# termprompt

Beautiful terminal prompts with structured output for rich terminal hosts.

Works like any prompt library in a normal terminal. Emits [OSC 7770](./PROTOCOL.md) escape sequences that terminal hosts can intercept to show native UI (modals, buttons, panels). If nothing intercepts the sequence, the user sees a normal TUI prompt. Zero degradation, zero config.

## Install

```bash
npm install termprompt
```

## Usage

```typescript
import {
  select, confirm, input, multiselect, password, search,
  group, spinner, intro, outro, note, log, isCancel,
} from "termprompt";

const env = await select({
  message: "Deploy to which environment?",
  options: [
    { value: "staging", label: "Staging", hint: "Safe to test" },
    { value: "production", label: "Production", hint: "Goes live" },
  ],
});

if (isCancel(env)) {
  process.exit(0);
}

const approved = await confirm({
  message: `Deploy to ${env}?`,
});

if (isCancel(approved) || !approved) {
  process.exit(0);
}

const tag = await input({
  message: "Release tag?",
  placeholder: "v1.0.0",
  validate: (v) => (v.startsWith("v") ? true : "Must start with v"),
});

const features = await multiselect({
  message: "Include features?",
  options: [
    { value: "auth", label: "Authentication" },
    { value: "analytics", label: "Analytics" },
    { value: "notifications", label: "Notifications" },
  ],
});
```

## Prompts

### `select<T>(config): Promise<T | Cancel>`

Pick one option from a list.

```typescript
const result = await select({
  message: "Framework?",
  options: [
    { value: "next", label: "Next.js", hint: "React" },
    { value: "hono", label: "Hono", hint: "Edge" },
    { value: "express", label: "Express", disabled: true },
  ],
  initialValue: "next",
  maxItems: 5,
});
```

Keys: `Up/Down` or `j/k` to navigate, `Enter` to submit, `Esc` to cancel.

### `confirm(config): Promise<boolean | Cancel>`

Yes or no.

```typescript
const ok = await confirm({
  message: "Continue?",
  initialValue: true,
  active: "Yes",
  inactive: "No",
});
```

Keys: `Left/Right` or `h/l` to toggle, `y/n` shortcuts, `Enter` to submit.

### `input(config): Promise<string | Cancel>`

Free text with validation.

```typescript
const name = await input({
  message: "Project name?",
  placeholder: "my-app",
  initialValue: "",
  validate: (v) => (v.length > 0 ? true : "Required"),
});
```

Keys: full text editing, `Ctrl+A/E` for home/end, `Ctrl+U` to clear, `Ctrl+W` to delete word.

### `multiselect<T>(config): Promise<T[] | Cancel>`

Pick multiple options.

```typescript
const features = await multiselect({
  message: "Features?",
  options: [
    { value: "auth", label: "Authentication" },
    { value: "db", label: "Database" },
    { value: "api", label: "API Layer" },
  ],
  initialValues: ["auth"],
  required: true,
  maxItems: 8,
});
```

Keys: `Space` to toggle, `a` to toggle all, `Enter` to submit.

### `password(config): Promise<string | Cancel>`

Masked text input.

```typescript
const secret = await password({
  message: "API key?",
  mask: "•",
  validate: (v) => (v.length > 0 ? true : "Required"),
});
```

Keys: type to append, `Backspace` to delete, `Enter` to submit.

### `search<T>(config): Promise<T | Cancel>`

Type-to-filter selection. Filters by label and hint, case-insensitive.

```typescript
const tz = await search({
  message: "Timezone?",
  options: [
    { value: "utc", label: "UTC", hint: "+00:00" },
    { value: "est", label: "Eastern", hint: "-05:00" },
    { value: "pst", label: "Pacific", hint: "-08:00" },
  ],
  placeholder: "Type to filter...",
  maxItems: 5,
});
```

Keys: type to filter, `Up/Down` to navigate results, `Enter` to submit.

## Composition

### `group(prompts, options?): Promise<T>`

Chain multiple prompts. Each prompt receives previous results. Stops on cancel.

```typescript
const answers = await group({
  name: () => input({ message: "Name?" }),
  confirm: ({ results }) =>
    confirm({ message: `Welcome ${results.name}?` }),
});
```

Options: `{ onCancel: () => void }` - called when any prompt is cancelled.

## Display

### `spinner(config?): Spinner`

Animated spinner for async operations.

```typescript
const s = spinner();
s.start("Installing dependencies...");
// ... async work
s.message("Compiling...");
// ... more work
s.stop("Done");        // success (green ◆)
s.stop("Failed", 1);  // error (red ▲)
```

### `intro(title?)`

Start marker with optional title.

```typescript
intro("my-cli v1.0");
```

### `outro(message?)`

End marker with optional message.

```typescript
outro("All done!");
```

### `note(message, title?)`

Boxed note with optional title.

```typescript
note("Run `npm start` to begin", "Next steps");
```

### `log.info / success / warn / error / step / message`

Structured log lines with icons.

```typescript
log.info("Connected to database");
log.success("Build complete");
log.warn("Deprecated config detected");
log.error("Connection failed");
log.step("Running migrations");
log.message("Plain text with bar");
```

## Cancel Handling

### `isCancel(value): boolean`

Check if the user cancelled a prompt (Ctrl+C or Escape).

```typescript
const result = await select({ ... });
if (isCancel(result)) {
  console.log("Cancelled");
  process.exit(0);
}
```

## OSC 7770

Every prompt emits an [OSC 7770](./PROTOCOL.md) escape sequence with a JSON payload describing the prompt structure. Terminal hosts that support OSC 7770 can intercept it and render native UI.

This is transparent to the application. No configuration needed. The prompt library handles everything.

See [PROTOCOL.md](./PROTOCOL.md) for the full specification.

## License

MIT
