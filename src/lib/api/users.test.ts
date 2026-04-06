import { afterEach, describe, expect, it, vi } from 'vitest';

import { deleteWebhook, disconnectCalendar } from './users';

describe('users API delete operations', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws when deleteWebhook returns a non-OK response', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            data: null,
            meta: null,
            error: { code: 'webhook_not_found', message: 'Webhook not found' },
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      );

    await expect(deleteWebhook('wh-1')).rejects.toMatchObject({
      message: 'Webhook not found',
      status: 404,
      code: 'webhook_not_found',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('throws when disconnectCalendar returns a non-OK response', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            data: null,
            meta: null,
            error: {
              code: 'calendar_not_connected',
              message: 'No active calendar connection found',
            },
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      );

    await expect(disconnectCalendar()).rejects.toMatchObject({
      message: 'No active calendar connection found',
      status: 404,
      code: 'calendar_not_connected',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('resolves when delete endpoints return 204', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 204 }));

    await expect(deleteWebhook('wh-2')).resolves.toBeUndefined();
    await expect(disconnectCalendar()).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
