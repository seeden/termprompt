import { isDeepStrictEqual } from "node:util";
import type { MultiselectConfig, KeyPress, PromptState } from "../types.js";
import { isSeparator } from "../types.js";
import type { Cancel } from "../symbols.js";
import { createPrompt } from "../core/prompt.js";
import { generatePromptId } from "../osc/osc.js";
import {
  S_BAR,
  S_BAR_END,
  S_STEP_ACTIVE,
  S_STEP_SUBMIT,
  S_STEP_CANCEL,
  S_STEP_ERROR,
  S_CHECKBOX_ACTIVE,
  S_CHECKBOX_INACTIVE,
  dim,
  gray,
  bold,
  strikethrough,
} from "../core/renderer.js";
import { getTheme } from "../theme.js";

function isSelectable<T>(opt: { disabled?: boolean; separator?: boolean; value?: T }): boolean {
  return !("separator" in opt && opt.separator === true) && !opt.disabled;
}

function parseResolvedMultiselectValues<T>(
  resolved: unknown,
  options: MultiselectConfig<T>["options"],
  required: boolean,
): T[] {
  if (!Array.isArray(resolved)) {
    throw new Error("Resolve value must be an array");
  }

  const selectedIndexes = new Set<number>();

  for (const item of resolved) {
    const index = options.findIndex(
      (option) =>
        !isSeparator(option) &&
        !option.disabled &&
        isDeepStrictEqual(option.value, item),
    );

    if (index === -1) {
      throw new Error("Resolve value contains unknown option");
    }

    selectedIndexes.add(index);
  }

  if (required && selectedIndexes.size === 0) {
    throw new Error("Resolve value must include at least one option");
  }

  return [...selectedIndexes]
    .sort((a, b) => a - b)
    .map((index) => (options[index] as { value: T }).value);
}

export async function multiselect<T>(
  config: MultiselectConfig<T>,
): Promise<T[] | Cancel> {
  const {
    message,
    options,
    initialValues = [],
    required = true,
    maxItems = 10,
  } = config;

  if (options.length === 0 || !options.some((o) => !isSeparator(o) && !o.disabled)) {
    throw new Error("multiselect requires at least one non-disabled option");
  }

  let cursorIndex = 0;
  // Skip to first selectable option
  if (!isSelectable(options[cursorIndex]!)) {
    for (let i = 0; i < options.length; i++) {
      if (isSelectable(options[i]!)) {
        cursorIndex = i;
        break;
      }
    }
  }

  const selected = new Set<number>(
    initialValues
      .map((v) => options.findIndex((o) => !isSeparator(o) && o.value === v))
      .filter((i) => i !== -1),
  );
  let scrollOffset = 0;
  let error: string | null = null;

  const promptId = generatePromptId();

  // Strip separators from OSC payload
  const oscOptions = options
    .filter((o) => !isSeparator(o))
    .map((o) => {
      const opt = o as { value: T; label: string; hint?: string; disabled?: boolean };
      return {
        value: opt.value,
        label: opt.label,
        hint: opt.hint,
        disabled: opt.disabled,
      };
    });

  return createPrompt<T[]>({
    initialValue: initialValues.slice(),
    osc: {
      v: 1,
      type: "multiselect",
      id: promptId,
      message,
      options: oscOptions,
      initialValues,
    },
    parseOscResolveValue: (resolved: unknown) =>
      parseResolvedMultiselectValues(resolved, options, required),

    onKey(key: KeyPress, current: { value: T[]; state: PromptState }) {
      if (error) error = null;

      // Navigate
      if (key.name === "up" || key.name === "k") {
        let next = cursorIndex;
        do {
          next = (next - 1 + options.length) % options.length;
        } while (!isSelectable(options[next]!) && next !== cursorIndex);
        cursorIndex = next;
        if (cursorIndex < scrollOffset) scrollOffset = cursorIndex;
        if (cursorIndex >= scrollOffset + maxItems)
          scrollOffset = cursorIndex - maxItems + 1;
        return { value: current.value, state: "active" };
      }

      if (key.name === "down" || key.name === "j") {
        let next = cursorIndex;
        do {
          next = (next + 1) % options.length;
        } while (!isSelectable(options[next]!) && next !== cursorIndex);
        cursorIndex = next;
        if (cursorIndex < scrollOffset) scrollOffset = cursorIndex;
        if (cursorIndex >= scrollOffset + maxItems)
          scrollOffset = cursorIndex - maxItems + 1;
        return { value: current.value, state: "active" };
      }

      // Toggle current
      if (key.name === "space") {
        const opt = options[cursorIndex]!;
        if (!isSeparator(opt) && !opt.disabled) {
          if (selected.has(cursorIndex)) {
            selected.delete(cursorIndex);
          } else {
            selected.add(cursorIndex);
          }
        }
        const values = [...selected].map((i) => (options[i] as { value: T }).value);
        return { value: values, state: "active" };
      }

      // Toggle all
      if (key.name === "a") {
        const allNonDisabled = options
          .map((o, i) => ({ selectable: isSelectable(o), index: i }))
          .filter((o) => o.selectable);

        const allSelected = allNonDisabled.every((o) => selected.has(o.index));
        if (allSelected) {
          selected.clear();
        } else {
          for (const o of allNonDisabled) {
            selected.add(o.index);
          }
        }
        const values = [...selected].map((i) => (options[i] as { value: T }).value);
        return { value: values, state: "active" };
      }

      // Submit
      if (key.name === "return") {
        if (required && selected.size === 0) {
          error = "Please select at least one option.";
          return { value: current.value, state: "error" };
        }
        const values = [...selected]
          .sort((a, b) => a - b)
          .map((i) => (options[i] as { value: T }).value);
        return { value: values, state: "submit" };
      }

      // Cancel
      if (key.name === "escape") {
        return { value: current.value, state: "cancel" };
      }

      return undefined;
    },

    render(state: PromptState, value: T[]) {
      const icon =
        state === "submit"
          ? getTheme().success(S_STEP_SUBMIT)
          : state === "cancel"
            ? getTheme().warning(S_STEP_CANCEL)
            : state === "error"
              ? getTheme().warning(S_STEP_ERROR)
              : getTheme().accent(S_STEP_ACTIVE);

      const title = `${icon}  ${bold(message)}`;

      if (state === "submit") {
        const labels = value
          .map((v) => {
            const found = options.find((o) => !isSeparator(o) && o.value === v);
            return found && !isSeparator(found) ? found.label : String(v);
          })
          .join(", ");
        return `${title}\n${gray(S_BAR)}  ${dim(labels)}\n`;
      }

      if (state === "cancel") {
        return `${title}\n${gray(S_BAR)}  ${dim(strikethrough("cancelled"))}\n`;
      }

      const visible = options.slice(scrollOffset, scrollOffset + maxItems);
      const lines = visible.map((opt, i) => {
        const idx = i + scrollOffset;

        if (isSeparator(opt)) {
          const divider = opt.label
            ? `── ${opt.label} ──`
            : "──────";
          return `${gray(S_BAR)}  ${dim(divider)}`;
        }

        const isActive = idx === cursorIndex;
        const isSelected = selected.has(idx);

        if (opt.disabled) {
          return `${gray(S_BAR)}  ${dim(S_CHECKBOX_INACTIVE)} ${dim(strikethrough(opt.label))} ${dim("(disabled)")}`;
        }

        const checkbox = isSelected
          ? getTheme().success(S_CHECKBOX_ACTIVE)
          : dim(S_CHECKBOX_INACTIVE);
        const label = isActive ? opt.label : dim(opt.label);
        const hint = opt.hint && isActive ? ` ${dim(`(${opt.hint})`)}` : "";
        const pointer = isActive ? getTheme().accent(">") : " ";
        return `${gray(S_BAR)} ${pointer}${checkbox} ${label}${hint}`;
      });

      if (scrollOffset > 0) {
        lines.unshift(`${gray(S_BAR)}  ${dim("...")}`);
      }
      if (scrollOffset + maxItems < options.length) {
        lines.push(`${gray(S_BAR)}  ${dim("...")}`);
      }

      const footer =
        state === "error" && error
          ? `${getTheme().warning(S_STEP_ERROR)}  ${getTheme().warning(error)}`
          : gray(S_BAR_END);

      return [title, ...lines, footer].join("\n");
    },
  });
}
