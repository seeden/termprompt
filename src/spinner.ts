import { stdout as defaultStdout } from "node:process";
import type { Writable } from "node:stream";
import { randomUUID } from "node:crypto";
import {
  cursor,
  erase,
  green,
  red,
  yellow,
  gray,
  S_BAR,
  S_STEP_SUBMIT,
  S_STEP_ERROR,
} from "./core/renderer.js";
import { getTheme } from "./theme.js";

const OSC_CODE = 7770;
const ESC = "\x1b";
const BEL = "\x07";

const SPINNER_FRAMES = ["◒", "◐", "◓", "◑"];
const SPINNER_INTERVAL = 80;

export type SpinnerConfig = {
  output?: Writable;
};

export type Spinner = {
  start: (message: string) => void;
  stop: (message?: string, code?: number) => void;
  message: (text: string) => void;
};

function emitOsc(
  output: Writable,
  payload: Record<string, unknown>,
): void {
  output.write(`${ESC}]${OSC_CODE};${JSON.stringify(payload)}${BEL}`);
}

export function spinner(config?: SpinnerConfig): Spinner {
  const output = config?.output ?? defaultStdout;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let frameIndex = 0;
  let currentMessage = "";
  let active = false;
  let oscId: string | null = null;

  function render() {
    const frame = SPINNER_FRAMES[frameIndex % SPINNER_FRAMES.length]!;
    frameIndex++;
    output.write(`\r${erase.line}${getTheme().accent(frame)}  ${currentMessage}`);
  }

  return {
    start(message: string) {
      if (active) return;
      active = true;
      currentMessage = message;
      frameIndex = 0;
      oscId = randomUUID();

      emitOsc(output, {
        v: 1,
        type: "spinner",
        id: oscId,
        status: "start",
        message,
      });

      output.write(cursor.hide);
      render();
      intervalId = setInterval(render, SPINNER_INTERVAL);
    },

    stop(message?: string, code?: number) {
      if (!active) return;
      active = false;

      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }

      const finalMessage = message ?? currentMessage;
      const isError = code !== undefined && code !== 0;
      const icon = isError ? red(S_STEP_ERROR) : green(S_STEP_SUBMIT);

      output.write(`\r${erase.line}${icon}  ${finalMessage}\n`);
      output.write(cursor.show);

      if (oscId) {
        emitOsc(output, {
          v: 1,
          type: "spinner",
          id: oscId,
          status: "stop",
          message: finalMessage,
          code: code ?? 0,
        });
        oscId = null;
      }
    },

    message(text: string) {
      currentMessage = text;

      if (oscId) {
        emitOsc(output, {
          v: 1,
          type: "spinner",
          id: oscId,
          status: "update",
          message: text,
        });
      }
    },
  };
}
