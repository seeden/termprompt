import type { ReactNode } from 'react';

type TerminalProps = {
  title?: string;
  children: ReactNode;
  className?: string;
};

export function Terminal({ title, children, className = '' }: TerminalProps) {
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-xl border border-[#1e293b] bg-[#0c1017] shadow-[0_0_40px_-12px_rgba(34,211,238,0.08)] ${className}`}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 border-b border-[#1e293b] px-4 py-2.5">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        {title && (
          <span className="ml-2 text-[11px] font-medium text-[#4a5568]">{title}</span>
        )}
      </div>

      {/* Content */}
      <pre className="flex-1 overflow-x-auto p-5 font-[JetBrains_Mono,ui-monospace,monospace] text-[13px] leading-6 text-[#c9d1d9]">
        {children}
      </pre>
    </div>
  );
}

// Color helpers for terminal mockup text
export function Cyan({ children }: { children: ReactNode }) {
  return <span className="text-[#22d3ee]">{children}</span>;
}

export function Green({ children }: { children: ReactNode }) {
  return <span className="text-[#4ade80]">{children}</span>;
}

export function Yellow({ children }: { children: ReactNode }) {
  return <span className="text-[#fbbf24]">{children}</span>;
}

export function Red({ children }: { children: ReactNode }) {
  return <span className="text-[#f87171]">{children}</span>;
}

export function Blue({ children }: { children: ReactNode }) {
  return <span className="text-[#60a5fa]">{children}</span>;
}

export function Magenta({ children }: { children: ReactNode }) {
  return <span className="text-[#c084fc]">{children}</span>;
}

export function Gray({ children }: { children: ReactNode }) {
  return <span className="text-[#4a5568]">{children}</span>;
}

export function Dim({ children }: { children: ReactNode }) {
  return <span className="text-[#6b7280]">{children}</span>;
}

export function Bold({ children }: { children: ReactNode }) {
  return <span className="font-bold text-[#e4e8f0]">{children}</span>;
}

export function Inv({ children }: { children: ReactNode }) {
  return <span className="bg-[#c9d1d9] text-[#0c1017]">{children}</span>;
}

export function Line({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}
