import { describe, it, expect, afterEach } from "vitest";
import { setTheme, getTheme } from "../theme.js";
import { cyan, magenta } from "../core/renderer.js";

describe("theme", () => {
  afterEach(() => {
    setTheme({ accent: cyan });
  });

  it("defaults accent to cyan", () => {
    expect(getTheme().accent).toBe(cyan);
  });

  it("accepts a ColorFn directly", () => {
    setTheme({ accent: magenta });
    expect(getTheme().accent).toBe(magenta);
    expect(getTheme().accent("hi")).toBe("\x1b[35mhi\x1b[39m");
  });

  it("accepts a custom color function", () => {
    const custom = (text: string) => `<custom>${text}</custom>`;
    setTheme({ accent: custom });
    expect(getTheme().accent("hello")).toBe("<custom>hello</custom>");
  });

  it("accepts a named color string", () => {
    setTheme({ accent: "magenta" });
    expect(getTheme().accent("hi")).toBe("\x1b[35mhi\x1b[39m");
  });

  it("accepts a hex color (#rrggbb)", () => {
    setTheme({ accent: "#ff6600" });
    expect(getTheme().accent("hi")).toBe("\x1b[38;2;255;102;0mhi\x1b[39m");
  });

  it("accepts a short hex color (#rgb)", () => {
    setTheme({ accent: "#f60" });
    expect(getTheme().accent("hi")).toBe("\x1b[38;2;255;102;0mhi\x1b[39m");
  });

  it("accepts hex with alpha (#rrggbbaa) and ignores alpha", () => {
    setTheme({ accent: "#ff660080" });
    expect(getTheme().accent("hi")).toBe("\x1b[38;2;255;102;0mhi\x1b[39m");
  });

  it("accepts rgb()", () => {
    setTheme({ accent: "rgb(100, 200, 50)" });
    expect(getTheme().accent("hi")).toBe("\x1b[38;2;100;200;50mhi\x1b[39m");
  });

  it("accepts rgba() and ignores alpha", () => {
    setTheme({ accent: "rgba(100, 200, 50, 0.5)" });
    expect(getTheme().accent("hi")).toBe("\x1b[38;2;100;200;50mhi\x1b[39m");
  });

  it("throws on invalid color string", () => {
    expect(() => setTheme({ accent: "nope" })).toThrow('Invalid color "nope"');
  });

  it("preserves accent on empty update", () => {
    setTheme({ accent: "#ff0000" });
    const before = getTheme().accent;
    setTheme({});
    expect(getTheme().accent).toBe(before);
  });
});
