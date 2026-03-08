# OSC 7770: Structured Terminal Prompts

**Version:** 1.1.0
**Date:** 2026-03-07
**Status:** Living Standard
**Authors:** Termprompt Contributors
**Canonical URL:** https://github.com/seeden/termprompt/blob/main/SPEC.md
**License:** MIT

---

## Abstract

This specification defines OSC 7770, an escape sequence protocol that enables
command-line applications to announce structured interactive prompts to terminal
hosts. Terminal hosts (emulators, web terminals, multiplexers, IDE terminals)
MAY intercept these announcements and render native user interface components
in place of the standard text-based fallback. The protocol is designed for
zero-degradation operation: applications that emit OSC 7770 sequences work
identically in terminals that do not support the protocol.

---

## Table of Contents

1. [Status of This Document](#1-status-of-this-document)
2. [Terminology](#2-terminology)
3. [Introduction](#3-introduction)
4. [Design Goals](#4-design-goals)
5. [Notation](#5-notation)
6. [Wire Format](#6-wire-format)
7. [Message Types](#7-message-types)
   - 7.1 [Prompt Announcement](#71-prompt-announcement)
   - 7.2 [Resolve](#72-resolve)
   - 7.3 [Spinner](#73-spinner)
   - 7.4 [Progress](#74-progress)
   - 7.5 [Tasks](#75-tasks)
   - 7.6 [Log](#76-log)
8. [Prompt Types](#8-prompt-types)
   - 8.1 [select](#81-select)
   - 8.2 [confirm](#82-confirm)
   - 8.3 [input](#83-input)
   - 8.4 [multiselect](#84-multiselect)
   - 8.5 [password](#85-password)
   - 8.6 [number](#86-number)
   - 8.7 [search](#87-search)
   - 8.8 [group](#88-group)
9. [Terminal Host Behavior](#9-terminal-host-behavior)
10. [Application Behavior](#10-application-behavior)
11. [Graceful Degradation](#11-graceful-degradation)
12. [Security Considerations](#12-security-considerations)
13. [OSC Code Allocation](#13-osc-code-allocation)
14. [Extensibility](#14-extensibility)
15. [References](#15-references)
16. [How to Cite This Document](#16-how-to-cite-this-document)
17. [Changelog](#17-changelog)

---

## 1. Status of This Document

This document is a **Living Standard**. It is maintained alongside the
reference implementation at the canonical URL above. The protocol version
field (`v`) in all messages allows backward-compatible evolution. Breaking
changes require a major version increment.

This document is not published by a formal standards body. Terminal escape
sequence extensions are allocated by convention among terminal vendors.
OSC 7770 follows this established practice.

---

## 2. Terminology

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this
document are to be interpreted as described in
[RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

**Application.** A command-line program that presents interactive prompts
to a user via a terminal. The application writes to stdout and reads from
stdin.

**Terminal host.** The software that renders terminal output and manages
the PTY. Examples: terminal emulators (iTerm2, Windows Terminal, Kitty),
web terminals (xterm.js), IDE integrated terminals (VS Code), terminal
multiplexers (tmux, Zellij).

**TUI fallback.** The text-based user interface that the application
renders using standard ANSI escape sequences. This is what the user
interacts with when the terminal host does not support OSC 7770.

**OSC.** Operating System Command, an escape sequence category defined by
ECMA-48 Section 8.3.89.

**PTY.** Pseudoterminal, the kernel-level abstraction that connects the
application's stdio to the terminal host.

---

## 3. Introduction

Terminal applications frequently present interactive prompts: selecting from
a list, confirming an action, entering text. These prompts are rendered as
TUI widgets using ANSI escape sequences. The result is functional but
constrained to the capabilities of a character grid.

Terminal hosts increasingly support richer rendering. Web-based terminals
can display HTML elements. Desktop emulators can show native OS dialogs.
IDE terminals can integrate with the editor's UI framework.

OSC 7770 bridges this gap. An application emits a structured description of
its prompt as an escape sequence. If a terminal host understands the
sequence, it can render a native UI component (a dropdown, a modal, a
checkbox list). If the terminal host does not understand the sequence, it
silently ignores it per ECMA-48, and the user interacts with the TUI
fallback.

The protocol is unidirectional for announcements (application to terminal
host) and bidirectional for resolution (terminal host writes back to PTY
stdin). Non-interactive events (spinners, log messages) are unidirectional
only.

---

## 4. Design Goals

1. **Zero degradation.** Applications MUST render a fully functional TUI
   prompt regardless of terminal host support. OSC 7770 is a progressive
   enhancement, not a requirement.

2. **Zero configuration.** Applications MUST NOT require users to configure
   terminal host support. The protocol works by convention.

3. **Simplicity.** Messages are JSON objects wrapped in a single escape
   sequence. No binary encoding, no negotiation handshake, no capability
   queries.

4. **Independence.** The protocol does not depend on any specific terminal
   emulator, operating system, or programming language.

5. **Backward compatibility.** Unknown OSC sequences are silently discarded
   by conforming terminals (ECMA-48 Section 8.3.89). Emitting OSC 7770 in
   a terminal that does not support it has no observable effect.

---

## 5. Notation

### 5.1. Byte Sequences

| Symbol | Hex    | Description                     |
|--------|--------|---------------------------------|
| ESC    | `0x1B` | Escape character                |
| BEL    | `0x07` | Bell character (OSC terminator) |
| ST     | `0x1B 0x5C` | String Terminator (ESC \)  |

### 5.2. ABNF Grammar

The wire format is specified using Augmented Backus-Naur Form (ABNF) as
defined in [RFC 5234](https://www.rfc-editor.org/rfc/rfc5234).

```abnf
osc-7770     = ESC "]" "7770" ";" json-payload terminator
terminator   = BEL / ST
json-payload = <any valid JSON text per RFC 8259>

ESC          = %x1B
BEL          = %x07
ST           = %x1B %x5C
```

### 5.3. JSON Encoding

All payloads MUST be serialized as JSON text conforming to
[RFC 8259](https://www.rfc-editor.org/rfc/rfc8259). Implementations MUST
use UTF-8 encoding. The JSON text MUST NOT contain the BEL character
(`U+0007`) or the ST sequence (`ESC \`) as literal content, since these
would be interpreted as the OSC terminator.

---

## 6. Wire Format

All OSC 7770 messages share the same envelope:

```
ESC ] 7770 ; <JSON> BEL
```

Alternate form using String Terminator:

```
ESC ] 7770 ; <JSON> ESC \
```

Both terminators are valid. Implementations MUST accept both BEL and ST as
terminators. Implementations SHOULD emit BEL for brevity.

The JSON payload is a single object. Every payload MUST contain the
following fields:

| Field  | Type      | Description                    |
|--------|-----------|--------------------------------|
| `v`    | `integer` | Protocol version. Currently `1`. |
| `type` | `string`  | Message type identifier.       |

Implementations that receive a message with an unrecognized `v` value
SHOULD ignore the message. Implementations that receive a message with an
unrecognized `type` value SHOULD ignore the message.

### 6.1. Maximum Message Size

This specification does not define a maximum message size. However,
implementations SHOULD keep individual messages under 65,536 bytes to
avoid potential buffer limitations in terminal host OSC parsers.

---

## 7. Message Types

OSC 7770 defines six message types: **prompt**, **resolve**, **spinner**,
**progress**, **tasks**, and **log**. The `type` field in the JSON payload
identifies the message type.

### 7.1. Prompt Announcement

**Direction:** Application -> Terminal Host (via stdout)

Announces a structured interactive prompt. The application MUST emit this
sequence immediately before rendering the TUI fallback for the same prompt.

**Type values:** `"select"`, `"confirm"`, `"input"`, `"multiselect"`

The `type` field doubles as both the message type identifier and the prompt
type. See [Section 8](#8-prompt-types) for per-type field definitions.

#### Common Fields

| Field          | Type       | Required | Description |
|----------------|------------|----------|-------------|
| `v`            | `1`        | REQUIRED | Protocol version. |
| `type`         | `string`   | REQUIRED | One of `"select"`, `"confirm"`, `"input"`, `"multiselect"`. |
| `id`           | `string`   | REQUIRED | Unique identifier for this prompt instance. UUID v4 RECOMMENDED. |
| `message`      | `string`   | REQUIRED | The prompt question displayed to the user. |

#### Optional Fields (type-dependent)

| Field          | Type       | Applicable Types   | Description |
|----------------|------------|--------------------|-------------|
| `options`      | `array`    | select, multiselect | Array of option objects. See below. |
| `placeholder`  | `string`   | input              | Placeholder text shown when value is empty. |
| `initialValue` | `any`      | select, confirm, input | Default value. |
| `initialValues`| `array`    | multiselect        | Default selected values. |
| `active`       | `string`   | confirm            | Label for the affirmative choice. Default: `"Yes"`. |
| `inactive`     | `string`   | confirm            | Label for the negative choice. Default: `"No"`. |

#### Option Object

Used in `select` and `multiselect` prompt types.

| Field      | Type      | Required | Description |
|------------|-----------|----------|-------------|
| `value`    | `any`     | REQUIRED | The value returned when this option is selected. |
| `label`    | `string`  | REQUIRED | Human-readable display text. |
| `hint`     | `string`  | OPTIONAL | Secondary text providing context. |
| `disabled` | `boolean` | OPTIONAL | If `true`, this option cannot be selected. Default: `false`. |

#### Example

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

Full wire encoding:

```
\x1B]7770;{"v":1,"type":"select","id":"550e8400-e29b-41d4-a716-446655440000","message":"Deploy to which environment?","options":[{"value":"staging","label":"Staging","hint":"Safe to test"},{"value":"prod","label":"Production","hint":"Goes live"}]}\x07
```

### 7.2. Resolve

**Direction:** Bidirectional

A resolve message indicates that a prompt has been answered. It is emitted
in two distinct scenarios:

1. **Terminal host -> Application (via PTY stdin).** When the terminal host
   intercepts a prompt announcement and renders native UI, it writes a
   resolve message into the PTY's stdin file descriptor after the user
   makes a selection. The application's prompt library reads this from
   stdin, completes the prompt, and suppresses further TUI interaction.

2. **Application -> Terminal host (via stdout).** When the user interacts
   with the TUI fallback normally (no host interception), the application
   emits a resolve message to stdout after the prompt completes. This
   allows the terminal host to track prompt state even when it chose not
   to intercept.

#### Fields

| Field   | Type       | Required | Description |
|---------|------------|----------|-------------|
| `v`     | `1`        | REQUIRED | Protocol version. |
| `type`  | `"resolve"`| REQUIRED | Identifies this as a resolve message. |
| `id`    | `string`   | REQUIRED | MUST match the `id` of the corresponding prompt announcement. |
| `value` | `any`      | REQUIRED | The user's selection. Type depends on prompt type (see Section 7.2.1). |

#### 7.2.1. Value Types by Prompt Type

| Prompt Type   | Value Type  | Example                  |
|---------------|-------------|--------------------------|
| `select`      | `any`       | `"staging"`              |
| `confirm`     | `boolean`   | `true`                   |
| `input`       | `string`    | `"my-project"`           |
| `multiselect` | `array`     | `["auth", "db"]`         |

#### Example

```json
{
  "v": 1,
  "type": "resolve",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "value": "staging"
}
```

#### 7.2.2. Resolve Timing

When the terminal host writes a resolve message to PTY stdin, the
application MUST:

1. Parse the resolve message from the stdin data buffer.
2. Validate that `v` equals `1`, `type` equals `"resolve"`, and `id`
   matches the active prompt.
3. Accept the `value` and complete the prompt.
4. Clean up the TUI rendering (restore cursor, exit raw mode).

If validation fails (wrong `id`, wrong version), the application MUST
ignore the message and continue waiting for user input via the TUI fallback.

### 7.3. Spinner

**Direction:** Application -> Terminal Host (via stdout)

Spinner messages describe the lifecycle of an asynchronous operation with
a progress indicator. Spinners are non-interactive: the terminal host
MUST NOT send a resolve message in response.

#### Fields

| Field     | Type      | Required       | Description |
|-----------|-----------|----------------|-------------|
| `v`       | `1`       | REQUIRED       | Protocol version. |
| `type`    | `"spinner"`| REQUIRED      | Identifies this as a spinner event. |
| `id`      | `string`  | REQUIRED       | Unique identifier for this spinner instance. Stable across the spinner's lifecycle. |
| `status`  | `string`  | REQUIRED       | One of `"start"`, `"update"`, `"stop"`. |
| `message` | `string`  | REQUIRED       | Current status text. |
| `code`    | `integer` | On `"stop"` only | Exit code. `0` indicates success, non-zero indicates error. |

#### Lifecycle

A spinner MUST follow this lifecycle:

1. Exactly one `"start"` message.
2. Zero or more `"update"` messages.
3. Exactly one `"stop"` message.

All messages for a given spinner instance MUST use the same `id`.

The `code` field MUST be present when `status` is `"stop"` and SHOULD be
omitted otherwise.

#### Examples

```json
{ "v": 1, "type": "spinner", "id": "a1b2c3", "status": "start", "message": "Installing..." }
{ "v": 1, "type": "spinner", "id": "a1b2c3", "status": "update", "message": "Compiling..." }
{ "v": 1, "type": "spinner", "id": "a1b2c3", "status": "stop", "message": "Done", "code": 0 }
```

Terminal hosts MAY render spinner events as native progress indicators,
status bar updates, or inline progress UI.

### 7.4. Progress

**Direction:** Application -> Terminal Host (via stdout)

Progress messages describe the lifecycle of a determinate operation with a
known completion percentage. Unlike spinners (indeterminate), progress bars
communicate how much work remains. Progress events are non-interactive:
the terminal host MUST NOT send a resolve message in response.

#### Fields

| Field     | Type        | Required       | Description |
|-----------|-------------|----------------|-------------|
| `v`       | `1`         | REQUIRED       | Protocol version. |
| `type`    | `"progress"`| REQUIRED       | Identifies this as a progress event. |
| `id`      | `string`    | REQUIRED       | Unique identifier for this progress instance. Stable across the lifecycle. |
| `status`  | `string`    | REQUIRED       | One of `"start"`, `"update"`, `"stop"`. |
| `message` | `string`    | REQUIRED       | Current status text. |
| `percent` | `number`    | REQUIRED       | Completion percentage, 0 to 100 inclusive. |
| `code`    | `integer`   | On `"stop"` only | Exit code. `0` indicates success, non-zero indicates error. |

#### Lifecycle

A progress instance MUST follow this lifecycle:

1. Exactly one `"start"` message (percent SHOULD be `0`).
2. Zero or more `"update"` messages with increasing percent values.
3. Exactly one `"stop"` message.

All messages for a given progress instance MUST use the same `id`.

#### Examples

```json
{ "v": 1, "type": "progress", "id": "a1b2c3", "status": "start", "message": "Downloading...", "percent": 0 }
{ "v": 1, "type": "progress", "id": "a1b2c3", "status": "update", "message": "Downloading...", "percent": 47 }
{ "v": 1, "type": "progress", "id": "a1b2c3", "status": "stop", "message": "Done", "percent": 100, "code": 0 }
```

Terminal hosts MAY render progress events as native progress bars,
percentage indicators, or download-style progress UI.

### 7.5. Tasks

**Direction:** Application -> Terminal Host (via stdout)

Tasks messages describe a multi-step operation where each step has its own
status. Each event includes the full state of all tasks, enabling the
terminal host to render a complete task list. Tasks are non-interactive:
the terminal host MUST NOT send a resolve message in response.

#### Fields

| Field           | Type       | Required       | Description |
|-----------------|------------|----------------|-------------|
| `v`             | `1`        | REQUIRED       | Protocol version. |
| `type`          | `"tasks"`  | REQUIRED       | Identifies this as a tasks event. |
| `id`            | `string`   | REQUIRED       | Unique identifier for this task group. Stable across the lifecycle. |
| `status`        | `string`   | REQUIRED       | One of `"start"`, `"update"`, `"stop"`. |
| `tasks`         | `array`    | REQUIRED       | Array of task state objects. |
| `tasks[].title` | `string`   | REQUIRED       | Task display text. |
| `tasks[].status`| `string`   | REQUIRED       | One of `"pending"`, `"running"`, `"success"`, `"error"`, `"skipped"`. |

#### Task Status Values

| Status      | Semantics |
|-------------|-----------|
| `"pending"` | Task has not started. |
| `"running"` | Task is currently executing. |
| `"success"` | Task completed successfully. |
| `"error"`   | Task failed with an error. |
| `"skipped"` | Task was skipped (disabled or conditional). |

#### Lifecycle

A tasks group MUST follow this lifecycle:

1. Exactly one `"start"` message (all tasks typically `"pending"`).
2. Zero or more `"update"` messages as task statuses change.
3. Exactly one `"stop"` message (all tasks in a terminal state).

#### Examples

```json
{ "v": 1, "type": "tasks", "id": "a1b2c3", "status": "start", "tasks": [
  { "title": "Install deps", "status": "pending" },
  { "title": "Compile", "status": "pending" }
]}
{ "v": 1, "type": "tasks", "id": "a1b2c3", "status": "update", "tasks": [
  { "title": "Install deps", "status": "success" },
  { "title": "Compile", "status": "running" }
]}
{ "v": 1, "type": "tasks", "id": "a1b2c3", "status": "stop", "tasks": [
  { "title": "Install deps", "status": "success" },
  { "title": "Compile", "status": "success" }
]}
```

Terminal hosts MAY render tasks events as structured checklists, multi-line
progress panels, or step-by-step status indicators.

### 7.6. Log

**Direction:** Application -> Terminal Host (via stdout)

Log messages are informational events. They do not expect a resolve. Terminal
hosts MAY render them as toast notifications, status bar updates, structured
log panels, or may ignore them entirely.

#### Fields

| Field     | Type     | Required | Description |
|-----------|----------|----------|-------------|
| `v`       | `1`      | REQUIRED | Protocol version. |
| `type`    | `"log"`  | REQUIRED | Identifies this as a log event. |
| `level`   | `string` | REQUIRED | Severity/purpose level. |
| `message` | `string` | REQUIRED | Log text. |
| `title`   | `string` | OPTIONAL | Title for `"note"` level logs. |

#### Log Levels

| Level      | Semantics |
|------------|-----------|
| `"intro"`  | Session start marker. Typically rendered as a header. |
| `"outro"`  | Session end marker. Typically rendered as a footer. |
| `"info"`   | Informational message. |
| `"success"`| Operation completed successfully. |
| `"warn"`   | Warning that does not prevent operation. |
| `"error"`  | Error condition. |
| `"step"`   | Progress step within a larger operation. |
| `"note"`   | Boxed note with optional title. MAY contain multi-line text. |

#### Examples

```json
{ "v": 1, "type": "log", "level": "intro", "message": "my-cli v2.0" }
{ "v": 1, "type": "log", "level": "info", "message": "Connected to database" }
{ "v": 1, "type": "log", "level": "success", "message": "Build complete" }
{ "v": 1, "type": "log", "level": "warn", "message": "Deprecated config key" }
{ "v": 1, "type": "log", "level": "error", "message": "Connection refused" }
{ "v": 1, "type": "log", "level": "note", "message": "Run npm start to begin", "title": "Next steps" }
{ "v": 1, "type": "log", "level": "outro", "message": "All done" }
```

---

## 8. Prompt Types

This section defines the semantics of each interactive prompt type.

### 8.1. select

Presents a list of options. The user selects exactly one.

**Required fields:** `message`, `options`
**Optional fields:** `initialValue`

The `options` array MUST contain at least one non-disabled option. The
`initialValue`, if provided, SHOULD match the `value` field of one of the
options.

**Resolve value type:** The `value` field of the selected option (any JSON
type).

#### Terminal Host Rendering Suggestions

- Dropdown menu
- Radio button group
- Native select dialog
- Inline list with keyboard navigation

### 8.2. confirm

Presents a binary yes/no choice.

**Required fields:** `message`
**Optional fields:** `initialValue` (boolean), `active` (string),
`inactive` (string)

The `active` label corresponds to `true`. The `inactive` label corresponds
to `false`. Defaults are `"Yes"` and `"No"` respectively.

**Resolve value type:** `boolean`

#### Terminal Host Rendering Suggestions

- Two-button dialog
- Toggle switch
- Native confirmation dialog

### 8.3. input

Accepts free-form text from the user.

**Required fields:** `message`
**Optional fields:** `placeholder`, `initialValue`

Validation is handled application-side. The protocol does not transmit
validation rules, as validation logic can be arbitrarily complex. The
terminal host sends the raw string value. The application validates after
receiving the resolve.

**Resolve value type:** `string`

#### Terminal Host Rendering Suggestions

- Native text input field
- Inline editable text
- Modal with text area

### 8.4. multiselect

Presents a list of options. The user selects zero or more.

**Required fields:** `message`, `options`
**Optional fields:** `initialValues`

The `options` array MUST contain at least one non-disabled option. The
`initialValues` array, if provided, SHOULD contain values that match the
`value` fields of options in the `options` array.

**Resolve value type:** Array of selected option values.

#### Terminal Host Rendering Suggestions

- Checkbox group
- Multi-select dropdown
- Tag picker

### 8.5. password

An application-level variant of `input` that masks user input in the TUI.
The OSC wire type is `"input"`. Terminal hosts that intercept an `input`
prompt cannot distinguish a password prompt from a regular text input based
on the OSC payload alone. The masking is purely a TUI rendering concern.

**Wire type:** `"input"`
**Required fields:** `message`
**Optional fields:** `placeholder`

The application renders each typed character as a mask symbol (e.g., `*`)
in the TUI. The `message` and `placeholder` fields are visible in the OSC
payload, but the user's typed response is never transmitted via OSC 7770
(it travels through normal stdin).

**Resolve value type:** `string`

#### Security Note

See Section 12.2. The prompt message is transmitted in cleartext. The
actual password value is never included in an OSC sequence.

### 8.6. number

An application-level variant of `input` that accepts only numeric values.
The OSC wire type is `"input"`. Numeric validation, min/max bounds, and
step-based increment/decrement are enforced application-side.

**Wire type:** `"input"`
**Required fields:** `message`
**Optional fields:** `placeholder`, `initialValue`

The TUI restricts keystroke input to numeric characters (`0-9`, `-`, `.`)
and supports up/down arrow keys for incrementing and decrementing by a
configurable step value.

**Resolve value type:** `string` (the terminal host sends a string; the
application parses it as a number)

#### Terminal Host Rendering Suggestions

- Native number spinner
- Stepper input with increment/decrement buttons
- Slider (if min and max are known)

### 8.7. search

An application-level variant of `select` that adds a text filter to the
option list. The OSC wire type is `"select"`. The full option list is
included in the OSC payload. Filtering is a TUI-side behavior that reduces
visible options as the user types.

**Wire type:** `"select"`
**Required fields:** `message`, `options`
**Optional fields:** `placeholder`

The `options` array follows the same schema as `select` (Section 8.1).

**Resolve value type:** The `value` field of the selected option (any JSON
type).

#### Terminal Host Rendering Suggestions

- Searchable dropdown with text filter
- Autocomplete combobox
- Command palette style selector

### 8.8. group

`group` is a client-side composition utility for sequencing multiple
prompts. It does not define a new message type and does not emit any OSC
sequence of its own. Each prompt within a group independently emits its
own OSC 7770 announcement and resolve.

`group` is documented here because it is part of the reference
implementation's public API, but it has no protocol implications. Terminal
hosts do not need to implement any special handling for grouped prompts.

---

## 9. Terminal Host Behavior

### 9.1. Registration

Terminal hosts that support OSC 7770 MUST register an OSC handler for
code `7770`. How this is done depends on the terminal host implementation.

**xterm.js example:**

```typescript
terminal.parser.registerOscHandler(7770, (data) => {
  try {
    const payload = JSON.parse(data);
    if (payload.v !== 1) return false;
    if (payload.type === "resolve") return false; // passthrough
    handleOsc7770(payload);
    return true;
  } catch {
    return false;
  }
});
```

### 9.2. Intercepting Prompts

When a terminal host receives a prompt announcement (type is `"select"`,
`"confirm"`, `"input"`, or `"multiselect"`), it MAY:

1. **Intercept:** Suppress the TUI rendering and display a native UI
   component. When the user makes a selection, write a resolve message
   (Section 7.2) into the PTY's stdin file descriptor as raw bytes.

2. **Observe:** Record the prompt metadata without intercepting. Allow
   the TUI fallback to proceed normally. Optionally listen for the
   application's resolve message on stdout.

3. **Ignore:** Discard the message entirely.

A terminal host that intercepts a prompt MUST write the resolve message
before the application's TUI times out or the user interacts with the TUI
fallback. Race conditions between host-initiated and TUI-initiated input
are resolved by the application accepting whichever completes first.

### 9.3. Non-Interactive Events

For spinner and log messages, the terminal host MAY render enhanced UI
(progress bars, toast notifications, structured log panels). The terminal
host MUST NOT write any data to PTY stdin in response to these messages.

### 9.4. Unknown Fields

Terminal hosts SHOULD ignore unknown fields in any message. This allows
forward-compatible extension of message payloads without breaking existing
implementations.

### 9.5. Error Handling

If the JSON payload is malformed or fails to parse, the terminal host
SHOULD silently ignore the message. The terminal host MUST NOT crash,
disconnect the PTY, or alter normal terminal operation due to a malformed
OSC 7770 message.

---

## 10. Application Behavior

### 10.1. Emission Order

The application MUST emit the OSC 7770 prompt announcement **before**
rendering the TUI fallback. This ensures the terminal host can intercept
before the user sees TUI output.

### 10.2. Prompt IDs

Each prompt instance MUST have a unique `id`. UUID v4 is RECOMMENDED.
The application MUST NOT reuse an `id` for different prompt instances
within the same session.

### 10.3. Concurrent Prompts

Applications SHOULD present at most one interactive prompt at a time.
This specification does not define behavior for concurrent prompt
announcements. Terminal hosts that receive a new prompt announcement while
a previous prompt is unresolved MAY cancel the previous prompt.

### 10.4. TUI Independence

The application's TUI fallback MUST be fully functional without OSC 7770
support. The TUI MUST handle all user input through standard terminal
mechanisms (raw mode keystroke reading). OSC 7770 is an optimization, not
a dependency.

### 10.5. Stdin Parsing

Applications that emit OSC 7770 MUST also listen for resolve messages on
stdin. The application MUST parse incoming stdin data for the OSC 7770
prefix (`ESC ] 7770 ;`) and extract the JSON payload. If the parsed
message is a valid resolve for the active prompt, the application MUST
complete the prompt with the provided value and clean up TUI state.

Non-matching data on stdin MUST be processed as normal keystroke input.

---

## 11. Graceful Degradation

OSC 7770 is designed for zero degradation. The following guarantees hold:

1. **Unknown OSC sequences are silently ignored.** Per ECMA-48, a terminal
   that does not recognize an OSC code discards the sequence without
   visible effect. No garbled output, no error messages.

2. **TUI renders independently.** The application always renders a complete
   TUI prompt. If no terminal host intercepts, the user experience is
   identical to a standard prompt library.

3. **No capability negotiation.** The application does not query the
   terminal for OSC 7770 support. It emits the sequence unconditionally.
   This avoids startup latency, race conditions, and configuration
   complexity.

4. **No feature detection.** The application does not alter its behavior
   based on whether OSC 7770 is supported. It always provides the full TUI
   and always emits the OSC sequence.

---

## 12. Security Considerations

### 12.1. Input Injection

A terminal host that writes resolve messages to PTY stdin is injecting data
into the application's input stream. Malicious or compromised terminal
hosts could inject arbitrary values. Applications SHOULD validate all
resolved values against expected types and ranges.

### 12.2. Sensitive Data

Prompt messages and option values are transmitted as cleartext in the OSC
sequence. Applications SHOULD NOT include secrets, credentials, or
personally identifiable information in prompt payloads. For password-type
prompts, the `input` type may be used with the understanding that the
`placeholder` and `message` fields are visible in the escape sequence, but
the user's typed response is not transmitted via OSC 7770 (it travels
through normal stdin).

### 12.3. JSON Parsing

Implementations MUST use safe JSON parsers that do not evaluate code.
Implementations MUST handle malformed JSON gracefully (silent ignore, not
crash). Implementations SHOULD set reasonable limits on JSON payload size
to prevent denial-of-service through oversized messages.

### 12.4. Cross-Terminal Leakage

In multiplexed environments (tmux, screen, Zellij), OSC sequences may be
forwarded to outer terminals. Implementations SHOULD be aware that OSC 7770
messages may traverse multiple terminal layers. Each layer MAY
independently choose to intercept, observe, or ignore.

---

## 13. OSC Code Allocation

There is no formal registry or standards body that assigns OSC code numbers.
Terminal vendors allocate codes by convention, avoiding known conflicts.
The following table lists well-known OSC codes for context:

| Code   | Usage                               | Origin          |
|--------|-------------------------------------|-----------------|
| 0-2    | Window/icon title                   | xterm           |
| 4      | Color palette                       | xterm           |
| 7      | Current working directory           | Various         |
| 8      | Hyperlinks                          | Various         |
| 10-19  | Dynamic colors                      | xterm           |
| 52     | Clipboard access                    | xterm           |
| 99     | Desktop notifications               | Kitty           |
| 133    | Semantic prompt zones               | FinalTerm       |
| 633    | Shell integration                   | VS Code         |
| 777    | Desktop notifications               | rxvt-unicode    |
| 1337   | Proprietary extensions              | iTerm2          |
| **7770** | **Structured terminal prompts**   | **This spec**   |

OSC 7770 was chosen for the following reasons:

- It occupies a high, unused range with no known collisions.
- It is numerically distinct from all established codes.
- It is easy to remember and type.
- It does not conflict with private-use ranges claimed by existing
  terminal emulators.

---

## 14. Extensibility

### 14.1. New Prompt Types

Future versions of this specification MAY define additional prompt types
(e.g., `"date"`, `"file"`, `"color"`). Terminal hosts that encounter an
unknown prompt type SHOULD ignore it, allowing the TUI fallback to handle
the interaction.

### 14.2. New Fields

Future versions MAY add new fields to existing message types. Per
Section 9.4, terminal hosts MUST ignore unknown fields. This allows
additive, non-breaking extensions.

### 14.3. Version Negotiation

This specification does not define a negotiation mechanism. Version
compatibility is handled through the `v` field:

- If `v` equals a known version, process the message.
- If `v` is greater than the highest known version, ignore the message.
- The `v` field MUST be incremented for breaking changes to existing
  message types.

New message types or optional fields do not require a version increment.

---

## 15. References

### Normative References

- **[RFC 2119]** Bradner, S., "Key words for use in RFCs to Indicate
  Requirement Levels", BCP 14, RFC 2119, March 1997.
  https://www.rfc-editor.org/rfc/rfc2119

- **[RFC 5234]** Crocker, D., Ed. and P. Overell, "Augmented BNF for
  Syntax Specifications: ABNF", STD 68, RFC 5234, January 2008.
  https://www.rfc-editor.org/rfc/rfc5234

- **[RFC 8259]** Bray, T., Ed., "The JavaScript Object Notation (JSON)
  Data Interchange Format", STD 90, RFC 8259, December 2017.
  https://www.rfc-editor.org/rfc/rfc8259

- **[ECMA-48]** ECMA International, "Control Functions for Coded Character
  Sets", ECMA-48, 5th Edition, June 1991.
  https://ecma-international.org/publications-and-standards/standards/ecma-48/

### Informative References

- **[xterm ctlseqs]** Moy, E., Gildea, S., Dickey, T., "XTerm Control
  Sequences". https://invisible-island.net/xterm/ctlseqs/ctlseqs.html

- **[iTerm2 Escape Codes]** iTerm2, "Proprietary Escape Codes".
  https://iterm2.com/documentation-escape-codes.html

- **[Kitty Protocol]** Kitty, "Terminal Protocol Extensions".
  https://sw.kovidgoyal.net/kitty/protocol-extensions/

- **[termprompt]** Reference implementation of OSC 7770.
  https://github.com/seeden/termprompt

---

## 16. How to Cite This Document

### Plain Text

> OSC 7770: Structured Terminal Prompts, Version 1.0.0, 2026.
> https://github.com/seeden/termprompt/blob/main/SPEC.md

### BibTeX

```bibtex
@techreport{osc7770,
  title        = {{OSC} 7770: Structured Terminal Prompts},
  author       = {{Termprompt Contributors}},
  year         = {2026},
  month        = mar,
  type         = {Living Standard},
  version      = {1.0.0},
  url          = {https://github.com/seeden/termprompt/blob/main/SPEC.md},
  note         = {Specification for structured interactive prompt
                  announcements over terminal escape sequences}
}
```

### APA

Termprompt Contributors. (2026). *OSC 7770: Structured terminal prompts*
(Version 1.0.0) [Living Standard].
https://github.com/seeden/termprompt/blob/main/SPEC.md

### Chicago

Termprompt Contributors. "OSC 7770: Structured Terminal Prompts."
Version 1.0.0. Living Standard, March 2026.
https://github.com/seeden/termprompt/blob/main/SPEC.md.

---

## 17. Changelog

### Version 1.1.0 (2026-03-07)

- Added `progress` message type for determinate progress bars.
- Added `tasks` message type for multi-step operation tracking.
- Added separator support in `select` and `multiselect` option lists.
- Added `password` as a prompt type variant (Section 8.5, uses `"input"` OSC type).
- Added `number` as a prompt type variant (Section 8.6, uses `"input"` OSC type).
- Added `search` as a prompt type variant (Section 8.7, uses `"select"` OSC type).
- Documented `group` composition utility (Section 8.8, no protocol implications).

### Version 1.0.0 (2026-03-07)

- Initial specification.
- Defines four message types: prompt, resolve, spinner, log.
- Defines four prompt types: select, confirm, input, multiselect.
- Defines wire format, ABNF grammar, and JSON payload schemas.
