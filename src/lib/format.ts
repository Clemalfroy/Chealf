const MONTH_NAMES_SHORT = [
  "", "jan", "fév", "mar", "avr", "mai", "jun",
  "jul", "aoû", "sep", "oct", "nov", "déc",
];

export function formatSeasonRange(
  start: number | null,
  end: number | null
): string | null {
  if (start == null || end == null) return null;
  const s = MONTH_NAMES_SHORT[start] ?? String(start);
  const e = MONTH_NAMES_SHORT[end] ?? String(end);
  return `${s}–${e}`;
}

const FRACTION_MAP: [number, string][] = [
  [0.125, "⅛"],
  [0.25, "¼"],
  [1 / 3, "⅓"],
  [0.5, "½"],
  [2 / 3, "⅔"],
  [0.75, "¾"],
];
const TOLERANCE = 0.02;

export function formatQuantity(value: number): string {
  if (value === 0) return "0";
  if (value < 0) return value.toString();

  const whole = Math.floor(value);
  const frac = value - whole;

  // Near-integer: frac close to 0 or close to 1
  if (frac <= TOLERANCE) return `${whole}`;
  if (frac >= 1 - TOLERANCE) return `${whole + 1}`;

  for (const [target, symbol] of FRACTION_MAP) {
    if (Math.abs(frac - target) < TOLERANCE) {
      return whole > 0 ? `${whole} ${symbol}` : symbol;
    }
  }

  return value.toFixed(1);
}
