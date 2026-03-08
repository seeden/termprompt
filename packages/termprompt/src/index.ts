// Interactive prompts
export { select } from "./prompts/select.js";
export { confirm } from "./prompts/confirm.js";
export { input } from "./prompts/input.js";
export { multiselect } from "./prompts/multiselect.js";
export { password } from "./prompts/password.js";
export { search } from "./prompts/search.js";
export { number } from "./prompts/number.js";

// Composition
export { group } from "./group.js";

// Display
export { spinner } from "./spinner.js";
export { progress } from "./progress.js";
export { tasks } from "./tasks.js";
export { intro, outro, note, log } from "./log.js";

// Cancel handling
export { isCancel, CANCEL } from "./symbols.js";
export type { Cancel } from "./symbols.js";

// Theming
export { setTheme } from "./theme.js";
export type { Theme, ThemeConfig, ColorFn, ColorValue } from "./theme.js";
export { colors } from "./core/renderer.js";

// Types
export type {
  Option,
  Separator,
  SelectOption,
  SelectConfig,
  ConfirmConfig,
  InputConfig,
  MultiselectConfig,
} from "./types.js";
export { isSeparator } from "./types.js";
export type { PasswordConfig } from "./prompts/password.js";
export type { SearchConfig, SearchOption } from "./prompts/search.js";
export type { NumberConfig } from "./prompts/number.js";
export type { SpinnerConfig, Spinner } from "./spinner.js";
export type { ProgressConfig, Progress } from "./progress.js";
export type { TaskItem, TasksConfig, TasksResult } from "./tasks.js";
export type { GroupConfig, GroupOptions } from "./group.js";
