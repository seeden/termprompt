import { stdin as defaultStdin, stdout as defaultStdout } from "node:process";
import type { Readable, Writable } from "node:stream";
import type { KeyPress, PromptState, OscPromptPayload } from "../types.js";
import { CANCEL, type Cancel } from "../symbols.js";
import { parseKey } from "./keyboard.js";
import { cursor, erase, lineCount } from "./renderer.js";
import { encodePrompt, parseOscResolve } from "../osc/osc.js";

export type OnKeyResult<T> = { value: T; state: PromptState } | undefined;

export type PromptOptions<T> = {
  render: (state: PromptState, value: T) => string;
  onKey: (
    key: KeyPress,
    current: { value: T; state: PromptState },
  ) => OnKeyResult<T>;
  initialValue: T;
  osc?: OscPromptPayload;
  input?: Readable;
  output?: Writable;
};

export function createPrompt<T>(options: PromptOptions<T>): Promise<T | Cancel> {
  const {
    render,
    onKey,
    initialValue,
    osc,
    input = defaultStdin,
    output = defaultStdout,
  } = options;

  return new Promise<T | Cancel>((resolve: (value: T | Cancel) => void) => {
    let value = initialValue;
    let state: PromptState = "active";
    let prevFrameLines = 0;
    let resolved = false;

    const isTTY =
      "setRawMode" in input &&
      typeof (input as NodeJS.ReadStream).setRawMode === "function";

    function renderFrame() {
      const frame = render(state, value);

      if (prevFrameLines > 0) {
        output.write(cursor.up(prevFrameLines - 1));
        output.write("\r");
        output.write(erase.toEnd);
      }

      output.write(frame);
      prevFrameLines = lineCount(frame);
    }

    function cleanup() {
      output.write(cursor.show);
      if (isTTY) {
        (input as NodeJS.ReadStream).setRawMode(false);
      }
      input.removeListener("data", onData);
      if (input !== defaultStdin) {
        input.pause();
      }
      process.removeListener("exit", onExit);
    }

    function finish(result: T | Cancel) {
      if (resolved) return;
      resolved = true;

      cleanup();
      renderFrame();
      output.write("\n");
      resolve(result);
    }

    function onExit() {
      if (!resolved) {
        output.write(cursor.show);
        if (isTTY) {
          (input as NodeJS.ReadStream).setRawMode(false);
        }
      }
    }

    function onData(data: Buffer) {
      // Check for OSC resolve from terminal host
      if (osc) {
        const oscValue = parseOscResolve(data.toString("utf8"), osc.id);
        if (oscValue !== null) {
          value = oscValue as T;
          state = "submit";
          finish(value);
          return;
        }
      }

      const key = parseKey(data);

      if (key.ctrl && key.name === "c") {
        state = "cancel";
        finish(CANCEL);
        return;
      }

      const result = onKey(key, { value, state });
      if (result) {
        value = result.value;
        state = result.state;

        if (state === "submit") {
          finish(value);
          return;
        }
        if (state === "cancel") {
          finish(CANCEL);
          return;
        }
      }

      renderFrame();
    }

    // Start prompt
    output.write(cursor.hide);

    if (osc) {
      output.write(encodePrompt(osc));
    }

    renderFrame();

    process.on("exit", onExit);

    if (isTTY) {
      (input as NodeJS.ReadStream).setRawMode(true);
    }
    input.resume();
    input.on("data", onData);
  });
}
