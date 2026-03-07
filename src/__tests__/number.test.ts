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
        up: Buffer.from("\x1b[A"),
        down: Buffer.from("\x1b[B"),
        left: Buffer.from("\x1b[D"),
        right: Buffer.from("\x1b[C"),
        return: Buffer.from("\r"),
        escape: Buffer.from("\x1b"),
        backspace: Buffer.from("\x7f"),
        delete: Buffer.from("\x1b[3~"),
        "ctrl+c": Buffer.from("\x03"),
        "ctrl+a": Buffer.from("\x01"),
        "ctrl+e": Buffer.from("\x05"),
        "ctrl+u": Buffer.from("\x15"),
        "ctrl+w": Buffer.from("\x17"),
      };
      input.write(keyMap[name] ?? Buffer.from(name));
    },
  };
}

type NumberState = {
  text: string;
  cursorPos: number;
  error: string | null;
};

function isNumericChar(char: string, text: string, cursorPos: number): boolean {
  if (char >= "0" && char <= "9") return true;
  if (char === "-" && cursorPos === 0 && !text.includes("-")) return true;
  if (char === "." && !text.includes(".")) return true;
  return false;
}

function testNumber(
  config: {
    message: string;
    min?: number;
    max?: number;
    step?: number;
    initialValue?: number;
    validate?: (value: number) => true | string;
  },
  streams: ReturnType<typeof createTestStreams>,
) {
  const { message, min, max, step = 1, initialValue, validate } = config;
  const initialText = initialValue !== undefined ? String(initialValue) : "";

  const s: NumberState = {
    text: initialText,
    cursorPos: initialText.length,
    error: null,
  };

  return createPrompt<number>({
    initialValue: initialValue ?? 0,
    input: streams.input,
    output: streams.output,
    osc: { v: 1, type: "input", id: generatePromptId(), message },
    onKey(key: KeyPress, current: { value: number; state: PromptState }) {
      if (s.error) s.error = null;

      if (key.name === "return") {
        const num = Number(s.text);
        if (s.text.length === 0 || Number.isNaN(num)) {
          s.error = "Invalid number";
          return { value: current.value, state: "error" };
        }
        if (min !== undefined && num < min) {
          s.error = `Min ${min}`;
          return { value: current.value, state: "error" };
        }
        if (max !== undefined && num > max) {
          s.error = `Max ${max}`;
          return { value: current.value, state: "error" };
        }
        if (validate) {
          const result = validate(num);
          if (result !== true) {
            s.error = result;
            return { value: current.value, state: "error" };
          }
        }
        return { value: num, state: "submit" };
      }

      if (key.name === "escape") {
        return { value: current.value, state: "cancel" };
      }

      if (key.name === "up") {
        let num = Number(s.text) || 0;
        num += step;
        if (max !== undefined && num > max) num = max;
        s.text = String(num);
        s.cursorPos = s.text.length;
        return { value: num, state: "active" };
      }

      if (key.name === "down") {
        let num = Number(s.text) || 0;
        num -= step;
        if (min !== undefined && num < min) num = min;
        s.text = String(num);
        s.cursorPos = s.text.length;
        return { value: num, state: "active" };
      }

      if (key.name === "backspace") {
        if (s.cursorPos > 0) {
          s.text = s.text.slice(0, s.cursorPos - 1) + s.text.slice(s.cursorPos);
          s.cursorPos--;
        }
        return { value: Number(s.text) || 0, state: "active" };
      }

      if (key.ctrl && key.name === "u") {
        s.text = s.text.slice(s.cursorPos);
        s.cursorPos = 0;
        return { value: Number(s.text) || 0, state: "active" };
      }

      if (
        key.name.length === 1 &&
        !key.ctrl &&
        !key.meta &&
        key.name !== "space"
      ) {
        if (isNumericChar(key.name, s.text, s.cursorPos)) {
          s.text =
            s.text.slice(0, s.cursorPos) + key.name + s.text.slice(s.cursorPos);
          s.cursorPos++;
          return { value: Number(s.text) || 0, state: "active" };
        }
        return undefined;
      }

      return undefined;
    },
    render(state: PromptState, value: number) {
      if (state === "submit") return `submitted:${value}`;
      if (state === "cancel") return "cancelled";
      if (state === "error") return `error:${s.error}`;
      return `number:${s.text}`;
    },
  });
}

describe("number", () => {
  it("accepts digits and submits as number", async () => {
    const streams = createTestStreams();
    const promise = testNumber({ message: "Age?" }, streams);
    streams.pressKey("4");
    streams.pressKey("2");
    streams.pressKey("return");
    expect(await promise).toBe(42);
  });

  it("accepts negative numbers", async () => {
    const streams = createTestStreams();
    const promise = testNumber({ message: "Temp?" }, streams);
    streams.pressKey("-");
    streams.pressKey("5");
    streams.pressKey("return");
    expect(await promise).toBe(-5);
  });

  it("accepts decimal numbers", async () => {
    const streams = createTestStreams();
    const promise = testNumber({ message: "Rate?" }, streams);
    streams.pressKey("3");
    streams.pressKey(".");
    streams.pressKey("1");
    streams.pressKey("4");
    streams.pressKey("return");
    expect(await promise).toBe(3.14);
  });

  it("rejects non-numeric characters", async () => {
    const streams = createTestStreams();
    const promise = testNumber({ message: "Count?" }, streams);
    streams.pressKey("a");
    streams.pressKey("b");
    streams.pressKey("5");
    streams.pressKey("return");
    expect(await promise).toBe(5);
  });

  it("rejects multiple decimal points", async () => {
    const streams = createTestStreams();
    const promise = testNumber({ message: "Val?" }, streams);
    streams.pressKey("1");
    streams.pressKey(".");
    streams.pressKey("2");
    streams.pressKey("."); // should be rejected
    streams.pressKey("3");
    streams.pressKey("return");
    expect(await promise).toBe(1.23);
  });

  it("rejects minus sign not at start", async () => {
    const streams = createTestStreams();
    const promise = testNumber({ message: "Val?" }, streams);
    streams.pressKey("5");
    streams.pressKey("-"); // should be rejected (not at position 0)
    streams.pressKey("return");
    expect(await promise).toBe(5);
  });

  it("increments with Up arrow", async () => {
    const streams = createTestStreams();
    const promise = testNumber({ message: "Count?", initialValue: 10 }, streams);
    streams.pressKey("up");
    streams.pressKey("return");
    expect(await promise).toBe(11);
  });

  it("decrements with Down arrow", async () => {
    const streams = createTestStreams();
    const promise = testNumber({ message: "Count?", initialValue: 10 }, streams);
    streams.pressKey("down");
    streams.pressKey("return");
    expect(await promise).toBe(9);
  });

  it("respects step value", async () => {
    const streams = createTestStreams();
    const promise = testNumber(
      { message: "Count?", initialValue: 0, step: 5 },
      streams,
    );
    streams.pressKey("up");
    streams.pressKey("up");
    streams.pressKey("return");
    expect(await promise).toBe(10);
  });

  it("clamps Up to max", async () => {
    const streams = createTestStreams();
    const promise = testNumber(
      { message: "Count?", initialValue: 9, max: 10 },
      streams,
    );
    streams.pressKey("up");
    streams.pressKey("up"); // should clamp to 10
    streams.pressKey("return");
    expect(await promise).toBe(10);
  });

  it("clamps Down to min", async () => {
    const streams = createTestStreams();
    const promise = testNumber(
      { message: "Count?", initialValue: 1, min: 0 },
      streams,
    );
    streams.pressKey("down");
    streams.pressKey("down"); // should clamp to 0
    streams.pressKey("return");
    expect(await promise).toBe(0);
  });

  it("validates min on submit", async () => {
    const streams = createTestStreams();
    const promise = testNumber(
      { message: "Count?", min: 5 },
      streams,
    );
    streams.pressKey("2");
    streams.pressKey("return"); // should fail validation
    // Fix by typing valid number
    streams.pressKey("backspace");
    streams.pressKey("7");
    streams.pressKey("return");
    expect(await promise).toBe(7);
  });

  it("validates max on submit", async () => {
    const streams = createTestStreams();
    const promise = testNumber(
      { message: "Count?", max: 10 },
      streams,
    );
    streams.pressKey("2");
    streams.pressKey("0");
    streams.pressKey("return"); // should fail
    streams.pressKey("backspace");
    streams.pressKey("backspace");
    streams.pressKey("5");
    streams.pressKey("return");
    expect(await promise).toBe(5);
  });

  it("validates with custom validator", async () => {
    const streams = createTestStreams();
    const promise = testNumber(
      {
        message: "Even?",
        validate: (v) => (v % 2 === 0 ? true : "Must be even"),
      },
      streams,
    );
    streams.pressKey("3");
    streams.pressKey("return"); // odd, should fail
    streams.pressKey("backspace");
    streams.pressKey("4");
    streams.pressKey("return");
    expect(await promise).toBe(4);
  });

  it("rejects empty submit", async () => {
    const streams = createTestStreams();
    const promise = testNumber({ message: "Val?" }, streams);
    streams.pressKey("return"); // empty, should fail
    streams.pressKey("1");
    streams.pressKey("return");
    expect(await promise).toBe(1);
  });

  it("cancels on Escape", async () => {
    const streams = createTestStreams();
    const promise = testNumber({ message: "Val?" }, streams);
    streams.pressKey("escape");
    expect(isCancel(await promise)).toBe(true);
  });

  it("cancels on Ctrl+C", async () => {
    const streams = createTestStreams();
    const promise = testNumber({ message: "Val?" }, streams);
    streams.pressKey("ctrl+c");
    expect(isCancel(await promise)).toBe(true);
  });

  it("uses initialValue", async () => {
    const streams = createTestStreams();
    const promise = testNumber(
      { message: "Val?", initialValue: 42 },
      streams,
    );
    streams.pressKey("return");
    expect(await promise).toBe(42);
  });

  it("supports backspace", async () => {
    const streams = createTestStreams();
    const promise = testNumber({ message: "Val?" }, streams);
    streams.pressKey("1");
    streams.pressKey("2");
    streams.pressKey("3");
    streams.pressKey("backspace");
    streams.pressKey("return");
    expect(await promise).toBe(12);
  });

  it("supports Ctrl+U to clear", async () => {
    const streams = createTestStreams();
    const promise = testNumber({ message: "Val?" }, streams);
    streams.pressKey("9");
    streams.pressKey("9");
    streams.pressKey("ctrl+u");
    streams.pressKey("5");
    streams.pressKey("return");
    expect(await promise).toBe(5);
  });
});
