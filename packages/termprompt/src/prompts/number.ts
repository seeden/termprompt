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
  S_STEP_ERROR,
  dim,
  gray,
  bold,
  strikethrough,
  inverse,
} from "../core/renderer.js";
import { getTheme } from "../theme.js";

export type NumberConfig = {
  message: string;
  min?: number;
  max?: number;
  step?: number;
  initialValue?: number;
  placeholder?: string;
  validate?: (value: number) => true | string;
};

type NumberState = {
  text: string;
  cursorPos: number;
  error: string | null;
};

function isNumericChar(char: string, text: string, cursorPos: number): boolean {
  if (char >= "0" && char <= "9") return true;
  if (char === "-" && cursorPos === 0 && !text.includes("-")) return true;
  if (char === "." && !text.includes(".")) return true;
  return false;
}

export async function number(config: NumberConfig): Promise<number | Cancel> {
  const {
    message,
    min,
    max,
    step = 1,
    initialValue,
    placeholder,
    validate,
  } = config;

  const initialText =
    initialValue !== undefined ? String(initialValue) : "";

  const state: NumberState = {
    text: initialText,
    cursorPos: initialText.length,
    error: null,
  };

  const promptId = generatePromptId();

  const result = await createPrompt<number>({
    initialValue: initialValue ?? 0,
    osc: {
      v: 1,
      type: "input",
      id: promptId,
      message,
      placeholder,
      initialValue,
    },
    parseOscResolveValue(value: unknown) {
      const num =
        typeof value === "number"
          ? value
          : typeof value === "string"
            ? Number(value)
            : Number.NaN;

      if (!Number.isFinite(num)) {
        throw new Error("Resolve value must be numeric");
      }
      if (min !== undefined && num < min) {
        throw new Error("Resolve value below min");
      }
      if (max !== undefined && num > max) {
        throw new Error("Resolve value above max");
      }
      if (validate) {
        const validation = validate(num);
        if (validation !== true) {
          throw new Error("Resolve value failed validation");
        }
      }

      return num;
    },

    onKey(key: KeyPress, current: { value: number; state: PromptState }) {
      const s = state;

      if (s.error) {
        s.error = null;
      }

      // Submit
      if (key.name === "return") {
        const num = Number(s.text);
        if (s.text.length === 0 || Number.isNaN(num)) {
          s.error = "Please enter a valid number.";
          return { value: current.value, state: "error" };
        }
        if (min !== undefined && num < min) {
          s.error = `Must be at least ${min}.`;
          return { value: current.value, state: "error" };
        }
        if (max !== undefined && num > max) {
          s.error = `Must be at most ${max}.`;
          return { value: current.value, state: "error" };
        }
        if (validate) {
          const result = validate(num);
          if (result !== true) {
            s.error = result;
            return { value: current.value, state: "error" };
          }
        }
        return { value: num, state: "submit" };
      }

      // Cancel
      if (key.name === "escape") {
        return { value: current.value, state: "cancel" };
      }

      // Up/Down: increment/decrement
      if (key.name === "up") {
        let num = Number(s.text) || 0;
        num += step;
        if (max !== undefined && num > max) num = max;
        s.text = String(num);
        s.cursorPos = s.text.length;
        return { value: num, state: "active" };
      }

      if (key.name === "down") {
        let num = Number(s.text) || 0;
        num -= step;
        if (min !== undefined && num < min) num = min;
        s.text = String(num);
        s.cursorPos = s.text.length;
        return { value: num, state: "active" };
      }

      // Backspace
      if (key.name === "backspace") {
        if (s.cursorPos > 0) {
          s.text = s.text.slice(0, s.cursorPos - 1) + s.text.slice(s.cursorPos);
          s.cursorPos--;
        }
        return { value: Number(s.text) || 0, state: "active" };
      }

      // Delete
      if (key.name === "delete") {
        if (s.cursorPos < s.text.length) {
          s.text = s.text.slice(0, s.cursorPos) + s.text.slice(s.cursorPos + 1);
        }
        return { value: Number(s.text) || 0, state: "active" };
      }

      // Cursor movement
      if (key.name === "left") {
        if (s.cursorPos > 0) s.cursorPos--;
        return { value: Number(s.text) || 0, state: "active" };
      }
      if (key.name === "right") {
        if (s.cursorPos < s.text.length) s.cursorPos++;
        return { value: Number(s.text) || 0, state: "active" };
      }
      if (key.name === "home" || (key.ctrl && key.name === "a")) {
        s.cursorPos = 0;
        return { value: Number(s.text) || 0, state: "active" };
      }
      if (key.name === "end" || (key.ctrl && key.name === "e")) {
        s.cursorPos = s.text.length;
        return { value: Number(s.text) || 0, state: "active" };
      }

      // Ctrl+U: clear to start
      if (key.ctrl && key.name === "u") {
        s.text = s.text.slice(s.cursorPos);
        s.cursorPos = 0;
        return { value: Number(s.text) || 0, state: "active" };
      }

      // Ctrl+W: delete word backward
      if (key.ctrl && key.name === "w") {
        const before = s.text.slice(0, s.cursorPos);
        const after = s.text.slice(s.cursorPos);
        const trimmed = before.replace(/\S+\s*$/, "");
        s.text = trimmed + after;
        s.cursorPos = trimmed.length;
        return { value: Number(s.text) || 0, state: "active" };
      }

      // Numeric characters only
      if (
        key.name.length === 1 &&
        !key.ctrl &&
        !key.meta &&
        key.name !== "space"
      ) {
        if (isNumericChar(key.name, s.text, s.cursorPos)) {
          s.text =
            s.text.slice(0, s.cursorPos) + key.name + s.text.slice(s.cursorPos);
          s.cursorPos++;
          return { value: Number(s.text) || 0, state: "active" };
        }
        // Reject non-numeric characters silently
        return undefined;
      }

      return undefined;
    },

    render(promptState: PromptState, value: number) {
      const s = state;

      const icon =
        promptState === "submit"
          ? getTheme().success(S_STEP_SUBMIT)
          : promptState === "cancel"
            ? getTheme().warning(S_STEP_CANCEL)
            : promptState === "error"
              ? getTheme().warning(S_STEP_ERROR)
              : getTheme().accent(S_STEP_ACTIVE);

      const title = `${icon}  ${bold(message)}`;

      if (promptState === "submit") {
        return `${title}\n${gray(S_BAR)}  ${dim(String(value))}\n`;
      }

      if (promptState === "cancel") {
        return `${title}\n${gray(S_BAR)}  ${dim(strikethrough(s.text || "cancelled"))}\n`;
      }

      // Build value line with cursor
      let valueLine: string;
      if (s.text.length === 0) {
        if (placeholder) {
          valueLine = dim(placeholder);
        } else {
          valueLine = inverse(" ");
        }
      } else {
        const before = s.text.slice(0, s.cursorPos);
        const cursorChar = s.text[s.cursorPos];
        const after = s.text.slice(s.cursorPos + 1);

        if (cursorChar) {
          valueLine = before + inverse(cursorChar) + after;
        } else {
          valueLine = before + inverse(" ");
        }
      }

      const lines = [`${title}`, `${gray(S_BAR)}  ${valueLine}`];

      if (promptState === "error" && s.error) {
        lines.push(`${getTheme().warning(S_STEP_ERROR)}  ${getTheme().warning(s.error)}`);
      } else {
        lines.push(gray(S_BAR_END));
      }

      return lines.join("\n");
    },
  });

  return result;
}
