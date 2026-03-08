/**
 * Atmospheric background for the termprompt docs site.
 *
 * Phosphor CRT glow: single-hue cyan with scanlines, grain, and vignette.
 * The glow sits behind the hero terminal mockup (top-right) with a
 * secondary bloom lower on the page for continuity.
 */

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

export function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
      {/* ── Light mode: subtle cyan tint ── */}
      <div
        className="absolute inset-0 dark:hidden"
        style={{
          background: [
            'radial-gradient(ellipse 70% 45% at 60% 10%, rgba(8,145,178,0.07) 0%, transparent 70%)',
            'radial-gradient(ellipse 45% 35% at 35% 65%, rgba(8,145,178,0.04) 0%, transparent 70%)',
          ].join(', '),
        }}
      />

      {/* ── Dark mode: phosphor CRT glow ── */}
      <div
        className="absolute inset-0 hidden dark:block"
        style={{
          background: [
            // Primary cyan bloom behind the hero terminal mockup
            'radial-gradient(ellipse 80% 50% at 65% 15%, rgba(34,211,238,0.14) 0%, transparent 70%)',
            // Secondary bloom, lower-left for continuity
            'radial-gradient(ellipse 50% 35% at 30% 70%, rgba(34,211,238,0.06) 0%, transparent 70%)',
            // Indigo undertone for shadow depth
            'radial-gradient(ellipse 60% 40% at 50% 40%, rgba(99,102,241,0.04) 0%, transparent 70%)',
          ].join(', '),
        }}
      />

      {/* ── Scanlines: cyan-tinted CRT lines (dark mode) ── */}
      <div
        className="absolute inset-0 hidden opacity-[0.035] dark:block"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(34,211,238,0.07) 2px, rgba(34,211,238,0.07) 3px)',
        }}
      />

      {/* ── Grain texture ── */}
      <div
        className="absolute inset-0 opacity-[0.018] dark:opacity-[0.04]"
        style={{
          backgroundImage: NOISE_SVG,
          backgroundSize: '256px 256px',
        }}
      />

      {/* ── Vignette (dark mode) ── */}
      <div
        className="absolute inset-0 hidden dark:block"
        style={{
          background:
            'radial-gradient(ellipse 75% 65% at 50% 35%, transparent 0%, rgba(12,16,23,0.40) 100%)',
        }}
      />
    </div>
  );
}
