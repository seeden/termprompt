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
        "ctrl+c": Buffer.from("\x03"),
        space: Buffer.from(" "),
      };
      input.write(keyMap[name] ?? Buffer.from(name));
    },
  };
}

function testPassword(
  config: {
    message: string;
    mask?: string;
    validate?: (value: string) => true | string;
  },
  streams: ReturnType<typeof createTestStreams>,
) {
  const { message, mask = "\u2022", validate } = config;
  const s = { text: "", error: null as string | null };

  return createPrompt<string>({
    initialValue: "",
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
        if (s.text.length > 0) s.text = s.text.slice(0, -1);
        return { value: s.text, state: "active" };
      }
      if (key.name === "space") {
        s.text += " ";
        return { value: s.text, state: "active" };
      }
      if (key.name.length === 1 && !key.ctrl && !key.meta) {
        s.text += key.name;
        return { value: s.text, state: "active" };
      }
      return undefined;
    },
    render(state: PromptState, value: string) {
      if (state === "submit") return `submitted:${mask.repeat(value.length)}`;
      if (state === "cancel") return "cancelled";
      if (state === "error") return `error:${s.error}`;
      return `password:${mask.repeat(s.text.length)}`;
    },
  });
}

describe("password", () => {
  it("submits typed text", async () => {
    const streams = createTestStreams();
    const promise = testPassword({ message: "Password?" }, streams);
    streams.pressKey("s");
    streams.pressKey("e");
    streams.pressKey("c");
    streams.pressKey("r");
    streams.pressKey("e");
    streams.pressKey("t");
    streams.pressKey("return");
    expect(await promise).toBe("secret");
  });

  it("handles backspace", async () => {
    const streams = createTestStreams();
    const promise = testPassword({ message: "Password?" }, streams);
    streams.pressKey("a");
    streams.pressKey("b");
    streams.pressKey("backspace");
    streams.pressKey("c");
    streams.pressKey("return");
    expect(await promise).toBe("ac");
  });

  it("renders masked output", async () => {
    const streams = createTestStreams();
    const promise = testPassword({ message: "Password?" }, streams);
    streams.pressKey("a");
    streams.pressKey("b");
    streams.pressKey("c");
    streams.pressKey("return");
    await promise;
    expect(streams.getOutput()).toContain("\u2022\u2022\u2022");
  });

  it("uses custom mask character", async () => {
    const streams = createTestStreams();
    const promise = testPassword({ message: "Password?", mask: "*" }, streams);
    streams.pressKey("a");
    streams.pressKey("b");
    streams.pressKey("return");
    await promise;
    expect(streams.getOutput()).toContain("**");
  });

  it("validates on submit", async () => {
    const streams = createTestStreams();
    const promise = testPassword(
      {
        message: "Password?",
        validate: (v) => (v.length >= 3 ? true : "Too short"),
      },
      streams,
    );
    streams.pressKey("a");
    streams.pressKey("return"); // too short
    streams.pressKey("b");
    streams.pressKey("c");
    streams.pressKey("return"); // now valid
    expect(await promise).toBe("abc");
  });

  it("cancels on Escape", async () => {
    const streams = createTestStreams();
    const promise = testPassword({ message: "Password?" }, streams);
    streams.pressKey("escape");
    expect(isCancel(await promise)).toBe(true);
  });

  it("cancels on Ctrl+C", async () => {
    const streams = createTestStreams();
    const promise = testPassword({ message: "Password?" }, streams);
    streams.pressKey("ctrl+c");
    expect(isCancel(await promise)).toBe(true);
  });

  it("handles space in password", async () => {
    const streams = createTestStreams();
    const promise = testPassword({ message: "Password?" }, streams);
    streams.pressKey("a");
    streams.pressKey("space");
    streams.pressKey("b");
    streams.pressKey("return");
    expect(await promise).toBe("a b");
  });
});
