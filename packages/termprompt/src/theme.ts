import {
  cyan,
  red,
  green,
  yellow,
  blue,
  magenta,
  gray,
} from "./core/renderer.js";

export type ColorFn = (text: string) => string;

export type ColorValue =
  | ColorFn
  | "red"
  | "green"
  | "yellow"
  | "blue"
  | "magenta"
  | "cyan"
  | "gray"
  | (string & {});

export type Theme = {
  accent: ColorFn;
  success: ColorFn;
  error: ColorFn;
  warning: ColorFn;
  info: ColorFn;
};

export type ThemeConfig = {
  accent?: ColorValue;
  success?: ColorValue;
  error?: ColorValue;
  warning?: ColorValue;
  info?: ColorValue;
};

const namedColors: Record<string, ColorFn> = {
  red,
  green,
  yellow,
  blue,
  magenta,
  cyan,
  gray,
};

function parseHex(hex: string): [number, number, number] {
  const h = hex.slice(1);
  if (h.length === 3 || h.length === 4) {
    return [
      parseInt(h[0]! + h[0]!, 16),
      parseInt(h[1]! + h[1]!, 16),
      parseInt(h[2]! + h[2]!, 16),
    ];
  }
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function parseRgb(str: string): [number, number, number] {
  const match = str.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!match) throw new Error(`Invalid color: ${str}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function truecolor(r: number, g: number, b: number): ColorFn {
  const open = `\x1b[38;2;${r};${g};${b}m`;
  return (text: string) => `${open}${text}\x1b[39m`;
}

function resolveColor(value: ColorValue): ColorFn {
  if (typeof value === "function") return value;

  const named = namedColors[value];
  if (named) return named;

  if (value.startsWith("#")) return truecolor(...parseHex(value));
  if (value.startsWith("rgb")) return truecolor(...parseRgb(value));

  throw new Error(
    `Invalid color "${value}". Use a hex (#ff6600), rgb(255,100,0), named color (cyan, magenta, ...), or a function.`,
  );
}

let current: Theme = { accent: cyan, success: green, error: red, warning: yellow, info: blue };

export function setTheme(overrides: ThemeConfig): void {
  const next = { ...current };
  if (overrides.accent !== undefined) next.accent = resolveColor(overrides.accent);
  if (overrides.success !== undefined) next.success = resolveColor(overrides.success);
  if (overrides.error !== undefined) next.error = resolveColor(overrides.error);
  if (overrides.warning !== undefined) next.warning = resolveColor(overrides.warning);
  if (overrides.info !== undefined) next.info = resolveColor(overrides.info);
  current = next;
}

export function getTheme(): Theme {
  return current;
}
