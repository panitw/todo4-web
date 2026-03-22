'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { ThreeColumnShell } from '@/components/layout/three-column-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  getProfile,
  updateProfile,
  getOAuthProviders,
  disconnectOAuthProvider,
  changePassword,
  deleteAccount,
  cancelDeletion,
  type UserProfile,
  type OAuthProvider,
} from '@/lib/api/users';

type Section = 'profile' | 'security' | 'account';

interface ApiError extends Error {
  code?: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Settings left nav
// ──────────────────────────────────────────────────────────────────────────────

function SettingsNav({
  active,
  onChange,
}: {
  active: Section;
  onChange: (s: Section) => void;
}) {
  const items: { key: Section; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'security', label: 'Security' },
    { key: 'account', label: 'Account' },
  ];

  return (
    <nav className="p-4 space-y-1">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Settings
      </p>
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onChange(item.key)}
          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
            active === item.key
              ? 'bg-accent text-accent-foreground font-medium'
              : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
          }`}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Profile section
// ──────────────────────────────────────────────────────────────────────────────

function ProfileSection({ profile }: { profile: UserProfile | undefined }) {
  const [name, setName] = useState(profile?.name ?? '');
  const [timezone, setTimezone] = useState(profile?.timezone ?? 'UTC');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updated) => {
      setName(updated.name ?? '');
      setTimezone(updated.timezone);
      setEmail(updated.email);
      setErrors({});
      if (updated.pendingEmail) {
        toast.info(`Verify your new email at ${updated.pendingEmail} to complete the change`);
      } else {
        toast.success('Profile updated');
      }
    },
    onError: (err: ApiError) => {
      toast.error(err.message ?? 'Failed to update profile');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Valid email is required';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    mutation.mutate({ name: name || undefined, timezone, email });
  }

  return (
    <section className="p-6">
      <h2 className="text-lg font-semibold mb-1">Profile</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Update your name, timezone, and email address.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
        <div>
          <label className="text-sm font-medium" htmlFor="name">
            Name
          </label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="mt-1"
          />
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="timezone">
            Timezone
          </label>
          <Input
            id="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            placeholder="UTC"
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">IANA timezone (e.g. America/New_York)</p>
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1"
          />
          {errors.email && (
            <p className="text-xs text-destructive mt-1">{errors.email}</p>
          )}
          {profile?.pendingEmail && (
            <p className="text-xs text-muted-foreground mt-1">
              Pending verification: <span className="font-medium">{profile.pendingEmail}</span>
            </p>
          )}
        </div>

        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : 'Save changes'}
        </Button>
      </form>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Security section
// ──────────────────────────────────────────────────────────────────────────────

function SecuritySection({ profile }: { profile: UserProfile | undefined }) {
  const queryClient = useQueryClient();

  const { data: providers = [] } = useQuery<OAuthProvider[]>({
    queryKey: ['oauth-providers'],
    queryFn: getOAuthProviders,
  });

  const disconnectMutation = useMutation({
    mutationFn: (provider: string) => disconnectOAuthProvider(provider),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['oauth-providers'] });
      toast.success('Provider disconnected');
    },
    onError: (err: ApiError) => {
      if (err.code === 'cannot_disconnect_oauth') {
        toast.error('Set a verified password before disconnecting this provider');
      } else {
        toast.error(err.message ?? 'Failed to disconnect provider');
      }
    },
  });

  // Change password form
  const currentPasswordRef = useRef<HTMLInputElement>(null);
  const newPasswordRef = useRef<HTMLInputElement>(null);
  const [pwdErrors, setPwdErrors] = useState<Record<string, string>>({});

  const changePwdMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      if (currentPasswordRef.current) currentPasswordRef.current.value = '';
      if (newPasswordRef.current) newPasswordRef.current.value = '';
      setPwdErrors({});
      toast.success('Password changed successfully');
    },
    onError: (err: ApiError) => {
      if (err.code === 'invalid_current_password') {
        setPwdErrors({ currentPassword: 'Current password is incorrect' });
      } else {
        toast.error(err.message ?? 'Failed to change password');
      }
    },
  });

  function handleChangePwdSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const currentPassword = currentPasswordRef.current?.value ?? '';
    const newPassword = newPasswordRef.current?.value ?? '';
    const errs: Record<string, string> = {};
    if (!currentPassword) errs.currentPassword = 'Current password is required';
    if (newPassword.length < 8) errs.newPassword = 'Password must be at least 8 characters';
    if (Object.keys(errs).length > 0) {
      setPwdErrors(errs);
      return;
    }
    changePwdMutation.mutate({ currentPassword, newPassword });
  }

  const hasPassword = !!profile?.hasPassword;

  return (
    <section className="p-6 space-y-8">
      {/* Connected accounts */}
      <div>
        <h2 className="text-lg font-semibold mb-1">Connected Accounts</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Manage your OAuth login providers.
        </p>
        {providers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No OAuth providers connected.</p>
        ) : (
          <ul className="space-y-3 max-w-sm">
            {providers.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between border rounded-md px-4 py-3"
              >
                <span className="text-sm font-medium capitalize">{p.provider}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={disconnectMutation.isPending}
                  onClick={() => disconnectMutation.mutate(p.provider)}
                >
                  Disconnect
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Separator />

      {/* Change password — only for email/password users */}
      {hasPassword && (
        <div>
          <h2 className="text-lg font-semibold mb-1">Change Password</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Update your password to keep your account secure.
          </p>
          <form onSubmit={handleChangePwdSubmit} className="space-y-4 max-w-sm">
            <div>
              <label className="text-sm font-medium" htmlFor="current-password">
                Current password
              </label>
              <Input
                id="current-password"
                type="password"
                ref={currentPasswordRef}
                className="mt-1"
                autoComplete="current-password"
              />
              {pwdErrors.currentPassword && (
                <p className="text-xs text-destructive mt-1">{pwdErrors.currentPassword}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="new-password">
                New password
              </label>
              <Input
                id="new-password"
                type="password"
                ref={newPasswordRef}
                className="mt-1"
                autoComplete="new-password"
              />
              {pwdErrors.newPassword && (
                <p className="text-xs text-destructive mt-1">{pwdErrors.newPassword}</p>
              )}
            </div>
            <Button type="submit" disabled={changePwdMutation.isPending}>
              {changePwdMutation.isPending ? 'Changing…' : 'Change password'}
            </Button>
          </form>
        </div>
      )}
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Account section (Danger Zone)
// ──────────────────────────────────────────────────────────────────────────────

function AccountSection({ profile }: { profile: UserProfile | undefined }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const passwordRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);

  const hasPendingDeletion = !!profile?.deletionScheduledAt;

  const deleteAccountMutation = useMutation({
    mutationFn: () => deleteAccount(passwordRef.current?.value || undefined),
    onSuccess: () => {
      setOpen(false);
      void queryClient.clear();
      router.push('/login');
    },
    onError: (err: ApiError) => {
      if (err.code === 'invalid_credentials') {
        toast.error('Password verification failed. Please try again.');
      } else {
        toast.error(err.message ?? 'Failed to delete account');
      }
      setOpen(false);
    },
  });

  const cancelDeletionMutation = useMutation({
    mutationFn: cancelDeletion,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Account deletion cancelled.');
    },
    onError: (err: ApiError) => {
      toast.error(err.message ?? 'Failed to cancel deletion');
    },
  });

  return (
    <section className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Account</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Manage your account settings.
        </p>
      </div>

      <div className="border border-destructive/50 rounded-lg p-4 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
        </div>

        {hasPendingDeletion ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Your account is scheduled for deletion on{' '}
              <span className="font-medium text-foreground">
                {new Date(profile!.deletionScheduledAt!).toLocaleDateString()}
              </span>
              . All your data will be permanently removed at that time.
            </p>
            <Button
              variant="outline"
              disabled={cancelDeletionMutation.isPending}
              onClick={() => cancelDeletionMutation.mutate()}
            >
              {cancelDeletionMutation.isPending ? 'Cancelling…' : 'Cancel Deletion'}
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Delete your account</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Schedules permanent deletion in 30 days. You can cancel within this period.
              </p>
            </div>
            <AlertDialog open={open} onOpenChange={setOpen}>
              <AlertDialogTrigger render={<Button variant="destructive" size="sm" disabled={!profile} />}>
                Delete Account
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This schedules permanent deletion in 30 days. All tasks, agents, and data
                    will be removed. You can cancel within 30 days.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                {profile?.hasPassword && (
                  <div className="py-2">
                    <label className="text-sm font-medium" htmlFor="delete-confirm-password">
                      Confirm with your password
                    </label>
                    <Input
                      id="delete-confirm-password"
                      type="password"
                      ref={passwordRef}
                      className="mt-1"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                    />
                  </div>
                )}
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    disabled={deleteAccountMutation.isPending}
                    onClick={() => {
                      if (profile?.hasPassword && !passwordRef.current?.value) {
                        toast.error('Password is required to confirm account deletion.');
                        return;
                      }
                      deleteAccountMutation.mutate();
                    }}
                  >
                    {deleteAccountMutation.isPending ? 'Deleting…' : 'Delete Account'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Settings page
// ──────────────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>('profile');

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: getProfile,
  });

  function renderSection() {
    if (activeSection === 'profile') return <ProfileSection key={profile?.id} profile={profile} />;
    if (activeSection === 'security') return <SecuritySection profile={profile} />;
    return <AccountSection profile={profile} />;
  }

  return (
    <ThreeColumnShell
      leftNav={
        <SettingsNav active={activeSection} onChange={setActiveSection} />
      }
      middle={renderSection()}
    />
  );
}
