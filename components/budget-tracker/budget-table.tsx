"use client";

import { useCallback, useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { toast } from "sonner";
import { upsertMonthlyAmount, deleteDebt, updateDebtName } from "@/app/actions/debt-budget";
import { AmountCell } from "@/components/budget-tracker/amount-cell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buildGridRows } from "@/lib/budget-tracker/grid";
import { formatMonthHeader } from "@/lib/budget-tracker/months";
import type { BudgetSnapshot, GridRow } from "@/lib/budget-tracker/types";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";

type Props = {
  snapshot: BudgetSnapshot;
  onRefresh: () => void;
};

export function BudgetTable({ snapshot, onRefresh }: Props) {
  const { budget, debts, records } = snapshot;
  const { columns, rows, startColumnKey } = useMemo(
    () => buildGridRows(budget.start_date, debts, records),
    [budget.start_date, debts, records],
  );

  const handleDeleteDebt = useCallback(
    async (debtId: string) => {
      if (!confirm("Remove this debt row and all its monthly amounts?")) return;
      try {
        await deleteDebt(debtId);
        toast.success("Debt removed");
        onRefresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Delete failed");
      }
    },
    [onRefresh],
  );

  const upsertCell = useCallback(
    async (budgetId: string, month: string, row: GridRow, amountPence: number) => {
      try {
        await upsertMonthlyAmount({
          budgetId,
          month,
          amountPence,
          debtId: row.kind === "debt" ? row.debtId : null,
          isSavings: row.kind === "savings",
        });
        onRefresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed");
        throw err;
      }
    },
    [onRefresh],
  );

  const tableColumns = useMemo<ColumnDef<GridRow>[]>(() => {
    const labelCol: ColumnDef<GridRow> = {
      id: "label",
      header: () => <span className="pl-2">Account</span>,
      cell: ({ row }) => {
        const r = row.original;
        if (r.kind !== "debt") {
          return (
            <span
              className={cn(
                "pl-2 font-medium",
                r.kind === "total" && "text-red-600",
                r.kind === "savings" && "text-emerald-700",
              )}
            >
              {r.label}
            </span>
          );
        }
        return (
          <div className="flex items-center gap-1 pl-1">
            <InlineDebtName
              debtId={r.debtId!}
              name={r.label}
              onRenamed={onRefresh}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-stone-400 hover:text-red-600"
              onClick={() => void handleDeleteDebt(r.debtId!)}
              aria-label={`Delete ${r.label}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      },
    };

    const monthCols: ColumnDef<GridRow>[] = columns.map((col) => ({
      id: col,
      header: () => (
        <span className="text-xs sm:text-sm">
          {formatMonthHeader(col, col === startColumnKey)}
        </span>
      ),
      cell: ({ row }) => {
        const r = row.original;
        const pence = r.cells[col] ?? 0;
        const isStart = col === startColumnKey;

        return (
          <AmountCell
            valuePence={pence}
            disabled={r.kind === "total"}
            variant={r.kind === "total" ? "total" : r.kind === "savings" ? "savings" : "debt"}
            showProgress={r.kind === "debt" && !isStart}
            startingPence={r.startingPence}
            onCommit={(amountPence) =>
              upsertCell(budget.id, col, r, amountPence)
            }
          />
        );
      },
    }));

    return [labelCol, ...monthCols];
  }, [budget.id, columns, handleDeleteDebt, startColumnKey, upsertCell]);

  const table = useReactTable({
    data: rows,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => (
                <TableHead key={header.id} className={header.id === "label" ? "sticky left-0 z-10 bg-stone-50/95 min-w-[10rem]" : undefined}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className={cn(
                row.original.kind === "total" && "bg-red-50/40",
                row.original.kind === "savings" && "bg-emerald-50/40",
              )}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className={cell.column.id === "label" ? "sticky left-0 z-10 bg-white" : undefined}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function InlineDebtName({
  debtId,
  name,
  onRenamed,
}: {
  debtId: string;
  name: string;
  onRenamed: () => void;
}) {
  async function save(next: string) {
    if (next.trim() === name) return;
    try {
      await updateDebtName(debtId, next);
      onRenamed();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rename failed");
    }
  }

  return (
    <Input
      defaultValue={name}
      className="h-8 border-transparent bg-transparent font-medium shadow-none focus-visible:border-stone-200"
      onBlur={(e) => void save(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
    />
  );
}
