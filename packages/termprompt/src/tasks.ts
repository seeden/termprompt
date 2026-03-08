import { stdout as defaultStdout } from "node:process";
import type { Writable } from "node:stream";
import { randomUUID } from "node:crypto";
import {
  cursor,
  erase,
  gray,
  dim,
  strikethrough,
  S_BAR,
  S_STEP_SUBMIT,
  S_STEP_ERROR,
} from "./core/renderer.js";
import { getTheme } from "./theme.js";

const OSC_CODE = 7770;
const ESC = "\x1b";
const BEL = "\x07";

const SPINNER_FRAMES = ["\u25d2", "\u25d0", "\u25d3", "\u25d1"]; // ◒ ◐ ◓ ◑
const SPINNER_INTERVAL = 80;
const S_PENDING = "\u25cb"; // ○
const S_SKIPPED = "\u2500"; // ─

type TaskStatus = "pending" | "running" | "success" | "error" | "skipped";

export type TaskItem<C> = {
  title: string;
  task: (ctx: C, update: (title: string) => void) => Promise<void>;
  enabled?: boolean | ((ctx: C) => boolean);
};

export type TasksConfig = {
  concurrent?: boolean;
  output?: Writable;
};

export type TasksResult = {
  errors: Error[];
};

type InternalTask = {
  title: string;
  status: TaskStatus;
  error?: Error;
};

function emitOsc(
  output: Writable,
  payload: Record<string, unknown>,
): void {
  output.write(`${ESC}]${OSC_CODE};${JSON.stringify(payload)}${BEL}`);
}

export async function tasks<C extends Record<string, unknown> = Record<string, unknown>>(
  items: TaskItem<C>[],
  config?: TasksConfig,
): Promise<TasksResult> {
  const output = config?.output ?? defaultStdout;
  const concurrent = config?.concurrent ?? false;
  const ctx = {} as C;
  const oscId = randomUUID();

  const state: InternalTask[] = items.map((item) => ({
    title: item.title,
    status: "pending",
  }));

  let frameIndex = 0;
  let prevLineCount = 0;

  function renderIcon(status: TaskStatus): string {
    switch (status) {
      case "pending":
        return dim(S_PENDING);
      case "running": {
        const frame = SPINNER_FRAMES[frameIndex % SPINNER_FRAMES.length]!;
        return getTheme().accent(frame);
      }
      case "success":
        return getTheme().success(S_STEP_SUBMIT);
      case "error":
        return getTheme().error(S_STEP_ERROR);
      case "skipped":
        return dim(S_SKIPPED);
    }
  }

  function renderTitle(task: InternalTask): string {
    switch (task.status) {
      case "pending":
        return dim(task.title);
      case "running":
        return task.title;
      case "success":
        return dim(task.title);
      case "error":
        return getTheme().error(task.title);
      case "skipped":
        return dim(strikethrough(task.title));
    }
  }

  function render() {
    // Move cursor up to overwrite previous frame
    if (prevLineCount > 0) {
      output.write(cursor.up(prevLineCount));
      output.write("\r");
      output.write(erase.toEnd);
    }

    const lines: string[] = [];
    lines.push(gray(S_BAR));

    for (const task of state) {
      const icon = renderIcon(task.status);
      const title = renderTitle(task);
      lines.push(`${icon}  ${title}`);
    }

    lines.push(gray(S_BAR));

    const frame = lines.join("\n") + "\n";
    output.write(frame);
    prevLineCount = lines.length;
  }

  function emitOscState(status: "start" | "update" | "stop") {
    emitOsc(output, {
      v: 1,
      type: "tasks",
      id: oscId,
      status,
      tasks: state.map((t) => ({ title: t.title, status: t.status })),
    });
  }

  function isEnabled(item: TaskItem<C>): boolean {
    if (item.enabled === undefined) return true;
    if (typeof item.enabled === "function") return item.enabled(ctx);
    return item.enabled;
  }

  // Start rendering
  output.write(cursor.hide);
  emitOscState("start");
  render();

  // Start spinner animation
  const intervalId = setInterval(() => {
    frameIndex++;
    if (state.some((t) => t.status === "running")) {
      render();
    }
  }, SPINNER_INTERVAL);

  const errors: Error[] = [];

  async function runTask(index: number) {
    const item = items[index]!;
    const task = state[index]!;

    if (!isEnabled(item)) {
      task.status = "skipped";
      render();
      emitOscState("update");
      return;
    }

    task.status = "running";
    render();
    emitOscState("update");

    try {
      await item.task(ctx, (newTitle: string) => {
        task.title = newTitle;
        render();
        emitOscState("update");
      });
      task.status = "success";
    } catch (err) {
      task.status = "error";
      task.error = err instanceof Error ? err : new Error(String(err));
      errors.push(task.error);
    }

    render();
    emitOscState("update");
  }

  if (concurrent) {
    await Promise.allSettled(items.map((_, i) => runTask(i)));
  } else {
    for (let i = 0; i < items.length; i++) {
      await runTask(i);
    }
  }

  // Cleanup
  clearInterval(intervalId);
  output.write(cursor.show);
  emitOscState("stop");

  return { errors };
}
