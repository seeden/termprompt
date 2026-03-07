import { describe, it, expect } from "vitest";
import { CANCEL, isCancel } from "../symbols.js";

describe("isCancel", () => {
  it("returns true for CANCEL symbol", () => {
    expect(isCancel(CANCEL)).toBe(true);
  });

  it("returns false for null", () => {
    expect(isCancel(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isCancel(undefined)).toBe(false);
  });

  it("returns false for false", () => {
    expect(isCancel(false)).toBe(false);
  });

  it("returns false for zero", () => {
    expect(isCancel(0)).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isCancel("")).toBe(false);
  });

  it("returns false for other symbols", () => {
    expect(isCancel(Symbol("cancel"))).toBe(false);
  });

  it("returns false for objects", () => {
    expect(isCancel({})).toBe(false);
  });

  it("returns false for strings", () => {
    expect(isCancel("cancel")).toBe(false);
  });
});
