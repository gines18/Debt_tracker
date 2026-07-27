/** Money helpers — all amounts stored as integer pence in the database. */

export function poundsToPence(value: string | number): number {
  const n = typeof value === "string" ? parseFloat(value.replace(/,/g, "")) : value;
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function penceToPounds(pence: number): number {
  return pence / 100;
}

export function formatGBP(pence: number): string {
  const pounds = penceToPounds(pence);
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(pounds);
}

/** Parse user input like "1,234.56" or "1234" into pence. */
export function parseMoneyInput(raw: string): number | null {
  const trimmed = raw.trim().replace(/£/g, "").replace(/,/g, "");
  if (trimmed === "" || trimmed === "-") return null;
  const n = parseFloat(trimmed);
  if (!Number.isFinite(n) || n < 0) return null;
  return poundsToPence(n);
}
