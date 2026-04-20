import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserProfile } from '@/lib/api/users';

const mockUpdateProfile = vi.fn();
vi.mock('@/lib/api/users', () => ({
  updateProfile: (data: unknown) => mockUpdateProfile(data) as Promise<unknown>,
}));

// Mirror the manual hook mocking used by use-task-events.test.ts. `useEffect`
// runs synchronously; `useRef` is backed by a single persistent object across
// re-renders so the idempotency guard survives between calls.
const refStore: { current: unknown } = { current: null };
const effectRunner: { deps: unknown; fn: () => void } = {
  deps: undefined,
  fn: () => {},
};
vi.mock('react', () => ({
  useRef: () => refStore,
  useEffect: (fn: () => void, deps: unknown[]) => {
    // Re-invoke only when deps change, matching React semantics (shallow).
    const prev = effectRunner.deps as unknown[] | undefined;
    const changed =
      !prev || prev.length !== deps.length || prev.some((v, i) => v !== deps[i]);
    effectRunner.deps = deps;
    effectRunner.fn = fn;
    if (changed) fn();
  },
}));

const { useSyncDeviceTimezone } = await import('./use-sync-device-timezone');

const baseProfile: UserProfile = {
  id: 'u1',
  email: 'a@b.com',
  name: 'A',
  profilePictureUrl: null,
  tosVersion: null,
  privacyVersion: null,
  currentTosVersion: '1',
  currentPrivacyVersion: '1',
  timezone: 'UTC',
  emailVerified: true,
  hasPassword: true,
  pendingEmail: null,
  deletionScheduledAt: null,
  createdAt: '',
  updatedAt: '',
};

function stubDeviceTz(tz: string | undefined): void {
  vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(
    () => ({ resolvedOptions: () => ({ timeZone: tz }) }) as unknown as Intl.DateTimeFormat,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  refStore.current = null;
  effectRunner.deps = undefined;
  mockUpdateProfile.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useSyncDeviceTimezone', () => {
  it('patches profile when device TZ differs from stored TZ', () => {
    stubDeviceTz('Asia/Bangkok');

    useSyncDeviceTimezone(baseProfile);

    expect(mockUpdateProfile).toHaveBeenCalledTimes(1);
    expect(mockUpdateProfile).toHaveBeenCalledWith({ timezone: 'Asia/Bangkok' });
  });

  it('skips PATCH when device TZ matches stored TZ', () => {
    stubDeviceTz('UTC');

    useSyncDeviceTimezone(baseProfile);

    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });

  it('skips PATCH when profile is undefined', () => {
    stubDeviceTz('Asia/Bangkok');

    useSyncDeviceTimezone(undefined);

    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });

  it('skips PATCH when Intl returns no timezone', () => {
    stubDeviceTz(undefined);

    useSyncDeviceTimezone(baseProfile);

    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });

  it('fires at most once per session for the same user id', () => {
    stubDeviceTz('Asia/Bangkok');

    // First call: profile undefined (auth still loading).
    useSyncDeviceTimezone(undefined);
    expect(mockUpdateProfile).not.toHaveBeenCalled();

    // Second call: profile loads. Fires PATCH.
    useSyncDeviceTimezone(baseProfile);
    expect(mockUpdateProfile).toHaveBeenCalledTimes(1);

    // Third call: profile refetch returns the same user with the NEW timezone
    // reflected server-side. Effect dep changes (new reference) and the
    // timezone-match short-circuit does NOT apply — only the id-keyed ref
    // guard keeps this from firing a second PATCH.
    useSyncDeviceTimezone({ ...baseProfile, timezone: 'Asia/Bangkok' });
    expect(mockUpdateProfile).toHaveBeenCalledTimes(1);
  });

  it('swallows PATCH rejections without throwing', async () => {
    stubDeviceTz('Asia/Bangkok');
    mockUpdateProfile.mockRejectedValue(new Error('500'));

    expect(() => useSyncDeviceTimezone(baseProfile)).not.toThrow();
    // Give the swallowed promise a tick to settle so vitest does not flag an
    // unhandled rejection.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockUpdateProfile).toHaveBeenCalled();
  });
});
