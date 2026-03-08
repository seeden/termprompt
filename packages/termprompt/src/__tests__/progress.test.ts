import { describe, it, expect } from "vitest";
import { PassThrough } from "node:stream";
import { progress } from "../progress.js";
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

describe("progress", () => {
  it("renders bar on start", () => {
    const { output, getOutput } = createOutputStream();
    const p = progress({ output });
    p.start("Installing...");
    p.stop();

    const out = getOutput();
    expect(out).toContain("Installing...");
    expect(out).toContain("0%");
  });

  it("renders bar with correct percentage", () => {
    const { output, getOutput } = createOutputStream();
    const p = progress({ output });
    p.start("Downloading...");
    p.update(50, "Half done");
    p.stop();

    const out = getOutput();
    expect(out).toContain("50%");
    expect(out).toContain("Half done");
  });

  it("renders filled and empty blocks", () => {
    const { output, getOutput } = createOutputStream();
    const p = progress({ output });
    p.start("Working...");
    p.update(50);
    p.stop();

    const out = stripAnsi(getOutput());
    expect(out).toContain("\u2588"); // filled block █
    expect(out).toContain("\u2591"); // empty block ░
  });

  it("clamps percent to 0-100", () => {
    const { output, getOutput } = createOutputStream();
    const p = progress({ output });
    p.start("Working...");
    p.update(150);
    p.stop();

    const out = getOutput();
    expect(out).toContain("100%");
  });

  it("clamps negative percent to 0", () => {
    const { output, getOutput } = createOutputStream();
    const p = progress({ output });
    p.start("Working...");
    p.update(-50);
    p.stop();

    const out = getOutput();
    expect(out).toContain("0%");
  });

  it("shows success icon on stop with code 0", () => {
    const { output, getOutput } = createOutputStream();
    const p = progress({ output });
    p.start("Working...");
    p.stop("Success", 0);

    expect(getOutput()).toContain("\u25c6"); // ◆
  });

  it("shows error icon on stop with non-zero code", () => {
    const { output, getOutput } = createOutputStream();
    const p = progress({ output });
    p.start("Working...");
    p.stop("Failed", 1);

    expect(getOutput()).toContain("\u25b2"); // ▲
  });

  it("shows final message on stop", () => {
    const { output, getOutput } = createOutputStream();
    const p = progress({ output });
    p.start("Working...");
    p.stop("All done!");

    const raw = stripAnsi(getOutput());
    expect(raw).toContain("All done!");
  });

  it("uses current message when stop has no message", () => {
    const { output, getOutput } = createOutputStream();
    const p = progress({ output });
    p.start("Processing");
    p.stop();

    const raw = stripAnsi(getOutput());
    expect(raw).toContain("Processing");
  });

  it("keeps message when update only changes percent", () => {
    const { output, getOutput } = createOutputStream();
    const p = progress({ output });
    p.start("Loading...");
    p.update(75);
    p.stop();

    const out = getOutput();
    expect(out).toContain("Loading...");
    expect(out).toContain("75%");
  });

  it("emits OSC 7770 progress start", () => {
    const { output, getRawOutput } = createOutputStream();
    const p = progress({ output });
    p.start("Loading...");
    p.stop();

    const raw = getRawOutput();
    expect(raw).toContain("\x1b]7770;");
    expect(raw).toContain('"type":"progress"');
    expect(raw).toContain('"status":"start"');
  });

  it("emits OSC 7770 progress update", () => {
    const { output, getRawOutput } = createOutputStream();
    const p = progress({ output });
    p.start("Loading...");
    p.update(42);
    p.stop();

    const raw = getRawOutput();
    expect(raw).toContain('"status":"update"');
    expect(raw).toContain('"percent":42');
  });

  it("emits OSC 7770 progress stop", () => {
    const { output, getRawOutput } = createOutputStream();
    const p = progress({ output });
    p.start("Loading...");
    p.stop("Done");

    const raw = getRawOutput();
    expect(raw).toContain('"status":"stop"');
    expect(raw).toContain('"message":"Done"');
  });

  it("hides cursor on start and shows on stop", () => {
    const { output, getRawOutput } = createOutputStream();
    const p = progress({ output });
    p.start("Loading...");
    p.stop("Done");

    const raw = getRawOutput();
    expect(raw).toContain("\x1b[?25l"); // hide
    expect(raw).toContain("\x1b[?25h"); // show
  });

  it("ignores double start", () => {
    const { output } = createOutputStream();
    const p = progress({ output });
    p.start("First");
    p.start("Second"); // should be ignored
    p.stop();
  });

  it("ignores double stop", () => {
    const { output } = createOutputStream();
    const p = progress({ output });
    p.start("Working");
    p.stop("Done");
    p.stop("Again"); // should be ignored
  });

  it("ignores update when not active", () => {
    const { output } = createOutputStream();
    const p = progress({ output });
    p.update(50); // should be ignored, not started
  });
});
