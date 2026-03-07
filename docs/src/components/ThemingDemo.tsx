'use client';

import { useState } from 'react';

const PRESETS = [
  { color: '#22d3ee', label: 'cyan' },
  { color: '#7c3aed', label: 'violet' },
  { color: '#f97316', label: 'orange' },
  { color: '#f43f5e', label: 'rose' },
  { color: '#10b981', label: 'emerald' },
];

export function ThemingDemo() {
  const [accent, setAccent] = useState('#22d3ee');

  return (
    <div className="grid items-start gap-12 lg:grid-cols-[2fr_3fr] lg:gap-16">
      {/* Left: copy + picker */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <p className="mb-4 font-[JetBrains_Mono,monospace] text-[11px] font-medium uppercase tracking-[0.2em] text-fd-primary">
          Brand theming
        </p>
        <h2 className="font-['DM_Sans',sans-serif] text-3xl font-extrabold tracking-[-0.03em] text-fd-foreground md:text-4xl">
          One line. Any color.
        </h2>
        <p className="mt-4 max-w-sm font-[JetBrains_Mono,monospace] text-sm leading-relaxed text-fd-muted-foreground">
          Hex, RGB, named colors, or bring chalk/picocolors. The accent color
          flows through every prompt, spinner, and focus indicator.
        </p>

        {/* Swatches */}
        <div className="mt-6 flex items-center gap-3">
          {PRESETS.map((p) => (
            <button
              key={p.color}
              type="button"
              onClick={() => setAccent(p.color)}
              className="h-8 w-8 rounded-full border-2 transition-all"
              style={{
                backgroundColor: p.color,
                borderColor: accent === p.color ? '#ffffff' : 'transparent',
                boxShadow:
                  accent === p.color
                    ? `0 0 12px ${p.color}40`
                    : 'none',
              }}
              aria-label={`Set accent to ${p.label}`}
            />
          ))}
          {/* Custom color */}
          <label className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-fd-border transition-colors hover:border-fd-muted-foreground">
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
            <svg
              className="h-3.5 w-3.5 text-fd-muted-foreground"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </label>
        </div>

        {/* Live code */}
        <code className="mt-6 block rounded-lg border border-fd-border bg-fd-card px-4 py-3 font-[JetBrains_Mono,monospace] text-[13px] text-fd-muted-foreground">
          setTheme({'{ '}accent:{' '}
          <span style={{ color: accent }}>"{accent}"</span>
          {' }'})
        </code>
      </div>

      {/* Right: live terminal preview */}
      <div className="relative">
        <div
          className="pointer-events-none absolute inset-0 -z-10 rounded-3xl opacity-20"
          style={{
            background: `radial-gradient(ellipse at center, ${accent} 0%, transparent 70%)`,
          }}
        />
        <div className="flex flex-col overflow-hidden rounded-xl border border-[#1e293b] bg-[#0c1017] shadow-[0_0_40px_-12px_rgba(34,211,238,0.08)]">
          {/* Title bar */}
          <div className="flex items-center gap-2 border-b border-[#1e293b] px-4 py-2.5">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            </div>
            <span className="ml-2 text-[11px] font-medium text-[#4a5568]">
              create-app
            </span>
          </div>

          {/* Terminal content */}
          <pre className="flex-1 overflow-x-auto p-5 font-[JetBrains_Mono,ui-monospace,monospace] text-[13px] leading-6 text-[#c9d1d9]">
            <div>
              <span className="text-[#4a5568]">┌</span>{' '}
              <span className="font-bold text-[#e4e8f0]">create-app</span>
            </div>
            <div>
              <span className="text-[#4a5568]">│</span>
            </div>
            <div>
              <span className="text-[#4ade80]">◆</span>{' '}
              <span className="font-bold text-[#e4e8f0]">Project name?</span>
            </div>
            <div>
              <span className="text-[#4a5568]">│</span>{' '}
              <span className="text-[#6b7280]">my-app</span>
            </div>
            <div>
              <span style={{ color: accent }} className="transition-colors duration-200">
                ◇
              </span>{' '}
              <span className="font-bold text-[#e4e8f0]">Pick a framework</span>
            </div>
            <div>
              <span className="text-[#4a5568]">│</span>{' '}
              <span className="text-[#4ade80]">◉</span> Next.js{' '}
              <span className="text-[#6b7280]">(React SSR)</span>
            </div>
            <div>
              <span className="text-[#4a5568]">│</span>{' '}
              <span className="text-[#6b7280]">○ Hono</span>
            </div>
            <div>
              <span className="text-[#4a5568]">│</span>{' '}
              <span className="text-[#6b7280]">○ Astro</span>
            </div>
            <div>
              <span className="text-[#4a5568]">└</span>
            </div>
          </pre>
        </div>
      </div>
    </div>
  );
}
