import { describe, it, expect } from "vitest";
import { PassThrough } from "node:stream";
import { createPrompt } from "../core/prompt.js";
import { isCancel } from "../symbols.js";
import { encodeResolve } from "../osc/osc.js";
import type { PromptState } from "../types.js";

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

describe("createPrompt", () => {
  it("renders initial frame", async () => {
    const { input, output, getOutput, pressKey } = createTestStreams();

    const promise = createPrompt({
      render: (state: PromptState) => `[${state}]`,
      onKey: () => undefined,
      initialValue: "test",
      input,
      output,
    });

    pressKey("ctrl+c");
    await promise;

    expect(getOutput()).toContain("[active]");
  });

  it("resolves with value on submit", async () => {
    const { input, output, pressKey } = createTestStreams();

    const promise = createPrompt({
      render: (state: PromptState, value: string) => `[${state}:${value}]`,
      onKey: (_key, current) => {
        if (_key.name === "return") {
          return { value: current.value, state: "submit" };
        }
        return undefined;
      },
      initialValue: "hello",
      input,
      output,
    });

    pressKey("return");
    const result = await promise;

    expect(result).toBe("hello");
  });

  it("returns CANCEL on Ctrl+C", async () => {
    const { input, output, pressKey } = createTestStreams();

    const promise = createPrompt({
      render: () => "prompt",
      onKey: () => undefined,
      initialValue: "test",
      input,
      output,
    });

    pressKey("ctrl+c");
    const result = await promise;

    expect(isCancel(result)).toBe(true);
  });

  it("re-renders on key press", async () => {
    const { input, output, getOutput, pressKey } = createTestStreams();
    let counter = 0;

    const promise = createPrompt({
      render: () => `frame-${counter}`,
      onKey: (_key, current) => {
        if (_key.name === "return") {
          return { value: current.value, state: "submit" };
        }
        counter++;
        return { value: current.value, state: "active" };
      },
      initialValue: null,
      input,
      output,
    });

    pressKey("a");
    pressKey("return");
    await promise;

    const out = getOutput();
    expect(out).toContain("frame-0");
    expect(out).toContain("frame-1");
  });

  it("hides cursor at start and shows at end", async () => {
    const { input, output, getOutput, pressKey } = createTestStreams();

    const promise = createPrompt({
      render: () => "prompt",
      onKey: () => undefined,
      initialValue: null,
      input,
      output,
    });

    pressKey("ctrl+c");
    await promise;

    const out = getOutput();
    expect(out).toContain("\x1b[?25l"); // hide
    expect(out).toContain("\x1b[?25h"); // show
  });

  it("emits OSC prompt payload", async () => {
    const { input, output, getOutput, pressKey } = createTestStreams();

    const promise = createPrompt({
      render: () => "prompt",
      onKey: () => undefined,
      initialValue: null,
      osc: {
        v: 1,
        type: "select",
        id: "test-prompt",
        message: "Pick",
        options: [{ value: "a", label: "A" }],
      },
      input,
      output,
    });

    pressKey("ctrl+c");
    await promise;

    const out = getOutput();
    expect(out).toContain("\x1b]7770;");
    expect(out).toContain('"id":"test-prompt"');
  });

  it("resolves via OSC resolve from terminal host", async () => {
    const { input, output } = createTestStreams();

    const promise = createPrompt({
      render: () => "prompt",
      onKey: () => undefined,
      initialValue: "default",
      osc: {
        v: 1,
        type: "select",
        id: "osc-test",
        message: "Pick",
      },
      input,
      output,
    });

    // Simulate terminal host sending OSC resolve
    const resolveData = encodeResolve("osc-test", "host-picked");
    input.write(Buffer.from(resolveData));

    const result = await promise;
    expect(result).toBe("host-picked");
  });

  it("emits OSC resolve when TUI submit completes", async () => {
    const { input, output, getOutput, pressKey } = createTestStreams();

    const promise = createPrompt({
      render: () => "prompt",
      onKey: (key, current) => {
        if (key.name === "return") {
          return { value: current.value, state: "submit" };
        }
        return undefined;
      },
      initialValue: "local-picked",
      osc: {
        v: 1,
        type: "select",
        id: "tui-submit",
        message: "Pick",
      },
      input,
      output,
    });

    pressKey("return");
    const result = await promise;

    expect(result).toBe("local-picked");
    const out = getOutput();
    expect(out).toContain('"type":"resolve"');
    expect(out).toContain('"id":"tui-submit"');
    expect(out).toContain('"value":"local-picked"');
  });

  it("does not emit OSC resolve when prompt is sensitive", async () => {
    const { input, output, getOutput, pressKey } = createTestStreams();

    const promise = createPrompt({
      render: () => "prompt",
      onKey: (key, current) => {
        if (key.name === "return") {
          return { value: current.value, state: "submit" };
        }
        return undefined;
      },
      initialValue: "super-secret",
      osc: {
        v: 1,
        type: "input",
        id: "sensitive-submit",
        message: "Password?",
        sensitive: true,
      },
      input,
      output,
    });

    pressKey("return");
    const result = await promise;

    expect(result).toBe("super-secret");
    const out = getOutput();
    expect(out).not.toContain('"type":"resolve"');
    expect(out).not.toContain("super-secret");
  });

  it("emits OSC resolve with structured values on TUI submit", async () => {
    const { input, output, getOutput, pressKey } = createTestStreams();
    const resolvedValue = { id: 7, tags: ["a", "b"] };

    const promise = createPrompt({
      render: () => "prompt",
      onKey: (key, current) => {
        if (key.name === "return") {
          return { value: current.value, state: "submit" };
        }
        return undefined;
      },
      initialValue: resolvedValue,
      osc: {
        v: 1,
        type: "select",
        id: "tui-structured",
        message: "Pick",
      },
      input,
      output,
    });

    pressKey("return");
    const result = await promise;

    expect(result).toEqual(resolvedValue);
    const out = getOutput();
    expect(out).toContain('"type":"resolve"');
    expect(out).toContain('"id":"tui-structured"');
    expect(out).toContain('"value":{"id":7,"tags":["a","b"]}');
  });

  it("does not emit OSC resolve for host-resolved prompts", async () => {
    const { input, output, getOutput } = createTestStreams();

    const promise = createPrompt({
      render: () => "prompt",
      onKey: () => undefined,
      initialValue: "default",
      osc: {
        v: 1,
        type: "select",
        id: "host-submit",
        message: "Pick",
      },
      input,
      output,
    });

    input.write(Buffer.from(encodeResolve("host-submit", "host-picked")));
    const result = await promise;

    expect(result).toBe("host-picked");
    expect(getOutput()).not.toContain('"type":"resolve"');
  });

  it("ignores host OSC resolve for sensitive prompts", async () => {
    const { input, output, getOutput, pressKey } = createTestStreams();

    const promise = createPrompt({
      render: () => "prompt",
      onKey: (key, current) => {
        if (key.name === "return") {
          return { value: current.value, state: "submit" };
        }
        return undefined;
      },
      initialValue: "typed-secret",
      osc: {
        v: 1,
        type: "input",
        id: "sensitive-host",
        message: "Password?",
        sensitive: true,
      },
      input,
      output,
    });

    input.write(Buffer.from(encodeResolve("sensitive-host", "host-secret")));
    pressKey("return");
    const result = await promise;

    expect(result).toBe("typed-secret");
    expect(getOutput()).not.toContain('"value":"host-secret"');
    expect(getOutput()).not.toContain('"type":"resolve"');
  });

  it("does not emit OSC resolve when prompt is cancelled", async () => {
    const { input, output, getOutput, pressKey } = createTestStreams();

    const promise = createPrompt({
      render: () => "prompt",
      onKey: (key, current) => {
        if (key.name === "escape") {
          return { value: current.value, state: "cancel" };
        }
        return undefined;
      },
      initialValue: "default",
      osc: {
        v: 1,
        type: "input",
        id: "cancelled",
        message: "Name?",
      },
      input,
      output,
    });

    pressKey("escape");
    await promise;

    expect(getOutput()).not.toContain('"type":"resolve"');
  });

  it("ignores invalid host resolve values", async () => {
    const { input, output, pressKey } = createTestStreams();

    const promise = createPrompt({
      render: () => "prompt",
      onKey: (key, current) => {
        if (key.name === "return") {
          return { value: current.value, state: "submit" };
        }
        return undefined;
      },
      parseOscResolveValue(value: unknown) {
        if (typeof value !== "string") {
          throw new Error("Resolve value must be string");
        }
        return value;
      },
      initialValue: "fallback",
      osc: {
        v: 1,
        type: "input",
        id: "validate-host",
        message: "Name?",
      },
      input,
      output,
    });

    input.write(Buffer.from(encodeResolve("validate-host", 42)));
    pressKey("return");
    const result = await promise;

    expect(result).toBe("fallback");
  });

  it("resolves when host OSC arrives split across chunks", async () => {
    const { input, output } = createTestStreams();

    const promise = createPrompt({
      render: () => "prompt",
      onKey: () => undefined,
      initialValue: "default",
      osc: {
        v: 1,
        type: "select",
        id: "chunked-host",
        message: "Pick",
      },
      input,
      output,
    });

    const resolveData = encodeResolve("chunked-host", "chunked-value");
    const mid = Math.floor(resolveData.length / 2);
    input.write(Buffer.from(resolveData.slice(0, mid)));
    input.write(Buffer.from(resolveData.slice(mid)));

    const result = await promise;
    expect(result).toBe("chunked-value");
  });

  it("finds matching resolve when other OSC messages are in the same chunk", async () => {
    const { input, output } = createTestStreams();

    const promise = createPrompt({
      render: () => "prompt",
      onKey: () => undefined,
      initialValue: "default",
      osc: {
        v: 1,
        type: "select",
        id: "mixed-osc",
        message: "Pick",
      },
      input,
      output,
    });

    const logOsc =
      '\x1b]7770;{"v":1,"type":"log","level":"info","message":"info"}\x07';
    const resolveOsc = encodeResolve("mixed-osc", "resolved");
    input.write(Buffer.from(`${logOsc}${resolveOsc}`));

    const result = await promise;
    expect(result).toBe("resolved");
  });
});
