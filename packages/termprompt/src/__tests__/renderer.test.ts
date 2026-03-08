import { describe, it, expect } from "vitest";
import {
  dim,
  bold,
  cyan,
  green,
  red,
  gray,
  inverse,
  strikethrough,
  stripAnsi,
  lineCount,
  cursor,
  S_BAR,
  S_BAR_END,
  S_RADIO_ACTIVE,
  S_RADIO_INACTIVE,
  S_CHECKBOX_ACTIVE,
  S_CHECKBOX_INACTIVE,
  S_STEP_ACTIVE,
  S_STEP_SUBMIT,
} from "../core/renderer.js";

describe("color functions", () => {
  it("wraps text with dim SGR codes", () => {
    expect(dim("hello")).toBe("\x1b[2mhello\x1b[22m");
  });

  it("wraps text with bold SGR codes", () => {
    expect(bold("hello")).toBe("\x1b[1mhello\x1b[22m");
  });

  it("wraps text with cyan SGR codes", () => {
    expect(cyan("hello")).toBe("\x1b[36mhello\x1b[39m");
  });

  it("wraps text with green SGR codes", () => {
    expect(green("hello")).toBe("\x1b[32mhello\x1b[39m");
  });

  it("wraps text with red SGR codes", () => {
    expect(red("hello")).toBe("\x1b[31mhello\x1b[39m");
  });

  it("wraps text with inverse SGR codes", () => {
    expect(inverse("x")).toBe("\x1b[7mx\x1b[27m");
  });

  it("wraps text with strikethrough SGR codes", () => {
    expect(strikethrough("x")).toBe("\x1b[9mx\x1b[29m");
  });
});

describe("stripAnsi", () => {
  it("removes SGR color codes", () => {
    expect(stripAnsi(bold("hello"))).toBe("hello");
  });

  it("removes cursor sequences", () => {
    expect(stripAnsi(cursor.hide + "text" + cursor.show)).toBe("text");
  });

  it("removes OSC sequences with BEL terminator", () => {
    expect(stripAnsi("\x1b]7770;{}\x07visible")).toBe("visible");
  });

  it("removes OSC sequences with ST terminator", () => {
    expect(stripAnsi("\x1b]7770;{}\x1b\\visible")).toBe("visible");
  });

  it("removes DEC save/restore cursor", () => {
    expect(stripAnsi("\x1b7text\x1b8")).toBe("text");
  });

  it("passes through plain text", () => {
    expect(stripAnsi("hello world")).toBe("hello world");
  });

  it("handles nested color codes", () => {
    expect(stripAnsi(bold(cyan("hello")))).toBe("hello");
  });
});

describe("lineCount", () => {
  it("counts single line", () => {
    expect(lineCount("hello")).toBe(1);
  });

  it("counts multiple lines", () => {
    expect(lineCount("a\nb\nc")).toBe(3);
  });

  it("counts trailing newline", () => {
    expect(lineCount("a\n")).toBe(2);
  });

  it("counts empty string as one line", () => {
    expect(lineCount("")).toBe(1);
  });
});

describe("unicode symbols", () => {
  it("has correct bar characters", () => {
    expect(S_BAR).toBe("│");
    expect(S_BAR_END).toBe("└");
  });

  it("has correct radio characters", () => {
    expect(S_RADIO_ACTIVE).toBe("◉");
    expect(S_RADIO_INACTIVE).toBe("○");
  });

  it("has correct checkbox characters", () => {
    expect(S_CHECKBOX_ACTIVE).toBe("■");
    expect(S_CHECKBOX_INACTIVE).toBe("□");
  });

  it("has correct step characters", () => {
    expect(S_STEP_ACTIVE).toBe("◇");
    expect(S_STEP_SUBMIT).toBe("◆");
  });
});

describe("cursor", () => {
  it("generates hide sequence", () => {
    expect(cursor.hide).toBe("\x1b[?25l");
  });

  it("generates show sequence", () => {
    expect(cursor.show).toBe("\x1b[?25h");
  });

  it("generates up movement", () => {
    expect(cursor.up(3)).toBe("\x1b[3A");
  });

  it("generates down movement", () => {
    expect(cursor.down(2)).toBe("\x1b[2B");
  });

  it("defaults to 1 for movements", () => {
    expect(cursor.up()).toBe("\x1b[1A");
    expect(cursor.down()).toBe("\x1b[1B");
  });
});
