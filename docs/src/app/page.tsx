import Link from 'next/link';
import { highlight } from 'sugar-high';
import {
  Terminal,
  Cyan,
  Green,
  Gray,
  Dim,
  Bold,
  Inv,
  Line,
  Accent,
} from '@/components/Terminal';
import { BrowserFrame, NativeSelect } from '@/components/SmartTerminal';
import ThemeToggle from '@/components/ThemeToggle';
import { ThemingDemo } from '@/components/ThemingDemo';
import { AccentProvider } from '@/components/AccentContext';
import { GradientSection } from '@/components/GradientSections';
import Testimonials from '@/components/Testimonials';

export const metadata = {
  title: 'termprompt - Beautiful terminal prompts for Node.js',
  description:
    'Zero-dependency terminal prompts with brand theming and OSC 7770 protocol support.',
};

/* ── Syntax-highlighted code block ── */

const shTheme: Record<string, string> = {
  '--sh-class': '#79c0ff',
  '--sh-identifier': '#c9d1d9',
  '--sh-sign': '#8b949e',
  '--sh-property': '#d2a8ff',
  '--sh-entity': '#7ee787',
  '--sh-jsxliterals': '#a5d6ff',
  '--sh-string': '#a5d6ff',
  '--sh-keyword': '#ff7b72',
  '--sh-comment': '#8b949e',
};

function Code({ code, label }: { code: string; label?: string }) {
  const html = highlight(code.trim());
  return (
    <div className="relative">
      {label && (
        <span className="absolute top-3 left-4 z-10 rounded bg-[#1e293b]/80 px-2 py-0.5 font-[JetBrains_Mono,monospace] text-[10px] uppercase tracking-[0.15em] text-[#6b7280]">
          {label}
        </span>
      )}
      <div
        className="overflow-x-auto rounded-xl border border-[#1e293b] bg-[#0d1117] p-5 pt-10 text-[13px] leading-7"
        style={shTheme as React.CSSProperties}
      >
        <pre>
          <code dangerouslySetInnerHTML={{ __html: html }} />
        </pre>
      </div>
    </div>
  );
}

/* ── Code examples ── */

const BASIC_EXAMPLE = `
import {
  setTheme, intro, outro,
  select, confirm, input, isCancel, log,
} from 'termprompt';

setTheme({ accent: '#7c3aed' });
intro('create-app');

const name = await input({
  message: 'Project name?',
  placeholder: 'my-app',
});
if (isCancel(name)) process.exit(0);

const framework = await select({
  message: 'Pick a framework',
  options: [
    { value: 'next', label: 'Next.js', hint: 'React SSR' },
    { value: 'hono', label: 'Hono', hint: 'Edge-first' },
    { value: 'astro', label: 'Astro', hint: 'Content sites' },
  ],
});
if (isCancel(framework)) process.exit(0);

log.success(\`Created \${name} with \${framework}.\`);
outro('Happy coding.');`;

/* ── Ecosystem data ── */

const TERMINALS = [
  {
    name: 'Anyterm',
    type: 'Web terminal',
    status: 'supported' as const,
    url: 'https://anyterm.dev',
    desc: 'Web-based terminal with full OSC 7770 support. Native prompts in your browser.',
  },
  {
    name: 'VSCode Terminal',
    type: 'IDE extension',
    status: 'coming' as const,
    desc: 'Native prompt UI directly in the VSCode integrated terminal.',
  },
];

/* ── Features data ── */

const FEATURES = [
  {
    title: 'OSC 7770',
    desc: 'Smart terminals like Anyterm render native UI. Standard terminals get the TUI. Same code, zero config.',
  },
  {
    title: 'zero dependencies',
    desc: 'Only node:process, node:stream, node:crypto. No transitive supply chain risk.',
  },
  {
    title: 'brand theming',
    desc: 'setTheme({ accent: "#hex" }). Works with chalk, picocolors, or raw ANSI.',
  },
  {
    title: 'strict typescript',
    desc: 'Full generics, typed cancel via symbol, narrowing type guards. No @types/ needed.',
  },
  {
    title: 'vim bindings',
    desc: 'j/k/h/l navigation, Ctrl+A/E/U/W editing. Arrow keys too.',
  },
  {
    title: 'composable',
    desc: 'group() chains prompts. Each step sees previous answers. Cancel propagates.',
  },
];

/* ── Page ── */

export default function HomePage() {
  return (
    <>
      {/* CSS keyframes */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes fadeUp {
              from { opacity: 0; transform: translateY(24px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .anim-fade {
              opacity: 0;
              animation: fadeUp 0.6s ease-out forwards;
            }
            @supports (animation-timeline: view()) {
              .anim-scroll {
                opacity: 0;
                animation: fadeUp 0.5s ease-out both;
                animation-timeline: view();
                animation-range: entry 0% entry 25%;
              }
            }
          `,
        }}
      />

      <div className="min-h-screen text-fd-foreground">
        {/* ━━ Nav ━━ */}
        <nav className="sticky top-0 z-50 border-b border-fd-border/40 bg-fd-background/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link
              href="/"
              className="font-[JetBrains_Mono,monospace] text-sm font-semibold text-fd-foreground"
            >
              termprompt
            </Link>
            <div className="flex items-center gap-6 font-[JetBrains_Mono,monospace] text-[12px] text-fd-muted-foreground">
              <Link href="/docs" className="transition-colors hover:text-fd-foreground">
                docs
              </Link>
              <a href="#ecosystem" className="transition-colors hover:text-fd-foreground">
                ecosystem
              </a>
              <a
                href="https://github.com/seeden/termprompt"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-fd-foreground"
              >
                github
              </a>
              <a
                href="https://www.npmjs.com/package/termprompt"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-fd-foreground"
              >
                npm
              </a>
              <ThemeToggle />
            </div>
          </div>
        </nav>

        {/* ━━ Hero ━━ */}
        <GradientSection variant="hero" className="overflow-hidden">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 pt-20 pb-16 lg:min-h-[85vh] lg:grid-cols-[1fr_1.2fr] lg:gap-16 lg:pt-0 lg:pb-0">
            {/* Copy */}
            <div>
              <div
                className="anim-fade font-[JetBrains_Mono,monospace] text-[11px] text-fd-muted-foreground"
                style={{ animationDelay: '0ms' }}
              >
                TypeScript&ensp;&middot;&ensp;zero dependencies&ensp;&middot;&ensp;MIT&ensp;&middot;&ensp;OSC 7770
              </div>

              <h1 className="mt-6">
                <span
                  className="anim-fade block font-['DM_Sans',sans-serif] text-4xl font-extrabold leading-[1.08] tracking-[-0.04em] text-fd-foreground md:text-6xl lg:text-7xl"
                  style={{ animationDelay: '100ms' }}
                >
                  One API.
                </span>
                <span
                  className="anim-fade block bg-clip-text font-['DM_Sans',sans-serif] text-4xl font-extrabold leading-[1.08] tracking-[-0.04em] text-transparent md:text-6xl lg:text-7xl"
                  style={{
                    animationDelay: '200ms',
                    backgroundImage: 'linear-gradient(135deg, #0891b2, #22d3ee, #a5f3fc)',
                  }}
                >
                  Two experiences.
                </span>
              </h1>

              <p
                className="anim-fade mt-6 max-w-md font-[JetBrains_Mono,monospace] text-sm leading-relaxed text-fd-muted-foreground"
                style={{ animationDelay: '300ms' }}
              >
                termprompt renders a beautiful TUI in any terminal.
                Smart terminals get native UI. Same code, zero config, zero dependencies.
              </p>

              <div
                className="anim-fade mt-10 flex flex-wrap items-center gap-4"
                style={{ animationDelay: '400ms' }}
              >
                <Link
                  href="/docs"
                  className="rounded-lg bg-fd-primary px-6 py-2.5 font-[JetBrains_Mono,monospace] text-[13px] font-semibold text-fd-primary-foreground shadow-[0_0_24px_-4px_rgba(34,211,238,0.3)] transition-all hover:shadow-[0_0_32px_-4px_rgba(34,211,238,0.5)]"
                >
                  get started
                </Link>
                <code className="rounded-lg border border-fd-border bg-fd-card px-5 py-2.5 font-[JetBrains_Mono,monospace] text-[13px] text-fd-muted-foreground">
                  <span className="select-none text-fd-primary">$ </span>
                  <span className="text-fd-foreground">npm install termprompt</span>
                </code>
              </div>
            </div>

            {/* Dual-view: TUI terminal overlapping with native UI */}
            <div
              className="anim-fade relative lg:mr-[-2rem]"
              style={{ animationDelay: '500ms', animationDuration: '0.8s' }}
            >
              {/* TUI terminal — behind, offset top-left */}
              <div className="relative z-10 max-w-[85%]">
                <Terminal
                  title="standard terminal"
                  className="shadow-[0_0_60px_-20px_rgba(34,211,238,0.10)]"
                >
                  <Line>
                    <Cyan>◇</Cyan> <Bold>Pick a framework</Bold>
                  </Line>
                  <Line>
                    <Gray>│</Gray> <Green>◉</Green> Next.js <Dim>(React SSR)</Dim>
                  </Line>
                  <Line>
                    <Gray>│</Gray> <Dim>○ Hono</Dim> <Dim>(Edge-first)</Dim>
                  </Line>
                  <Line>
                    <Gray>│</Gray> <Dim>○ Astro</Dim> <Dim>(Content-first)</Dim>
                  </Line>
                  <Line>
                    <Gray>└</Gray>
                  </Line>
                </Terminal>
              </div>

              {/* Native UI — in front, offset bottom-right, overlapping */}
              <div className="relative z-20 mt-[-3rem] ml-auto mr-0 w-[75%] lg:mt-[-4rem]">
                <BrowserFrame url="anyterm.dev">
                  <NativeSelect />
                </BrowserFrame>
              </div>
            </div>
          </div>
        </GradientSection>

        {/* ━━ How It Works ━━ */}
        <section className="bg-[#0c1017] py-24 lg:py-32">
          <div className="mx-auto max-w-7xl px-6">
            {/* Heading */}
            <div className="anim-scroll mb-16 text-center">
              <p className="mb-4 font-[JetBrains_Mono,monospace] text-[11px] font-medium uppercase tracking-[0.2em] text-[#22d3ee]">
                How it works
              </p>
              <h2 className="font-['DM_Sans',sans-serif] text-3xl font-extrabold tracking-[-0.03em] text-[#e4e8f0] md:text-5xl">
                Your code doesn&apos;t change.{' '}
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #0891b2, #22d3ee, #a5f3fc)',
                  }}
                >
                  The terminal decides.
                </span>
              </h2>
            </div>

            {/* Three steps */}
            <div className="grid gap-8 md:grid-cols-3">
              {/* Step 1: You write prompts */}
              <div className="anim-scroll rounded-xl border border-[#1e2d40] bg-[#0a0e14] p-8">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#22d3ee]/10 font-[JetBrains_Mono,monospace] text-[12px] font-bold text-[#22d3ee]">1</span>
                  <h3 className="font-[JetBrains_Mono,monospace] text-[13px] font-bold text-[#e4e8f0]">You write prompts</h3>
                </div>
                <pre className="mb-4 overflow-x-auto rounded-lg bg-[#0c1017] p-4 font-[JetBrains_Mono,monospace] text-[12px] leading-6 text-[#c9d1d9]">
{`await select({
  message: 'Pick a framework',
  options: [
    { value: 'next', label: 'Next.js' },
    { value: 'hono', label: 'Hono' },
  ],
});`}
                </pre>
                <p className="font-[JetBrains_Mono,monospace] text-[12px] leading-relaxed text-[#8d96a8]">
                  Standard termprompt API. Nothing special.
                </p>
              </div>

              {/* Step 2: termprompt emits both */}
              <div className="anim-scroll rounded-xl border border-[#1e2d40] bg-[#0a0e14] p-8">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#22d3ee]/10 font-[JetBrains_Mono,monospace] text-[12px] font-bold text-[#22d3ee]">2</span>
                  <h3 className="font-[JetBrains_Mono,monospace] text-[13px] font-bold text-[#e4e8f0]">termprompt emits both</h3>
                </div>
                <div className="mb-4 space-y-3">
                  <div className="rounded-lg bg-[#0c1017] p-4">
                    <p className="mb-2 font-[JetBrains_Mono,monospace] text-[10px] uppercase tracking-[0.15em] text-[#4a5568]">TUI output</p>
                    <pre className="font-[JetBrains_Mono,monospace] text-[12px] leading-5 text-[#c9d1d9]">
                      <span className="text-[#22d3ee]">◇</span> Pick a framework{'\n'}
                      <span className="text-[#4a5568]">│</span> <span className="text-[#4ade80]">◉</span> Next.js{'\n'}
                      <span className="text-[#4a5568]">│</span> <span className="text-[#6b7280]">○ Hono</span>
                    </pre>
                  </div>
                  <div className="rounded-lg bg-[#0c1017] p-4">
                    <p className="mb-2 font-[JetBrains_Mono,monospace] text-[10px] uppercase tracking-[0.15em] text-[#4a5568]">OSC 7770</p>
                    <code className="font-[JetBrains_Mono,monospace] text-[11px] leading-5 text-[#6b7280]">
                      <span className="text-[#22d3ee]">ESC</span>{']7770;'}
                      <span className="text-[#a5d6ff]">{'{...}'}</span>
                      <span className="text-[#22d3ee]">BEL</span>
                    </code>
                  </div>
                </div>
                <p className="font-[JetBrains_Mono,monospace] text-[12px] leading-relaxed text-[#8d96a8]">
                  TUI renders in the terminal. Structured metadata rides alongside.
                </p>
              </div>

              {/* Step 3: Smart terminals upgrade */}
              <div className="anim-scroll rounded-xl border border-[#1e2d40] bg-[#0a0e14] p-8">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#22d3ee]/10 font-[JetBrains_Mono,monospace] text-[12px] font-bold text-[#22d3ee]">3</span>
                  <h3 className="font-[JetBrains_Mono,monospace] text-[13px] font-bold text-[#e4e8f0]">Smart terminals upgrade</h3>
                </div>
                <div className="mb-4">
                  <BrowserFrame url="anyterm.dev">
                    <NativeSelect />
                  </BrowserFrame>
                </div>
                <p className="font-[JetBrains_Mono,monospace] text-[12px] leading-relaxed text-[#8d96a8]">
                  Terminals that understand 7770 render native UI. Others show the TUI.
                </p>
              </div>
            </div>

            <div className="mt-10 text-center">
              <Link
                href="/docs/advanced/osc-protocol"
                className="font-[JetBrains_Mono,monospace] text-[13px] text-[#22d3ee] hover:underline"
              >
                Read the protocol spec &rarr;
              </Link>
            </div>
          </div>
        </section>

        {/* ━━ Brand Theming (interactive) + Prompt/Display Strips ━━ */}
        <AccentProvider>
        <GradientSection variant="mid" className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-6">
            <ThemingDemo />
          </div>
        </GradientSection>

        {/* ━━ Prompt Strip ━━ */}
        <section className="bg-[#0c1017] py-24">
          <div className="mx-auto max-w-7xl px-6">
            <p className="anim-scroll mb-2 font-[JetBrains_Mono,monospace] text-[11px] font-medium uppercase tracking-[0.2em] text-[#22d3ee]">
              Every prompt, one API
            </p>
            <h2 className="anim-scroll mb-10 font-['DM_Sans',sans-serif] text-2xl font-extrabold tracking-[-0.03em] text-[#e4e8f0] md:text-3xl">
              Every prompt, rendered in your terminal
            </h2>

            <div className="grid auto-rows-fr gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="anim-scroll flex flex-col transition-transform duration-300 hover:translate-y-[-2px]">
                <Terminal title="select" className="flex-1">
                  <Line>
                    <Accent>◇</Accent> <Bold>Pick a framework</Bold>
                  </Line>
                  <Line>
                    <Gray>│</Gray> <Green>◉</Green> Next.js <Dim>(React SSR)</Dim>
                  </Line>
                  <Line>
                    <Gray>│</Gray> <Dim>○ Hono</Dim>
                  </Line>
                  <Line>
                    <Gray>│</Gray> <Dim>○ Astro</Dim>
                  </Line>
                  <Line>
                    <Gray>└</Gray>
                  </Line>
                </Terminal>
              </div>

              <div className="anim-scroll flex flex-col transition-transform duration-300 hover:translate-y-[-2px]">
                <Terminal title="confirm" className="flex-1">
                  <Line>
                    <Accent>◇</Accent> <Bold>Deploy to production?</Bold>
                  </Line>
                  <Line>
                    <Gray>│</Gray> <Accent><u>Yes</u></Accent> / <Dim>No</Dim>
                  </Line>
                  <Line>
                    <Gray>└</Gray>
                  </Line>
                </Terminal>
              </div>

              <div className="anim-scroll flex flex-col transition-transform duration-300 hover:translate-y-[-2px]">
                <Terminal title="input" className="flex-1">
                  <Line>
                    <Accent>◇</Accent> <Bold>Project name?</Bold>
                  </Line>
                  <Line>
                    <Gray>│</Gray> my-app
                    <Inv> </Inv>
                  </Line>
                  <Line>
                    <Gray>└</Gray>
                  </Line>
                </Terminal>
              </div>

              <div className="anim-scroll flex flex-col transition-transform duration-300 hover:translate-y-[-2px]">
                <Terminal title="multiselect" className="flex-1">
                  <Line>
                    <Accent>◇</Accent> <Bold>Select features</Bold>
                  </Line>
                  <Line>
                    <Gray>│</Gray> <Accent>{'>'}</Accent>
                    <Green>■</Green> TypeScript
                  </Line>
                  <Line>
                    <Gray>│</Gray> {'  '}
                    <Dim>□</Dim> <Dim>ESLint</Dim>
                  </Line>
                  <Line>
                    <Gray>│</Gray> {'  '}
                    <Green>■</Green> Vitest
                  </Line>
                  <Line>
                    <Gray>│</Gray> {'  '}
                    <Dim>□</Dim> <Dim>GitHub Actions</Dim>
                  </Line>
                  <Line>
                    <Gray>└</Gray>
                  </Line>
                </Terminal>
              </div>

              <div className="anim-scroll flex flex-col transition-transform duration-300 hover:translate-y-[-2px]">
                <Terminal title="password" className="flex-1">
                  <Line>
                    <Accent>◇</Accent> <Bold>Enter your API key</Bold>
                  </Line>
                  <Line>
                    <Gray>│</Gray> ••••••••
                  </Line>
                  <Line>
                    <Gray>└</Gray>
                  </Line>
                </Terminal>
              </div>

              <div className="anim-scroll flex flex-col transition-transform duration-300 hover:translate-y-[-2px]">
                <Terminal title="search" className="flex-1">
                  <Line>
                    <Accent>◇</Accent> <Bold>Select timezone</Bold>
                  </Line>
                  <Line>
                    <Gray>│</Gray> pac
                  </Line>
                  <Line>
                    <Gray>│</Gray> <Green>◉</Green> Pacific <Dim>(UTC-8)</Dim>
                  </Line>
                  <Line>
                    <Gray>│</Gray> <Dim>○ Asia/Pacific</Dim>
                  </Line>
                  <Line>
                    <Gray>└</Gray>
                  </Line>
                </Terminal>
              </div>

              <div className="anim-scroll flex flex-col transition-transform duration-300 hover:translate-y-[-2px]">
                <Terminal title="number" className="flex-1">
                  <Line>
                    <Accent>◇</Accent> <Bold>Port number?</Bold>
                  </Line>
                  <Line>
                    <Gray>│</Gray> 3000
                    <Inv> </Inv>
                  </Line>
                  <Line>
                    <Gray>└</Gray>
                  </Line>
                </Terminal>
              </div>
            </div>

            {/* ━━ Display Utilities ━━ */}
            <div className="mt-24">
              <p className="anim-scroll mb-2 font-[JetBrains_Mono,monospace] text-[11px] font-medium uppercase tracking-[0.2em] text-[#22d3ee]">
                Display utilities
              </p>
              <h2 className="anim-scroll mb-10 font-['DM_Sans',sans-serif] text-2xl font-extrabold tracking-[-0.03em] text-[#e4e8f0] md:text-3xl">
                Spinners, progress, tasks, and notes
              </h2>

              <div className="grid auto-rows-fr gap-6 md:grid-cols-2">
                <div className="anim-scroll flex flex-col transition-transform duration-300 hover:translate-y-[-2px]">
                  <Terminal title="spinner" className="flex-1">
                    <Line>
                      <Accent>◒</Accent> {'  '}Installing dependencies...
                    </Line>
                    <Line>
                      <Green>◆</Green> {'  '}Installed 142 packages
                    </Line>
                  </Terminal>
                </div>

                <div className="anim-scroll flex flex-col transition-transform duration-300 hover:translate-y-[-2px]">
                  <Terminal title="progress" className="flex-1">
                    <Line>
                      <Accent>████████████</Accent>
                      <Dim>░░░░░░░░</Dim> {'  '}Downloading... {'  '}
                      <Dim>60%</Dim>
                    </Line>
                    <Line>
                      <Green>◆</Green> {'  '}Download complete
                    </Line>
                  </Terminal>
                </div>

                <div className="anim-scroll flex flex-col transition-transform duration-300 hover:translate-y-[-2px]">
                  <Terminal title="tasks" className="flex-1">
                    <Line>
                      <Gray>│</Gray>
                    </Line>
                    <Line>
                      <Green>◆</Green> {'  '}
                      <Dim>Install dependencies</Dim>
                    </Line>
                    <Line>
                      <Accent>◒</Accent> {'  '}Generating types...
                    </Line>
                    <Line>
                      <Dim>○</Dim> {'  '}
                      <Dim>Run tests</Dim>
                    </Line>
                    <Line>
                      <Dim>○</Dim> {'  '}
                      <Dim>Build project</Dim>
                    </Line>
                    <Line>
                      <Gray>│</Gray>
                    </Line>
                  </Terminal>
                </div>

                <div className="anim-scroll flex flex-col transition-transform duration-300 hover:translate-y-[-2px]">
                  <Terminal title="note" className="flex-1">
                    <Line>
                      <Gray>│</Gray>
                    </Line>
                    <Line>
                      <Gray>│</Gray> {'  '}
                      <Green>────────────────────</Green>
                    </Line>
                    <Line>
                      <Gray>│</Gray> {'  '}
                      <Green>
                        <Bold>Next steps</Bold>
                      </Green>
                    </Line>
                    <Line>
                      <Gray>│</Gray> {'  '}
                      <Dim>cd my-app</Dim>
                    </Line>
                    <Line>
                      <Gray>│</Gray> {'  '}
                      <Dim>npm run dev</Dim>
                    </Line>
                    <Line>
                      <Gray>│</Gray> {'  '}
                      <Gray>────────────────────</Gray>
                    </Line>
                  </Terminal>
                </div>
              </div>
            </div>
          </div>
        </section>
        </AccentProvider>

        {/* ━━ Features Grid ━━ */}
        <GradientSection variant="lower" className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-6">
            <div className="anim-scroll grid gap-px overflow-hidden rounded-xl border border-fd-border bg-fd-border md:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ title, desc }) => (
                <div key={title} className="bg-fd-background p-8">
                  <h3 className="mb-2 font-[JetBrains_Mono,monospace] text-[13px] font-bold text-fd-primary">
                    {title}
                  </h3>
                  <p className="font-[JetBrains_Mono,monospace] text-[12px] leading-relaxed text-fd-muted-foreground">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ━━ Full Code Example ━━ */}
          <div className="anim-scroll mx-auto max-w-4xl px-6 pt-20">
            <Code code={BASIC_EXAMPLE} label="Full example" />
          </div>
        </GradientSection>

        {/* ━━ Terminal Ecosystem ━━ */}
        <section id="ecosystem" className="bg-[#0c1017] py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-6">
            <div className="anim-scroll mb-12">
              <p className="mb-4 font-[JetBrains_Mono,monospace] text-[11px] font-medium uppercase tracking-[0.2em] text-[#22d3ee]">
                Ecosystem
              </p>
              <h2 className="font-['DM_Sans',sans-serif] text-3xl font-extrabold tracking-[-0.03em] text-[#e4e8f0] md:text-4xl">
                Which terminals support 7770?
              </h2>
              <p className="mt-4 max-w-2xl font-[JetBrains_Mono,monospace] text-sm leading-relaxed text-[#8d96a8]">
                OSC 7770 is an open standard. Terminal hosts adopt it independently.
                Your code works everywhere.
              </p>
            </div>

            <div className="anim-scroll grid gap-4 md:grid-cols-2">
              {TERMINALS.map((t) => (
                <div
                  key={t.name}
                  className="group relative rounded-xl border border-[#1e2d40] bg-[#0a0e14] p-6 transition-colors hover:border-[#2a3a50]"
                  style={t.status === 'supported' ? { borderLeftWidth: 3, borderLeftColor: '#22d3ee' } : {}}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="font-[JetBrains_Mono,monospace] text-[14px] font-bold text-[#e4e8f0]">
                        {t.url ? (
                          <a
                            href={t.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="transition-colors hover:text-[#22d3ee]"
                          >
                            {t.name}
                          </a>
                        ) : (
                          t.name
                        )}
                      </h3>
                      <span className="font-[JetBrains_Mono,monospace] text-[11px] text-[#4a5568]">{t.type}</span>
                    </div>
                    {t.status === 'supported' ? (
                      <span className="rounded-full bg-[#22d3ee]/10 px-3 py-1 font-[JetBrains_Mono,monospace] text-[11px] font-medium text-[#22d3ee]">
                        supported
                      </span>
                    ) : (
                      <span className="rounded-full bg-[#1e2d40] px-3 py-1 font-[JetBrains_Mono,monospace] text-[11px] text-[#4a5568]">
                        coming soon
                      </span>
                    )}
                  </div>
                  <p className={`font-[JetBrains_Mono,monospace] text-[12px] leading-relaxed ${t.status === 'supported' ? 'text-[#8d96a8]' : 'text-[#4a5568]'}`}>
                    {t.desc}
                  </p>
                </div>
              ))}
            </div>

            <p className="anim-scroll mt-8 font-[JetBrains_Mono,monospace] text-[12px] leading-relaxed text-[#4a5568]">
              Want your terminal listed here?{' '}
              <Link
                href="/docs/advanced/osc-protocol"
                className="text-[#22d3ee] hover:underline"
              >
                The spec is open and MIT-licensed.
              </Link>
            </p>
          </div>
        </section>

        {/* ━━ Testimonials ━━ */}
        <section className="border-t border-fd-border/40 py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-6">
            <p className="mb-2 font-[JetBrains_Mono,monospace] text-[11px] font-medium uppercase tracking-[0.2em] text-fd-primary">
              Community
            </p>
            <h2 className="mb-4 max-w-md font-['DM_Sans',sans-serif] text-2xl font-extrabold tracking-tight text-fd-foreground md:text-3xl">
              Who&apos;s using termprompt?
            </h2>
            <p className="mb-10 max-w-lg text-sm leading-relaxed text-fd-muted-foreground">
              Companies and developers shipping with termprompt in production. Get your logo and a dofollow backlink
              on this page.
            </p>

            <Testimonials />
          </div>
        </section>

        {/* ━━ Footer ━━ */}
        <section className="border-t border-fd-border pt-16 pb-12">
          <div className="mx-auto max-w-7xl px-6 text-center">
            <code className="inline-block rounded-lg border border-fd-border bg-fd-card px-5 py-2.5 font-[JetBrains_Mono,monospace] text-[13px] text-fd-muted-foreground">
              <span className="select-none text-fd-primary">$ </span>
              <span className="text-fd-foreground">npm install termprompt</span>
            </code>
            <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 font-[JetBrains_Mono,monospace] text-[11px] text-fd-muted-foreground">
              <span>MIT License</span>
              <span className="opacity-40">&middot;</span>
              <span>TypeScript</span>
              <span className="opacity-40">&middot;</span>
              <span>Zero Dependencies</span>
            </div>
            <div className="mt-4 flex justify-center gap-6 font-[JetBrains_Mono,monospace] text-[12px]">
              <Link href="/docs" className="text-fd-primary hover:underline">
                docs
              </Link>
              <a
                href="https://github.com/seeden/termprompt"
                target="_blank"
                rel="noopener noreferrer"
                className="text-fd-primary hover:underline"
              >
                github
              </a>
              <a
                href="https://www.npmjs.com/package/termprompt"
                target="_blank"
                rel="noopener noreferrer"
                className="text-fd-primary hover:underline"
              >
                npm
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
