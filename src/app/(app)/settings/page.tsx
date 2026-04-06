'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { showError, showSuccess, showInfo } from '@/lib/toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
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
  exportCsv,
  exportJson,
  getNotificationPreferences,
  updateNotificationPreferences,
  getWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  getCalendarStatus,
  disconnectCalendar,
  type UserProfile,
  type OAuthProvider,
  type NotificationPreferences,
  type WebhookItem,
  type CalendarStatus,
} from '@/lib/api/users';
import { logout } from '@/lib/api/auth';

type Section = 'profile' | 'security' | 'notifications' | 'export' | 'account';

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
    { key: 'notifications', label: 'Notifications' },
    { key: 'export', label: 'Export data' },
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
        showInfo(`Verify your new email at ${updated.pendingEmail} to complete the change`);
      } else {
        showSuccess('Profile updated');
      }
    },
    onError: (err: ApiError) => {
      showError(err.message ?? 'Failed to update profile');
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
      showSuccess('Provider disconnected');
    },
    onError: (err: ApiError) => {
      if (err.code === 'cannot_disconnect_oauth') {
        showError('Set a verified password before disconnecting this provider');
      } else {
        showError(err.message ?? 'Failed to disconnect provider');
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
      showSuccess('Password changed successfully');
    },
    onError: (err: ApiError) => {
      if (err.code === 'invalid_current_password') {
        setPwdErrors({ currentPassword: 'Current password is incorrect' });
      } else {
        showError(err.message ?? 'Failed to change password');
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
// Notifications section
// ──────────────────────────────────────────────────────────────────────────────

const PREF_LABELS: { key: keyof NotificationPreferences; label: string; description: string }[] = [
  { key: 'agentTaskCreated', label: 'Agent creates a task', description: 'Email when an agent creates a new task' },
  { key: 'agentTaskUpdated', label: 'Agent updates a task', description: 'Email when an agent modifies a task' },
  { key: 'agentTaskClosed', label: 'Agent closes a task', description: 'Email when an agent closes a task' },
  { key: 'agentDeletionRequest', label: 'Agent requests deletion', description: 'Email when an agent requests task deletion' },
  { key: 'overdueTaskNudge', label: 'Overdue task nudge', description: 'One-time email the morning after a task is overdue' },
  { key: 'weeklySummary', label: 'Weekly summary', description: 'Weekly email with task completion stats' },
];

function maskUrl(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname;
    if (host.length <= 8) return url;
    return `${u.protocol}//${host.slice(0, 4)}${'••••'}${host.slice(-4)}${u.pathname}`;
  } catch {
    return url.length > 20 ? `${url.slice(0, 10)}••••${url.slice(-6)}` : url;
  }
}

function NotificationsSection() {
  const queryClient = useQueryClient();

  // ── Notification preferences ──
  const { data: prefs } = useQuery<NotificationPreferences>({
    queryKey: ['notification-preferences'],
    queryFn: getNotificationPreferences,
  });

  const prefsMutation = useMutation({
    mutationFn: updateNotificationPreferences,
    onMutate: async (newPrefs) => {
      await queryClient.cancelQueries({ queryKey: ['notification-preferences'] });
      const previous = queryClient.getQueryData<NotificationPreferences>(['notification-preferences']);
      queryClient.setQueryData<NotificationPreferences>(['notification-preferences'], (old) =>
        old ? { ...old, ...newPrefs } : old,
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['notification-preferences'], context.previous);
      }
      showError('Failed to update preference');
    },
    onSuccess: () => showSuccess('Preference updated'),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
  });

  // ── Webhooks ──
  const { data: webhooks = [] } = useQuery<WebhookItem[]>({
    queryKey: ['webhooks'],
    queryFn: getWebhooks,
  });

  const [webhookFormOpen, setWebhookFormOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookItem | null>(null);
  const webhookUrlRef = useRef<HTMLInputElement>(null);
  const webhookSecretRef = useRef<HTMLInputElement>(null);

  const createWebhookMutation = useMutation({
    mutationFn: ({ url, secret }: { url: string; secret?: string }) => createWebhook(url, secret),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      setWebhookFormOpen(false);
      showSuccess('Webhook configured');
    },
    onError: (err: ApiError) => showError(err.message ?? 'Failed to create webhook'),
  });

  const updateWebhookMutation = useMutation({
    mutationFn: ({ id, url, secret }: { id: string; url: string; secret?: string }) =>
      updateWebhook(id, url, secret),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      setEditingWebhook(null);
      showSuccess('Webhook updated');
    },
    onError: (err: ApiError) => showError(err.message ?? 'Failed to update webhook'),
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: deleteWebhook,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      showSuccess('Webhook deleted');
    },
    onError: () => showError('Failed to delete webhook'),
  });

  // ── Google Calendar ──
  const { data: calendarStatus } = useQuery<CalendarStatus>({
    queryKey: ['calendar-status'],
    queryFn: getCalendarStatus,
  });

  const disconnectCalendarMutation = useMutation({
    mutationFn: disconnectCalendar,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['calendar-status'] });
      showSuccess('Google Calendar disconnected');
    },
    onError: () => showError('Failed to disconnect Google Calendar'),
  });

  function handleWebhookSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = webhookUrlRef.current?.value?.trim();
    const secret = webhookSecretRef.current?.value?.trim() || undefined;
    if (!url) return;

    if (editingWebhook) {
      updateWebhookMutation.mutate({ id: editingWebhook.id, url, secret });
    } else {
      createWebhookMutation.mutate({ url, secret });
    }
  }

  return (
    <section className="p-6 space-y-8">
      {/* Email notification toggles */}
      <div>
        <h2 className="text-lg font-semibold mb-1">Email Notifications</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Choose which email notifications you receive.
        </p>
        <fieldset className="space-y-3 max-w-sm">
          <legend className="sr-only">Email notification preferences</legend>
          {PREF_LABELS.map(({ key, label, description }) => (
            <label
              key={key}
              className="flex items-start gap-3 cursor-pointer group/field"
            >
              <Checkbox
                checked={prefs?.[key] ?? true}
                onCheckedChange={(checked: boolean) =>
                  prefsMutation.mutate({ [key]: checked })
                }
                aria-label={label}
                className="mt-0.5"
              />
              <div>
                <span className="text-sm font-medium">{label}</span>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </label>
          ))}
        </fieldset>
      </div>

      <Separator />

      {/* Webhook management */}
      <div>
        <h2 className="text-lg font-semibold mb-1">Webhooks</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Send task change events to an external URL.
        </p>

        {webhooks.length > 0 ? (
          <div className="space-y-3 max-w-sm">
            {webhooks.map((wh) =>
              editingWebhook?.id === wh.id ? (
                <form key={wh.id} onSubmit={handleWebhookSubmit} className="space-y-3 border rounded-md p-3">
                  <div>
                    <label className="text-sm font-medium" htmlFor="edit-webhook-url">URL</label>
                    <Input
                      id="edit-webhook-url"
                      ref={webhookUrlRef}
                      defaultValue={wh.url}
                      placeholder="https://example.com/webhook"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium" htmlFor="edit-webhook-secret">
                      Secret <span className="text-muted-foreground font-normal">(optional)</span>
                    </label>
                    <Input
                      id="edit-webhook-secret"
                      ref={webhookSecretRef}
                      type="password"
                      placeholder="Leave blank to keep current"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={updateWebhookMutation.isPending}>
                      {updateWebhookMutation.isPending ? 'Saving…' : 'Save'}
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setEditingWebhook(null)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div key={wh.id} className="flex items-center justify-between border rounded-md px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{maskUrl(wh.url)}</p>
                    {wh.hasSecret && (
                      <p className="text-xs text-muted-foreground">Signed with secret</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0 ml-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingWebhook(wh)}
                    >
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger render={<Button variant="outline" size="sm" />}>
                        Delete
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete webhook?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Task change events will no longer be sent to this URL.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            disabled={deleteWebhookMutation.isPending}
                            onClick={() => deleteWebhookMutation.mutate(wh.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ),
            )}
          </div>
        ) : webhookFormOpen ? (
          <form onSubmit={handleWebhookSubmit} className="space-y-3 max-w-sm">
            <div>
              <label className="text-sm font-medium" htmlFor="new-webhook-url">URL</label>
              <Input
                id="new-webhook-url"
                ref={webhookUrlRef}
                placeholder="https://example.com/webhook"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="new-webhook-secret">
                Secret <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Input
                id="new-webhook-secret"
                ref={webhookSecretRef}
                type="password"
                placeholder="HMAC-SHA256 signing secret"
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={createWebhookMutation.isPending}>
                {createWebhookMutation.isPending ? 'Saving…' : 'Save'}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setWebhookFormOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button variant="outline" onClick={() => setWebhookFormOpen(true)}>
            Configure Webhook
          </Button>
        )}
      </div>

      <Separator />

      {/* Google Calendar */}
      <div>
        <h2 className="text-lg font-semibold mb-1">Google Calendar</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Sync task due dates to your Google Calendar as all-day events.
        </p>

        {calendarStatus?.connected ? (
          <div className="flex items-center justify-between max-w-sm border rounded-md px-4 py-3">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Connected</p>
              {calendarStatus.connectedAt && (
                <p className="text-xs text-muted-foreground">
                  Since {new Date(calendarStatus.connectedAt).toLocaleDateString()}
                </p>
              )}
            </div>
            <AlertDialog>
              <AlertDialogTrigger render={<Button variant="outline" size="sm" />}>
                Disconnect
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Disconnect Google Calendar?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Future task due dates will no longer sync. Existing calendar events will remain.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    disabled={disconnectCalendarMutation.isPending}
                    onClick={() => disconnectCalendarMutation.mutate()}
                  >
                    Disconnect
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => {
              window.location.href = '/api/v1/users/me/calendar/connect';
            }}
          >
            Connect Google Calendar
          </Button>
        )}
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Export data section
// ──────────────────────────────────────────────────────────────────────────────

function ExportSection() {
  const csvMutation = useMutation({
    mutationFn: exportCsv,
    onSuccess: () => showSuccess('CSV downloaded'),
    onError: () => showError('Failed to download CSV'),
  });

  const jsonMutation = useMutation({
    mutationFn: exportJson,
    onSuccess: () => showSuccess('JSON downloaded'),
    onError: () => showError('Failed to download JSON'),
  });

  return (
    <section className="p-6">
      <h2 className="text-lg font-semibold mb-1">Export data</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Download a copy of your data. CSV includes all active tasks. JSON includes your full account data.
      </p>
      <div className="flex gap-3">
        <Button
          variant="outline"
          disabled={csvMutation.isPending || jsonMutation.isPending}
          onClick={() => csvMutation.mutate()}
        >
          {csvMutation.isPending ? 'Downloading…' : 'Download CSV'}
        </Button>
        <Button
          variant="outline"
          disabled={jsonMutation.isPending || csvMutation.isPending}
          onClick={() => jsonMutation.mutate()}
        >
          {jsonMutation.isPending ? 'Downloading…' : 'Download JSON'}
        </Button>
      </div>
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
        showError('Password verification failed. Please try again.');
      } else {
        showError(err.message ?? 'Failed to delete account');
      }
      setOpen(false);
    },
  });

  const cancelDeletionMutation = useMutation({
    mutationFn: cancelDeletion,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
      showSuccess('Account deletion cancelled.');
    },
    onError: (err: ApiError) => {
      showError(err.message ?? 'Failed to cancel deletion');
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

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Log out</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sign out of your account on this device.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            logout()
              .catch(() => {})
              .finally(() => {
                queryClient.clear();
                router.push('/login');
              });
          }}
        >
          Log out
        </Button>
      </div>

      <Separator />

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
                        showError('Password is required to confirm account deletion.');
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
    if (activeSection === 'notifications') return <NotificationsSection />;
    if (activeSection === 'export') return <ExportSection />;
    return <AccountSection profile={profile} />;
  }

  return (
    <div className="flex h-full">
      <aside className="hidden md:block w-56 shrink-0 border-r border-border">
        <SettingsNav active={activeSection} onChange={setActiveSection} />
      </aside>
      <div className="flex-1 overflow-y-auto">
        {/* Mobile settings nav */}
        <div className="md:hidden border-b border-border">
          <SettingsNav active={activeSection} onChange={setActiveSection} />
        </div>
        {renderSection()}
      </div>
    </div>
  );
}
