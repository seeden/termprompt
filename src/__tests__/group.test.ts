import { describe, it, expect, vi } from "vitest";
import { group } from "../group.js";
import { CANCEL } from "../symbols.js";

describe("group", () => {
  it("collects results from multiple prompts", async () => {
    const result = await group({
      name: async () => "Alice",
      age: async () => 30,
      active: async () => true,
    });

    expect(result).toEqual({ name: "Alice", age: 30, active: true });
  });

  it("passes previous results to subsequent prompts", async () => {
    const result = await group({
      first: async () => "hello",
      second: async ({ results }) => `${results.first} world`,
    });

    expect(result).toEqual({ first: "hello", second: "hello world" });
  });

  it("stops on cancel and calls onCancel", async () => {
    const onCancel = vi.fn();

    const result = await group(
      {
        name: async () => "Alice",
        email: async () => CANCEL,
        phone: async () => "555-1234", // should not be reached
      },
      { onCancel },
    );

    expect(onCancel).toHaveBeenCalledOnce();
    expect(result).toEqual({ name: "Alice" });
    expect(result).not.toHaveProperty("email");
    expect(result).not.toHaveProperty("phone");
  });

  it("stops on cancel without onCancel handler", async () => {
    const result = await group({
      name: async () => CANCEL,
      email: async () => "test@test.com",
    });

    expect(result).toEqual({});
  });

  it("handles empty group", async () => {
    const result = await group({});
    expect(result).toEqual({});
  });

  it("handles single prompt", async () => {
    const result = await group({
      value: async () => 42,
    });
    expect(result).toEqual({ value: 42 });
  });
});
