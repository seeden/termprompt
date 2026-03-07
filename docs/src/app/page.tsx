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
} from '@/components/Terminal';
import { BrowserFrame, NativeSelect } from '@/components/SmartTerminal';
import ThemeToggle from '@/components/ThemeToggle';
import { ThemingDemo } from '@/components/ThemingDemo';
import { GradientSection } from '@/components/GradientSections';

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

const OSC_EXAMPLE = `
// Your app code is identical. Zero changes needed.
const framework = await select({
  message: 'Pick a framework',
  options: [
    { value: 'next', label: 'Next.js' },
    { value: 'hono', label: 'Hono' },
  ],
});

// termprompt emits OSC 7770 alongside the TUI.
// Smart terminals intercept it and render native UI.
// Standard terminals just show the TUI. Zero config.`;

/* ── Features data ── */

const FEATURES = [
  {
    title: 'OSC 7770',
    desc: 'Smart terminals render native UI. Standard terminals get the TUI. Same code, zero config.',
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
            @keyframes seamPulse {
              0%, 100% { opacity: 0.6; }
              50% { opacity: 1; }
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
                TypeScript&ensp;&middot;&ensp;zero dependencies&ensp;&middot;&ensp;MIT
              </div>

              <h1 className="mt-6">
                <span
                  className="anim-fade block font-['DM_Sans',sans-serif] text-4xl font-extrabold leading-[1.08] tracking-[-0.04em] text-fd-foreground md:text-6xl lg:text-7xl"
                  style={{ animationDelay: '100ms' }}
                >
                  Beautiful terminal prompts,
                </span>
                <span
                  className="anim-fade block bg-clip-text font-['DM_Sans',sans-serif] text-4xl font-extrabold leading-[1.08] tracking-[-0.04em] text-transparent md:text-6xl lg:text-7xl"
                  style={{
                    animationDelay: '200ms',
                    backgroundImage: 'linear-gradient(135deg, #0891b2, #22d3ee, #a5f3fc)',
                  }}
                >
                  done right.
                </span>
              </h1>

              <p
                className="anim-fade mt-6 max-w-md font-[JetBrains_Mono,monospace] text-sm leading-relaxed text-fd-muted-foreground"
                style={{ animationDelay: '300ms' }}
              >
                Zero dependencies. Smart terminals render native UI from the same code.
                Standard terminals get a beautiful TUI.
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

            {/* Terminal mockup — full flow with intro/outro */}
            <div
              className="anim-fade lg:mr-[-4rem]"
              style={{ animationDelay: '500ms', animationDuration: '0.8s' }}
            >
              <Terminal
                title="create-app"
                className="shadow-[0_0_80px_-20px_rgba(34,211,238,0.12)] transition-transform duration-300 hover:translate-y-[-2px]"
              >
                <Line>
                  <Gray>┌</Gray> <Bold>create-app</Bold>
                </Line>
                <Line>
                  <Gray>│</Gray>
                </Line>
                <Line>
                  <Green>◆</Green> <Bold>Project name?</Bold>
                </Line>
                <Line>
                  <Gray>│</Gray> <Dim>my-app</Dim>
                </Line>
                <Line>
                  <Green>◆</Green> <Bold>Pick a framework</Bold>
                </Line>
                <Line>
                  <Gray>│</Gray> <Dim>Next.js</Dim>
                </Line>
                <Line>
                  <Green>◆</Green> <Bold>Select features</Bold>
                </Line>
                <Line>
                  <Gray>│</Gray> <Dim>TypeScript, Vitest</Dim>
                </Line>
                <Line>
                  <Green>◆</Green> <Bold>Initialize git?</Bold>
                </Line>
                <Line>
                  <Gray>│</Gray> <Dim>Yes</Dim>
                </Line>
                <Line>
                  <Green>◆</Green> Project created!
                </Line>
                <Line>
                  <Gray>└</Gray> Happy coding.
                </Line>
              </Terminal>
            </div>
          </div>
        </GradientSection>

        {/* ━━ OSC 7770 Centerpiece ━━ */}
        <section className="bg-[#0c1017] py-24 lg:py-32">
          <div className="mx-auto max-w-7xl px-6">
            {/* Heading */}
            <div className="anim-scroll mb-12 text-center lg:mb-16">
              <p className="mb-4 font-[JetBrains_Mono,monospace] text-[11px] font-medium uppercase tracking-[0.2em] text-[#22d3ee]">
                OSC 7770 Protocol
              </p>
              <h2 className="font-['DM_Sans',sans-serif] text-3xl font-extrabold tracking-[-0.03em] text-[#e4e8f0] md:text-5xl lg:text-6xl">
                Same code.{' '}
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #0891b2, #22d3ee, #a5f3fc)',
                  }}
                >
                  Two worlds.
                </span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl font-[JetBrains_Mono,monospace] text-sm leading-relaxed text-[#8d96a8]">
                termprompt emits structured metadata alongside the TUI. Smart terminals
                intercept it and render native UI. Standard terminals show the TUI. Zero
                config, zero degradation.
              </p>
            </div>

            {/* Split comparison */}
            <div className="anim-scroll relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-[#1e2d40] shadow-[0_0_60px_-12px_rgba(34,211,238,0.08)]">
              <div className="grid lg:grid-cols-[3fr_2fr]">
                {/* Left: raw TUI (wider) */}
                <div className="relative bg-[#0a0e14] p-8 lg:p-12">
                  <p className="mb-6 font-[JetBrains_Mono,monospace] text-[11px] font-medium uppercase tracking-[0.2em] text-[#4a5568]">
                    Any terminal
                  </p>
                  <pre className="font-[JetBrains_Mono,monospace] text-[13px] leading-6 text-[#c9d1d9]">
                    <Line>
                      <Cyan>◇</Cyan> <Bold>Pick a framework</Bold>
                    </Line>
                    <Line>
                      <Gray>│</Gray> <Green>◉</Green> Next.js{' '}
                      <Dim>(React SSR)</Dim>
                    </Line>
                    <Line>
                      <Gray>│</Gray> <Dim>○ Hono</Dim> <Dim>(Edge-first)</Dim>
                    </Line>
                    <Line>
                      <Gray>│</Gray> <Dim>○ Astro</Dim>{' '}
                      <Dim>(Content-first)</Dim>
                    </Line>
                    <Line>
                      <Gray>└</Gray>
                    </Line>
                  </pre>
                </div>

                {/* Glowing seam */}
                <div
                  className="absolute top-0 left-[60%] hidden h-full w-px -translate-x-1/2 lg:block"
                  style={{
                    background:
                      'linear-gradient(to bottom, transparent, #22d3ee, transparent)',
                    animation: 'seamPulse 3s ease-in-out infinite',
                  }}
                />

                {/* Right: native UI */}
                <div className="bg-[#111118] p-8 lg:p-12">
                  <p className="mb-6 font-[JetBrains_Mono,monospace] text-[11px] font-medium uppercase tracking-[0.2em] text-[#4a5568]">
                    Smart terminal host
                  </p>
                  <div className="flex items-center justify-center">
                    <BrowserFrame url="your-terminal.dev">
                      <NativeSelect />
                    </BrowserFrame>
                  </div>
                </div>
              </div>
            </div>

            {/* Code block */}
            <div className="mx-auto mt-10 max-w-3xl">
              <Code code={OSC_EXAMPLE} label="your code stays the same" />
            </div>

            {/* Wire format */}
            <div className="mx-auto mt-6 max-w-3xl text-center">
              <code className="inline-block rounded-lg border border-[#1e2d40] bg-[#0a0e14] px-4 py-2 font-[JetBrains_Mono,monospace] text-[11px] text-[#6b7280]">
                <span className="text-[#22d3ee]">ESC</span> ] 7770 ;{' '}
                <span className="text-[#a5d6ff]">
                  {'{"v":1,"type":"select","message":"Pick a framework",...}'}
                </span>{' '}
                <span className="text-[#22d3ee]">BEL</span>
              </code>
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/docs/advanced/osc-protocol"
                className="font-[JetBrains_Mono,monospace] text-[13px] text-[#22d3ee] hover:underline"
              >
                Read the protocol spec &rarr;
              </Link>
            </div>
          </div>
        </section>

        {/* ━━ Brand Theming (interactive) ━━ */}
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
                    <Cyan>◇</Cyan> <Bold>Pick a framework</Bold>
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
                    <Cyan>◇</Cyan> <Bold>Deploy to production?</Bold>
                  </Line>
                  <Line>
                    <Gray>│</Gray> <Cyan><u>Yes</u></Cyan> / <Dim>No</Dim>
                  </Line>
                  <Line>
                    <Gray>└</Gray>
                  </Line>
                </Terminal>
              </div>

              <div className="anim-scroll flex flex-col transition-transform duration-300 hover:translate-y-[-2px]">
                <Terminal title="input" className="flex-1">
                  <Line>
                    <Cyan>◇</Cyan> <Bold>Project name?</Bold>
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
                    <Cyan>◇</Cyan> <Bold>Select features</Bold>
                  </Line>
                  <Line>
                    <Gray>│</Gray> <Cyan>{'>'}</Cyan>
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
                    <Cyan>◇</Cyan> <Bold>Enter your API key</Bold>
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
                    <Cyan>◇</Cyan> <Bold>Select timezone</Bold>
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
                    <Cyan>◇</Cyan> <Bold>Port number?</Bold>
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
                      <Cyan>◒</Cyan> {'  '}Installing dependencies...
                    </Line>
                    <Line>
                      <Green>◆</Green> {'  '}Installed 142 packages
                    </Line>
                  </Terminal>
                </div>

                <div className="anim-scroll flex flex-col transition-transform duration-300 hover:translate-y-[-2px]">
                  <Terminal title="progress" className="flex-1">
                    <Line>
                      <Cyan>████████████</Cyan>
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
                      <Cyan>◒</Cyan> {'  '}Generating types...
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
