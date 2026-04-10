import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { MarketingFooter } from '@/components/marketing/marketing-footer';

export const metadata: Metadata = {
  title: 'Terms and Conditions — Todo4',
  description:
    'Terms and conditions governing the use of Todo4, the AI-native task management platform. Learn about acceptable use, agent connections, quotas, and your rights.',
};

export default function TermsPage() {
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

      {/* Terms content */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 pb-16">
        <h1 className="text-3xl font-bold tracking-tight">
          Terms and Conditions
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: April 2026
        </p>

        <div className="mt-10 space-y-10 text-base leading-relaxed text-foreground/90">
          {/* Acceptance of Terms */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Acceptance of Terms
            </h2>
            <p className="mt-3">
              By accessing or using Todo4, you agree to be bound by these terms
              and conditions. If you do not agree to these terms, please do not
              use the service.
            </p>
            <p className="mt-3">
              These terms apply to all users of Todo4, including visitors,
              registered users, and AI agents acting on behalf of users.
            </p>
          </section>

          {/* Description of Service */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Description of Service
            </h2>
            <p className="mt-3">
              Todo4 is an AI-native task management platform. It provides a web
              application where you can create, organize, and manage tasks. It
              also provides an API and a Model Context Protocol (MCP) server that
              allows AI agents to read, create, and manage tasks on your behalf.
            </p>
            <p className="mt-3">
              The platform includes features such as subtasks, tags, due dates,
              recurrence, comments, calendar sync, notifications, and data
              export.
            </p>
          </section>

          {/* Account Registration */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Account Registration
            </h2>
            <p className="mt-3">
              To use Todo4, you must create an account using your email address
              and a password, or by signing in with Google or Facebook. You are
              responsible for providing accurate information and keeping your
              account credentials secure.
            </p>
            <p className="mt-3">
              Each person may register only one account. You must be at least 13
              years old to use Todo4. You are responsible for all activity that
              occurs under your account.
            </p>
          </section>

          {/* Acceptable Use */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Acceptable Use
            </h2>
            <p className="mt-3">When using Todo4, you agree not to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                Use the service for any abusive, illegal, or harmful purpose.
              </li>
              <li>
                Access the platform through automated means outside of the
                official MCP integration (no scraping or unauthorized bots).
              </li>
              <li>
                Circumvent or attempt to bypass rate limits, usage quotas, or
                other platform restrictions.
              </li>
              <li>
                Attempt to gain unauthorized access to other users&rsquo; data or
                accounts.
              </li>
              <li>
                Interfere with or disrupt the operation of the service or its
                infrastructure.
              </li>
            </ul>
          </section>

          {/* Agent Connections */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Agent Connections
            </h2>
            <p className="mt-3">
              Todo4 allows you to connect AI agents that can manage tasks on your
              behalf. When you connect an agent, you authorize it to perform
              actions within the permission scope you choose &mdash; either
              read-only or full access.
            </p>
            <p className="mt-3">
              You are responsible for the actions taken by any AI agent you
              connect to your account. Todo4 provides tools to help you stay in
              control, including action notifications and the ability to revoke
              agent access at any time. However, Todo4 does not control agent
              behavior and is not liable for actions agents take on your behalf.
            </p>
          </section>

          {/* Free Tier & Quotas */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Free Tier &amp; Quotas
            </h2>
            <p className="mt-3">
              Todo4 offers a free tier with the following usage limits:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>50 tasks created per day</li>
              <li>500 tasks created per month</li>
              <li>1 connected AI agent</li>
            </ul>
            <p className="mt-3">
              If you exceed these limits, task creation and agent connections will
              be temporarily restricted until the quota resets. Your existing data
              is never affected &mdash; exceeding a quota does not result in data
              loss.
            </p>
            <p className="mt-3">
              The operator reserves the right to adjust these limits at any time.
              Changes to quotas will be communicated through updated terms.
            </p>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Intellectual Property
            </h2>
            <p className="mt-3">
              You retain full ownership of all task data and content you create
              in Todo4. We do not claim any rights over your data.
            </p>
            <p className="mt-3">
              By using the service, you grant Todo4 a limited, non-exclusive
              license to process, store, and display your data solely for the
              purpose of providing the service to you.
            </p>
            <p className="mt-3">
              Todo4 retains ownership of the platform itself, including its code,
              design, branding, and all related intellectual property.
            </p>
          </section>

          {/* Data & Privacy */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Data &amp; Privacy
            </h2>
            <p className="mt-3">
              Your privacy matters to us. For full details on how we collect,
              use, and protect your personal data, please read our{' '}
              <Link
                href="/privacy"
                className="text-primary underline underline-offset-2 hover:text-primary/80"
              >
                Privacy Notice
              </Link>
              .
            </p>
            <p className="mt-3">
              Key highlights: we use httpOnly cookies for authentication only, we
              do not use third-party tracking or advertising cookies, and we
              support GDPR-aligned data deletion and export.
            </p>
          </section>

          {/* Account Termination */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Account Termination
            </h2>
            <p className="mt-3">
              You can delete your account at any time from the Settings page.
              When you delete your account, all agent connections are revoked
              immediately. A 30-day grace period follows, after which all your
              data is permanently and irreversibly deleted.
            </p>
            <p className="mt-3">
              The operator reserves the right to suspend or terminate accounts
              that violate these terms, with or without prior notice. In cases of
              severe or repeated violations, termination may be immediate.
            </p>
          </section>

          {/* Disclaimers & Limitation of Liability */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Disclaimers &amp; Limitation of Liability
            </h2>
            <p className="mt-3">
              Todo4 is provided &ldquo;as is&rdquo; and &ldquo;as
              available&rdquo; without warranties of any kind, whether express or
              implied. We do not guarantee that the service will be
              uninterrupted, error-free, or available at all times.
            </p>
            <p className="mt-3">
              Todo4 is not liable for any actions taken by AI agents connected to
              your account. While we provide tools for visibility and control,
              the responsibility for agent behavior rests with you.
            </p>
            <p className="mt-3">
              To the fullest extent permitted by law, the total liability of
              Todo4 and its operator is limited to the amount you have paid for
              the service. For free-tier users, this means zero liability.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">
              Changes to Terms
            </h2>
            <p className="mt-3">
              The operator may update these terms at any time. The &ldquo;Last
              Updated&rdquo; date at the top of this page reflects the most
              recent revision.
            </p>
            <p className="mt-3">
              Your continued use of Todo4 after changes are made constitutes
              acceptance of the updated terms. We encourage you to review this
              page periodically.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-semibold text-foreground">Contact</h2>
            <p className="mt-3">
              If you have questions about these terms, please contact us at{' '}
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
