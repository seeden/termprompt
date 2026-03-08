import { BEL, OSC_CODE, ESC } from "./constants.js";
import type { OscPromptPayload, OscResolvePayload } from "./types.js";

export function wrapOsc(json: string): string {
  return `${ESC}]${OSC_CODE};${json}${BEL}`;
}

export function encodePrompt(payload: OscPromptPayload): string {
  return wrapOsc(JSON.stringify(payload));
}

export function encodeResolve(id: string, value: unknown): string {
  const payload: OscResolvePayload = { v: 1, type: "resolve", id, value };
  return wrapOsc(JSON.stringify(payload));
}
