import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { MarketingFooter } from '@/components/marketing/marketing-footer';

export const metadata: Metadata = {
  title: 'Privacy Notice — Todo4',
  description:
    'Learn how Todo4 collects, uses, and protects your personal data. Read about your rights, data retention, cookies, and third-party services.',
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Top bar */}
      <header className="px-4 py-4">
        <Link href="/" aria-label="Back to homepage">
          <Image
            src="/todo4-logo.png"
            alt="Todo4"
            width={112}
            height={32}
            className="h-8 w-auto"
            unoptimized
          />
        </Link>
      </header>

      {/* Privacy content */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 pb-16">
        <h1 className="text-3xl font-bold tracking-tight">Privacy Notice</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: April 2026
        </p>

        <div className="mt-10 space-y-10 text-base leading-relaxed text-foreground/90">
          {/* Introduction */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Introduction
            </h2>
            <p className="mt-3">
              Todo4 is an AI-native task management platform operated by Panit
              Wechasil. This privacy notice explains what personal data we
              collect, how we use it, who we share it with, and what rights you
              have over your information.
            </p>
            <p className="mt-3">
              This notice applies to everyone who uses Todo4, whether you access
              it through the web app, connect an AI agent, or simply visit our
              website.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Information We Collect
            </h2>
            <p className="mt-3">
              We collect the following types of information when you use Todo4:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <strong>Account information</strong> &mdash; your name and email
                address, provided during registration.
              </li>
              <li>
                <strong>OAuth profile data</strong> &mdash; if you sign in with
                Google or Facebook, we store your profile picture URL so we can
                display your avatar in the app.
              </li>
              <li>
                <strong>Task data</strong> &mdash; everything you create in
                Todo4, including task titles, descriptions, due dates,
                priorities, tags, subtasks, comments, and recurrence settings.
              </li>
              <li>
                <strong>Agent connection metadata</strong> &mdash; when you
                connect an AI agent, we store the agent&rsquo;s name, permission
                scope (read-only or full access), and registration date. We
                never store raw agent tokens &mdash; only secure hashes.
              </li>
              <li>
                <strong>Usage and error data</strong> &mdash; we collect error
                reports and performance data through Sentry to keep the platform
                reliable. No personally identifiable information (such as your
                name, email, or task content) is included in these reports.
              </li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">
              How We Use Your Information
            </h2>
            <p className="mt-3">We use the information we collect to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                Provide and maintain the Todo4 service, including task
                management, agent connections, and calendar sync.
              </li>
              <li>
                Authenticate your identity when you sign in, whether by email
                and password or through Google or Facebook.
              </li>
              <li>
                Send transactional emails &mdash; including welcome emails,
                email verification, password resets, agent action notifications,
                weekly task summaries, overdue task reminders, and agent token
                expiry alerts.
              </li>
              <li>
                Enforce free-tier usage quotas to keep the platform fair for all
                users.
              </li>
              <li>
                Monitor and improve platform reliability, performance, and
                security.
              </li>
            </ul>
            <p className="mt-3">
              We do not sell your personal data. We do not use your task content
              for advertising or marketing purposes.
            </p>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Third-Party Services
            </h2>
            <p className="mt-3">
              Todo4 relies on the following third-party services to operate:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <strong>Google and Facebook</strong> &mdash; for OAuth login and
                retrieving your profile picture. These providers only share the
                data you authorize during sign-in.
              </li>
              <li>
                <strong>Email delivery service</strong> &mdash; to send
                transactional emails such as verification links, password
                resets, and notifications. Only your email address and the
                message content are shared.
              </li>
              <li>
                <strong>Sentry</strong> &mdash; for error tracking and
                performance monitoring. No personally identifiable information
                is sent to Sentry.
              </li>
              <li>
                <strong>Railway</strong> &mdash; our cloud hosting provider,
                which runs the application servers and database infrastructure.
              </li>
              <li>
                <strong>Google Calendar</strong> &mdash; if you enable calendar
                sync, your task due dates are synced as events to your Google
                Calendar. This is optional and one-way (Todo4 to Google
                Calendar).
              </li>
            </ul>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Data Retention
            </h2>
            <p className="mt-3">
              Your account data is retained for as long as your account is
              active.
            </p>
            <p className="mt-3">
              When you delete a task, it enters a soft-delete state and is
              retained for up to one year before being permanently purged. This
              gives you a safety net for accidental deletions.
            </p>
            <p className="mt-3">
              When you delete your account, all agent connections are revoked
              immediately. A 30-day grace period begins, after which all your
              data &mdash; including tasks, comments, agent connections, and
              account information &mdash; is permanently and irreversibly
              deleted.
            </p>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">Cookies</h2>
            <p className="mt-3">
              Todo4 uses two httpOnly session cookies for authentication: an
              access token and a refresh token. These cookies are essential for
              the service to work &mdash; they keep you signed in and secure
              your session.
            </p>
            <p className="mt-3">
              We do not use third-party tracking cookies, advertising cookies,
              or analytics cookies. The only cookies Todo4 sets are strictly
              necessary for authentication.
            </p>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Your Rights
            </h2>
            <p className="mt-3">You have the right to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <strong>Access your data</strong> &mdash; all your tasks, agent
                connections, and profile information are viewable in the app at
                any time.
              </li>
              <li>
                <strong>Export your tasks</strong> &mdash; download your tasks as
                a CSV file from the Settings page.
              </li>
              <li>
                <strong>Export your full account data</strong> &mdash; download a
                complete JSON export of all your data from the Settings page.
              </li>
              <li>
                <strong>Update your profile</strong> &mdash; change your name,
                email address, and timezone in Settings.
              </li>
              <li>
                <strong>Delete your account</strong> &mdash; permanently remove
                your account and all associated data from Settings at any time.
              </li>
            </ul>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">Contact</h2>
            <p className="mt-3">
              If you have questions about this privacy notice or how your data
              is handled, please reach out to us at{' '}
              <a
                href="mailto:privacy@todo4.com"
                className="text-primary underline underline-offset-2 hover:text-primary/80"
              >
                privacy@todo4.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
