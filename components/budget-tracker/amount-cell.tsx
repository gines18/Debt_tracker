"use client";

import { useEffect, useRef, useState } from "react";
import { formatGBP, parseMoneyInput, penceToPounds } from "@/lib/budget-tracker/money";
import { cn } from "@/lib/utils";

type Props = {
  valuePence: number;
  disabled?: boolean;
  variant?: "debt" | "total" | "savings";
  onCommit: (pence: number) => Promise<void>;
};

export function AmountCell({
  valuePence,
  disabled,
  variant = "debt",
  onCommit,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(penceToPounds(valuePence).toFixed(2));
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing, valuePence]);

  async function commit() {
    const pence = parseMoneyInput(draft);
    if (pence === null) {
      setEditing(false);
      return;
    }
    if (pence === valuePence) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onCommit(pence);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  const textClass =
    variant === "total"
      ? "text-red-600 font-semibold dark:text-red-400"
      : variant === "savings"
        ? "text-emerald-700 font-semibold dark:text-emerald-400"
        : "text-stone-800 dark:text-stone-200";

  if (disabled) {
    return (
      <div className={cn("px-2 py-1.5 text-sm tabular-nums", textClass)}>
        {formatGBP(valuePence)}
      </div>
    );
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="h-8 w-full min-w-[5.5rem] rounded border border-emerald-400 bg-white px-2 text-sm tabular-nums text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-emerald-600 dark:bg-[#242424] dark:text-stone-100"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => void commit()}
        onKeyDown={(e) => {
          if (e.key === "Enter") void commit();
          if (e.key === "Escape") setEditing(false);
        }}
        disabled={saving}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={cn(
        "w-full min-w-[5.5rem] rounded px-2 py-1.5 text-left text-sm tabular-nums transition-colors hover:bg-stone-100 dark:hover:bg-stone-800/60",
        textClass,
        saving && "opacity-60",
      )}
      title="Click to edit"
    >
      {formatGBP(valuePence)}
    </button>
  );
}
