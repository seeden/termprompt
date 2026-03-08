import type { ConfirmConfig, KeyPress, PromptState } from "../types.js";
import type { Cancel } from "../symbols.js";
import { createPrompt } from "../core/prompt.js";
import { generatePromptId } from "../osc/osc.js";
import {
  S_BAR,
  S_BAR_END,
  S_STEP_ACTIVE,
  S_STEP_SUBMIT,
  S_STEP_CANCEL,
  dim,
  gray,
  bold,
  strikethrough,
  underline,
} from "../core/renderer.js";
import { getTheme } from "../theme.js";

export async function confirm(
  config: ConfirmConfig,
): Promise<boolean | Cancel> {
  const {
    message,
    initialValue = false,
    active = "Yes",
    inactive = "No",
  } = config;

  const promptId = generatePromptId();

  return createPrompt<boolean>({
    initialValue,
    osc: {
      v: 1,
      type: "confirm",
      id: promptId,
      message,
      active,
      inactive,
      initialValue,
    },
    parseOscResolveValue(value: unknown) {
      if (typeof value !== "boolean") {
        throw new Error("Resolve value must be boolean");
      }
      return value;
    },

    onKey(key: KeyPress, current: { value: boolean; state: PromptState }) {
      if (
        key.name === "left" ||
        key.name === "h" ||
        key.name === "right" ||
        key.name === "l" ||
        key.name === "tab"
      ) {
        return { value: !current.value, state: "active" };
      }

      if (key.name === "y" || key.name === "Y") {
        return { value: true, state: "active" };
      }

      if (key.name === "n" || key.name === "N") {
        return { value: false, state: "active" };
      }

      if (key.name === "return") {
        return { value: current.value, state: "submit" };
      }

      if (key.name === "escape") {
        return { value: current.value, state: "cancel" };
      }

      return undefined;
    },

    render(state: PromptState, value: boolean) {
      const icon =
        state === "submit"
          ? getTheme().success(S_STEP_SUBMIT)
          : state === "cancel"
            ? getTheme().warning(S_STEP_CANCEL)
            : getTheme().accent(S_STEP_ACTIVE);

      const title = `${icon}  ${bold(message)}`;

      if (state === "submit") {
        return `${title}\n${gray(S_BAR)}  ${dim(value ? active : inactive)}\n`;
      }

      if (state === "cancel") {
        return `${title}\n${gray(S_BAR)}  ${dim(strikethrough("cancelled"))}\n`;
      }

      const accent = getTheme().accent;
      const yes = value ? accent(underline(active)) : dim(active);
      const no = value ? dim(inactive) : accent(underline(inactive));
      return `${title}\n${gray(S_BAR)}  ${yes} / ${no}\n${gray(S_BAR_END)}`;
    },
  });
}
