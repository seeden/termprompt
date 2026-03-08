import { isCancel, type Cancel } from "./symbols.js";

export type GroupConfig<T extends Record<string, unknown>> = {
  [K in keyof T]: (opts: {
    results: Partial<T>;
  }) => Promise<T[K] | Cancel>;
};

export type GroupOptions = {
  onCancel?: () => void;
};

export async function group<T extends Record<string, unknown>>(
  prompts: GroupConfig<T>,
  options?: GroupOptions,
): Promise<T> {
  const results = {} as Partial<T>;

  for (const [key, promptFn] of Object.entries(prompts)) {
    const value = await (
      promptFn as (opts: { results: Partial<T> }) => Promise<unknown>
    )({ results });

    if (isCancel(value)) {
      options?.onCancel?.();
      return results as T;
    }

    (results as Record<string, unknown>)[key] = value;
  }

  return results as T;
}
