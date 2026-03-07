import { describe, it, expect, beforeEach } from "vitest";
import { PassThrough } from "node:stream";
import { intro, outro, note, log, setOutput } from "../log.js";
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
    getPlain: () => stripAnsi(buffer),
  };
}

let streams: ReturnType<typeof createOutputStream>;

beforeEach(() => {
  streams = createOutputStream();
  setOutput(streams.output);
});

describe("intro", () => {
  it("renders title with bar start", () => {
    intro("My CLI");
    expect(streams.getPlain()).toContain("┌");
    expect(streams.getPlain()).toContain("My CLI");
  });

  it("renders without title", () => {
    intro();
    expect(streams.getPlain()).toContain("┌");
  });

  it("emits OSC intro event", () => {
    intro("Test");
    expect(streams.getOutput()).toContain('"level":"intro"');
  });
});

describe("outro", () => {
  it("renders message with bar end", () => {
    outro("Goodbye");
    expect(streams.getPlain()).toContain("└");
    expect(streams.getPlain()).toContain("Goodbye");
  });

  it("renders without message", () => {
    outro();
    expect(streams.getPlain()).toContain("└");
  });

  it("emits OSC outro event", () => {
    outro("Done");
    expect(streams.getOutput()).toContain('"level":"outro"');
  });
});

describe("note", () => {
  it("renders message with borders", () => {
    note("Some info here");
    const plain = streams.getPlain();
    expect(plain).toContain("Some info here");
    expect(plain).toContain("─"); // horizontal bar
  });

  it("renders with title", () => {
    note("Details here", "Important");
    const plain = streams.getPlain();
    expect(plain).toContain("Important");
    expect(plain).toContain("Details here");
  });

  it("handles multi-line messages", () => {
    note("Line 1\nLine 2\nLine 3");
    const plain = streams.getPlain();
    expect(plain).toContain("Line 1");
    expect(plain).toContain("Line 2");
    expect(plain).toContain("Line 3");
  });

  it("emits OSC note event", () => {
    note("Info", "Title");
    const raw = streams.getOutput();
    expect(raw).toContain('"level":"note"');
    expect(raw).toContain('"title":"Title"');
  });
});

describe("log.info", () => {
  it("renders info message", () => {
    log.info("Something happened");
    expect(streams.getPlain()).toContain("Something happened");
    expect(streams.getPlain()).toContain("\u2139"); // info icon
  });

  it("emits OSC info event", () => {
    log.info("Test");
    expect(streams.getOutput()).toContain('"level":"info"');
  });
});

describe("log.success", () => {
  it("renders success message", () => {
    log.success("All good");
    expect(streams.getPlain()).toContain("All good");
    expect(streams.getPlain()).toContain("\u25c6"); // ◆
  });

  it("emits OSC success event", () => {
    log.success("Test");
    expect(streams.getOutput()).toContain('"level":"success"');
  });
});

describe("log.warn", () => {
  it("renders warning message", () => {
    log.warn("Be careful");
    expect(streams.getPlain()).toContain("Be careful");
  });

  it("emits OSC warn event", () => {
    log.warn("Test");
    expect(streams.getOutput()).toContain('"level":"warn"');
  });
});

describe("log.error", () => {
  it("renders error message", () => {
    log.error("Something broke");
    expect(streams.getPlain()).toContain("Something broke");
  });

  it("emits OSC error event", () => {
    log.error("Test");
    expect(streams.getOutput()).toContain('"level":"error"');
  });
});

describe("log.step", () => {
  it("renders step message", () => {
    log.step("Installing dependencies");
    expect(streams.getPlain()).toContain("Installing dependencies");
  });

  it("emits OSC step event", () => {
    log.step("Test");
    expect(streams.getOutput()).toContain('"level":"step"');
  });
});

describe("log.message", () => {
  it("renders plain message with bar", () => {
    log.message("Just a note");
    expect(streams.getPlain()).toContain("Just a note");
    expect(streams.getPlain()).toContain("│");
  });
});
