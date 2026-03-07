import { stdout as defaultStdout } from "node:process";
import type { Writable } from "node:stream";
import { randomUUID } from "node:crypto";
import {
  cursor,
  erase,
  green,
  red,
  dim,
  S_STEP_SUBMIT,
  S_STEP_ERROR,
} from "./core/renderer.js";
import { getTheme } from "./theme.js";

const OSC_CODE = 7770;
const ESC = "\x1b";
const BEL = "\x07";

const BAR_WIDTH = 20;
const FILL_CHAR = "\u2588"; // █
const EMPTY_CHAR = "\u2591"; // ░

export type ProgressConfig = {
  output?: Writable;
};

export type Progress = {
  start: (message: string) => void;
  update: (percent: number, message?: string) => void;
  stop: (message?: string, code?: number) => void;
};

function emitOsc(
  output: Writable,
  payload: Record<string, unknown>,
): void {
  output.write(`${ESC}]${OSC_CODE};${JSON.stringify(payload)}${BEL}`);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function renderBar(percent: number): string {
  const filled = Math.round((percent / 100) * BAR_WIDTH);
  const empty = BAR_WIDTH - filled;
  return FILL_CHAR.repeat(filled) + EMPTY_CHAR.repeat(empty);
}

export function progress(config?: ProgressConfig): Progress {
  const output = config?.output ?? defaultStdout;
  let currentMessage = "";
  let currentPercent = 0;
  let active = false;
  let oscId: string | null = null;

  function render() {
    const bar = renderBar(currentPercent);
    const pct = `${Math.round(currentPercent)}%`;
    output.write(
      `\r${erase.line}${getTheme().accent(bar)}  ${currentMessage} ${dim(pct)}`,
    );
  }

  return {
    start(message: string) {
      if (active) return;
      active = true;
      currentMessage = message;
      currentPercent = 0;
      oscId = randomUUID();

      emitOsc(output, {
        v: 1,
        type: "progress",
        id: oscId,
        status: "start",
        message,
        percent: 0,
      });

      output.write(cursor.hide);
      render();
    },

    update(percent: number, message?: string) {
      if (!active) return;
      currentPercent = clamp(percent, 0, 100);
      if (message !== undefined) currentMessage = message;

      render();

      if (oscId) {
        emitOsc(output, {
          v: 1,
          type: "progress",
          id: oscId,
          status: "update",
          message: currentMessage,
          percent: currentPercent,
        });
      }
    },

    stop(message?: string, code?: number) {
      if (!active) return;
      active = false;

      const finalMessage = message ?? currentMessage;
      const isError = code !== undefined && code !== 0;
      const icon = isError ? red(S_STEP_ERROR) : green(S_STEP_SUBMIT);

      output.write(`\r${erase.line}${icon}  ${finalMessage}\n`);
      output.write(cursor.show);

      if (oscId) {
        emitOsc(output, {
          v: 1,
          type: "progress",
          id: oscId,
          status: "stop",
          message: finalMessage,
          percent: currentPercent,
          code: code ?? 0,
        });
        oscId = null;
      }
    },
  };
}
