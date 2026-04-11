import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock EventSource
const mockClose = vi.fn();
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();
let EventSourceConstructorArgs: [string, EventSourceInit?] | null = null;

class MockEventSource {
  addEventListener = mockAddEventListener;
  removeEventListener = mockRemoveEventListener;
  close = mockClose;
  readyState = 1;

  constructor(url: string, init?: EventSourceInit) {
    EventSourceConstructorArgs = [url, init];
  }
}

vi.stubGlobal('EventSource', MockEventSource);

// Track useEffect cleanup functions
let effectCleanup: (() => void) | undefined;

// Mock React hooks
vi.mock('react', () => ({
  useEffect: (fn: () => (() => void) | void) => {
    effectCleanup = fn() as (() => void) | undefined;
  },
}));

const mockInvalidateQueries = vi.fn();
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
}));

// Import after mocks are set up
const { useTaskEvents } = await import('./use-task-events');

describe('useTaskEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    EventSourceConstructorArgs = null;
    effectCleanup = undefined;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates EventSource with correct URL and credentials', () => {
    useTaskEvents();

    expect(EventSourceConstructorArgs).toBeTruthy();
    expect(EventSourceConstructorArgs![0]).toBe('/api/v1/events/stream');
    expect(EventSourceConstructorArgs![1]).toEqual({ withCredentials: true });
  });

  it('listens for task.changed events (not onmessage)', () => {
    useTaskEvents();

    expect(mockAddEventListener).toHaveBeenCalledWith(
      'task.changed',
      expect.any(Function),
    );
  });

  it('invalidates task queries when task.changed event arrives', () => {
    useTaskEvents();

    // Get the registered event handler
    const handler = mockAddEventListener.mock.calls.find(
      (call: unknown[]) => call[0] === 'task.changed',
    )?.[1] as (e: MessageEvent) => void;

    expect(handler).toBeDefined();

    // Simulate a task.changed event
    const event = {
      data: JSON.stringify({
        userId: 'user-1',
        taskId: 'task-123',
        action: 'created',
        actorType: 'agent',
        actorId: 'agent-1',
        timestamp: '2026-04-07T10:00:00.000Z',
      }),
    } as MessageEvent;

    handler(event);

    // Should invalidate all task list queries (partial match)
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['tasks'],
    });

    // Should invalidate specific task detail
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['task', 'task-123'],
    });

    expect(mockInvalidateQueries).toHaveBeenCalledTimes(2);
  });

  it('ignores malformed task.changed payloads', () => {
    useTaskEvents();

    const handler = mockAddEventListener.mock.calls.find(
      (call: unknown[]) => call[0] === 'task.changed',
    )?.[1] as (e: MessageEvent) => void;

    expect(handler).toBeDefined();

    handler({ data: '{bad-json' } as MessageEvent);

    expect(mockInvalidateQueries).not.toHaveBeenCalled();
  });

  it('skips detail invalidation when taskId is missing', () => {
    useTaskEvents();

    const handler = mockAddEventListener.mock.calls.find(
      (call: unknown[]) => call[0] === 'task.changed',
    )?.[1] as (e: MessageEvent) => void;

    expect(handler).toBeDefined();

    handler({
      data: JSON.stringify({
        userId: 'user-1',
        action: 'updated',
      }),
    } as MessageEvent);

    expect(mockInvalidateQueries).toHaveBeenCalledTimes(1);
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['tasks'],
    });
  });

  it('closes EventSource on cleanup', () => {
    useTaskEvents();

    expect(effectCleanup).toBeDefined();
    effectCleanup!();

    expect(mockRemoveEventListener).toHaveBeenCalledWith(
      'task.changed',
      expect.any(Function),
    );
    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});
