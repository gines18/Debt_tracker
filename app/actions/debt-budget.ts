"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  budgetStartDateSchema,
  budgetTitleSchema,
  debtNameSchema,
  uuidSchema,
} from "@/lib/budget-tracker/validation";
import { monthKeyFromDate, monthStartFromDate, nextMonthKey } from "@/lib/budget-tracker/months";
import type { Budget, BudgetSnapshot, Debt, MonthlyRecord } from "@/lib/budget-tracker/types";

const PLAN_PATH = "/plan";

async function requireUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Not authenticated");
  return { supabase, userId: user.id };
}

async function assertBudgetOwner(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, budgetId: string, userId: string) {
  const { data, error } = await supabase
    .from("budgets")
    .select("id")
    .eq("id", budgetId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Budget not found");
}

export async function listBudgets(): Promise<Budget[]> {
  const { supabase, userId } = await requireUser();
  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Budget[];
}

export async function fetchBudgetSnapshot(budgetId: string): Promise<BudgetSnapshot | null> {
  const id = uuidSchema.parse(budgetId);
  const { supabase, userId } = await requireUser();
  await assertBudgetOwner(supabase, id, userId);

  const { data: budget, error: bErr } = await supabase
    .from("budgets")
    .select("*")
    .eq("id", id)
    .single();
  if (bErr) throw bErr;

  const { data: debts, error: dErr } = await supabase
    .from("debts")
    .select("*")
    .eq("budget_id", id)
    .order("sort_order", { ascending: true });
  if (dErr) throw dErr;

  const { data: records, error: rErr } = await supabase
    .from("monthly_records")
    .select("*")
    .eq("budget_id", id);
  if (rErr) throw rErr;

  return {
    budget: budget as Budget,
    debts: (debts ?? []) as Debt[],
    records: (records ?? []) as MonthlyRecord[],
  };
}

/** Creates budget with starter debts and starting-month cells. */
export async function createBudget(input?: {
  title?: string;
  startDate?: string;
}): Promise<Budget> {
  const { supabase, userId } = await requireUser();
  const title = budgetTitleSchema.parse(input?.title ?? "My debt plan");
  const startDate = budgetStartDateSchema.parse(
    input?.startDate ?? monthKeyFromDate(monthStartFromDate(new Date().toISOString())),
  );

  const { data: budget, error } = await supabase
    .from("budgets")
    .insert({ user_id: userId, title, start_date: startDate })
    .select()
    .single();
  if (error) throw error;

  const budgetId = budget.id as string;
  const starterDebts = [
    { budget_id: budgetId, name: "Polish debt", sort_order: 0 },
    { budget_id: budgetId, name: "British debt", sort_order: 1 },
  ];
  const { data: debts, error: dErr } = await supabase
    .from("debts")
    .insert(starterDebts)
    .select();
  if (dErr) throw dErr;

  const month = startDate;
  const records = [
    ...(debts ?? []).map((d: Debt, i: number) => ({
      budget_id: budgetId,
      debt_id: d.id,
      month,
      amount_pence: i === 0 ? 500000 : 300000, // £5,000 / £3,000 example
      is_savings: false,
    })),
    {
      budget_id: budgetId,
      debt_id: null,
      month,
      amount_pence: 100000,
      is_savings: true,
    },
  ];
  const { error: rErr } = await supabase.from("monthly_records").insert(records);
  if (rErr) throw rErr;

  revalidatePath(PLAN_PATH);
  return budget as Budget;
}

export async function updateBudgetMeta(
  budgetId: string,
  patch: { title?: string; start_date?: string },
): Promise<void> {
  const id = uuidSchema.parse(budgetId);
  const { supabase, userId } = await requireUser();
  await assertBudgetOwner(supabase, id, userId);

  const payload: Record<string, string> = {};
  if (patch.title !== undefined) payload.title = budgetTitleSchema.parse(patch.title);
  if (patch.start_date !== undefined) {
    payload.start_date = budgetStartDateSchema.parse(patch.start_date);
  }
  if (Object.keys(payload).length === 0) return;

  const { error } = await supabase.from("budgets").update(payload).eq("id", id);
  if (error) throw error;
  revalidatePath(PLAN_PATH);
}

export async function deleteBudget(budgetId: string): Promise<void> {
  const id = uuidSchema.parse(budgetId);
  const { supabase, userId } = await requireUser();
  await assertBudgetOwner(supabase, id, userId);
  const { error } = await supabase.from("budgets").delete().eq("id", id);
  if (error) throw error;
  revalidatePath(PLAN_PATH);
}

export async function addDebt(budgetId: string, name: string): Promise<Debt> {
  const id = uuidSchema.parse(budgetId);
  const debtName = debtNameSchema.parse(name);
  const { supabase, userId } = await requireUser();
  await assertBudgetOwner(supabase, id, userId);

  const { data: maxRow } = await supabase
    .from("debts")
    .select("sort_order")
    .eq("budget_id", id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sort_order = (maxRow?.sort_order ?? -1) + 1;

  const { data: budget } = await supabase.from("budgets").select("start_date").eq("id", id).single();
  const startMonth = budget?.start_date as string;

  const { data: debt, error } = await supabase
    .from("debts")
    .insert({ budget_id: id, name: debtName, sort_order })
    .select()
    .single();
  if (error) throw error;

  const { data: existingMonths } = await supabase
    .from("monthly_records")
    .select("month")
    .eq("budget_id", id);
  const months = [...new Set((existingMonths ?? []).map((r: { month: string }) => r.month.slice(0, 10)))];
  if (months.length === 0 && startMonth) months.push(startMonth.slice(0, 10));

  if (months.length > 0) {
    const inserts = months.map((month) => ({
      budget_id: id,
      debt_id: debt.id,
      month,
      amount_pence: 0,
      is_savings: false,
    }));
    const { error: rErr } = await supabase.from("monthly_records").insert(inserts);
    if (rErr) throw rErr;
  }

  revalidatePath(PLAN_PATH);
  return debt as Debt;
}

export async function updateDebtName(debtId: string, name: string): Promise<void> {
  const id = uuidSchema.parse(debtId);
  const debtName = debtNameSchema.parse(name);
  const { supabase, userId } = await requireUser();

  const { data: debt } = await supabase.from("debts").select("budget_id").eq("id", id).single();
  if (!debt) throw new Error("Debt not found");
  await assertBudgetOwner(supabase, debt.budget_id, userId);

  const { error } = await supabase.from("debts").update({ name: debtName }).eq("id", id);
  if (error) throw error;
  revalidatePath(PLAN_PATH);
}

export async function deleteDebt(debtId: string): Promise<void> {
  const id = uuidSchema.parse(debtId);
  const { supabase, userId } = await requireUser();
  const { data: debt } = await supabase.from("debts").select("budget_id").eq("id", id).single();
  if (!debt) throw new Error("Debt not found");
  await assertBudgetOwner(supabase, debt.budget_id, userId);

  const { error } = await supabase.from("debts").delete().eq("id", id);
  if (error) throw error;
  revalidatePath(PLAN_PATH);
}

export async function upsertMonthlyAmount(input: {
  budgetId: string;
  month: string;
  amountPence: number;
  debtId?: string | null;
  isSavings?: boolean;
}): Promise<MonthlyRecord> {
  const budgetId = uuidSchema.parse(input.budgetId);
  const month = budgetStartDateSchema.parse(input.month.slice(0, 10));
  const amountPence = Math.max(0, Math.round(input.amountPence));
  const isSavings = input.isSavings ?? false;

  const { supabase, userId } = await requireUser();
  await assertBudgetOwner(supabase, budgetId, userId);

  if (isSavings) {
    const { data: existing } = await supabase
      .from("monthly_records")
      .select("id")
      .eq("budget_id", budgetId)
      .eq("is_savings", true)
      .eq("month", month)
      .maybeSingle();

    if (existing?.id) {
      const { data, error } = await supabase
        .from("monthly_records")
        .update({ amount_pence: amountPence })
        .eq("id", existing.id)
        .select()
        .single();
      if (error) throw error;
      revalidatePath(PLAN_PATH);
      return data as MonthlyRecord;
    }

    const { data, error } = await supabase
      .from("monthly_records")
      .insert({
        budget_id: budgetId,
        debt_id: null,
        month,
        amount_pence: amountPence,
        is_savings: true,
      })
      .select()
      .single();
    if (error) throw error;
    revalidatePath(PLAN_PATH);
    return data as MonthlyRecord;
  }

  const debtId = uuidSchema.parse(input.debtId!);
  const { data: existing } = await supabase
    .from("monthly_records")
    .select("id")
    .eq("budget_id", budgetId)
    .eq("debt_id", debtId)
    .eq("month", month)
    .maybeSingle();

  if (existing?.id) {
    const { data, error } = await supabase
      .from("monthly_records")
      .update({ amount_pence: amountPence })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    revalidatePath(PLAN_PATH);
    return data as MonthlyRecord;
  }

  const { data, error } = await supabase
    .from("monthly_records")
    .insert({
      budget_id: budgetId,
      debt_id: debtId,
      month,
      amount_pence: amountPence,
      is_savings: false,
    })
    .select()
    .single();
  if (error) throw error;
  revalidatePath(PLAN_PATH);
  return data as MonthlyRecord;
}

/** Adds the next calendar month column; copies prior month amounts for every row. */
export async function addMonthColumn(budgetId: string): Promise<string> {
  const id = uuidSchema.parse(budgetId);
  const { supabase, userId } = await requireUser();
  await assertBudgetOwner(supabase, id, userId);

  const { data: records, error } = await supabase
    .from("monthly_records")
    .select("*")
    .eq("budget_id", id);
  if (error) throw error;

  const { data: budget } = await supabase.from("budgets").select("start_date").eq("id", id).single();
  const startKey = monthKeyFromDate(monthStartFromDate(budget!.start_date));

  const months = [...new Set((records ?? []).map((r: MonthlyRecord) => r.month.slice(0, 10)))].sort();
  const lastMonth = months[months.length - 1] ?? startKey;
  const newMonth = nextMonthKey(lastMonth);

  if (months.includes(newMonth)) return newMonth;

  const { data: debts } = await supabase.from("debts").select("id").eq("budget_id", id);
  const prevRecords = (records ?? []).filter((r: MonthlyRecord) => r.month.slice(0, 10) === lastMonth);

  const inserts: {
    budget_id: string;
    debt_id: string | null;
    month: string;
    amount_pence: number;
    is_savings: boolean;
  }[] = [];

  for (const debt of debts ?? []) {
    const prev = prevRecords.find((r: MonthlyRecord) => r.debt_id === debt.id);
    inserts.push({
      budget_id: id,
      debt_id: debt.id,
      month: newMonth,
      amount_pence: prev?.amount_pence ?? 0,
      is_savings: false,
    });
  }

  const prevSavings = prevRecords.find((r: MonthlyRecord) => r.is_savings);
  inserts.push({
    budget_id: id,
    debt_id: null,
    month: newMonth,
    amount_pence: prevSavings?.amount_pence ?? 0,
    is_savings: true,
  });

  const { error: iErr } = await supabase.from("monthly_records").insert(inserts);
  if (iErr) throw iErr;

  revalidatePath(PLAN_PATH);
  return newMonth;
}

export async function ensureDefaultBudget(): Promise<BudgetSnapshot> {
  const list = await listBudgets();
  if (list.length === 0) {
    const created = await createBudget();
    const snap = await fetchBudgetSnapshot(created.id);
    if (!snap) throw new Error("Failed to load new budget");
    return snap;
  }
  const snap = await fetchBudgetSnapshot(list[0].id);
  if (!snap) throw new Error("Failed to load budget");
  return snap;
}
