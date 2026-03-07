import { describe, it, expect } from "vitest";
import { parseKey } from "../core/keyboard.js";

describe("parseKey", () => {
  it("parses Ctrl+C", () => {
    const key = parseKey(Buffer.from([0x03]));
    expect(key.name).toBe("c");
    expect(key.ctrl).toBe(true);
  });

  it("parses Ctrl+D", () => {
    const key = parseKey(Buffer.from([0x04]));
    expect(key.name).toBe("d");
    expect(key.ctrl).toBe(true);
  });

  it("parses Enter (CR)", () => {
    const key = parseKey(Buffer.from([0x0d]));
    expect(key.name).toBe("return");
  });

  it("parses Enter (LF)", () => {
    const key = parseKey(Buffer.from([0x0a]));
    expect(key.name).toBe("return");
  });

  it("parses Tab", () => {
    const key = parseKey(Buffer.from([0x09]));
    expect(key.name).toBe("tab");
  });

  it("parses Backspace (0x7F)", () => {
    const key = parseKey(Buffer.from([0x7f]));
    expect(key.name).toBe("backspace");
  });

  it("parses Backspace (0x08)", () => {
    const key = parseKey(Buffer.from([0x08]));
    expect(key.name).toBe("backspace");
  });

  it("parses Escape", () => {
    const key = parseKey(Buffer.from([0x1b]));
    expect(key.name).toBe("escape");
  });

  it("parses Space", () => {
    const key = parseKey(Buffer.from([0x20]));
    expect(key.name).toBe("space");
  });

  it("parses printable ASCII", () => {
    const key = parseKey(Buffer.from("a"));
    expect(key.name).toBe("a");
    expect(key.ctrl).toBe(false);
  });

  it("parses uppercase letter", () => {
    const key = parseKey(Buffer.from("A"));
    expect(key.name).toBe("A");
  });

  it("parses Ctrl+A", () => {
    const key = parseKey(Buffer.from([0x01]));
    expect(key.name).toBe("a");
    expect(key.ctrl).toBe(true);
  });

  it("parses Ctrl+E", () => {
    const key = parseKey(Buffer.from([0x05]));
    expect(key.name).toBe("e");
    expect(key.ctrl).toBe(true);
  });

  it("parses Ctrl+U", () => {
    const key = parseKey(Buffer.from([0x15]));
    expect(key.name).toBe("u");
    expect(key.ctrl).toBe(true);
  });

  it("parses Ctrl+W", () => {
    const key = parseKey(Buffer.from([0x17]));
    expect(key.name).toBe("w");
    expect(key.ctrl).toBe(true);
  });

  it("parses arrow up", () => {
    const key = parseKey(Buffer.from("\x1b[A"));
    expect(key.name).toBe("up");
  });

  it("parses arrow down", () => {
    const key = parseKey(Buffer.from("\x1b[B"));
    expect(key.name).toBe("down");
  });

  it("parses arrow right", () => {
    const key = parseKey(Buffer.from("\x1b[C"));
    expect(key.name).toBe("right");
  });

  it("parses arrow left", () => {
    const key = parseKey(Buffer.from("\x1b[D"));
    expect(key.name).toBe("left");
  });

  it("parses Home", () => {
    const key = parseKey(Buffer.from("\x1b[H"));
    expect(key.name).toBe("home");
  });

  it("parses End", () => {
    const key = parseKey(Buffer.from("\x1b[F"));
    expect(key.name).toBe("end");
  });

  it("parses Delete", () => {
    const key = parseKey(Buffer.from("\x1b[3~"));
    expect(key.name).toBe("delete");
  });

  it("parses Shift+Tab", () => {
    const key = parseKey(Buffer.from("\x1b[Z"));
    expect(key.name).toBe("tab");
    expect(key.shift).toBe(true);
  });

  it("parses Ctrl+Arrow Up", () => {
    const key = parseKey(Buffer.from("\x1b[1;5A"));
    expect(key.name).toBe("up");
    expect(key.ctrl).toBe(true);
  });

  it("parses Ctrl+Arrow Right", () => {
    const key = parseKey(Buffer.from("\x1b[1;5C"));
    expect(key.name).toBe("right");
    expect(key.ctrl).toBe(true);
  });

  it("parses Shift+Arrow Down", () => {
    const key = parseKey(Buffer.from("\x1b[1;2B"));
    expect(key.name).toBe("down");
    expect(key.shift).toBe(true);
  });

  it("parses Meta/Alt + char", () => {
    const key = parseKey(Buffer.from("\x1bb"));
    expect(key.name).toBe("b");
    expect(key.meta).toBe(true);
  });

  it("parses multi-byte UTF-8", () => {
    const key = parseKey(Buffer.from("🎉"));
    expect(key.name).toBe("🎉");
    expect(key.ctrl).toBe(false);
    expect(key.meta).toBe(false);
  });

  it("preserves raw string", () => {
    const key = parseKey(Buffer.from("\x1b[A"));
    expect(key.raw).toBe("\x1b[A");
  });
});
