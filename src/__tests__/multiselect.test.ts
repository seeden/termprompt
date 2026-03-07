import { describe, it, expect } from "vitest";
import { PassThrough } from "node:stream";
import { createPrompt } from "../core/prompt.js";
import { isCancel } from "../symbols.js";
import { generatePromptId } from "../osc/osc.js";
import { multiselect } from "../prompts/multiselect.js";
import { isSeparator, type SelectOption } from "../types.js";
import type { KeyPress, PromptState } from "../types.js";

function createTestStreams() {
  const input = new PassThrough();
  const output = new PassThrough({ encoding: "utf8" });
  let outputBuffer = "";
  output.on("data", (chunk: string) => {
    outputBuffer += chunk;
  });
  return {
    input,
    output,
    getOutput: () => outputBuffer,
    pressKey: (name: string) => {
      const keyMap: Record<string, Buffer> = {
        up: Buffer.from("\x1b[A"),
        down: Buffer.from("\x1b[B"),
        return: Buffer.from("\r"),
        space: Buffer.from(" "),
        escape: Buffer.from("\x1b"),
        "ctrl+c": Buffer.from("\x03"),
      };
      input.write(keyMap[name] ?? Buffer.from(name));
    },
  };
}

function isSelectable<T>(opt: SelectOption<T>): boolean {
  return !isSeparator(opt) && !opt.disabled;
}

function testMultiselect<T>(
  config: {
    message: string;
    options: SelectOption<T>[];
    initialValues?: T[];
    required?: boolean;
  },
  streams: ReturnType<typeof createTestStreams>,
) {
  const { message, options, initialValues = [], required = true } = config;
  let cursorIndex = 0;
  // Skip to first selectable
  if (!isSelectable(options[cursorIndex]!)) {
    for (let i = 0; i < options.length; i++) {
      if (isSelectable(options[i]!)) {
        cursorIndex = i;
        break;
      }
    }
  }
  const selected = new Set<number>(
    initialValues
      .map((v) => options.findIndex((o) => !isSeparator(o) && o.value === v))
      .filter((i) => i !== -1),
  );
  let error: string | null = null;

  return createPrompt<T[]>({
    initialValue: initialValues.slice(),
    input: streams.input,
    output: streams.output,
    osc: { v: 1, type: "multiselect", id: generatePromptId(), message },
    onKey(key: KeyPress, current: { value: T[]; state: PromptState }) {
      if (error) error = null;

      if (key.name === "up" || key.name === "k") {
        let next = cursorIndex;
        do {
          next = (next - 1 + options.length) % options.length;
        } while (!isSelectable(options[next]!) && next !== cursorIndex);
        cursorIndex = next;
        return { value: current.value, state: "active" };
      }
      if (key.name === "down" || key.name === "j") {
        let next = cursorIndex;
        do {
          next = (next + 1) % options.length;
        } while (!isSelectable(options[next]!) && next !== cursorIndex);
        cursorIndex = next;
        return { value: current.value, state: "active" };
      }
      if (key.name === "space") {
        const opt = options[cursorIndex]!;
        if (!isSeparator(opt) && !opt.disabled) {
          if (selected.has(cursorIndex)) {
            selected.delete(cursorIndex);
          } else {
            selected.add(cursorIndex);
          }
        }
        const values = [...selected].map((i) => (options[i] as { value: T }).value);
        return { value: values, state: "active" };
      }
      if (key.name === "a") {
        const allSelectable = options
          .map((o, i) => ({ selectable: isSelectable(o), index: i }))
          .filter((o) => o.selectable);
        const allSelected = allSelectable.every((o) => selected.has(o.index));
        if (allSelected) {
          selected.clear();
        } else {
          for (const o of allSelectable) selected.add(o.index);
        }
        const values = [...selected].map((i) => (options[i] as { value: T }).value);
        return { value: values, state: "active" };
      }
      if (key.name === "return") {
        if (required && selected.size === 0) {
          error = "Required";
          return { value: current.value, state: "error" };
        }
        const values = [...selected].sort((a, b) => a - b).map((i) => (options[i] as { value: T }).value);
        return { value: values, state: "submit" };
      }
      if (key.name === "escape") {
        return { value: current.value, state: "cancel" };
      }
      return undefined;
    },
    render(state: PromptState, value: T[]) {
      if (state === "submit") return `submitted:${value.join(",")}`;
      if (state === "cancel") return "cancelled";
      if (state === "error") return `error:${error}`;
      return options
        .map((o, i) => {
          if (isSeparator(o)) return `--${o.label ?? ""}--`;
          const cursor = i === cursorIndex ? ">" : " ";
          const check = selected.has(i) ? "x" : " ";
          return `${cursor}[${check}]${o.label}`;
        })
        .join("\n");
    },
  });
}

describe("multiselect", () => {
  it("selects with space and submits", async () => {
    const streams = createTestStreams();
    const promise = testMultiselect(
      {
        message: "Features?",
        options: [
          { value: "a", label: "Auth" },
          { value: "b", label: "DB" },
          { value: "c", label: "API" },
        ],
      },
      streams,
    );

    streams.pressKey("space"); // select first
    streams.pressKey("down");
    streams.pressKey("down");
    streams.pressKey("space"); // select third
    streams.pressKey("return");
    const result = await promise;
    expect(result).toEqual(["a", "c"]);
  });

  it("toggles selection with space", async () => {
    const streams = createTestStreams();
    const promise = testMultiselect(
      {
        message: "Features?",
        options: [
          { value: "a", label: "Auth" },
          { value: "b", label: "DB" },
        ],
      },
      streams,
    );

    streams.pressKey("space"); // select
    streams.pressKey("space"); // deselect
    streams.pressKey("down");
    streams.pressKey("space"); // select second
    streams.pressKey("return");
    const result = await promise;
    expect(result).toEqual(["b"]);
  });

  it("toggle all with 'a'", async () => {
    const streams = createTestStreams();
    const promise = testMultiselect(
      {
        message: "Features?",
        options: [
          { value: "a", label: "Auth" },
          { value: "b", label: "DB" },
          { value: "c", label: "API" },
        ],
      },
      streams,
    );

    streams.pressKey("a"); // select all
    streams.pressKey("return");
    const result = await promise;
    expect(result).toEqual(["a", "b", "c"]);
  });

  it("toggle all deselects when all selected", async () => {
    const streams = createTestStreams();
    const promise = testMultiselect(
      {
        message: "Features?",
        options: [
          { value: "a", label: "Auth" },
          { value: "b", label: "DB" },
        ],
        required: false,
      },
      streams,
    );

    streams.pressKey("a"); // select all
    streams.pressKey("a"); // deselect all
    streams.pressKey("return");
    const result = await promise;
    expect(result).toEqual([]);
  });

  it("validates required", async () => {
    const streams = createTestStreams();
    const promise = testMultiselect(
      {
        message: "Features?",
        options: [
          { value: "a", label: "Auth" },
          { value: "b", label: "DB" },
        ],
        required: true,
      },
      streams,
    );

    streams.pressKey("return"); // try empty submit
    // Should get error, now select something
    streams.pressKey("space");
    streams.pressKey("return");
    const result = await promise;
    expect(result).toEqual(["a"]);
  });

  it("allows empty when not required", async () => {
    const streams = createTestStreams();
    const promise = testMultiselect(
      {
        message: "Features?",
        options: [{ value: "a", label: "Auth" }],
        required: false,
      },
      streams,
    );

    streams.pressKey("return");
    const result = await promise;
    expect(result).toEqual([]);
  });

  it("skips disabled options", async () => {
    const streams = createTestStreams();
    const promise = testMultiselect(
      {
        message: "Features?",
        options: [
          { value: "a", label: "Auth" },
          { value: "b", label: "DB", disabled: true },
          { value: "c", label: "API" },
        ],
      },
      streams,
    );

    streams.pressKey("down"); // skips disabled, goes to API
    streams.pressKey("space");
    streams.pressKey("return");
    const result = await promise;
    expect(result).toEqual(["c"]);
  });

  it("uses initialValues", async () => {
    const streams = createTestStreams();
    const promise = testMultiselect(
      {
        message: "Features?",
        options: [
          { value: "a", label: "Auth" },
          { value: "b", label: "DB" },
          { value: "c", label: "API" },
        ],
        initialValues: ["a", "c"],
      },
      streams,
    );

    streams.pressKey("return");
    const result = await promise;
    expect(result).toEqual(["a", "c"]);
  });

  it("cancels on Escape", async () => {
    const streams = createTestStreams();
    const promise = testMultiselect(
      {
        message: "Features?",
        options: [{ value: "a", label: "Auth" }],
      },
      streams,
    );

    streams.pressKey("escape");
    expect(isCancel(await promise)).toBe(true);
  });

  it("supports vim j/k navigation", async () => {
    const streams = createTestStreams();
    const promise = testMultiselect(
      {
        message: "Features?",
        options: [
          { value: "a", label: "Auth" },
          { value: "b", label: "DB" },
          { value: "c", label: "API" },
        ],
      },
      streams,
    );

    streams.pressKey("j"); // down to DB
    streams.pressKey("j"); // down to API
    streams.pressKey("space"); // select API
    streams.pressKey("k"); // up to DB
    streams.pressKey("space"); // select DB
    streams.pressKey("return");
    const result = await promise;
    expect(result).toEqual(["b", "c"]);
  });

  it("throws on empty options", async () => {
    await expect(
      multiselect({ message: "Pick", options: [] }),
    ).rejects.toThrow("multiselect requires at least one non-disabled option");
  });

  it("throws when all options are disabled", async () => {
    await expect(
      multiselect({
        message: "Pick",
        options: [
          { value: "a", label: "Auth", disabled: true },
          { value: "b", label: "DB", disabled: true },
        ],
      }),
    ).rejects.toThrow("multiselect requires at least one non-disabled option");
  });

  it("skips separators during navigation", async () => {
    const streams = createTestStreams();
    const promise = testMultiselect(
      {
        message: "Features?",
        options: [
          { value: "a", label: "Auth" },
          { separator: true, label: "More" },
          { value: "b", label: "DB" },
        ],
      },
      streams,
    );

    streams.pressKey("down"); // skips separator, lands on DB
    streams.pressKey("space"); // select DB
    streams.pressKey("return");
    const result = await promise;
    expect(result).toEqual(["b"]);
  });

  it("toggle all ignores separators", async () => {
    const streams = createTestStreams();
    const promise = testMultiselect(
      {
        message: "Features?",
        options: [
          { value: "a", label: "Auth" },
          { separator: true },
          { value: "b", label: "DB" },
        ],
      },
      streams,
    );

    streams.pressKey("a"); // select all (only real options)
    streams.pressKey("return");
    const result = await promise;
    expect(result).toEqual(["a", "b"]);
  });
});
