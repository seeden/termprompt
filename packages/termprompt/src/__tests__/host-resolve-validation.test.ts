import { beforeEach, describe, expect, it, vi } from "vitest";

const createPromptMock = vi.fn();

vi.mock("../core/prompt.js", () => ({
  createPrompt: (options: unknown) => createPromptMock(options),
}));

type CapturedPromptConfig = {
  initialValue: unknown;
  osc?: {
    type: string;
    options?: Array<{ value: unknown; label: string }>;
    initialValue?: unknown;
    initialValues?: unknown[];
  };
  parseOscResolveValue?: (value: unknown) => unknown;
};

function getLastConfig(): CapturedPromptConfig {
  expect(createPromptMock).toHaveBeenCalled();
  const calls = createPromptMock.mock.calls;
  return calls[calls.length - 1]![0] as CapturedPromptConfig;
}

beforeEach(() => {
  createPromptMock.mockReset();
  createPromptMock.mockImplementation(async (options: CapturedPromptConfig) => options.initialValue);
});

describe("OSC payload values", () => {
  it("select keeps non-string option values and initialValue", async () => {
    const { select } = await import("../prompts/select.js");
    const initial = { id: 2 };

    await select({
      message: "Pick one",
      options: [
        { value: 1, label: "One" },
        { value: initial, label: "Two" },
      ],
      initialValue: initial,
    });

    const config = getLastConfig();
    expect(config.osc?.type).toBe("select");
    expect(config.osc?.options?.map((opt) => opt.value)).toEqual([1, initial]);
    expect(config.osc?.initialValue).toBe(initial);
  });

  it("multiselect keeps non-string option values and initialValues", async () => {
    const { multiselect } = await import("../prompts/multiselect.js");
    const a = { key: "a" };
    const b = { key: "b" };

    await multiselect({
      message: "Pick many",
      options: [
        { value: a, label: "A" },
        { value: b, label: "B" },
      ],
      initialValues: [b],
    });

    const config = getLastConfig();
    expect(config.osc?.type).toBe("multiselect");
    expect(config.osc?.options?.map((opt) => opt.value)).toEqual([a, b]);
    expect(config.osc?.initialValues).toEqual([b]);
  });

  it("search keeps non-string option values", async () => {
    const { search } = await import("../prompts/search.js");
    const value = { code: "eu" };

    await search({
      message: "Search",
      options: [{ value, label: "Europe" }],
    });

    const config = getLastConfig();
    expect(config.osc?.type).toBe("select");
    expect(config.osc?.options?.[0]?.value).toBe(value);
  });
});

describe("Host resolve validation", () => {
  it("select maps deep-equal resolve values back to canonical option values", async () => {
    const { select } = await import("../prompts/select.js");
    const canonical = { id: 7 };

    await select({
      message: "Pick one",
      options: [
        { value: canonical, label: "Seven" },
        { value: { id: 8 }, label: "Eight", disabled: true },
      ],
    });

    const config = getLastConfig();
    expect(config.parseOscResolveValue?.({ id: 7 })).toBe(canonical);
    expect(() => config.parseOscResolveValue?.({ id: 8 })).toThrow("Invalid resolve value");
    expect(() => config.parseOscResolveValue?.({ id: 9 })).toThrow("Invalid resolve value");
  });

  it("multiselect validates required and option membership", async () => {
    const { multiselect } = await import("../prompts/multiselect.js");
    const a = { name: "a" };
    const b = { name: "b" };

    await multiselect({
      message: "Pick",
      options: [
        { value: a, label: "A" },
        { value: b, label: "B" },
      ],
      required: true,
    });

    const config = getLastConfig();
    expect(config.parseOscResolveValue?.([{ name: "b" }, { name: "a" }])).toEqual([a, b]);
    expect(() => config.parseOscResolveValue?.([])).toThrow(
      "Resolve value must include at least one option",
    );
    expect(() => config.parseOscResolveValue?.([{ name: "missing" }])).toThrow(
      "Resolve value contains unknown option",
    );
  });

  it("multiselect allows empty resolve values when required is false", async () => {
    const { multiselect } = await import("../prompts/multiselect.js");

    await multiselect({
      message: "Pick",
      options: [{ value: "a", label: "A" }],
      required: false,
    });

    const config = getLastConfig();
    expect(config.parseOscResolveValue?.([])).toEqual([]);
  });

  it("search validates membership and returns canonical values", async () => {
    const { search } = await import("../prompts/search.js");
    const canonical = { slug: "eu-west" };

    await search({
      message: "Region",
      options: [{ value: canonical, label: "EU West" }],
    });

    const config = getLastConfig();
    expect(config.parseOscResolveValue?.({ slug: "eu-west" })).toBe(canonical);
    expect(() => config.parseOscResolveValue?.({ slug: "us-east" })).toThrow(
      "Invalid resolve value",
    );
  });

  it("confirm only accepts boolean resolve values", async () => {
    const { confirm } = await import("../prompts/confirm.js");

    await confirm({ message: "Continue?" });
    const config = getLastConfig();

    expect(config.parseOscResolveValue?.(true)).toBe(true);
    expect(config.parseOscResolveValue?.(false)).toBe(false);
    expect(() => config.parseOscResolveValue?.("true")).toThrow(
      "Resolve value must be boolean",
    );
  });

  it("input requires a string and runs validate", async () => {
    const { input } = await import("../prompts/input.js");

    await input({
      message: "Name?",
      validate: (value) => (value.length >= 3 ? true : "too short"),
    });

    const config = getLastConfig();
    expect(config.parseOscResolveValue?.("alice")).toBe("alice");
    expect(() => config.parseOscResolveValue?.("ab")).toThrow(
      "Resolve value failed validation",
    );
    expect(() => config.parseOscResolveValue?.(123)).toThrow("Resolve value must be string");
  });

  it("password requires a string and runs validate", async () => {
    const { password } = await import("../prompts/password.js");

    await password({
      message: "Secret?",
      validate: (value) => (value.includes("!") ? true : "missing bang"),
    });

    const config = getLastConfig();
    expect(config.parseOscResolveValue?.("abc!")).toBe("abc!");
    expect(() => config.parseOscResolveValue?.("abc")).toThrow(
      "Resolve value failed validation",
    );
    expect(() => config.parseOscResolveValue?.(null)).toThrow("Resolve value must be string");
  });

  it("number accepts numeric values/strings and enforces bounds + custom validation", async () => {
    const { number } = await import("../prompts/number.js");

    await number({
      message: "Port",
      min: 1,
      max: 10,
      validate: (value) => (value % 2 === 0 ? true : "must be even"),
      initialValue: 6,
    });

    const config = getLastConfig();
    expect(config.osc?.initialValue).toBe(6);
    expect(config.parseOscResolveValue?.("8")).toBe(8);
    expect(config.parseOscResolveValue?.(4)).toBe(4);
    expect(() => config.parseOscResolveValue?.("abc")).toThrow(
      "Resolve value must be numeric",
    );
    expect(() => config.parseOscResolveValue?.(11)).toThrow("Resolve value above max");
    expect(() => config.parseOscResolveValue?.(0)).toThrow("Resolve value below min");
    expect(() => config.parseOscResolveValue?.(3)).toThrow(
      "Resolve value failed validation",
    );
  });
});
