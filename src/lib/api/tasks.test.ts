import { afterEach, describe, expect, it, vi } from 'vitest';

import { sortTasks } from './tasks';

describe('sortTasks', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockOk(body: Record<string, unknown>): Response {
    return new Response(
      JSON.stringify({ data: body, meta: null, error: null }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }

  it('POSTs to /api/v1/tasks/sort with the given criterion and returns unwrapped data', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(mockOk({ updated: 7 }));

    const result = await sortTasks({ by: 'priority' });

    expect(result).toEqual({ updated: 7 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/v1/tasks/sort');
    expect((init as RequestInit).method).toBe('POST');
    expect((init as RequestInit).body).toBe(JSON.stringify({ by: 'priority' }));
  });

  it('passes each of the 4 valid criteria through the body', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(() => Promise.resolve(mockOk({ updated: 0 })));

    const criteria = ['priority', 'due_date', 'created_newest', 'created_oldest'] as const;
    for (const by of criteria) {
      await sortTasks({ by });
    }

    expect(fetchMock).toHaveBeenCalledTimes(4);
    const bodies = fetchMock.mock.calls.map(
      (c) => JSON.parse((c[1] as RequestInit).body as string) as { by: string },
    );
    expect(bodies.map((b) => b.by)).toEqual([...criteria]);
  });
});
