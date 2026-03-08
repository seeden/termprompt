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
} from "../core/renderer.js";
import { getTheme } from "../theme.js";

export type PasswordConfig = {
  message: string;
  mask?: string;
  validate?: (value: string) => true | string;
};

type PasswordState = {
  text: string;
  error: string | null;
};

export async function password(
  config: PasswordConfig,
): Promise<string | Cancel> {
  const { message, mask = "\u2022", validate } = config;

  const state: PasswordState = {
    text: "",
    error: null,
  };

  const promptId = generatePromptId();

  return createPrompt<string>({
    initialValue: "",
    osc: {
      v: 1,
      type: "input",
      id: promptId,
      message,
      placeholder: undefined,
    },

    onKey(key: KeyPress, current: { value: string; state: PromptState }) {
      const s = state;

      if (s.error) s.error = null;

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

      if (key.name === "escape") {
        return { value: current.value, state: "cancel" };
      }

      if (key.name === "backspace") {
        if (s.text.length > 0) {
          s.text = s.text.slice(0, -1);
        }
        return { value: s.text, state: "active" };
      }

      // Printable characters
      if (
        key.name.length === 1 &&
        !key.ctrl &&
        !key.meta &&
        key.name !== "space"
      ) {
        s.text += key.name;
        return { value: s.text, state: "active" };
      }

      if (key.name === "space") {
        s.text += " ";
        return { value: s.text, state: "active" };
      }

      return undefined;
    },

    render(promptState: PromptState, value: string) {
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
        return `${title}\n${gray(S_BAR)}  ${dim(mask.repeat(value.length))}\n`;
      }

      if (promptState === "cancel") {
        return `${title}\n${gray(S_BAR)}  ${dim(strikethrough("cancelled"))}\n`;
      }

      const masked = s.text.length > 0 ? mask.repeat(s.text.length) : dim("_");

      const lines = [title, `${gray(S_BAR)}  ${masked}`];

      if (promptState === "error" && s.error) {
        lines.push(`${getTheme().warning(S_STEP_ERROR)}  ${getTheme().warning(s.error)}`);
      } else {
        lines.push(gray(S_BAR_END));
      }

      return lines.join("\n");
    },
  });
}
