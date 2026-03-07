'use client';

import { useState, type FormEvent } from 'react';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

const PERKS = [
  ['Your logo on this page', 'Visible to every developer who visits'],
  ['Dofollow backlink', 'Direct SEO value to your domain'],
  ['Community recognition', 'Show you build with modern tools'],
] as const;

export default function Testimonials() {
  const [state, setState] = useState<FormState>('idle');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('submitting');

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch('https://formspree.io/f/mnnbagln', {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) throw new Error('Submit failed');

      setState('success');
      form.reset();
    } catch {
      setState('error');
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
      {/* Left: pitch */}
      <div>
        <p className="mb-6 max-w-md text-sm leading-relaxed text-fd-muted-foreground">
          Using termprompt in production? Get your company featured here. We add your logo with a dofollow backlink,
          visible to every developer who visits.
        </p>

        <div className="flex flex-col gap-4">
          {PERKS.map(([title, desc]) => (
            <div key={title} className="flex items-start gap-3">
              <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-fd-primary" />
              <div>
                <p className="text-sm font-semibold text-fd-foreground">{title}</p>
                <p className="text-[13px] text-fd-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Ghost testimonial cards */}
        <div className="mt-8 flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border border-dashed border-fd-border px-4 py-3"
              style={{ opacity: 1.1 - i * 0.25 }}
            >
              <div className="h-8 w-8 shrink-0 rounded-full bg-fd-border" />
              <div className="flex-1">
                <div className="mb-1 h-3 w-24 rounded bg-fd-border" />
                <div className="h-2.5 w-40 rounded bg-fd-border opacity-60" />
              </div>
            </div>
          ))}
          <p className="text-center text-xs text-fd-muted-foreground opacity-60">
            Your company could be here
          </p>
        </div>
      </div>

      {/* Right: form */}
      <div>
        {state === 'success' ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-fd-border bg-fd-card p-8">
            <div className="text-center">
              <p className="text-lg font-semibold text-fd-foreground">Thank you!</p>
              <p className="mt-2 text-sm text-fd-muted-foreground">
                We&apos;ll review your submission and add your logo to this page.
              </p>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 rounded-xl border border-fd-border bg-fd-card p-6"
          >
            <p className="text-sm font-semibold text-fd-foreground">Get featured</p>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-fd-muted-foreground">Your name</span>
                <input
                  type="text"
                  name="name"
                  required
                  className="rounded-lg border border-fd-border bg-fd-background px-3 py-2 text-sm text-fd-foreground outline-none transition-colors focus:border-fd-primary"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-fd-muted-foreground">Email</span>
                <input
                  type="email"
                  name="email"
                  required
                  className="rounded-lg border border-fd-border bg-fd-background px-3 py-2 text-sm text-fd-foreground outline-none transition-colors focus:border-fd-primary"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-fd-muted-foreground">Job title</span>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. CTO, Senior Engineer"
                  className="rounded-lg border border-fd-border bg-fd-background px-3 py-2 text-sm text-fd-foreground outline-none transition-colors placeholder:text-fd-muted-foreground placeholder:opacity-40 focus:border-fd-primary"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-fd-muted-foreground">Company / Project</span>
                <input
                  type="text"
                  name="company"
                  required
                  className="rounded-lg border border-fd-border bg-fd-background px-3 py-2 text-sm text-fd-foreground outline-none transition-colors focus:border-fd-primary"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-fd-muted-foreground">Website URL</span>
                <input
                  type="url"
                  name="url"
                  required
                  placeholder="https://"
                  className="rounded-lg border border-fd-border bg-fd-background px-3 py-2 text-sm text-fd-foreground outline-none transition-colors placeholder:text-fd-muted-foreground placeholder:opacity-40 focus:border-fd-primary"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-fd-muted-foreground">Country</span>
                <input
                  type="text"
                  name="country"
                  required
                  placeholder="e.g. United States, Germany"
                  className="rounded-lg border border-fd-border bg-fd-background px-3 py-2 text-sm text-fd-foreground outline-none transition-colors placeholder:text-fd-muted-foreground placeholder:opacity-40 focus:border-fd-primary"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-fd-muted-foreground">
                How are you using termprompt?
              </span>
              <textarea
                name="message"
                required
                rows={3}
                placeholder="e.g. We use termprompt for our CLI scaffolding tool..."
                className="resize-none rounded-lg border border-fd-border bg-fd-background px-3 py-2 text-sm text-fd-foreground outline-none transition-colors placeholder:text-fd-muted-foreground placeholder:opacity-40 focus:border-fd-primary"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-fd-muted-foreground">
                Logo URL <span className="opacity-50">(optional)</span>
              </span>
              <input
                type="url"
                name="logo"
                placeholder="https://your-site.com/logo.svg"
                className="rounded-lg border border-fd-border bg-fd-background px-3 py-2 text-sm text-fd-foreground outline-none transition-colors placeholder:text-fd-muted-foreground placeholder:opacity-40 focus:border-fd-primary"
              />
            </label>

            <input type="hidden" name="project" value="termprompt" />
            <input type="hidden" name="_subject" value="termprompt - New testimonial submission" />

            {state === 'error' && <p className="text-sm text-red-500">Something went wrong. Please try again.</p>}

            <button
              type="submit"
              disabled={state === 'submitting'}
              className="mt-1 self-start rounded-full bg-fd-primary px-6 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_-4px_rgba(34,211,238,0.4)] transition-all hover:shadow-[0_0_32px_-4px_rgba(34,211,238,0.6)] disabled:opacity-60"
            >
              {state === 'submitting' ? 'Submitting...' : 'Get Featured'}
            </button>

            <p className="text-[11px] text-fd-muted-foreground opacity-60">
              We&apos;ll review your submission and reach out via email. Your information is only used for this purpose.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
