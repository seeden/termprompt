import { describe, it, expect, vi, afterEach } from "vitest";
import { PassThrough } from "node:stream";
import { tasks } from "../tasks.js";
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

describe("tasks", () => {
  it("runs tasks sequentially", async () => {
    const { output, getOutput } = createOutputStream();
    const order: string[] = [];

    const result = await tasks(
      [
        {
          title: "Step 1",
          task: async () => {
            order.push("1");
          },
        },
        {
          title: "Step 2",
          task: async () => {
            order.push("2");
          },
        },
      ],
      { output },
    );

    expect(order).toEqual(["1", "2"]);
    expect(result.errors).toEqual([]);
    const out = stripAnsi(getOutput());
    expect(out).toContain("Step 1");
    expect(out).toContain("Step 2");
  });

  it("runs tasks concurrently when configured", async () => {
    const { output } = createOutputStream();
    const started: string[] = [];

    const result = await tasks(
      [
        {
          title: "Task A",
          task: async () => {
            started.push("A-start");
            await new Promise((r) => setTimeout(r, 10));
            started.push("A-end");
          },
        },
        {
          title: "Task B",
          task: async () => {
            started.push("B-start");
            await new Promise((r) => setTimeout(r, 10));
            started.push("B-end");
          },
        },
      ],
      { output, concurrent: true },
    );

    // Both should start before either ends
    expect(started.indexOf("A-start")).toBeLessThan(started.indexOf("A-end"));
    expect(started.indexOf("B-start")).toBeLessThan(started.indexOf("B-end"));
    // Both start before first end (concurrent)
    expect(started.indexOf("B-start")).toBeLessThan(started.indexOf("A-end"));
    expect(result.errors).toEqual([]);
  });

  it("catches errors and continues", async () => {
    const { output, getOutput } = createOutputStream();
    const order: string[] = [];

    const result = await tasks(
      [
        {
          title: "Failing task",
          task: async () => {
            throw new Error("boom");
          },
        },
        {
          title: "After failure",
          task: async () => {
            order.push("ran");
          },
        },
      ],
      { output },
    );

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.message).toBe("boom");
    expect(order).toEqual(["ran"]); // second task still ran
  });

  it("collects multiple errors", async () => {
    const { output } = createOutputStream();

    const result = await tasks(
      [
        {
          title: "Fail 1",
          task: async () => {
            throw new Error("error-1");
          },
        },
        {
          title: "Fail 2",
          task: async () => {
            throw new Error("error-2");
          },
        },
      ],
      { output },
    );

    expect(result.errors).toHaveLength(2);
    expect(result.errors.map((e) => e.message)).toEqual(["error-1", "error-2"]);
  });

  it("skips disabled tasks (boolean)", async () => {
    const { output, getOutput } = createOutputStream();
    const ran: string[] = [];

    await tasks(
      [
        {
          title: "Enabled",
          task: async () => {
            ran.push("enabled");
          },
        },
        {
          title: "Disabled",
          enabled: false,
          task: async () => {
            ran.push("disabled");
          },
        },
      ],
      { output },
    );

    expect(ran).toEqual(["enabled"]);
  });

  it("skips disabled tasks (function)", async () => {
    const { output } = createOutputStream();
    const ran: string[] = [];

    await tasks(
      [
        {
          title: "Conditional",
          enabled: () => false,
          task: async () => {
            ran.push("conditional");
          },
        },
        {
          title: "Always",
          task: async () => {
            ran.push("always");
          },
        },
      ],
      { output },
    );

    expect(ran).toEqual(["always"]);
  });

  it("allows title updates during task execution", async () => {
    const { output, getOutput } = createOutputStream();

    await tasks(
      [
        {
          title: "Original",
          task: async (_ctx, update) => {
            update("Updated title");
          },
        },
      ],
      { output },
    );

    const out = getOutput();
    expect(out).toContain("Updated title");
  });

  it("passes shared context between tasks", async () => {
    const { output } = createOutputStream();
    let captured: unknown = null;

    await tasks<{ value: string }>(
      [
        {
          title: "Set context",
          task: async (ctx) => {
            ctx.value = "hello";
          },
        },
        {
          title: "Read context",
          task: async (ctx) => {
            captured = ctx.value;
          },
        },
      ],
      { output },
    );

    expect(captured).toBe("hello");
  });

  it("emits OSC 7770 tasks events", () => {
    const { output, getRawOutput } = createOutputStream();

    tasks(
      [
        {
          title: "Quick",
          task: async () => {},
        },
      ],
      { output },
    ).then(() => {
      const raw = getRawOutput();
      expect(raw).toContain("\x1b]7770;");
      expect(raw).toContain('"type":"tasks"');
      expect(raw).toContain('"status":"start"');
    });
  });

  it("hides cursor during execution and shows after", async () => {
    const { output, getRawOutput } = createOutputStream();

    await tasks(
      [
        {
          title: "Quick",
          task: async () => {},
        },
      ],
      { output },
    );

    const raw = getRawOutput();
    expect(raw).toContain("\x1b[?25l"); // hide
    expect(raw).toContain("\x1b[?25h"); // show
  });

  it("shows success icon for completed tasks", async () => {
    const { output, getOutput } = createOutputStream();

    await tasks(
      [
        {
          title: "Done",
          task: async () => {},
        },
      ],
      { output },
    );

    expect(getOutput()).toContain("\u25c6"); // ◆
  });

  it("shows error icon for failed tasks", async () => {
    const { output, getOutput } = createOutputStream();

    await tasks(
      [
        {
          title: "Fail",
          task: async () => {
            throw new Error("oops");
          },
        },
      ],
      { output },
    );

    expect(getOutput()).toContain("\u25b2"); // ▲
  });

  it("returns empty errors for all-success run", async () => {
    const { output } = createOutputStream();

    const result = await tasks(
      [
        { title: "A", task: async () => {} },
        { title: "B", task: async () => {} },
      ],
      { output },
    );

    expect(result.errors).toEqual([]);
  });

  it("handles non-Error throws", async () => {
    const { output } = createOutputStream();

    const result = await tasks(
      [
        {
          title: "String throw",
          task: async () => {
            throw "string-error";
          },
        },
      ],
      { output },
    );

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.message).toBe("string-error");
  });
});
