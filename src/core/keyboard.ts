import type { KeyPress } from "../types.js";

export function parseKey(data: Buffer): KeyPress {
  const raw = data.toString("utf8");
  const base: KeyPress = { name: "", ctrl: false, meta: false, shift: false, raw };

  if (data.length === 1) {
    const byte = data[0]!;

    if (byte === 0x03) return { ...base, name: "c", ctrl: true };
    if (byte === 0x04) return { ...base, name: "d", ctrl: true };
    if (byte === 0x0d || byte === 0x0a) return { ...base, name: "return" };
    if (byte === 0x09) return { ...base, name: "tab" };
    if (byte === 0x7f || byte === 0x08) return { ...base, name: "backspace" };
    if (byte === 0x1b) return { ...base, name: "escape" };
    if (byte === 0x20) return { ...base, name: "space" };

    // Ctrl+A through Ctrl+Z (0x01-0x1A, excluding already handled)
    if (byte >= 0x01 && byte <= 0x1a) {
      return { ...base, name: String.fromCharCode(byte + 96), ctrl: true };
    }

    // Printable ASCII
    if (byte >= 0x21 && byte < 0x7f) {
      return { ...base, name: raw };
    }
  }

  // CSI sequences (ESC [ ...)
  if (data.length >= 3 && data[0] === 0x1b && data[1] === 0x5b) {
    const seq = raw.slice(2);

    // Arrow keys
    if (seq === "A") return { ...base, name: "up" };
    if (seq === "B") return { ...base, name: "down" };
    if (seq === "C") return { ...base, name: "right" };
    if (seq === "D") return { ...base, name: "left" };

    // Home / End
    if (seq === "H" || seq === "1~") return { ...base, name: "home" };
    if (seq === "F" || seq === "4~") return { ...base, name: "end" };

    // Delete
    if (seq === "3~") return { ...base, name: "delete" };

    // Shift+Tab
    if (seq === "Z") return { ...base, name: "tab", shift: true };

    // Ctrl+Arrow
    if (seq.startsWith("1;5")) {
      const dir = seq[3];
      if (dir === "A") return { ...base, name: "up", ctrl: true };
      if (dir === "B") return { ...base, name: "down", ctrl: true };
      if (dir === "C") return { ...base, name: "right", ctrl: true };
      if (dir === "D") return { ...base, name: "left", ctrl: true };
    }

    // Shift+Arrow
    if (seq.startsWith("1;2")) {
      const dir = seq[3];
      if (dir === "A") return { ...base, name: "up", shift: true };
      if (dir === "B") return { ...base, name: "down", shift: true };
      if (dir === "C") return { ...base, name: "right", shift: true };
      if (dir === "D") return { ...base, name: "left", shift: true };
    }
  }

  // Meta/Alt sequences (ESC + char)
  if (data.length === 2 && data[0] === 0x1b) {
    return { ...base, name: String.fromCharCode(data[1]!), meta: true };
  }

  // Multi-byte UTF-8 (emoji, CJK, etc.)
  if (data.length > 1 && data[0] !== 0x1b) {
    return { ...base, name: raw };
  }

  return { ...base, name: raw };
}
