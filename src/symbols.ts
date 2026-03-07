const CANCEL_SYMBOL: unique symbol = Symbol("cancel");

export const CANCEL: typeof CANCEL_SYMBOL = CANCEL_SYMBOL;

export type Cancel = typeof CANCEL_SYMBOL;

export function isCancel(value: unknown): value is Cancel {
  return value === CANCEL_SYMBOL;
}
