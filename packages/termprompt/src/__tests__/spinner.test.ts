import { describe, it, expect, vi, afterEach } from "vitest";
import { PassThrough } from "node:stream";
import { spinner } from "../spinner.js";
import { stripAnsi } from "../core/renderer.js";

function createOutputStream() {
  const output = new PassThrough({ encoding: "utf8" });
  let buffer = "";
  output.on("data", (chunk: string) => {
    buffer += chunk;
  });
  return {
    output,
    getOutput: () => buffer,
    getRawOutput: () => buffer,
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("spinner", () => {
  it("renders spinner frame on start", () => {
    const { output, getOutput } = createOutputStream();
    const s = spinner({ output });
    s.start("Loading...");
    s.stop();

    const out = getOutput();
    expect(out).toContain("Loading...");
  });

  it("shows final message on stop", () => {
    const { output, getOutput } = createOutputStream();
    const s = spinner({ output });
    s.start("Working...");
    s.stop("Done!");

    const raw = stripAnsi(getOutput());
    expect(raw).toContain("Done!");
  });

  it("shows success icon on stop with code 0", () => {
    const { output, getOutput } = createOutputStream();
    const s = spinner({ output });
    s.start("Working...");
    s.stop("Success", 0);

    expect(getOutput()).toContain("\u25c6"); // S_STEP_SUBMIT (◆)
  });

  it("shows error icon on stop with non-zero code", () => {
    const { output, getOutput } = createOutputStream();
    const s = spinner({ output });
    s.start("Working...");
    s.stop("Failed", 1);

    expect(getOutput()).toContain("\u25b2"); // S_STEP_ERROR (▲)
  });

  it("updates message", () => {
    const { output, getOutput } = createOutputStream();
    const s = spinner({ output });
    s.start("Step 1...");
    s.message("Step 2...");
    s.stop("All done");

    const out = getOutput();
    // The OSC update should contain the new message
    expect(out).toContain("Step 2...");
  });

  it("emits OSC 7770 spinner start", () => {
    const { output, getRawOutput } = createOutputStream();
    const s = spinner({ output });
    s.start("Loading...");
    s.stop();

    const raw = getRawOutput();
    expect(raw).toContain("\x1b]7770;");
    expect(raw).toContain('"type":"spinner"');
    expect(raw).toContain('"status":"start"');
  });

  it("emits OSC 7770 spinner stop", () => {
    const { output, getRawOutput } = createOutputStream();
    const s = spinner({ output });
    s.start("Loading...");
    s.stop("Done");

    const raw = getRawOutput();
    expect(raw).toContain('"status":"stop"');
    expect(raw).toContain('"message":"Done"');
  });

  it("emits OSC 7770 spinner update on message change", () => {
    const { output, getRawOutput } = createOutputStream();
    const s = spinner({ output });
    s.start("Step 1");
    s.message("Step 2");
    s.stop();

    const raw = getRawOutput();
    expect(raw).toContain('"status":"update"');
    expect(raw).toContain('"message":"Step 2"');
  });

  it("hides cursor on start and shows on stop", () => {
    const { output, getRawOutput } = createOutputStream();
    const s = spinner({ output });
    s.start("Loading...");
    s.stop("Done");

    const raw = getRawOutput();
    expect(raw).toContain("\x1b[?25l"); // hide
    expect(raw).toContain("\x1b[?25h"); // show
  });

  it("uses current message when stop has no message", () => {
    const { output, getOutput } = createOutputStream();
    const s = spinner({ output });
    s.start("Processing");
    s.stop();

    const raw = stripAnsi(getOutput());
    expect(raw).toContain("Processing");
  });

  it("ignores double start", () => {
    const { output } = createOutputStream();
    const s = spinner({ output });
    s.start("First");
    s.start("Second"); // should be ignored
    s.stop();
    // no error thrown
  });

  it("ignores double stop", () => {
    const { output } = createOutputStream();
    const s = spinner({ output });
    s.start("Working");
    s.stop("Done");
    s.stop("Again"); // should be ignored
    // no error thrown
  });
});
