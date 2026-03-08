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

export type OscSpinnerPayload = {
  v: 1;
  type: "spinner";
  id: string;
  status: "start" | "update" | "stop";
  message: string;
  code?: number;
};

export type OscProgressPayload = {
  v: 1;
  type: "progress";
  id: string;
  status: "start" | "update" | "stop";
  message: string;
  percent: number;
  code?: number;
};

export type OscTasksPayload = {
  v: 1;
  type: "tasks";
  id: string;
  status: "start" | "update" | "stop";
  tasks: Array<{ title: string; status: string }>;
};

export type OscLogPayload = {
  v: 1;
  type: "log";
  level:
    | "intro"
    | "outro"
    | "info"
    | "success"
    | "warn"
    | "error"
    | "step"
    | "note";
  message: string;
  title?: string | null;
};

export type OscPayload =
  | OscPromptPayload
  | OscResolvePayload
  | OscSpinnerPayload
  | OscProgressPayload
  | OscTasksPayload
  | OscLogPayload;
