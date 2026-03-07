'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState, type ReactNode } from 'react';

/**
 * Wraps a section with a visible gradient background.
 * Uses client-side theme detection to apply the right gradient,
 * avoiding Tailwind dark: variant issues with fumadocs.
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
      dark: [
        'radial-gradient(ellipse 80% 50% at 65% 15%, rgba(34,211,238,0.14) 0%, transparent 70%)',
        'radial-gradient(ellipse 50% 40% at 20% 60%, rgba(34,211,238,0.05) 0%, transparent 70%)',
        'radial-gradient(ellipse 60% 40% at 50% 40%, rgba(99,102,241,0.04) 0%, transparent 70%)',
      ].join(', '),
      light: [
        'radial-gradient(ellipse 70% 45% at 60% 10%, rgba(8,145,178,0.08) 0%, transparent 70%)',
        'radial-gradient(ellipse 45% 35% at 35% 65%, rgba(8,145,178,0.04) 0%, transparent 70%)',
      ].join(', '),
    },
    mid: {
      dark: 'radial-gradient(ellipse 70% 50% at 80% 30%, rgba(34,211,238,0.07) 0%, transparent 70%)',
      light: 'radial-gradient(ellipse 60% 40% at 70% 25%, rgba(8,145,178,0.05) 0%, transparent 70%)',
    },
    lower: {
      dark: 'radial-gradient(ellipse 60% 50% at 20% 50%, rgba(34,211,238,0.06) 0%, transparent 70%)',
      light: 'radial-gradient(ellipse 50% 40% at 25% 45%, rgba(8,145,178,0.04) 0%, transparent 70%)',
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
      {children}
    </section>
  );
}
