import type { InputConfig, KeyPress, PromptState } from "../types.js";
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

type InputState = {
  text: string;
  cursorPos: number;
  error: string | null;
};

export async function input(config: InputConfig): Promise<string | Cancel> {
  const { message, placeholder, initialValue = "", validate } = config;

  let inputState: InputState = {
    text: initialValue,
    cursorPos: initialValue.length,
    error: null,
  };

  const promptId = generatePromptId();

  const result = await createPrompt<string>({
    initialValue,
    osc: {
      v: 1,
      type: "input",
      id: promptId,
      message,
      placeholder,
      initialValue: initialValue || undefined,
    },

    onKey(key: KeyPress, current: { value: string; state: PromptState }) {
      const s = inputState;

      // Clear error on any input
      if (s.error) {
        s.error = null;
      }

      // Submit
      if (key.name === "return") {
        if (validate) {
          const result = validate(s.text);
          if (result !== true) {
            s.error = result;
            return { value: s.text, state: "error" };
          }
        }
        return { value: s.text, state: "submit" };
      }

      // Cancel
      if (key.name === "escape") {
        return { value: current.value, state: "cancel" };
      }

      // Backspace
      if (key.name === "backspace") {
        if (s.cursorPos > 0) {
          s.text = s.text.slice(0, s.cursorPos - 1) + s.text.slice(s.cursorPos);
          s.cursorPos--;
        }
        return { value: s.text, state: "active" };
      }

      // Delete
      if (key.name === "delete") {
        if (s.cursorPos < s.text.length) {
          s.text = s.text.slice(0, s.cursorPos) + s.text.slice(s.cursorPos + 1);
        }
        return { value: s.text, state: "active" };
      }

      // Cursor movement
      if (key.name === "left") {
        if (s.cursorPos > 0) s.cursorPos--;
        return { value: s.text, state: "active" };
      }
      if (key.name === "right") {
        if (s.cursorPos < s.text.length) s.cursorPos++;
        return { value: s.text, state: "active" };
      }
      if (key.name === "home" || (key.ctrl && key.name === "a")) {
        s.cursorPos = 0;
        return { value: s.text, state: "active" };
      }
      if (key.name === "end" || (key.ctrl && key.name === "e")) {
        s.cursorPos = s.text.length;
        return { value: s.text, state: "active" };
      }

      // Ctrl+U: clear line
      if (key.ctrl && key.name === "u") {
        s.text = s.text.slice(s.cursorPos);
        s.cursorPos = 0;
        return { value: s.text, state: "active" };
      }

      // Ctrl+W: delete word backward
      if (key.ctrl && key.name === "w") {
        const before = s.text.slice(0, s.cursorPos);
        const after = s.text.slice(s.cursorPos);
        const trimmed = before.replace(/\S+\s*$/, "");
        s.text = trimmed + after;
        s.cursorPos = trimmed.length;
        return { value: s.text, state: "active" };
      }

      // Printable characters (single char, no ctrl/meta)
      if (
        key.name.length === 1 &&
        !key.ctrl &&
        !key.meta &&
        key.name !== "space"
      ) {
        s.text =
          s.text.slice(0, s.cursorPos) + key.name + s.text.slice(s.cursorPos);
        s.cursorPos++;
        return { value: s.text, state: "active" };
      }

      // Space
      if (key.name === "space") {
        s.text =
          s.text.slice(0, s.cursorPos) + " " + s.text.slice(s.cursorPos);
        s.cursorPos++;
        return { value: s.text, state: "active" };
      }

      // Multi-byte characters (emoji, etc.)
      if (key.raw.length > 1 && !key.ctrl && !key.meta && key.name.length > 1) {
        s.text =
          s.text.slice(0, s.cursorPos) + key.name + s.text.slice(s.cursorPos);
        s.cursorPos += key.name.length;
        return { value: s.text, state: "active" };
      }

      return undefined;
    },

    render(state: PromptState, value: string) {
      const s = inputState;

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
        return `${title}\n${gray(S_BAR)}  ${dim(value)}\n`;
      }

      if (state === "cancel") {
        return `${title}\n${gray(S_BAR)}  ${dim(strikethrough(s.text || "cancelled"))}\n`;
      }

      // Build the value line with cursor
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

      if (state === "error" && s.error) {
        lines.push(`${getTheme().warning(S_STEP_ERROR)}  ${getTheme().warning(s.error)}`);
      } else {
        lines.push(gray(S_BAR_END));
      }

      return lines.join("\n");
    },
  });

  return result;
}
