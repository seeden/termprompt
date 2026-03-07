function sgr(open: number, close: number): (text: string) => string {
  const openSeq = `\x1b[${open}m`;
  const closeSeq = `\x1b[${close}m`;
  return (text: string) => `${openSeq}${text}${closeSeq}`;
}

export const dim = sgr(2, 22);
export const bold = sgr(1, 22);
export const italic = sgr(3, 23);
export const underline = sgr(4, 24);
export const inverse = sgr(7, 27);
export const strikethrough = sgr(9, 29);

export const red = sgr(31, 39);
export const green = sgr(32, 39);
export const yellow = sgr(33, 39);
export const blue = sgr(34, 39);
export const magenta = sgr(35, 39);
export const cyan = sgr(36, 39);
export const gray = sgr(90, 39);

export const cursor = {
  hide: "\x1b[?25l",
  show: "\x1b[?25h",
  up: (n = 1) => `\x1b[${n}A`,
  down: (n = 1) => `\x1b[${n}B`,
  forward: (n = 1) => `\x1b[${n}C`,
  back: (n = 1) => `\x1b[${n}D`,
  to: (col: number) => `\x1b[${col}G`,
  save: "\x1b7",
  restore: "\x1b8",
};

export const erase = {
  line: "\x1b[2K",
  toEnd: "\x1b[0J",
};

// Box-drawing symbols (clack-style)
export const S_BAR = "\u2502"; // │
export const S_BAR_END = "\u2514"; // └
export const S_BAR_START = "\u250c"; // ┌

export const S_RADIO_ACTIVE = "\u25c9"; // ◉
export const S_RADIO_INACTIVE = "\u25cb"; // ○

export const S_CHECKBOX_ACTIVE = "\u25a0"; // ■
export const S_CHECKBOX_INACTIVE = "\u25a1"; // □

export const S_STEP_ACTIVE = "\u25c7"; // ◇
export const S_STEP_SUBMIT = "\u25c6"; // ◆
export const S_STEP_CANCEL = "\u25a0"; // ■
export const S_STEP_ERROR = "\u25b2"; // ▲

const ANSI_REGEX =
  /\x1b\[[\?]?[0-9;]*[a-zA-Z]|\x1b\].*?(\x07|\x1b\\)|\x1b[78]/g;

export function stripAnsi(str: string): string {
  return str.replace(ANSI_REGEX, "");
}

export function lineCount(str: string): number {
  return str.split("\n").length;
}

export const colors = { red, green, yellow, blue, magenta, cyan, gray } as const;
