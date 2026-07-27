/** Debt payoff grid — shared types (matches Supabase rows). */

export interface Budget {
  id: string;
  user_id: string;
  title: string;
  start_date: string; // ISO date YYYY-MM-DD
  created_at: string;
  updated_at: string;
}

export interface Debt {
  id: string;
  budget_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface MonthlyRecord {
  id: string;
  budget_id: string;
  debt_id: string | null;
  month: string; // first day of month YYYY-MM-DD
  amount_pence: number;
  is_savings: boolean;
  created_at: string;
  updated_at: string;
}

/** Client-side bundle for one budget. */
export interface BudgetSnapshot {
  budget: Budget;
  debts: Debt[];
  records: MonthlyRecord[];
}

export type GridRowKind = "debt" | "total" | "savings";

export interface GridRow {
  kind: GridRowKind;
  id: string;
  label: string;
  debtId?: string;
  /** Starting column + each month column, in pence. */
  cells: Record<string, number>;
  /** For debt rows: starting amount used for progress bars. */
  startingPence?: number;
}
