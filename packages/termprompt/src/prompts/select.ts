import { isDeepStrictEqual } from "node:util";
import type { SelectConfig, KeyPress, PromptState } from "../types.js";
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
  S_RADIO_ACTIVE,
  S_RADIO_INACTIVE,
  dim,
  gray,
  bold,
  strikethrough,
} from "../core/renderer.js";
import { getTheme } from "../theme.js";

function isSelectable<T>(opt: { disabled?: boolean; separator?: boolean; value?: T }): boolean {
  return !("separator" in opt && opt.separator === true) && !opt.disabled;
}

function parseResolvedSelectValue<T>(resolved: unknown, configOptions: SelectConfig<T>["options"]): T {
  for (const option of configOptions) {
    if (isSeparator(option) || option.disabled) continue;
    if (isDeepStrictEqual(option.value, resolved)) return option.value;
  }
  throw new Error("Invalid resolve value");
}

export async function select<T>(
  config: SelectConfig<T>,
): Promise<T | Cancel> {
  const { message, options, initialValue, maxItems = 10 } = config;

  if (options.length === 0 || !options.some((o) => !isSeparator(o) && !o.disabled)) {
    throw new Error("select requires at least one non-disabled option");
  }

  let cursorIndex = 0;
  if (initialValue !== undefined) {
    const idx = options.findIndex((o) => !isSeparator(o) && o.value === initialValue);
    if (idx !== -1) cursorIndex = idx;
  }

  // Skip to first selectable option
  if (!isSelectable(options[cursorIndex]!)) {
    for (let i = 0; i < options.length; i++) {
      if (isSelectable(options[i]!)) {
        cursorIndex = i;
        break;
      }
    }
  }

  let scrollOffset = 0;
  if (cursorIndex >= maxItems) {
    scrollOffset = cursorIndex - maxItems + 1;
  }

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

  return createPrompt<T>({
    initialValue: (options[cursorIndex] as { value: T }).value,
    osc: {
      v: 1,
      type: "select",
      id: promptId,
      message,
      options: oscOptions,
      initialValue,
    },
    parseOscResolveValue: (resolved: unknown) => parseResolvedSelectValue(resolved, options),

    onKey(key: KeyPress, current: { value: T; state: PromptState }) {
      if (key.name === "up" || key.name === "k") {
        let next = cursorIndex;
        do {
          next = (next - 1 + options.length) % options.length;
        } while (!isSelectable(options[next]!) && next !== cursorIndex);
        cursorIndex = next;
        if (cursorIndex < scrollOffset) scrollOffset = cursorIndex;
        if (cursorIndex >= scrollOffset + maxItems)
          scrollOffset = cursorIndex - maxItems + 1;
        return { value: (options[cursorIndex] as { value: T }).value, state: "active" };
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
        return { value: (options[cursorIndex] as { value: T }).value, state: "active" };
      }

      if (key.name === "return") {
        const opt = options[cursorIndex]!;
        if (isSeparator(opt) || opt.disabled) return undefined;
        return { value: opt.value, state: "submit" };
      }

      if (key.name === "escape") {
        return { value: current.value, state: "cancel" };
      }

      return undefined;
    },

    render(state: PromptState, value: T) {
      const icon =
        state === "submit"
          ? getTheme().success(S_STEP_SUBMIT)
          : state === "cancel"
            ? getTheme().warning(S_STEP_CANCEL)
            : getTheme().accent(S_STEP_ACTIVE);

      const title = `${icon}  ${bold(message)}`;

      if (state === "submit") {
        const selected = options.find((o) => !isSeparator(o) && o.value === value);
        const label = selected && !isSeparator(selected) ? selected.label : String(value);
        return `${title}\n${gray(S_BAR)}  ${dim(label)}\n`;
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
        const radio = isActive ? getTheme().success(S_RADIO_ACTIVE) : dim(S_RADIO_INACTIVE);

        if (opt.disabled) {
          return `${gray(S_BAR)}  ${dim(S_RADIO_INACTIVE)} ${dim(strikethrough(opt.label))} ${dim("(disabled)")}`;
        }

        const label = isActive ? opt.label : dim(opt.label);
        const hint = opt.hint && isActive ? ` ${dim(`(${opt.hint})`)}` : "";
        return `${gray(S_BAR)}  ${radio} ${label}${hint}`;
      });

      if (scrollOffset > 0) {
        lines.unshift(`${gray(S_BAR)}  ${dim("...")}`);
      }
      if (scrollOffset + maxItems < options.length) {
        lines.push(`${gray(S_BAR)}  ${dim("...")}`);
      }

      return [title, ...lines, gray(S_BAR_END)].join("\n");
    },
  });
}
