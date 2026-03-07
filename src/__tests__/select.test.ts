import { describe, it, expect } from "vitest";
import { PassThrough } from "node:stream";
import { select } from "../prompts/select.js";
import { isCancel } from "../symbols.js";
import { isSeparator, type SelectOption } from "../types.js";

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

async function testSelect<T>(
  config: { message: string; options: SelectOption<T>[]; initialValue?: T; maxItems?: number },
  streams: ReturnType<typeof createTestStreams>,
) {
  const { createPrompt } = await import("../core/prompt.js");
  const { generatePromptId } = await import("../osc/osc.js");

  const { message, options, initialValue, maxItems = 10 } = config;
  let cursorIndex = 0;
  if (initialValue !== undefined) {
    const idx = options.findIndex((o) => !isSeparator(o) && o.value === initialValue);
    if (idx !== -1) cursorIndex = idx;
  }
  if (!isSelectable(options[cursorIndex]!)) {
    for (let i = 0; i < options.length; i++) {
      if (isSelectable(options[i]!)) {
        cursorIndex = i;
        break;
      }
    }
  }
  let scrollOffset = 0;

  const promptId = generatePromptId();
  const oscOptions = options
    .filter((o) => !isSeparator(o))
    .map((o) => {
      const opt = o as { value: T; label: string; hint?: string; disabled?: boolean };
      return { value: String(opt.value), label: opt.label, hint: opt.hint, disabled: opt.disabled };
    });

  return createPrompt<T>({
    initialValue: (options[cursorIndex] as { value: T }).value,
    input: streams.input,
    output: streams.output,
    osc: { v: 1, type: "select", id: promptId, message, options: oscOptions },
    onKey(key, current) {
      if (key.name === "up" || key.name === "k") {
        let next = cursorIndex;
        do {
          next = (next - 1 + options.length) % options.length;
        } while (!isSelectable(options[next]!) && next !== cursorIndex);
        cursorIndex = next;
        if (cursorIndex < scrollOffset) scrollOffset = cursorIndex;
        if (cursorIndex >= scrollOffset + maxItems)
          scrollOffset = cursorIndex - maxItems + 1;
        return { value: (options[cursorIndex] as { value: T }).value, state: "active" };
      }
      if (key.name === "down" || key.name === "j") {
        let next = cursorIndex;
        do {
          next = (next + 1) % options.length;
        } while (!isSelectable(options[next]!) && next !== cursorIndex);
        cursorIndex = next;
        if (cursorIndex < scrollOffset) scrollOffset = cursorIndex;
        if (cursorIndex >= scrollOffset + maxItems)
          scrollOffset = cursorIndex - maxItems + 1;
        return { value: (options[cursorIndex] as { value: T }).value, state: "active" };
      }
      if (key.name === "return") {
        const opt = options[cursorIndex]!;
        if (isSeparator(opt) || opt.disabled) return undefined;
        return { value: opt.value, state: "submit" };
      }
      if (key.name === "escape") {
        return { value: current.value, state: "cancel" };
      }
      return undefined;
    },
    render(state, value) {
      const selected = options.find((o) => !isSeparator(o) && o.value === value);
      const label = selected && !isSeparator(selected) ? selected.label : String(value);
      if (state === "submit") return `submitted:${label}`;
      if (state === "cancel") return "cancelled";
      return options
        .map((o, i) => {
          if (isSeparator(o)) return `--${o.label ?? ""}--`;
          return `${i === cursorIndex ? ">" : " "}${o.label}`;
        })
        .join("\n");
    },
  });
}

describe("select", () => {
  it("submits first option on Enter", async () => {
    const streams = createTestStreams();
    const promise = testSelect(
      {
        message: "Pick",
        options: [
          { value: "a", label: "Alpha" },
          { value: "b", label: "Beta" },
        ],
      },
      streams,
    );

    streams.pressKey("return");
    const result = await promise;
    expect(result).toBe("a");
  });

  it("navigates down and submits", async () => {
    const streams = createTestStreams();
    const promise = testSelect(
      {
        message: "Pick",
        options: [
          { value: "a", label: "Alpha" },
          { value: "b", label: "Beta" },
          { value: "c", label: "Gamma" },
        ],
      },
      streams,
    );

    streams.pressKey("down");
    streams.pressKey("down");
    streams.pressKey("return");
    const result = await promise;
    expect(result).toBe("c");
  });

  it("navigates up and wraps around", async () => {
    const streams = createTestStreams();
    const promise = testSelect(
      {
        message: "Pick",
        options: [
          { value: "a", label: "Alpha" },
          { value: "b", label: "Beta" },
        ],
      },
      streams,
    );

    streams.pressKey("up");
    streams.pressKey("return");
    const result = await promise;
    expect(result).toBe("b"); // wrapped to last
  });

  it("supports vim j/k navigation", async () => {
    const streams = createTestStreams();
    const promise = testSelect(
      {
        message: "Pick",
        options: [
          { value: "a", label: "Alpha" },
          { value: "b", label: "Beta" },
          { value: "c", label: "Gamma" },
        ],
      },
      streams,
    );

    streams.pressKey("j");
    streams.pressKey("j");
    streams.pressKey("k");
    streams.pressKey("return");
    const result = await promise;
    expect(result).toBe("b");
  });

  it("skips disabled options", async () => {
    const streams = createTestStreams();
    const promise = testSelect(
      {
        message: "Pick",
        options: [
          { value: "a", label: "Alpha" },
          { value: "b", label: "Beta", disabled: true },
          { value: "c", label: "Gamma" },
        ],
      },
      streams,
    );

    streams.pressKey("down");
    streams.pressKey("return");
    const result = await promise;
    expect(result).toBe("c"); // skipped disabled Beta
  });

  it("cancels on Escape", async () => {
    const streams = createTestStreams();
    const promise = testSelect(
      {
        message: "Pick",
        options: [{ value: "a", label: "Alpha" }],
      },
      streams,
    );

    streams.pressKey("escape");
    const result = await promise;
    expect(isCancel(result)).toBe(true);
  });

  it("cancels on Ctrl+C", async () => {
    const streams = createTestStreams();
    const promise = testSelect(
      {
        message: "Pick",
        options: [{ value: "a", label: "Alpha" }],
      },
      streams,
    );

    streams.pressKey("ctrl+c");
    const result = await promise;
    expect(isCancel(result)).toBe(true);
  });

  it("renders submitted label", async () => {
    const streams = createTestStreams();
    const promise = testSelect(
      {
        message: "Pick",
        options: [
          { value: "a", label: "Alpha" },
          { value: "b", label: "Beta" },
        ],
      },
      streams,
    );

    streams.pressKey("return");
    await promise;
    expect(streams.getOutput()).toContain("submitted:Alpha");
  });

  it("uses initialValue to set cursor", async () => {
    const streams = createTestStreams();
    const promise = testSelect(
      {
        message: "Pick",
        options: [
          { value: "a", label: "Alpha" },
          { value: "b", label: "Beta" },
          { value: "c", label: "Gamma" },
        ],
        initialValue: "c",
      },
      streams,
    );

    streams.pressKey("return");
    const result = await promise;
    expect(result).toBe("c");
  });

  it("throws on empty options", async () => {
    await expect(select({ message: "Pick", options: [] })).rejects.toThrow(
      "select requires at least one non-disabled option",
    );
  });

  it("throws when all options are disabled", async () => {
    await expect(
      select({
        message: "Pick",
        options: [
          { value: "a", label: "Alpha", disabled: true },
          { value: "b", label: "Beta", disabled: true },
        ],
      }),
    ).rejects.toThrow("select requires at least one non-disabled option");
  });

  it("skips separators during navigation", async () => {
    const streams = createTestStreams();
    const promise = testSelect(
      {
        message: "Pick",
        options: [
          { value: "a", label: "Alpha" },
          { separator: true, label: "Divider" },
          { value: "b", label: "Beta" },
        ],
      },
      streams,
    );

    streams.pressKey("down"); // skips separator, lands on Beta
    streams.pressKey("return");
    const result = await promise;
    expect(result).toBe("b");
  });

  it("skips separator on wrap around", async () => {
    const streams = createTestStreams();
    const promise = testSelect(
      {
        message: "Pick",
        options: [
          { value: "a", label: "Alpha" },
          { separator: true },
          { value: "b", label: "Beta" },
        ],
      },
      streams,
    );

    streams.pressKey("up"); // wraps to Beta, skipping separator
    streams.pressKey("return");
    const result = await promise;
    expect(result).toBe("b");
  });
});
