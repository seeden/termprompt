# termprompt

Beautiful terminal prompts for Node.js. Zero dependencies.

Every prompt emits [OSC 7770](./SPEC.md) escape sequences alongside the TUI. Smart terminals (web terminals, IDE terminals, multiplexers) can intercept the structured data and render native UI. Standard terminals ignore the sequences and show the TUI. Zero config, zero degradation.

```
┌  create-app
│
◆  Project name?
│  my-app
◆  Pick a framework
│  Next.js
◆  Select features
│  TypeScript, Vitest
◆  Initialize git?
│  Yes
◆  Project created!
└  Happy coding.
```

## Install

```bash
npm install termprompt
```

## Quick start

```typescript
import { setTheme, intro, outro, select, input, isCancel, log } from 'termprompt';

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

log.success(`Created ${name} with ${framework}.`);
outro('Happy coding.');
```

## Prompts

### select

Pick one option from a list.

```typescript
const framework = await select({
  message: 'Pick a framework',
  options: [
    { value: 'next', label: 'Next.js', hint: 'React SSR' },
    { value: 'hono', label: 'Hono', hint: 'Edge-first' },
    { value: 'express', label: 'Express', disabled: true },
  ],
  initialValue: 'next',
  maxItems: 5,
});
```

```
◇  Pick a framework
│  ◉ Next.js (React SSR)
│  ○ Hono
│  ○ Astro
└
```

Keys: `Up/Down` or `j/k` to navigate, `Enter` to submit, `Esc` to cancel.

### confirm

Yes or no.

```typescript
const ok = await confirm({
  message: 'Deploy to production?',
  initialValue: true,
  active: 'Yes',
  inactive: 'No',
});
```

```
◇  Deploy to production?
│  Yes / No
└
```

Keys: `Left/Right` or `h/l` to toggle, `y/n` shortcuts, `Enter` to submit.

### input

Free text with optional validation.

```typescript
const name = await input({
  message: 'Project name?',
  placeholder: 'my-app',
  validate: (v) => (v.length > 0 ? true : 'Required'),
});
```

```
◇  Project name?
│  my-app█
└
```

Keys: full text editing, `Ctrl+A/E` for home/end, `Ctrl+U` to clear, `Ctrl+W` to delete word.

### multiselect

Pick multiple options.

```typescript
const features = await multiselect({
  message: 'Select features',
  options: [
    { value: 'ts', label: 'TypeScript' },
    { value: 'lint', label: 'ESLint' },
    { value: 'test', label: 'Vitest' },
    { value: 'ci', label: 'GitHub Actions' },
  ],
  initialValues: ['ts'],
  required: true,
});
```

```
◇  Select features
│  >■ TypeScript
│   □ ESLint
│   ■ Vitest
│   □ GitHub Actions
└
```

Keys: `Space` to toggle, `a` to toggle all, `Enter` to submit.

### password

Masked text input.

```typescript
const secret = await password({
  message: 'API key?',
  mask: '•',
  validate: (v) => (v.length > 0 ? true : 'Required'),
});
```

```
◇  Enter your API key
│  ••••••••
└
```

### number

Numeric input with optional min/max/step.

```typescript
const port = await number({
  message: 'Port number?',
  initialValue: 3000,
  min: 1,
  max: 65535,
  step: 1,
});
```

```
◇  Port number?
│  3000█
└
```

Keys: `Up/Down` to increment/decrement by step, `Enter` to submit.

### search

Type-to-filter selection. Filters by label and hint, case-insensitive.

```typescript
const tz = await search({
  message: 'Select timezone',
  options: [
    { value: 'utc', label: 'UTC', hint: '+00:00' },
    { value: 'est', label: 'Eastern', hint: '-05:00' },
    { value: 'pst', label: 'Pacific', hint: '-08:00' },
  ],
  placeholder: 'Type to filter...',
  maxItems: 5,
});
```

```
◇  Select timezone
│  pac
│  ◉ Pacific (UTC-8)
│  ○ Asia/Pacific
└
```

Keys: type to filter, `Up/Down` to navigate, `Enter` to submit.

## Display

### spinner

Animated spinner for async operations.

```typescript
const s = spinner();
s.start('Installing dependencies...');
// ... do work
s.message('Compiling...');
// ... more work
s.stop('Installed 142 packages');    // success (green ◆)
s.stop('Failed', 1);                // error (red ▲)
```

```
◒  Installing dependencies...
◆  Installed 142 packages
```

### progress

Determinate progress bar.

```typescript
const p = progress();
p.start('Downloading...');
p.update(30, 'Downloading...');
p.update(60, 'Downloading...');
p.update(100, 'Downloading...');
p.stop('Download complete');
```

```
████████████░░░░░░░░  Downloading...  60%
◆  Download complete
```

### tasks

Run multiple tasks with status tracking.

```typescript
const result = await tasks([
  {
    title: 'Install dependencies',
    task: async () => { /* ... */ },
  },
  {
    title: 'Generate types',
    task: async (ctx, update) => {
      update('Generating schema...');
      /* ... */
    },
  },
  {
    title: 'Run tests',
    task: async () => { /* ... */ },
    enabled: false, // skip this task
  },
], { concurrent: false });
```

```
│
◆  Install dependencies
◒  Generating schema...
○  Run tests
│
```

### note

Boxed note with optional title.

```typescript
note('cd my-app\nnpm run dev', 'Next steps');
```

```
│
│  ────────────────
│  Next steps
│  cd my-app
│  npm run dev
│  ────────────────
```

### log

Structured log lines with icons.

```typescript
log.info('Connected to database');     // ⓘ  blue
log.success('Build complete');         // ◆  green
log.warn('Deprecated config');         // ▲  yellow
log.error('Connection failed');        // ▲  red
log.step('Running migrations');        // │  gray
```

### intro / outro

Session markers that bracket your CLI flow.

```typescript
intro('my-cli v1.0');
// ... prompts and work
outro('All done!');
```

```
┌  my-cli v1.0
│
│  ... your prompts here ...
│
└  All done!
```

## Composition

### group

Chain prompts together. Each step receives previous results. Stops on cancel.

```typescript
const answers = await group({
  name: () => input({ message: 'Project name?' }),
  framework: () => select({
    message: 'Framework?',
    options: [
      { value: 'next', label: 'Next.js' },
      { value: 'hono', label: 'Hono' },
    ],
  }),
  confirm: ({ results }) =>
    confirm({ message: `Create ${results.name} with ${results.framework}?` }),
}, {
  onCancel: () => process.exit(0),
});
```

## Theming

One line. Any color. Flows through every prompt, spinner, and focus indicator.

```typescript
import { setTheme } from 'termprompt';

setTheme({ accent: '#7c3aed' });  // hex
setTheme({ accent: 'cyan' });     // named color
setTheme({ accent: (text) => `\x1b[35m${text}\x1b[0m` }); // custom function
```

Works with chalk, picocolors, or raw ANSI. The accent color is used for active prompt indicators (`◇`), focus states, and interactive highlights.

## Cancel handling

Every prompt returns `T | Cancel`. Use `isCancel()` to check.

```typescript
import { select, isCancel } from 'termprompt';

const result = await select({
  message: 'Pick one',
  options: [{ value: 'a', label: 'A' }],
});

if (isCancel(result)) {
  console.log('User cancelled');
  process.exit(0);
}

// result is narrowed to T here
```

`Ctrl+C` or `Escape` triggers cancellation. With `group()`, cancelling any prompt cancels the entire group.

## OSC 7770

Every prompt, spinner, progress bar, and log message emits an [OSC 7770](./SPEC.md) escape sequence with a JSON payload describing the structured data:

```
ESC ] 7770 ; {"v":1,"type":"select","id":"...","message":"Pick a framework","options":[...]} BEL
```

Terminal hosts (web terminals, IDE terminals, multiplexers) can register an OSC handler for code `7770`, intercept the payload, and render native UI (dropdowns, modals, checkboxes, progress bars) instead of the TUI. When the user makes a selection, the host writes a resolve message back to PTY stdin.

Terminals that don't support OSC 7770 silently ignore the sequences per ECMA-48. The TUI works exactly as it would without the protocol.

Your code doesn't change. No feature flags. No configuration. The library handles everything.

See [SPEC.md](./SPEC.md) for the full protocol specification.

## Documentation

Full documentation at [seeden.github.io/termprompt](https://seeden.github.io/termprompt/).

## License

MIT
