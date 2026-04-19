import Link from 'next/link';

export function DocsCtaCard({ title, body }: { title: string; body: string }) {
  return (
    <section className="mt-12 flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-base font-semibold text-white">{title}</h2>
        <p className="mt-1 text-sm text-white/65">{body}</p>
      </div>
      <div className="flex gap-2 sm:shrink-0">
        <Link
          href="/register"
          className="rounded-xl bg-gradient-to-r from-[#6C4FE8] to-[#4F7FE5] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(92,79,229,0.4)] transition-transform hover:-translate-y-0.5"
        >
          Sign up free
        </Link>
        <Link
          href="/login"
          className="rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
        >
          Sign in
        </Link>
      </div>
    </section>
  );
}
