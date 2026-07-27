import type { Debt, GridRow, MonthlyRecord } from "@/lib/budget-tracker/types";
import { buildMonthColumns, monthKeyFromDate, monthStartFromDate } from "@/lib/budget-tracker/months";

function recordKey(debtId: string | null, isSavings: boolean, month: string): string {
  return `${isSavings ? "savings" : debtId}:${month.slice(0, 10)}`;
}

export function indexRecords(records: MonthlyRecord[]): Map<string, MonthlyRecord> {
  const map = new Map<string, MonthlyRecord>();
  for (const r of records) {
    map.set(recordKey(r.debt_id, r.is_savings, r.month), r);
  }
  return map;
}

export function buildGridRows(
  startDateIso: string,
  debts: Debt[],
  records: MonthlyRecord[],
): { columns: string[]; rows: GridRow[]; startColumnKey: string } {
  const recordMonths = records.map((r) => r.month);
  const columns = buildMonthColumns(startDateIso, recordMonths);
  const startColumnKey = monthKeyFromDate(monthStartFromDate(startDateIso));
  const byKey = indexRecords(records);

  const sortedDebts = [...debts].sort((a, b) => a.sort_order - b.sort_order);

  const debtRows: GridRow[] = sortedDebts.map((debt) => {
    const cells: Record<string, number> = {};
    for (const col of columns) {
      const rec = byKey.get(recordKey(debt.id, false, col));
      cells[col] = rec?.amount_pence ?? 0;
    }
    const startingPence = cells[startColumnKey] ?? 0;
    return {
      kind: "debt",
      id: debt.id,
      label: debt.name,
      debtId: debt.id,
      cells,
      startingPence,
    };
  });

  const totalCells: Record<string, number> = {};
  for (const col of columns) {
    totalCells[col] = debtRows.reduce((sum, row) => sum + (row.cells[col] ?? 0), 0);
  }

  const savingsCells: Record<string, number> = {};
  for (const col of columns) {
    const rec = byKey.get(recordKey(null, true, col));
    savingsCells[col] = rec?.amount_pence ?? 0;
  }

  const rows: GridRow[] = [
    ...debtRows,
    {
      kind: "total",
      id: "total-debt",
      label: "Total debt",
      cells: totalCells,
    },
    {
      kind: "savings",
      id: "savings",
      label: "Savings",
      cells: savingsCells,
    },
  ];

  return { columns, rows, startColumnKey };
}

/** Debt payoff progress 0–100 (100 = fully paid off from starting balance). */
export function debtProgressPercent(startingPence: number, currentPence: number): number {
  if (startingPence <= 0) return 0;
  const paid = Math.max(0, startingPence - currentPence);
  return Math.min(100, Math.round((paid / startingPence) * 100));
}
