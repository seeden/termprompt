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
});
