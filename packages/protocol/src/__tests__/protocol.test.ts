import { describe, it, expect } from "vitest";
import {
  createOscParser,
  encodePrompt,
  encodeResolve,
  wrapOsc,
  ESC,
  BEL,
  OSC_PREFIX,
} from "../index.js";
import type { OscPromptPayload } from "../index.js";

describe("createOscParser", () => {
  it("parses a single select message", () => {
    const parser = createOscParser();
    const payload = { v: 1, type: "select", id: "abc", message: "Pick one", options: [] };
    const raw = `${OSC_PREFIX}${JSON.stringify(payload)}${BEL}`;
    const result = parser.write(raw);

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]!.payload).toEqual(payload);
    expect(result.output).toBe("");
  });

  it("strips OSC sequences from output", () => {
    const parser = createOscParser();
    const payload = { v: 1, type: "log", level: "info", message: "hello" };
    const osc = `${OSC_PREFIX}${JSON.stringify(payload)}${BEL}`;
    const result = parser.write(`before${osc}after`);

    expect(result.output).toBe("beforeafter");
    expect(result.messages).toHaveLength(1);
  });

  it("handles multiple messages in one chunk", () => {
    const parser = createOscParser();
    const p1 = { v: 1, type: "spinner", id: "s1", status: "start", message: "Loading..." };
    const p2 = { v: 1, type: "spinner", id: "s1", status: "stop", message: "Done", code: 0 };
    const data = `${OSC_PREFIX}${JSON.stringify(p1)}${BEL}text${OSC_PREFIX}${JSON.stringify(p2)}${BEL}`;

    const result = parser.write(data);
    expect(result.messages).toHaveLength(2);
    expect(result.messages[0]!.payload.type).toBe("spinner");
    expect((result.messages[0]!.payload as { status: string }).status).toBe("start");
    expect((result.messages[1]!.payload as { status: string }).status).toBe("stop");
    expect(result.output).toBe("text");
  });

  it("handles sequence split across two writes", () => {
    const parser = createOscParser();
    const payload = { v: 1, type: "log", level: "success", message: "done" };
    const full = `${OSC_PREFIX}${JSON.stringify(payload)}${BEL}`;
    const mid = Math.floor(full.length / 2);

    const r1 = parser.write(full.slice(0, mid));
    expect(r1.messages).toHaveLength(0);
    expect(r1.output).toBe("");

    const r2 = parser.write(full.slice(mid));
    expect(r2.messages).toHaveLength(1);
    expect(r2.messages[0]!.payload).toEqual(payload);
  });

  it("handles partial prefix at end of chunk", () => {
    const parser = createOscParser();
    // Send text ending with just ESC (start of a potential OSC sequence)
    const r1 = parser.write(`hello${ESC}`);
    expect(r1.output).toBe("hello");
    expect(r1.messages).toHaveLength(0);

    // Complete it as a non-OSC escape - send normal text
    const payload = { v: 1, type: "log", level: "info", message: "x" };
    const osc = `${OSC_PREFIX}${JSON.stringify(payload)}${BEL}`;
    // The buffered ESC + new data starting with ] 7770 ;
    const r2 = parser.write(osc.slice(1)); // without ESC (already buffered)
    expect(r2.messages).toHaveLength(1);
  });

  it("handles ST terminator (ESC backslash)", () => {
    const parser = createOscParser();
    const payload = { v: 1, type: "resolve", id: "r1", value: "ok" };
    const raw = `${OSC_PREFIX}${JSON.stringify(payload)}${ESC}\\`;
    const result = parser.write(raw);

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]!.payload).toEqual(payload);
  });

  it("ignores malformed JSON", () => {
    const parser = createOscParser();
    const raw = `${OSC_PREFIX}{not valid json${BEL}`;
    const result = parser.write(raw);

    expect(result.messages).toHaveLength(0);
    expect(result.output).toBe("");
  });

  it("ignores messages with wrong version", () => {
    const parser = createOscParser();
    const raw = `${OSC_PREFIX}{"v":2,"type":"log","level":"info","message":"x"}${BEL}`;
    const result = parser.write(raw);

    expect(result.messages).toHaveLength(0);
  });

  it("ignores messages without type field", () => {
    const parser = createOscParser();
    const raw = `${OSC_PREFIX}{"v":1,"data":"something"}${BEL}`;
    const result = parser.write(raw);

    expect(result.messages).toHaveLength(0);
  });

  it("preserves raw sequence on parsed messages", () => {
    const parser = createOscParser();
    const payload = { v: 1, type: "confirm", id: "c1", message: "Sure?" };
    const raw = `${OSC_PREFIX}${JSON.stringify(payload)}${BEL}`;
    const result = parser.write(raw);

    expect(result.messages[0]!.raw).toBe(raw);
  });

  it("parses all payload types", () => {
    const parser = createOscParser();
    const payloads = [
      { v: 1, type: "select", id: "1", message: "Pick", options: [] },
      { v: 1, type: "confirm", id: "2", message: "Ok?", active: "Yes", inactive: "No" },
      { v: 1, type: "input", id: "3", message: "Name?" },
      { v: 1, type: "multiselect", id: "4", message: "Features", options: [], initialValues: [] },
      { v: 1, type: "resolve", id: "5", value: "test" },
      { v: 1, type: "spinner", id: "6", status: "start", message: "Loading" },
      { v: 1, type: "progress", id: "7", status: "update", message: "DL", percent: 50 },
      { v: 1, type: "tasks", id: "8", status: "start", tasks: [{ title: "A", status: "pending" }] },
      { v: 1, type: "log", level: "info", message: "hello" },
    ];

    const data = payloads.map((p) => `${OSC_PREFIX}${JSON.stringify(p)}${BEL}`).join("");
    const result = parser.write(data);

    expect(result.messages).toHaveLength(9);
    for (let i = 0; i < payloads.length; i++) {
      expect(result.messages[i]!.payload.type).toBe(payloads[i]!.type);
    }
  });

  it("handles interleaved normal output and OSC", () => {
    const parser = createOscParser();
    const osc1 = `${OSC_PREFIX}{"v":1,"type":"log","level":"intro","message":"cli"}${BEL}`;
    const osc2 = `${OSC_PREFIX}{"v":1,"type":"log","level":"outro","message":"bye"}${BEL}`;
    const data = `\x1b[32m┌\x1b[39m  cli\n${osc1}\x1b[32m└\x1b[39m  bye\n${osc2}`;

    const result = parser.write(data);
    expect(result.messages).toHaveLength(2);
    expect(result.output).toBe("\x1b[32m┌\x1b[39m  cli\n\x1b[32m└\x1b[39m  bye\n");
  });

  it("handles empty write", () => {
    const parser = createOscParser();
    const result = parser.write("");
    expect(result.messages).toHaveLength(0);
    expect(result.output).toBe("");
  });
});

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

    expect(result.startsWith(OSC_PREFIX)).toBe(true);
    expect(result.endsWith(BEL)).toBe(true);

    const json = result.slice(OSC_PREFIX.length, -1);
    const parsed = JSON.parse(json);
    expect(parsed.v).toBe(1);
    expect(parsed.type).toBe("select");
  });

  it("preserves non-string option values", () => {
    const payload: OscPromptPayload = {
      v: 1,
      type: "select",
      id: "typed-values",
      message: "Pick one",
      options: [{ value: { id: 1 }, label: "One" }, { value: 2, label: "Two" }],
    };

    const result = encodePrompt(payload);
    const json = result.slice(OSC_PREFIX.length, -1);
    const parsed = JSON.parse(json);

    expect(parsed.options).toEqual([
      { value: { id: 1 }, label: "One" },
      { value: 2, label: "Two" },
    ]);
  });
});

describe("encodeResolve", () => {
  it("creates a resolve OSC sequence", () => {
    const result = encodeResolve("test-id", "selected");

    const json = result.slice(OSC_PREFIX.length, -1);
    const parsed = JSON.parse(json);
    expect(parsed.v).toBe(1);
    expect(parsed.type).toBe("resolve");
    expect(parsed.id).toBe("test-id");
    expect(parsed.value).toBe("selected");
  });

  it("handles complex values", () => {
    const result = encodeResolve("id", ["a", "b"]);
    const json = result.slice(OSC_PREFIX.length, -1);
    const parsed = JSON.parse(json);
    expect(parsed.value).toEqual(["a", "b"]);
  });
});

describe("wrapOsc", () => {
  it("wraps raw JSON string in OSC envelope", () => {
    const result = wrapOsc('{"test":true}');
    expect(result).toBe(`${OSC_PREFIX}{"test":true}${BEL}`);
  });
});
