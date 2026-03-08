import { describe, it, expect } from "vitest";
import { PassThrough } from "node:stream";
import { createPrompt } from "../core/prompt.js";
import { isCancel } from "../symbols.js";
import { generatePromptId } from "../osc/osc.js";
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
        return: Buffer.from("\r"),
        escape: Buffer.from("\x1b"),
        backspace: Buffer.from("\x7f"),
        delete: Buffer.from("\x1b[3~"),
        left: Buffer.from("\x1b[D"),
        right: Buffer.from("\x1b[C"),
        home: Buffer.from("\x1b[H"),
        end: Buffer.from("\x1b[F"),
        "ctrl+c": Buffer.from("\x03"),
        "ctrl+a": Buffer.from("\x01"),
        "ctrl+e": Buffer.from("\x05"),
        "ctrl+u": Buffer.from("\x15"),
        "ctrl+w": Buffer.from("\x17"),
        space: Buffer.from(" "),
      };
      input.write(keyMap[name] ?? Buffer.from(name));
    },
  };
}

function testInput(
  config: {
    message: string;
    placeholder?: string;
    initialValue?: string;
    validate?: (value: string) => true | string;
  },
  streams: ReturnType<typeof createTestStreams>,
) {
  const { message, initialValue = "", validate } = config;
  const s = { text: initialValue, cursorPos: initialValue.length, error: null as string | null };

  return createPrompt<string>({
    initialValue,
    input: streams.input,
    output: streams.output,
    osc: { v: 1, type: "input", id: generatePromptId(), message },
    onKey(key: KeyPress, current: { value: string; state: PromptState }) {
      if (s.error) s.error = null;

      if (key.name === "return") {
        if (validate) {
          const result = validate(s.text);
          if (result !== true) {
            s.error = result;
            return { value: s.text, state: "error" };
          }
        }
        return { value: s.text, state: "submit" };
      }
      if (key.name === "escape") {
        return { value: current.value, state: "cancel" };
      }
      if (key.name === "backspace") {
        if (s.cursorPos > 0) {
          s.text = s.text.slice(0, s.cursorPos - 1) + s.text.slice(s.cursorPos);
          s.cursorPos--;
        }
        return { value: s.text, state: "active" };
      }
      if (key.name === "delete") {
        if (s.cursorPos < s.text.length) {
          s.text = s.text.slice(0, s.cursorPos) + s.text.slice(s.cursorPos + 1);
        }
        return { value: s.text, state: "active" };
      }
      if (key.name === "left") {
        if (s.cursorPos > 0) s.cursorPos--;
        return { value: s.text, state: "active" };
      }
      if (key.name === "right") {
        if (s.cursorPos < s.text.length) s.cursorPos++;
        return { value: s.text, state: "active" };
      }
      if (key.name === "home" || (key.ctrl && key.name === "a")) {
        s.cursorPos = 0;
        return { value: s.text, state: "active" };
      }
      if (key.name === "end" || (key.ctrl && key.name === "e")) {
        s.cursorPos = s.text.length;
        return { value: s.text, state: "active" };
      }
      if (key.ctrl && key.name === "u") {
        s.text = s.text.slice(s.cursorPos);
        s.cursorPos = 0;
        return { value: s.text, state: "active" };
      }
      if (key.ctrl && key.name === "w") {
        const before = s.text.slice(0, s.cursorPos);
        const after = s.text.slice(s.cursorPos);
        const trimmed = before.replace(/\S+\s*$/, "");
        s.text = trimmed + after;
        s.cursorPos = trimmed.length;
        return { value: s.text, state: "active" };
      }
      if (key.name === "space") {
        s.text = s.text.slice(0, s.cursorPos) + " " + s.text.slice(s.cursorPos);
        s.cursorPos++;
        return { value: s.text, state: "active" };
      }
      if (key.name.length === 1 && !key.ctrl && !key.meta) {
        s.text = s.text.slice(0, s.cursorPos) + key.name + s.text.slice(s.cursorPos);
        s.cursorPos++;
        return { value: s.text, state: "active" };
      }
      return undefined;
    },
    render(state: PromptState, value: string) {
      if (state === "submit") return `submitted:${value}`;
      if (state === "cancel") return "cancelled";
      if (state === "error") return `error:${s.error}`;
      return `input:${s.text}`;
    },
  });
}

describe("input", () => {
  it("submits typed text", async () => {
    const streams = createTestStreams();
    const promise = testInput({ message: "Name?" }, streams);
    streams.pressKey("h");
    streams.pressKey("i");
    streams.pressKey("return");
    expect(await promise).toBe("hi");
  });

  it("handles backspace", async () => {
    const streams = createTestStreams();
    const promise = testInput({ message: "Name?" }, streams);
    streams.pressKey("a");
    streams.pressKey("b");
    streams.pressKey("c");
    streams.pressKey("backspace");
    streams.pressKey("return");
    expect(await promise).toBe("ab");
  });

  it("handles delete key", async () => {
    const streams = createTestStreams();
    const promise = testInput({ message: "Name?", initialValue: "abc" }, streams);
    streams.pressKey("home");
    streams.pressKey("delete");
    streams.pressKey("return");
    expect(await promise).toBe("bc");
  });

  it("handles cursor movement", async () => {
    const streams = createTestStreams();
    const promise = testInput({ message: "Name?" }, streams);
    streams.pressKey("a");
    streams.pressKey("c");
    streams.pressKey("left");
    streams.pressKey("b");
    streams.pressKey("return");
    expect(await promise).toBe("abc");
  });

  it("handles home/end keys", async () => {
    const streams = createTestStreams();
    const promise = testInput({ message: "Name?", initialValue: "hello" }, streams);
    streams.pressKey("home");
    streams.pressKey("x");
    streams.pressKey("end");
    streams.pressKey("y");
    streams.pressKey("return");
    expect(await promise).toBe("xhelloy");
  });

  it("handles Ctrl+A and Ctrl+E", async () => {
    const streams = createTestStreams();
    const promise = testInput({ message: "Name?", initialValue: "test" }, streams);
    streams.pressKey("ctrl+a");
    streams.pressKey("0");
    streams.pressKey("ctrl+e");
    streams.pressKey("9");
    streams.pressKey("return");
    expect(await promise).toBe("0test9");
  });

  it("handles Ctrl+U (clear before cursor)", async () => {
    const streams = createTestStreams();
    const promise = testInput({ message: "Name?", initialValue: "hello world" }, streams);
    // Cursor is at end. Move to position 5 (after "hello")
    streams.pressKey("home");
    streams.pressKey("right");
    streams.pressKey("right");
    streams.pressKey("right");
    streams.pressKey("right");
    streams.pressKey("right");
    streams.pressKey("ctrl+u");
    streams.pressKey("return");
    expect(await promise).toBe(" world");
  });

  it("handles Ctrl+W (delete word backward)", async () => {
    const streams = createTestStreams();
    const promise = testInput({ message: "Name?", initialValue: "hello world" }, streams);
    streams.pressKey("ctrl+w");
    streams.pressKey("return");
    expect(await promise).toBe("hello ");
  });

  it("handles space", async () => {
    const streams = createTestStreams();
    const promise = testInput({ message: "Name?" }, streams);
    streams.pressKey("a");
    streams.pressKey("space");
    streams.pressKey("b");
    streams.pressKey("return");
    expect(await promise).toBe("a b");
  });

  it("validates on submit", async () => {
    const streams = createTestStreams();
    const promise = testInput(
      {
        message: "Name?",
        validate: (v) => (v.length > 0 ? true : "Required"),
      },
      streams,
    );
    // Try empty submit
    streams.pressKey("return");
    // Should get error state, not resolve
    // Type something and try again
    streams.pressKey("a");
    streams.pressKey("return");
    expect(await promise).toBe("a");
  });

  it("cancels on Escape", async () => {
    const streams = createTestStreams();
    const promise = testInput({ message: "Name?" }, streams);
    streams.pressKey("escape");
    expect(isCancel(await promise)).toBe(true);
  });

  it("cancels on Ctrl+C", async () => {
    const streams = createTestStreams();
    const promise = testInput({ message: "Name?" }, streams);
    streams.pressKey("ctrl+c");
    expect(isCancel(await promise)).toBe(true);
  });

  it("uses initialValue", async () => {
    const streams = createTestStreams();
    const promise = testInput({ message: "Name?", initialValue: "preset" }, streams);
    streams.pressKey("return");
    expect(await promise).toBe("preset");
  });
});
