import { describe, it, expect } from "vitest";
import {
  encodePrompt,
  encodeResolve,
  parseOscResolve,
  generatePromptId,
} from "../osc/osc.js";
import type { OscPromptPayload } from "../types.js";

const ESC = "\x1b";
const BEL = "\x07";

describe("encodePrompt", () => {
  it("wraps payload in OSC 7770 sequence", () => {
    const payload: OscPromptPayload = {
      v: 1,
      type: "select",
      id: "test-id",
      message: "Pick one",
      options: [{ value: "a", label: "A" }],
    };
    const result = encodePrompt(payload);

    expect(result.startsWith(`${ESC}]7770;`)).toBe(true);
    expect(result.endsWith(BEL)).toBe(true);

    const json = result.slice(7, -1);
    const parsed = JSON.parse(json);
    expect(parsed.v).toBe(1);
    expect(parsed.type).toBe("select");
    expect(parsed.id).toBe("test-id");
    expect(parsed.message).toBe("Pick one");
  });
});

describe("encodeResolve", () => {
  it("creates a resolve OSC sequence", () => {
    const result = encodeResolve("test-id", "selected");

    const json = result.slice(7, -1);
    const parsed = JSON.parse(json);
    expect(parsed.v).toBe(1);
    expect(parsed.type).toBe("resolve");
    expect(parsed.id).toBe("test-id");
    expect(parsed.value).toBe("selected");
  });
});

describe("parseOscResolve", () => {
  it("extracts value from valid resolve sequence", () => {
    const data = encodeResolve("my-id", "hello");
    const result = parseOscResolve(data, "my-id");
    expect(result).toBe("hello");
  });

  it("returns null for wrong prompt ID", () => {
    const data = encodeResolve("other-id", "hello");
    const result = parseOscResolve(data, "my-id");
    expect(result).toBeNull();
  });

  it("returns null for non-OSC data", () => {
    const result = parseOscResolve("just some text", "my-id");
    expect(result).toBeNull();
  });

  it("returns null for malformed JSON", () => {
    const data = `${ESC}]7770;{not json${BEL}`;
    const result = parseOscResolve(data, "my-id");
    expect(result).toBeNull();
  });

  it("returns null for wrong version", () => {
    const data = `${ESC}]7770;{"v":2,"type":"resolve","id":"my-id","value":"x"}${BEL}`;
    const result = parseOscResolve(data, "my-id");
    expect(result).toBeNull();
  });

  it("returns null for non-resolve type", () => {
    const data = `${ESC}]7770;{"v":1,"type":"select","id":"my-id","value":"x"}${BEL}`;
    const result = parseOscResolve(data, "my-id");
    expect(result).toBeNull();
  });

  it("handles ST terminator (ESC backslash)", () => {
    const data = `${ESC}]7770;{"v":1,"type":"resolve","id":"my-id","value":"ok"}${ESC}\\`;
    const result = parseOscResolve(data, "my-id");
    expect(result).toBe("ok");
  });

  it("handles data with surrounding text", () => {
    const osc = encodeResolve("my-id", 42);
    const data = `some prefix${osc}some suffix`;
    const result = parseOscResolve(data, "my-id");
    expect(result).toBe(42);
  });

  it("handles object values", () => {
    const data = encodeResolve("my-id", { key: "val" });
    const result = parseOscResolve(data, "my-id");
    expect(result).toEqual({ key: "val" });
  });

  it("handles array values", () => {
    const data = encodeResolve("my-id", ["a", "b"]);
    const result = parseOscResolve(data, "my-id");
    expect(result).toEqual(["a", "b"]);
  });

  it("handles boolean values", () => {
    const data = encodeResolve("my-id", true);
    const result = parseOscResolve(data, "my-id");
    expect(result).toBe(true);
  });
});

describe("generatePromptId", () => {
  it("returns a string", () => {
    expect(typeof generatePromptId()).toBe("string");
  });

  it("returns unique values", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generatePromptId()));
    expect(ids.size).toBe(100);
  });
});
