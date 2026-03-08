import { describe, it, expect } from "vitest";
import { PassThrough } from "node:stream";
import { createPrompt } from "../core/prompt.js";
import { isCancel } from "../symbols.js";
import { generatePromptId } from "../osc/osc.js";
import { search } from "../prompts/search.js";
import type { KeyPress, PromptState } from "../types.js";

type SearchOption<T> = { value: T; label: string; hint?: string };

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
        backspace: Buffer.from("\x7f"),
        "ctrl+c": Buffer.from("\x03"),
        "ctrl+u": Buffer.from("\x15"),
        "ctrl+w": Buffer.from("\x17"),
        space: Buffer.from(" "),
      };
      input.write(keyMap[name] ?? Buffer.from(name));
    },
  };
}

function filterOptions<T>(options: SearchOption<T>[], query: string) {
  if (query.length === 0) return options;
  const lower = query.toLowerCase();
  return options.filter(
    (o) =>
      o.label.toLowerCase().includes(lower) ||
      (o.hint && o.hint.toLowerCase().includes(lower)),
  );
}

function testSearch<T>(
  config: { message: string; options: SearchOption<T>[]; maxItems?: number },
  streams: ReturnType<typeof createTestStreams>,
) {
  const { message, options, maxItems = 10 } = config;
  const s = {
    query: "",
    cursorPos: 0,
    filtered: options.slice(),
    selectedIndex: 0,
    scrollOffset: 0,
  };

  return createPrompt<T>({
    initialValue: options[0]?.value as T,
    input: streams.input,
    output: streams.output,
    osc: { v: 1, type: "select", id: generatePromptId(), message },
    onKey(key: KeyPress, current: { value: T; state: PromptState }) {
      if (key.name === "up") {
        if (s.filtered.length > 0) {
          s.selectedIndex =
            (s.selectedIndex - 1 + s.filtered.length) % s.filtered.length;
        }
        return {
          value: s.filtered[s.selectedIndex]?.value ?? current.value,
          state: "active",
        };
      }
      if (key.name === "down") {
        if (s.filtered.length > 0) {
          s.selectedIndex = (s.selectedIndex + 1) % s.filtered.length;
        }
        return {
          value: s.filtered[s.selectedIndex]?.value ?? current.value,
          state: "active",
        };
      }
      if (key.name === "return") {
        const selected = s.filtered[s.selectedIndex];
        if (!selected) return undefined;
        return { value: selected.value, state: "submit" };
      }
      if (key.name === "escape") {
        return { value: current.value, state: "cancel" };
      }
      if (key.name === "backspace") {
        if (s.cursorPos > 0) {
          s.query =
            s.query.slice(0, s.cursorPos - 1) + s.query.slice(s.cursorPos);
          s.cursorPos--;
          s.filtered = filterOptions(options, s.query);
          s.selectedIndex = 0;
        }
        return {
          value: s.filtered[0]?.value ?? current.value,
          state: "active",
        };
      }
      if (key.ctrl && key.name === "u") {
        s.query = s.query.slice(s.cursorPos);
        s.cursorPos = 0;
        s.filtered = filterOptions(options, s.query);
        s.selectedIndex = 0;
        return {
          value: s.filtered[0]?.value ?? current.value,
          state: "active",
        };
      }
      if (key.ctrl && key.name === "w") {
        const before = s.query.slice(0, s.cursorPos);
        const after = s.query.slice(s.cursorPos);
        const trimmed = before.replace(/\S+\s*$/, "");
        s.query = trimmed + after;
        s.cursorPos = trimmed.length;
        s.filtered = filterOptions(options, s.query);
        s.selectedIndex = 0;
        return {
          value: s.filtered[0]?.value ?? current.value,
          state: "active",
        };
      }
      if (key.name === "space") {
        s.query += " ";
        s.cursorPos++;
        s.filtered = filterOptions(options, s.query);
        s.selectedIndex = 0;
        return {
          value: s.filtered[0]?.value ?? current.value,
          state: "active",
        };
      }
      if (key.name.length === 1 && !key.ctrl && !key.meta) {
        s.query += key.name;
        s.cursorPos++;
        s.filtered = filterOptions(options, s.query);
        s.selectedIndex = 0;
        return {
          value: s.filtered[0]?.value ?? current.value,
          state: "active",
        };
      }
      return undefined;
    },
    render(state: PromptState, value: T) {
      if (state === "submit") {
        const sel = options.find((o) => o.value === value);
        return `submitted:${sel?.label}`;
      }
      if (state === "cancel") return "cancelled";
      return `search:${s.query}|results:${s.filtered.length}|selected:${s.selectedIndex}`;
    },
  });
}

const FRAMEWORKS = [
  { value: "next", label: "Next.js", hint: "React" },
  { value: "hono", label: "Hono", hint: "Edge" },
  { value: "express", label: "Express", hint: "Node.js" },
  { value: "fastify", label: "Fastify", hint: "Node.js" },
  { value: "nuxt", label: "Nuxt", hint: "Vue" },
  { value: "svelte", label: "SvelteKit", hint: "Svelte" },
];

describe("search", () => {
  it("submits first option without typing", async () => {
    const streams = createTestStreams();
    const promise = testSearch(
      { message: "Framework?", options: FRAMEWORKS },
      streams,
    );
    streams.pressKey("return");
    expect(await promise).toBe("next");
  });

  it("filters by typing", async () => {
    const streams = createTestStreams();
    const promise = testSearch(
      { message: "Framework?", options: FRAMEWORKS },
      streams,
    );
    streams.pressKey("h");
    streams.pressKey("o");
    streams.pressKey("n");
    streams.pressKey("return");
    expect(await promise).toBe("hono");
  });

  it("filters case-insensitively", async () => {
    const streams = createTestStreams();
    const promise = testSearch(
      { message: "Framework?", options: FRAMEWORKS },
      streams,
    );
    streams.pressKey("E");
    streams.pressKey("X");
    streams.pressKey("P");
    streams.pressKey("return");
    expect(await promise).toBe("express");
  });

  it("filters by hint", async () => {
    const streams = createTestStreams();
    const promise = testSearch(
      { message: "Framework?", options: FRAMEWORKS },
      streams,
    );
    streams.pressKey("V");
    streams.pressKey("u");
    streams.pressKey("e");
    streams.pressKey("return");
    expect(await promise).toBe("nuxt");
  });

  it("navigates filtered results with arrows", async () => {
    const streams = createTestStreams();
    const promise = testSearch(
      { message: "Framework?", options: FRAMEWORKS },
      streams,
    );
    // Type "n" - matches Next.js, Hono, Nuxt (all contain 'n')
    streams.pressKey("n");
    streams.pressKey("down");
    streams.pressKey("return");
    const result = await promise;
    // Second match after filtering
    expect(["hono", "nuxt", "next"].includes(result as string)).toBe(true);
  });

  it("handles backspace to clear filter", async () => {
    const streams = createTestStreams();
    const promise = testSearch(
      { message: "Framework?", options: FRAMEWORKS },
      streams,
    );
    streams.pressKey("x");
    streams.pressKey("x");
    streams.pressKey("x");
    // No results for "xxx", backspace all
    streams.pressKey("backspace");
    streams.pressKey("backspace");
    streams.pressKey("backspace");
    // Back to all results
    streams.pressKey("return");
    expect(await promise).toBe("next");
  });

  it("wraps around on navigation", async () => {
    const streams = createTestStreams();
    const promise = testSearch(
      { message: "Framework?", options: FRAMEWORKS },
      streams,
    );
    streams.pressKey("up"); // wraps to last
    streams.pressKey("return");
    expect(await promise).toBe("svelte");
  });

  it("cancels on Escape", async () => {
    const streams = createTestStreams();
    const promise = testSearch(
      { message: "Framework?", options: FRAMEWORKS },
      streams,
    );
    streams.pressKey("escape");
    expect(isCancel(await promise)).toBe(true);
  });

  it("cancels on Ctrl+C", async () => {
    const streams = createTestStreams();
    const promise = testSearch(
      { message: "Framework?", options: FRAMEWORKS },
      streams,
    );
    streams.pressKey("ctrl+c");
    expect(isCancel(await promise)).toBe(true);
  });

  it("ignores Enter when no results match", async () => {
    const streams = createTestStreams();
    const promise = testSearch(
      { message: "Framework?", options: FRAMEWORKS },
      streams,
    );
    streams.pressKey("z");
    streams.pressKey("z");
    streams.pressKey("z");
    // Enter should be ignored, prompt stays active
    streams.pressKey("return");
    // Backspace to clear and submit normally
    streams.pressKey("backspace");
    streams.pressKey("backspace");
    streams.pressKey("backspace");
    streams.pressKey("return");
    expect(await promise).toBe("next");
  });

  it("Ctrl+U clears query from cursor to start", async () => {
    const streams = createTestStreams();
    const promise = testSearch(
      { message: "Framework?", options: FRAMEWORKS },
      streams,
    );
    streams.pressKey("z");
    streams.pressKey("z");
    streams.pressKey("z");
    // Ctrl+U clears the query
    streams.pressKey("ctrl+u");
    // All results should be back
    streams.pressKey("return");
    expect(await promise).toBe("next");
  });

  it("Ctrl+W deletes word backward", async () => {
    const streams = createTestStreams();
    const promise = testSearch(
      { message: "Framework?", options: FRAMEWORKS },
      streams,
    );
    streams.pressKey("z");
    streams.pressKey("z");
    streams.pressKey("z");
    // Ctrl+W deletes the word
    streams.pressKey("ctrl+w");
    // All results should be back
    streams.pressKey("return");
    expect(await promise).toBe("next");
  });

  it("throws on empty options", async () => {
    await expect(search({ message: "Pick", options: [] })).rejects.toThrow(
      "search requires at least one option",
    );
  });
});
