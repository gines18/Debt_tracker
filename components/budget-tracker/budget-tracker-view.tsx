"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  addMonthColumn,
  createBudget,
  deleteBudget,
  fetchBudgetSnapshot,
  listBudgets,
  updateBudgetMeta,
} from "@/app/actions/debt-budget";
import { AddDebtDialog } from "@/components/budget-tracker/add-debt-dialog";
import { BudgetTable } from "@/components/budget-tracker/budget-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { monthKeyFromDate, monthStartFromDate } from "@/lib/budget-tracker/months";
import type { Budget, BudgetSnapshot } from "@/lib/budget-tracker/types";
import { createClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Loader2, Plus } from "lucide-react";

type Props = {
  initialSnapshot: BudgetSnapshot;
  initialBudgets: Budget[];
};

export function BudgetTrackerView({ initialSnapshot, initialBudgets }: Props) {
  const [budgets, setBudgets] = useState(initialBudgets);
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();
  const supabase = createClient();

  const refresh = useCallback(async (budgetId?: string) => {
    const id = budgetId ?? snapshot.budget.id;
    setLoading(true);
    try {
      const [list, snap] = await Promise.all([listBudgets(), fetchBudgetSnapshot(id)]);
      if (list) setBudgets(list);
      if (snap) setSnapshot(snap);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to refresh");
    } finally {
      setLoading(false);
    }
  }, [snapshot.budget.id]);

  useEffect(() => {
    const budgetId = snapshot.budget.id;
    const channel = supabase
      .channel(`budget-${budgetId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "monthly_records", filter: `budget_id=eq.${budgetId}` },
        () => void refresh(budgetId),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "debts", filter: `budget_id=eq.${budgetId}` },
        () => void refresh(budgetId),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "budgets", filter: `id=eq.${budgetId}` },
        () => void refresh(budgetId),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refresh, snapshot.budget.id, supabase]);

  function switchBudget(id: string) {
    startTransition(() => void refresh(id));
  }

  async function handleNewBudget() {
    try {
      const b = await createBudget();
      toast.success("Budget created");
      await refresh(b.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create budget");
    }
  }

  async function handleAddMonth() {
    try {
      await addMonthColumn(snapshot.budget.id);
      toast.success("Month added");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add month");
    }
  }

  async function saveTitle(title: string) {
    if (title.trim() === snapshot.budget.title) return;
    try {
      await updateBudgetMeta(snapshot.budget.id, { title });
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save title");
    }
  }

  async function saveStartDate(start_date: string) {
    if (start_date === snapshot.budget.start_date.slice(0, 10)) return;
    try {
      await updateBudgetMeta(snapshot.budget.id, { start_date });
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save start date");
    }
  }

  async function handleDeleteBudget() {
    if (budgets.length <= 1) {
      toast.error("Create another budget before deleting this one");
      return;
    }
    if (!confirm("Delete this budget and all its data?")) return;
    try {
      const id = snapshot.budget.id;
      await deleteBudget(id);
      toast.success("Budget deleted");
      const remaining = budgets.filter((b) => b.id !== id);
      if (remaining[0]) await refresh(remaining[0].id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const startDateValue = snapshot.budget.start_date.slice(0, 10);

  return (
    <div className="min-h-screen bg-[#f7f6f3] text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Link href="/" className="font-mono text-lg font-bold tracking-tight">
            budget<span className="text-emerald-600">.</span>tracker
          </Link>
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <Link href="/" className="rounded-md px-3 py-1.5 text-stone-600 hover:bg-stone-100">
              Monthly budget
            </Link>
            <span className="rounded-md bg-emerald-50 px-3 py-1.5 font-medium text-emerald-800">
              Debt plan
            </span>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <Label htmlFor="budget-title" className="text-stone-500">
              Budget title
            </Label>
            <Input
              id="budget-title"
              defaultValue={snapshot.budget.title}
              className="max-w-md text-lg font-semibold"
              onBlur={(e) => void saveTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            />
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <Label htmlFor="start-date" className="text-xs text-stone-500">
                  Start date (starting column)
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  defaultValue={startDateValue}
                  className="mt-1 w-auto"
                  onBlur={(e) => void saveStartDate(e.target.value || startDateValue)}
                />
              </div>
              {(loading || pending) && (
                <span className="flex items-center gap-1 text-xs text-stone-500">
                  <Loader2 className="h-3 w-3 animate-spin" /> Syncing…
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-9 rounded-md border border-stone-200 bg-white px-3 text-sm"
              value={snapshot.budget.id}
              onChange={(e) => switchBudget(e.target.value)}
            >
              {budgets.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                </option>
              ))}
            </select>
            <Button variant="outline" size="sm" onClick={() => void handleNewBudget()}>
              <Plus className="h-4 w-4" /> New budget
            </Button>
            <Button variant="ghost" size="sm" className="text-red-600" onClick={() => void handleDeleteBudget()}>
              Delete
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <AddDebtDialog budgetId={snapshot.budget.id} onAdded={() => void refresh()} />
          <Button variant="outline" size="sm" onClick={() => void handleAddMonth()}>
            + Add month column
          </Button>
        </div>

        <p className="text-sm text-stone-500">
          Click any amount to edit. Total debt is calculated automatically. Green savings row stays separate.
          Starting column:{" "}
          <span className="font-medium text-stone-700">
            {formatMonthLabel(snapshot.budget.start_date)}
          </span>
        </p>

        <div className={cn("overflow-x-auto pb-2", loading && "opacity-70 pointer-events-none")}>
          <BudgetTable snapshot={snapshot} onRefresh={() => void refresh()} />
        </div>
      </main>
    </div>
  );
}

function formatMonthLabel(iso: string) {
  return monthKeyFromDate(monthStartFromDate(iso)).slice(0, 7);
}
