import { randomUUID } from "node:crypto";
import { createOscParser } from "@termprompt/protocol";

// Re-export protocol encode functions for internal use
export { encodePrompt, encodeResolve } from "@termprompt/protocol";

export function generatePromptId(): string {
  return randomUUID();
}

export function parseOscResolve(
  data: string,
  promptId: string,
): unknown | null {
  const parser = createOscParser();
  const { messages } = parser.write(data);

  for (const message of messages) {
    const payload = message.payload;
    if (payload.type === "resolve" && payload.id === promptId) {
      return payload.value;
    }
  }

  return null;
}
