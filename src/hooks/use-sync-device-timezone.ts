'use client';

import { useEffect, useRef } from 'react';
import { updateProfile, type UserProfile } from '@/lib/api/users';

export function useSyncDeviceTimezone(profile: UserProfile | undefined): void {
  const hasSyncedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    if (hasSyncedFor.current === profile.id) return;

    const deviceTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!deviceTz) return;

    hasSyncedFor.current = profile.id;

    if (deviceTz === profile.timezone) return;

    void updateProfile({ timezone: deviceTz }).catch(() => {
      // Silent: server-side @IsTimeZone() validator rejects invalid IANA with
      // 400, network failures happen, and neither should surface to the user
      // or block navigation. Next sign-in will try again organically.
    });
  }, [profile]);
}
