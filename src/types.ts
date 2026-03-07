export type KeyPress = {
  name: string;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
  raw: string;
};

export type Option<T> = {
  value: T;
  label: string;
  hint?: string;
  disabled?: boolean;
};

export type Separator = {
  separator: true;
  label?: string;
};

export type SelectOption<T> = Option<T> | Separator;

export function isSeparator<T>(opt: SelectOption<T>): opt is Separator {
  return "separator" in opt && opt.separator === true;
}

export type SelectConfig<T> = {
  message: string;
  options: SelectOption<T>[];
  initialValue?: T;
  maxItems?: number;
};

export type ConfirmConfig = {
  message: string;
  initialValue?: boolean;
  active?: string;
  inactive?: string;
};

export type InputConfig = {
  message: string;
  placeholder?: string;
  initialValue?: string;
  validate?: (value: string) => true | string;
};

export type MultiselectConfig<T> = {
  message: string;
  options: SelectOption<T>[];
  initialValues?: T[];
  required?: boolean;
  maxItems?: number;
};

export type PromptState = "initial" | "active" | "submit" | "cancel" | "error";

export type OscPromptPayload = {
  v: 1;
  type: "select" | "confirm" | "input" | "multiselect";
  id: string;
  message: string;
  options?: Array<{
    value: string;
    label: string;
    hint?: string;
    disabled?: boolean;
  }>;
  placeholder?: string;
  initialValue?: unknown;
  initialValues?: unknown[];
  active?: string;
  inactive?: string;
};

export type OscResolvePayload = {
  v: 1;
  type: "resolve";
  id: string;
  value: unknown;
};
