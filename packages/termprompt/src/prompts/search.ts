import { isDeepStrictEqual } from "node:util";
import type { KeyPress, PromptState } from "../types.js";
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

export type SearchOption<T> = {
  value: T;
  label: string;
  hint?: string;
};

export type SearchConfig<T> = {
  message: string;
  options: SearchOption<T>[];
  placeholder?: string;
  maxItems?: number;
};

type SearchState<T> = {
  query: string;
  cursorPos: number;
  filtered: SearchOption<T>[];
  selectedIndex: number;
  scrollOffset: number;
};

function filterOptions<T>(
  options: SearchOption<T>[],
  query: string,
): SearchOption<T>[] {
  if (query.length === 0) return options;
  const lower = query.toLowerCase();
  return options.filter(
    (o) =>
      o.label.toLowerCase().includes(lower) ||
      (o.hint && o.hint.toLowerCase().includes(lower)),
  );
}

function parseResolvedSearchValue<T>(resolved: unknown, options: SearchOption<T>[]): T {
  const matched = options.find((option) => isDeepStrictEqual(option.value, resolved));
  if (!matched) {
    throw new Error("Invalid resolve value");
  }
  return matched.value;
}

export async function search<T>(
  config: SearchConfig<T>,
): Promise<T | Cancel> {
  const { message, options, placeholder, maxItems = 10 } = config;

  if (options.length === 0) {
    throw new Error("search requires at least one option");
  }

  const state: SearchState<T> = {
    query: "",
    cursorPos: 0,
    filtered: options,
    selectedIndex: 0,
    scrollOffset: 0,
  };

  const promptId = generatePromptId();

  return createPrompt<T>({
    initialValue: options[0]?.value as T,
    osc: {
      v: 1,
      type: "select",
      id: promptId,
      message,
      options: options.map((o) => ({
        value: o.value,
        label: o.label,
        hint: o.hint,
      })),
      placeholder,
    },
    parseOscResolveValue: (resolved: unknown) => parseResolvedSearchValue(resolved, options),

    onKey(key: KeyPress, current: { value: T; state: PromptState }) {
      const s = state;

      // Navigate filtered results
      if (key.name === "up") {
        if (s.filtered.length > 0) {
          s.selectedIndex =
            (s.selectedIndex - 1 + s.filtered.length) % s.filtered.length;
          if (s.selectedIndex < s.scrollOffset) s.scrollOffset = s.selectedIndex;
          if (s.selectedIndex >= s.scrollOffset + maxItems)
            s.scrollOffset = s.selectedIndex - maxItems + 1;
        }
        return {
          value: s.filtered[s.selectedIndex]?.value ?? current.value,
          state: "active",
        };
      }

      if (key.name === "down") {
        if (s.filtered.length > 0) {
          s.selectedIndex = (s.selectedIndex + 1) % s.filtered.length;
          if (s.selectedIndex < s.scrollOffset) s.scrollOffset = s.selectedIndex;
          if (s.selectedIndex >= s.scrollOffset + maxItems)
            s.scrollOffset = s.selectedIndex - maxItems + 1;
        }
        return {
          value: s.filtered[s.selectedIndex]?.value ?? current.value,
          state: "active",
        };
      }

      // Submit
      if (key.name === "return") {
        const selected = s.filtered[s.selectedIndex];
        if (!selected) return undefined;
        return { value: selected.value, state: "submit" };
      }

      // Cancel
      if (key.name === "escape") {
        return { value: current.value, state: "cancel" };
      }

      // Backspace
      if (key.name === "backspace") {
        if (s.cursorPos > 0) {
          s.query =
            s.query.slice(0, s.cursorPos - 1) + s.query.slice(s.cursorPos);
          s.cursorPos--;
          s.filtered = filterOptions(options, s.query);
          s.selectedIndex = 0;
          s.scrollOffset = 0;
        }
        return {
          value: s.filtered[0]?.value ?? current.value,
          state: "active",
        };
      }

      // Ctrl+U: clear query from cursor to start
      if (key.ctrl && key.name === "u") {
        s.query = s.query.slice(s.cursorPos);
        s.cursorPos = 0;
        s.filtered = filterOptions(options, s.query);
        s.selectedIndex = 0;
        s.scrollOffset = 0;
        return {
          value: s.filtered[0]?.value ?? current.value,
          state: "active",
        };
      }

      // Ctrl+W: delete word backward
      if (key.ctrl && key.name === "w") {
        const before = s.query.slice(0, s.cursorPos);
        const after = s.query.slice(s.cursorPos);
        const trimmed = before.replace(/\S+\s*$/, "");
        s.query = trimmed + after;
        s.cursorPos = trimmed.length;
        s.filtered = filterOptions(options, s.query);
        s.selectedIndex = 0;
        s.scrollOffset = 0;
        return {
          value: s.filtered[0]?.value ?? current.value,
          state: "active",
        };
      }

      // Printable characters
      if (
        key.name.length === 1 &&
        !key.ctrl &&
        !key.meta &&
        key.name !== "space"
      ) {
        s.query =
          s.query.slice(0, s.cursorPos) + key.name + s.query.slice(s.cursorPos);
        s.cursorPos++;
        s.filtered = filterOptions(options, s.query);
        s.selectedIndex = 0;
        s.scrollOffset = 0;
        return {
          value: s.filtered[0]?.value ?? current.value,
          state: "active",
        };
      }

      if (key.name === "space") {
        s.query =
          s.query.slice(0, s.cursorPos) + " " + s.query.slice(s.cursorPos);
        s.cursorPos++;
        s.filtered = filterOptions(options, s.query);
        s.selectedIndex = 0;
        s.scrollOffset = 0;
        return {
          value: s.filtered[0]?.value ?? current.value,
          state: "active",
        };
      }

      return undefined;
    },

    render(promptState: PromptState, value: T) {
      const s = state;

      const icon =
        promptState === "submit"
          ? getTheme().success(S_STEP_SUBMIT)
          : promptState === "cancel"
            ? getTheme().warning(S_STEP_CANCEL)
            : getTheme().accent(S_STEP_ACTIVE);

      const title = `${icon}  ${bold(message)}`;

      if (promptState === "submit") {
        const selected = options.find((o) => o.value === value);
        return `${title}\n${gray(S_BAR)}  ${dim(selected?.label ?? String(value))}\n`;
      }

      if (promptState === "cancel") {
        return `${title}\n${gray(S_BAR)}  ${dim(strikethrough("cancelled"))}\n`;
      }

      // Search input line
      const queryDisplay =
        s.query.length > 0
          ? s.query
          : placeholder
            ? dim(placeholder)
            : dim("Type to search...");

      const lines = [title, `${gray(S_BAR)}  ${queryDisplay}`];

      // Filtered results
      if (s.filtered.length === 0) {
        lines.push(`${gray(S_BAR)}  ${dim("No results")}`);
      } else {
        const visible = s.filtered.slice(
          s.scrollOffset,
          s.scrollOffset + maxItems,
        );

        if (s.scrollOffset > 0) {
          lines.push(`${gray(S_BAR)}  ${dim("...")}`);
        }

        for (let i = 0; i < visible.length; i++) {
          const opt = visible[i]!;
          const idx = i + s.scrollOffset;
          const isActive = idx === s.selectedIndex;
          const radio = isActive
            ? getTheme().success(S_RADIO_ACTIVE)
            : dim(S_RADIO_INACTIVE);
          const label = isActive ? opt.label : dim(opt.label);
          const hint =
            opt.hint && isActive ? ` ${dim(`(${opt.hint})`)}` : "";
          lines.push(`${gray(S_BAR)}  ${radio} ${label}${hint}`);
        }

        if (s.scrollOffset + maxItems < s.filtered.length) {
          lines.push(`${gray(S_BAR)}  ${dim("...")}`);
        }
      }

      lines.push(gray(S_BAR_END));
      return lines.join("\n");
    },
  });
}
