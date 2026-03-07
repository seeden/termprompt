# OSC 7770 - Structured Terminal Prompts

Version 1

## Overview

OSC 7770 allows CLI applications to announce structured interactive prompts to terminal hosts. Terminal hosts (emulators, web terminals, multiplexers) can intercept these announcements and provide richer UI than the standard TUI fallback.

Applications emit OSC 7770 **alongside** their normal TUI prompt rendering. If no host intercepts the sequence, the user interacts with the TUI prompt normally. Zero degradation.

## Sequences

### Prompt Announcement

Emitted by the application to stdout before rendering the TUI prompt.

```
ESC ] 7770 ; <json> BEL
```

Where `<json>` is a JSON object:

```json
{
  "v": 1,
  "type": "select",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Deploy to which environment?",
  "options": [
    { "value": "staging", "label": "Staging", "hint": "Safe to test" },
    { "value": "prod", "label": "Production", "hint": "Goes live" }
  ]
}
```

Fields:

| Field | Type | Required | Description |
|---|---|---|---|
| `v` | `1` | Yes | Protocol version |
| `type` | `string` | Yes | `"select"`, `"confirm"`, `"input"`, `"multiselect"`, `"spinner"`, `"progress"`, `"tasks"`, `"log"` |
| `id` | `string` | Yes | Unique prompt ID (UUID recommended) |
| `message` | `string` | Yes | The question text |
| `options` | `array` | For select/multiselect | Array of `{ value, label, hint?, disabled? }` |
| `placeholder` | `string` | No | Placeholder text for input prompts |
| `initialValue` | `any` | No | Default value |
| `initialValues` | `array` | No | Default selected values for multiselect |
| `active` | `string` | No | Label for "true" in confirm (default: "Yes") |
| `inactive` | `string` | No | Label for "false" in confirm (default: "No") |

### Resolve

Emitted in two scenarios:

1. **By the terminal host** into PTY stdin when the user interacts with the host's native UI
2. **By the application** to stdout when the TUI prompt resolves normally

```
ESC ] 7770 ; <json> BEL
```

```json
{
  "v": 1,
  "type": "resolve",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "value": "staging"
}
```

Fields:

| Field | Type | Required | Description |
|---|---|---|---|
| `v` | `1` | Yes | Protocol version |
| `type` | `"resolve"` | Yes | Marks this as a resolution |
| `id` | `string` | Yes | Must match the prompt's ID |
| `value` | `any` | Yes | The selected value |

## Value Types by Prompt Type

| Prompt Type | Value Type | Example |
|---|---|---|
| `select` | `string` | `"staging"` |
| `confirm` | `boolean` | `true` |
| `input` | `string` | `"my-project"` |
| `multiselect` | `string[]` | `["auth", "db"]` |

## Application-Level Prompt Variants

The reference implementation provides higher-level prompt types that map to existing wire types. These do not introduce new OSC `type` values. Terminal hosts see the underlying wire type and can intercept them normally.

| Variant | Wire Type | Description |
|---|---|---|
| `password` | `input` | Text input with masked TUI display. The OSC payload is identical to `input`. The masking is purely a TUI rendering concern. |
| `number` | `input` | Numeric input with validation, min/max bounds, and up/down stepping. The OSC payload is identical to `input`. Numeric constraints are enforced application-side. |
| `search` | `select` | Filterable select with a text query. The OSC payload is identical to `select` (all options included). Filtering is a TUI-side behavior. |

### Group

`group` is a client-side composition utility for sequencing multiple prompts. It does not emit any OSC sequence of its own. Each prompt within a group emits its own independent OSC announcement and resolve.

## Non-Interactive Events

### Spinner

Spinners emit lifecycle events. They do not expect a resolve from the terminal host.

```json
{ "v": 1, "type": "spinner", "id": "uuid", "status": "start", "message": "Installing..." }
{ "v": 1, "type": "spinner", "id": "uuid", "status": "update", "message": "Compiling..." }
{ "v": 1, "type": "spinner", "id": "uuid", "status": "stop", "message": "Done", "code": 0 }
```

| Field | Type | Required | Description |
|---|---|---|---|
| `status` | `string` | Yes | `"start"`, `"update"`, or `"stop"` |
| `message` | `string` | Yes | Current spinner text |
| `code` | `number` | On stop | Exit code (`0` = success, non-zero = error) |

Terminal hosts can replace the TUI spinner with a native progress indicator.

### Progress

Progress bars emit lifecycle events for determinate progress. They do not expect a resolve from the terminal host.

```json
{ "v": 1, "type": "progress", "id": "uuid", "status": "start", "message": "Downloading...", "percent": 0 }
{ "v": 1, "type": "progress", "id": "uuid", "status": "update", "message": "Downloading...", "percent": 47 }
{ "v": 1, "type": "progress", "id": "uuid", "status": "stop", "message": "Done", "percent": 100, "code": 0 }
```

| Field | Type | Required | Description |
|---|---|---|---|
| `status` | `string` | Yes | `"start"`, `"update"`, or `"stop"` |
| `message` | `string` | Yes | Current status text |
| `percent` | `number` | Yes | Progress percentage (0-100) |
| `code` | `number` | On stop | Exit code (`0` = success, non-zero = error) |

Terminal hosts can render these as native progress bars or percentage indicators.

### Tasks

Tasks emit lifecycle events for multi-step operations. Each event includes the full state of all tasks. No resolve expected.

```json
{ "v": 1, "type": "tasks", "id": "uuid", "status": "start", "tasks": [
  { "title": "Install deps", "status": "pending" },
  { "title": "Compile", "status": "pending" }
]}
{ "v": 1, "type": "tasks", "id": "uuid", "status": "update", "tasks": [
  { "title": "Install deps", "status": "success" },
  { "title": "Compile", "status": "running" }
]}
{ "v": 1, "type": "tasks", "id": "uuid", "status": "stop", "tasks": [
  { "title": "Install deps", "status": "success" },
  { "title": "Compile", "status": "success" }
]}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `status` | `string` | Yes | `"start"`, `"update"`, or `"stop"` |
| `tasks` | `array` | Yes | Array of `{ title, status }` objects |
| `tasks[].title` | `string` | Yes | Task display text |
| `tasks[].status` | `string` | Yes | `"pending"`, `"running"`, `"success"`, `"error"`, `"skipped"` |

Terminal hosts can render these as structured task lists with individual status indicators.

### Log

Log events are informational. No resolve expected.

```json
{ "v": 1, "type": "log", "level": "intro", "message": "My CLI v1.0" }
{ "v": 1, "type": "log", "level": "info", "message": "Connected to database" }
{ "v": 1, "type": "log", "level": "success", "message": "Build complete" }
{ "v": 1, "type": "log", "level": "warn", "message": "Deprecated config" }
{ "v": 1, "type": "log", "level": "error", "message": "Connection failed" }
{ "v": 1, "type": "log", "level": "note", "message": "Details here", "title": "Important" }
{ "v": 1, "type": "log", "level": "outro", "message": "Goodbye" }
```

| Field | Type | Required | Description |
|---|---|---|---|
| `level` | `string` | Yes | `"intro"`, `"outro"`, `"info"`, `"success"`, `"warn"`, `"error"`, `"note"`, `"step"` |
| `message` | `string` | Yes | Log text |
| `title` | `string` | No | Title for note-level logs |

Terminal hosts can render these as toast notifications, status bar updates, or structured log panels.

## Terminal Host Implementation

1. Register an OSC handler for code 7770
2. Parse the JSON payload
3. If `type` is not `"resolve"`, display a native UI (modal, panel, buttons)
4. When the user makes a selection, write the resolve sequence into PTY stdin
5. The application's stdin handler detects the resolve and completes the prompt

The resolve sequence is written as raw bytes into the PTY's stdin file descriptor. The application's prompt library parses it.

### xterm.js Example

```typescript
terminal.parser.registerOscHandler(7770, (data) => {
  try {
    const payload = JSON.parse(data);
    if (payload.v === 1 && payload.type !== "resolve") {
      showPromptUI(payload);
      return true;
    }
  } catch {
    // ignore malformed
  }
  return false;
});
```

## String Terminator

Both BEL (`\x07`) and ST (`ESC \`) are valid terminators. Implementations must accept both.

## Why OSC 7770

There is no registry or standards body that assigns OSC codes. Terminal vendors pick unused numbers by convention:

| Code | Owner |
|---|---|
| 0-19 | Standard (window title, colors) |
| 52 | Clipboard (widely adopted) |
| 99 | Kitty notifications |
| 133 | Semantic prompts (FinalTerm/iTerm2/VS Code) |
| 633 | VS Code shell integration |
| 777 | rxvt-unicode notifications |
| 1337 | iTerm2 proprietary extensions |
| **7770** | **Structured terminal prompts (this spec)** |

7770 sits in a high, unused range with no known collisions. It is easy to remember and distinct from established codes.

## Compatibility

Unknown OSC sequences are silently ignored by terminals per the ECMA-48 standard. Applications can safely emit OSC 7770 in any terminal without side effects.
