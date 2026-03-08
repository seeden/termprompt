import { randomUUID } from "node:crypto";
import { OSC_PREFIX, BEL, ESC } from "@termprompt/protocol";

// Re-export protocol encode functions for internal use
export { encodePrompt, encodeResolve } from "@termprompt/protocol";

export function generatePromptId(): string {
  return randomUUID();
}

export function parseOscResolve(
  data: string,
  promptId: string,
): unknown | null {
  const start = data.indexOf(OSC_PREFIX);
  if (start === -1) return null;

  const jsonStart = start + OSC_PREFIX.length;

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
