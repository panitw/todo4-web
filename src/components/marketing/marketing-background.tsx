export const marketingBackgroundClassName = 'relative isolate bg-[#FAFAF7]';

export function MarketingBackground() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(24, 24, 27, 0.08) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px]"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 60% 45% at 50% 0%, rgba(124, 58, 237, 0.10), transparent 70%)',
        }}
      />
    </>
  );
}
