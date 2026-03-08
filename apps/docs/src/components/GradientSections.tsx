'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState, type ReactNode } from 'react';

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

/**
 * Wraps a section with a visible gradient background.
 * Uses client-side theme detection to apply the right gradient,
 * avoiding Tailwind dark: variant issues with fumadocs.
 *
 * Gradients use a single radial per variant (no stacking) to avoid
 * browser banding. A noise overlay dithers the transition edges.
 */
export function GradientSection({
  children,
  className = '',
  variant = 'hero',
}: {
  children: ReactNode;
  className?: string;
  variant?: 'hero' | 'mid' | 'lower';
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';

  const gradients: Record<string, { dark: string; light: string }> = {
    hero: {
      dark: 'radial-gradient(ellipse 90% 60% at 60% 20%, rgba(34,211,238,0.12) 0%, rgba(34,211,238,0) 70%)',
      light: 'radial-gradient(ellipse 80% 50% at 55% 15%, rgba(8,145,178,0.07) 0%, rgba(8,145,178,0) 70%)',
    },
    mid: {
      dark: 'radial-gradient(ellipse 70% 50% at 80% 30%, rgba(34,211,238,0.07) 0%, rgba(34,211,238,0) 70%)',
      light: 'radial-gradient(ellipse 60% 40% at 70% 25%, rgba(8,145,178,0.05) 0%, rgba(8,145,178,0) 70%)',
    },
    lower: {
      dark: 'radial-gradient(ellipse 60% 50% at 20% 50%, rgba(34,211,238,0.06) 0%, rgba(34,211,238,0) 70%)',
      light: 'radial-gradient(ellipse 50% 40% at 25% 45%, rgba(8,145,178,0.04) 0%, rgba(8,145,178,0) 70%)',
    },
  };

  const bg = gradients[variant];

  return (
    <section
      className={`relative ${className}`}
      style={{
        background: mounted ? (isDark ? bg.dark : bg.light) : undefined,
      }}
    >
      {/* Noise dither to mask gradient banding */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
        aria-hidden="true"
        style={{ backgroundImage: NOISE_SVG, backgroundSize: '200px 200px' }}
      />
      <div className="relative">{children}</div>
    </section>
  );
}
