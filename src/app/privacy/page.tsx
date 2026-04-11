import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import {
  MarketingBackground,
  marketingBackgroundClassName,
} from '@/components/marketing/marketing-background';
import { MarketingFooter } from '@/components/marketing/marketing-footer';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Privacy Notice — Todo4',
  description:
    'Learn how Todo4 collects, uses, and protects your personal data. Read about your rights, data retention, cookies, and third-party services.',
};

export default function PrivacyPage() {
  return (
    <div className={cn(marketingBackgroundClassName, 'flex min-h-screen flex-col text-foreground')}>
      <MarketingBackground />
      {/* Top bar */}
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-4">
        <Link href="/" aria-label="Todo4 homepage">
          <Image
            src="/todo4-logo.png"
            alt="Todo4"
            width={224}
            height={64}
            className="h-16 w-auto"
            unoptimized
          />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={16} />
          Back to home
        </Link>
      </header>

      {/* Privacy content */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 pb-16">
        <h1 className="text-3xl font-bold tracking-tight">Privacy Notice</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: April 11, 2026
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

          {/* Legal Basis for Processing */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Legal Basis for Processing (GDPR)
            </h2>
            <p className="mt-3">
              If you are in the European Economic Area or the United Kingdom,
              we rely on the following legal bases under the GDPR to process
              your personal data:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <strong>Performance of a contract</strong> &mdash; to create
                and maintain your account, deliver the task management
                service, sync your data across devices, and send essential
                transactional emails such as email verification, password
                resets, and account notifications.
              </li>
              <li>
                <strong>Legitimate interests</strong> &mdash; to keep the
                platform secure, prevent fraud and abuse, monitor errors and
                performance through Sentry, and improve the reliability of
                the service. We balance these interests against your privacy
                rights and only process the minimum data needed.
              </li>
              <li>
                <strong>Consent</strong> &mdash; for optional features that
                you explicitly enable, such as Google Calendar sync. You can
                withdraw consent at any time by disabling the feature in
                Settings.
              </li>
              <li>
                <strong>Legal obligation</strong> &mdash; where we are
                required by law to process or retain certain information,
                such as responding to lawful requests from authorities.
              </li>
            </ul>
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

          {/* International Data Transfers */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">
              International Data Transfers
            </h2>
            <p className="mt-3">
              Todo4 is hosted on Railway&rsquo;s cloud infrastructure, which
              may process and store data in the United States and other
              regions where Railway operates. If you access Todo4 from
              outside these regions &mdash; including from the European
              Economic Area, the United Kingdom, or other jurisdictions
              &mdash; your data will be transferred to and processed in
              those locations.
            </p>
            <p className="mt-3">
              Where required by applicable law, we rely on appropriate
              safeguards for these transfers, including the European
              Commission&rsquo;s Standard Contractual Clauses or equivalent
              legal mechanisms put in place by our subprocessors.
            </p>
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

          {/* Security Measures */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Security Measures
            </h2>
            <p className="mt-3">
              We take the security of your data seriously and apply
              industry-standard protections:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <strong>Encryption in transit</strong> &mdash; all
                communication between your device and Todo4 is protected by
                HTTPS using TLS 1.2 or higher.
              </li>
              <li>
                <strong>Password hashing</strong> &mdash; passwords are
                hashed with bcrypt at a strong cost factor; we never store
                plaintext passwords.
              </li>
              <li>
                <strong>OAuth token protection</strong> &mdash; agent OAuth
                tokens are encrypted at rest using AES-256-GCM, and we only
                ever store hashed token references.
              </li>
              <li>
                <strong>Session security</strong> &mdash; authentication
                sessions use httpOnly cookies that cannot be read by
                JavaScript, reducing the risk of token theft.
              </li>
              <li>
                <strong>Monitoring</strong> &mdash; we monitor errors and
                anomalous activity through Sentry to detect and respond to
                potential incidents quickly.
              </li>
            </ul>
            <p className="mt-3">
              No system can guarantee perfect security. If we ever become
              aware of a personal data breach that affects you, we will
              notify you and the relevant authorities as required by
              applicable law.
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Children&rsquo;s Privacy
            </h2>
            <p className="mt-3">
              Todo4 is not intended for children under the age of 13, and we
              do not knowingly collect personal data from anyone under 13.
              If you are a parent or guardian and believe your child has
              provided personal data to Todo4, please contact us and we will
              promptly delete the information.
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

          {/* Changes to This Notice */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Changes to This Notice
            </h2>
            <p className="mt-3">
              We may update this privacy notice from time to time to reflect
              changes in our practices, the services we offer, or applicable
              law. The &ldquo;Last updated&rdquo; date at the top of this
              page always reflects the most recent revision.
            </p>
            <p className="mt-3">
              For material changes &mdash; such as new categories of data
              processing or new third-party services &mdash; we will notify
              you in advance through the app or by email, and where required
              by law we will ask you to review and re-accept the updated
              notice. We encourage you to review this page periodically.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">Contact</h2>
            <p className="mt-3">
              If you have questions about this privacy notice or how your data
              is handled, please reach out to us at{' '}
              <a
                href="mailto:privacy@todo4.io"
                className="text-primary underline underline-offset-2 hover:text-primary/80"
              >
                privacy@todo4.io
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
