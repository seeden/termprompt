import { stdout as defaultStdout } from "node:process";
import type { Writable } from "node:stream";
import {
  S_BAR,
  S_BAR_START,
  S_BAR_END,
  S_STEP_SUBMIT,
  S_STEP_ERROR,
  cyan,
  green,
  yellow,
  red,
  gray,
  dim,
  bold,
  blue,
} from "./core/renderer.js";

const OSC_CODE = 7770;
const ESC = "\x1b";
const BEL = "\x07";

let output: Writable = defaultStdout;

function emitOsc(payload: Record<string, unknown>): void {
  output.write(`${ESC}]${OSC_CODE};${JSON.stringify(payload)}${BEL}`);
}

function writeLine(icon: string, text: string, oscLevel?: string): void {
  output.write(`${icon}  ${text}\n`);
  if (oscLevel) {
    emitOsc({ v: 1, type: "log", level: oscLevel, message: text });
  }
}

export function setOutput(writable: Writable): void {
  output = writable;
}

export function intro(title?: string): void {
  if (title) {
    output.write(`${gray(S_BAR_START)}  ${bold(title)}\n`);
  } else {
    output.write(`${gray(S_BAR_START)}\n`);
  }
  emitOsc({ v: 1, type: "log", level: "intro", message: title ?? "" });
}

export function outro(message?: string): void {
  if (message) {
    output.write(`${gray(S_BAR_END)}  ${message}\n`);
  } else {
    output.write(`${gray(S_BAR_END)}\n`);
  }
  output.write("\n");
  emitOsc({ v: 1, type: "log", level: "outro", message: message ?? "" });
}

export function note(message: string, title?: string): void {
  const lines = message.split("\n");
  const maxLen = Math.max(
    ...lines.map((l) => l.length),
    title ? title.length : 0,
  );
  const bar = "\u2500".repeat(maxLen + 2);

  output.write(`${gray(S_BAR)}\n`);
  if (title) {
    output.write(`${gray(S_BAR)}  ${green(bar)}\n`);
    output.write(`${gray(S_BAR)}  ${green(bold(title))}\n`);
  } else {
    output.write(`${gray(S_BAR)}  ${gray(bar)}\n`);
  }
  for (const line of lines) {
    output.write(`${gray(S_BAR)}  ${dim(line)}\n`);
  }
  output.write(`${gray(S_BAR)}  ${gray(bar)}\n`);

  emitOsc({
    v: 1,
    type: "log",
    level: "note",
    message,
    title: title ?? null,
  });
}

export const log = {
  info(message: string): void {
    writeLine(blue("\u2139"), message, "info");
  },

  success(message: string): void {
    writeLine(green(S_STEP_SUBMIT), message, "success");
  },

  warn(message: string): void {
    writeLine(yellow(S_STEP_ERROR), message, "warn");
  },

  error(message: string): void {
    writeLine(red(S_STEP_ERROR), message, "error");
  },

  step(message: string): void {
    writeLine(gray(S_BAR), message, "step");
  },

  message(message: string): void {
    output.write(`${gray(S_BAR)}  ${message}\n`);
  },
};
