import type { ReactNode } from 'react';

export function BrowserFrame({
  title,
  url,
  children,
}: {
  title?: string;
  url?: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#2a2a3a] bg-[#18181f] shadow-[0_8px_40px_-12px_rgba(34,211,238,0.10)]">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-[#2a2a3a] bg-[#111118] px-4 py-2.5">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        {url && (
          <div className="ml-3 flex flex-1 items-center rounded-md bg-[#0c0c12] px-3 py-1">
            <svg
              className="mr-2 h-3 w-3 text-[#4a5568]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span className="text-[11px] text-[#6b7280]">{url}</span>
          </div>
        )}
        {title && !url && (
          <span className="ml-2 text-[11px] font-medium text-[#4a5568]">
            {title}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-6">{children}</div>
    </div>
  );
}

export function NativeSelect() {
  return (
    <div className="flex flex-col items-center justify-center py-2">
      <div className="relative w-full max-w-[280px]">
        {/* Modal dialog */}
        <div className="rounded-lg border border-[#2a2a3a] bg-[#1e1e2a] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          {/* Header */}
          <div className="border-b border-[#2a2a3a] px-4 py-3">
            <p className="text-[13px] font-medium text-[#e4e8f0]">
              Pick a framework
            </p>
          </div>

          {/* Options */}
          <div className="py-1">
            <div className="flex items-center gap-2.5 bg-[#22d3ee]/10 px-4 py-2.5">
              <div className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#22d3ee]">
                <div className="h-2 w-2 rounded-full bg-[#22d3ee]" />
              </div>
              <span className="text-[13px] font-medium text-[#e4e8f0]">
                Next.js
              </span>
              <span className="ml-auto text-[11px] text-[#6b7280]">
                React SSR
              </span>
            </div>

            <div className="flex items-center gap-2.5 px-4 py-2.5">
              <div className="h-4 w-4 rounded-full border-2 border-[#3a3a4a]" />
              <span className="text-[13px] text-[#9ca3af]">Hono</span>
              <span className="ml-auto text-[11px] text-[#4a5568]">
                Edge-first
              </span>
            </div>

            <div className="flex items-center gap-2.5 px-4 py-2.5">
              <div className="h-4 w-4 rounded-full border-2 border-[#3a3a4a]" />
              <span className="text-[13px] text-[#9ca3af]">Astro</span>
              <span className="ml-auto text-[11px] text-[#4a5568]">
                Content-first
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end border-t border-[#2a2a3a] px-4 py-2.5">
            <button
              type="button"
              className="rounded-md bg-[#22d3ee] px-3.5 py-1.5 text-[12px] font-medium text-[#0c1017]"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
