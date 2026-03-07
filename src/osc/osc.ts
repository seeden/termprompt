import { randomUUID } from "node:crypto";
import type { OscPromptPayload, OscResolvePayload } from "../types.js";

const OSC_CODE = 7770;
const ESC = "\x1b";
const BEL = "\x07";

function wrapOsc(json: string): string {
  return `${ESC}]${OSC_CODE};${json}${BEL}`;
}

export function encodePrompt(payload: OscPromptPayload): string {
  return wrapOsc(JSON.stringify(payload));
}

export function encodeResolve(id: string, value: unknown): string {
  const payload: OscResolvePayload = { v: 1, type: "resolve", id, value };
  return wrapOsc(JSON.stringify(payload));
}

export function generatePromptId(): string {
  return randomUUID();
}

export function parseOscResolve(
  data: string,
  promptId: string,
): unknown | null {
  const prefix = `${ESC}]${OSC_CODE};`;
  const start = data.indexOf(prefix);
  if (start === -1) return null;

  const jsonStart = start + prefix.length;

  let jsonEnd = data.indexOf(BEL, jsonStart);
  if (jsonEnd === -1) {
    jsonEnd = data.indexOf(`${ESC}\\`, jsonStart);
  }
  if (jsonEnd === -1) return null;

  try {
    const payload = JSON.parse(data.slice(jsonStart, jsonEnd)) as Record<
      string,
      unknown
    >;
    if (payload.v !== 1 || payload.type !== "resolve" || payload.id !== promptId)
      return null;
    return payload.value;
  } catch {
    return null;
  }
}
