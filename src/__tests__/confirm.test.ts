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
        left: Buffer.from("\x1b[D"),
        right: Buffer.from("\x1b[C"),
        return: Buffer.from("\r"),
        escape: Buffer.from("\x1b"),
        "ctrl+c": Buffer.from("\x03"),
        tab: Buffer.from("\t"),
      };
      input.write(keyMap[name] ?? Buffer.from(name));
    },
  };
}

function testConfirm(
  config: {
    message: string;
    initialValue?: boolean;
    active?: string;
    inactive?: string;
  },
  streams: ReturnType<typeof createTestStreams>,
) {
  const {
    message,
    initialValue = false,
    active = "Yes",
    inactive = "No",
  } = config;

  return createPrompt<boolean>({
    initialValue,
    input: streams.input,
    output: streams.output,
    osc: {
      v: 1,
      type: "confirm",
      id: generatePromptId(),
      message,
      active,
      inactive,
    },
    onKey(key: KeyPress, current: { value: boolean; state: PromptState }) {
      if (
        key.name === "left" ||
        key.name === "right" ||
        key.name === "h" ||
        key.name === "l" ||
        key.name === "tab"
      ) {
        return { value: !current.value, state: "active" };
      }
      if (key.name === "y" || key.name === "Y") {
        return { value: true, state: "active" };
      }
      if (key.name === "n" || key.name === "N") {
        return { value: false, state: "active" };
      }
      if (key.name === "return") {
        return { value: current.value, state: "submit" };
      }
      if (key.name === "escape") {
        return { value: current.value, state: "cancel" };
      }
      return undefined;
    },
    render(state: PromptState, value: boolean) {
      if (state === "submit") return `confirmed:${value}`;
      if (state === "cancel") return "cancelled";
      return `${message}: ${value ? active : inactive}`;
    },
  });
}

describe("confirm", () => {
  it("defaults to false", async () => {
    const streams = createTestStreams();
    const promise = testConfirm({ message: "Continue?" }, streams);
    streams.pressKey("return");
    expect(await promise).toBe(false);
  });

  it("respects initialValue true", async () => {
    const streams = createTestStreams();
    const promise = testConfirm(
      { message: "Continue?", initialValue: true },
      streams,
    );
    streams.pressKey("return");
    expect(await promise).toBe(true);
  });

  it("toggles with left arrow", async () => {
    const streams = createTestStreams();
    const promise = testConfirm({ message: "Continue?" }, streams);
    streams.pressKey("left"); // false -> true
    streams.pressKey("return");
    expect(await promise).toBe(true);
  });

  it("toggles with right arrow", async () => {
    const streams = createTestStreams();
    const promise = testConfirm(
      { message: "Continue?", initialValue: true },
      streams,
    );
    streams.pressKey("right"); // true -> false
    streams.pressKey("return");
    expect(await promise).toBe(false);
  });

  it("y sets to true", async () => {
    const streams = createTestStreams();
    const promise = testConfirm({ message: "Continue?" }, streams);
    streams.pressKey("y");
    streams.pressKey("return");
    expect(await promise).toBe(true);
  });

  it("n sets to false", async () => {
    const streams = createTestStreams();
    const promise = testConfirm(
      { message: "Continue?", initialValue: true },
      streams,
    );
    streams.pressKey("n");
    streams.pressKey("return");
    expect(await promise).toBe(false);
  });

  it("toggles with tab", async () => {
    const streams = createTestStreams();
    const promise = testConfirm({ message: "Continue?" }, streams);
    streams.pressKey("tab");
    streams.pressKey("return");
    expect(await promise).toBe(true);
  });

  it("cancels on Escape", async () => {
    const streams = createTestStreams();
    const promise = testConfirm({ message: "Continue?" }, streams);
    streams.pressKey("escape");
    expect(isCancel(await promise)).toBe(true);
  });

  it("cancels on Ctrl+C", async () => {
    const streams = createTestStreams();
    const promise = testConfirm({ message: "Continue?" }, streams);
    streams.pressKey("ctrl+c");
    expect(isCancel(await promise)).toBe(true);
  });
});
