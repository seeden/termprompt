# termprompt

Beautiful terminal prompts for Node.js. Zero dependencies.

Every prompt emits [OSC 7770](https://github.com/seeden/termprompt/blob/main/SPEC.md) escape sequences alongside the TUI. Smart terminals can intercept the structured data and render native UI. Standard terminals show the TUI. Zero config, zero degradation.

**[Documentation](https://seeden.github.io/termprompt/)** | **[GitHub](https://github.com/seeden/termprompt)**

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

## Components

**Prompts:** `select`, `confirm`, `input`, `multiselect`, `password`, `number`, `search`, `group`

**Display:** `spinner`, `progress`, `tasks`, `note`, `log`, `intro`, `outro`

**Theming:** `setTheme({ accent, success, error, warning, info })`

See the [full documentation](https://seeden.github.io/termprompt/) for API details and examples.

## License

MIT
