import { ESC, BEL, OSC_PREFIX } from "./constants.js";
import type { OscPayload } from "./types.js";

export type OscMessage = {
  raw: string;
  payload: OscPayload;
};

export type OscParseResult = {
  messages: OscMessage[];
  output: string;
};

export type OscParser = {
  write(data: string): OscParseResult;
};

export function createOscParser(): OscParser {
  let buffer = "";

  return {
    write(data: string): OscParseResult {
      buffer += data;

      const messages: OscMessage[] = [];
      let output = "";
      let pos = 0;

      while (pos < buffer.length) {
        const seqStart = buffer.indexOf(OSC_PREFIX, pos);

        if (seqStart === -1) {
          // No more sequences. Check if buffer ends with a partial ESC or OSC_PREFIX.
          // Keep potential partial prefix in buffer for next write().
          const trailingEsc = findPartialPrefix(buffer, pos);
          if (trailingEsc === -1) {
            output += buffer.slice(pos);
            buffer = "";
          } else {
            output += buffer.slice(pos, trailingEsc);
            buffer = buffer.slice(trailingEsc);
          }
          return { messages, output };
        }

        // Append text before the sequence
        output += buffer.slice(pos, seqStart);

        const jsonStart = seqStart + OSC_PREFIX.length;

        // Look for BEL terminator
        let jsonEnd = buffer.indexOf(BEL, jsonStart);
        let seqEnd = jsonEnd === -1 ? -1 : jsonEnd + BEL.length;

        // Try ST terminator (ESC \)
        if (jsonEnd === -1) {
          const stPos = buffer.indexOf(`${ESC}\\`, jsonStart);
          if (stPos !== -1) {
            jsonEnd = stPos;
            seqEnd = stPos + 2;
          }
        }

        if (jsonEnd === -1) {
          // Incomplete sequence, keep in buffer for next write()
          buffer = buffer.slice(seqStart);
          return { messages, output };
        }

        const jsonStr = buffer.slice(jsonStart, jsonEnd);
        const raw = buffer.slice(seqStart, seqEnd);

        try {
          const payload = JSON.parse(jsonStr) as Record<string, unknown>;
          if (payload.v === 1 && typeof payload.type === "string") {
            messages.push({ raw, payload: payload as OscPayload });
          }
          // Invalid payload (wrong version or missing type): strip but don't emit
        } catch {
          // Malformed JSON: strip the sequence silently
        }

        pos = seqEnd;
      }

      buffer = "";
      return { messages, output };
    },
  };
}

/**
 * Find the start of a potential partial OSC_PREFIX at the end of the buffer.
 * Returns the index where the partial starts, or -1 if none found.
 */
function findPartialPrefix(data: string, from: number): number {
  // Check if the buffer ends with a partial match of OSC_PREFIX
  // OSC_PREFIX is ESC ] 7770 ; (6 chars)
  for (let i = Math.max(from, data.length - OSC_PREFIX.length + 1); i < data.length; i++) {
    const tail = data.slice(i);
    if (OSC_PREFIX.startsWith(tail)) {
      return i;
    }
  }
  return -1;
}
