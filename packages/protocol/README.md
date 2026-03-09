# @termprompt/protocol

OSC 7770 protocol parser and encoder. Parses terminal output streams for OSC 7770 escape sequences, strips them from display output, and returns typed messages.

Used by terminal hosts (VSCode extensions, web terminals, multiplexers) to intercept [termprompt](https://www.npmjs.com/package/termprompt) prompts and render native UI.

**[Specification](https://github.com/seeden/termprompt/blob/main/SPEC.md)** | **[GitHub](https://github.com/seeden/termprompt)**

## Install

```bash
npm install @termprompt/protocol
```

## Usage

### Parse terminal output

```typescript
import { createOscParser } from '@termprompt/protocol';

const parser = createOscParser();

// Feed raw terminal output (handles partial reads, buffering)
const { messages, output } = parser.write(rawData);

// output: cleaned string with OSC 7770 sequences stripped
// messages: array of typed OscMessage objects
for (const msg of messages) {
  switch (msg.payload.type) {
    case 'select':
    case 'confirm':
    case 'input':
    case 'multiselect':
      // Interactive prompt - show native UI, then resolve.
      // If payload.sensitive === true, return via stdin keystrokes instead.
      break;
    case 'spinner':
    case 'progress':
    case 'tasks':
    case 'log':
      // Display event - render enhanced UI
      break;
    case 'resolve':
      // Prompt was answered via TUI fallback
      break;
  }
}
```

### Send a resolve back to the application

```typescript
import { encodeResolve } from '@termprompt/protocol';

// Write this string to PTY stdin to answer a prompt
const data = encodeResolve(promptId, selectedValue);
pty.write(data);
```

For prompts with `sensitive: true`, do not send secret values in OSC
`resolve` payloads. Inject normal stdin keystrokes instead.

### Encode a prompt announcement

```typescript
import { encodePrompt } from '@termprompt/protocol';
import type { OscPromptPayload } from '@termprompt/protocol';

const payload: OscPromptPayload = {
  v: 1,
  type: 'select',
  id: crypto.randomUUID(),
  message: 'Pick one',
  options: [{ value: 'a', label: 'Option A' }],
};

const data = encodePrompt(payload);
process.stdout.write(data);
```

## Exports

- `createOscParser()` - streaming parser, handles partial reads
- `encodeResolve(id, value)` - encode a resolve message
- `encodePrompt(payload)` - encode a prompt announcement
- `wrapOsc(json)` - wrap raw JSON in OSC 7770 envelope
- `ESC`, `BEL`, `ST`, `OSC_CODE`, `OSC_PREFIX` - protocol constants
- Types: `OscPayload`, `OscPromptPayload`, `OscResolvePayload`, `OscSpinnerPayload`, `OscProgressPayload`, `OscTasksPayload`, `OscLogPayload`

## License

MIT
