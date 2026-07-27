"use client";

import { useEffect, useRef, useState } from "react";
import { formatGBP, parseMoneyInput, penceToPounds } from "@/lib/budget-tracker/money";
import { cn } from "@/lib/utils";

type Props = {
  valuePence: number;
  disabled?: boolean;
  variant?: "debt" | "total" | "savings";
  showProgress?: boolean;
  startingPence?: number;
  onCommit: (pence: number) => Promise<void>;
};

export function AmountCell({
  valuePence,
  disabled,
  variant = "debt",
  showProgress,
  startingPence = 0,
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

  const progress =
    showProgress && startingPence > 0
      ? Math.min(100, Math.max(0, ((startingPence - valuePence) / startingPence) * 100))
      : null;

  const textClass =
    variant === "total"
      ? "text-red-600 font-semibold"
      : variant === "savings"
        ? "text-emerald-700 font-semibold"
        : "text-stone-800";

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
        className="h-8 w-full min-w-[5.5rem] rounded border border-emerald-400 px-2 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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
        "group relative w-full min-w-[5.5rem] rounded px-2 py-1.5 text-left text-sm tabular-nums transition-colors hover:bg-emerald-50/80",
        textClass,
        saving && "opacity-60",
      )}
      title="Click to edit"
    >
      {progress !== null && (
        <span
          className="pointer-events-none absolute inset-y-1 left-1 rounded bg-emerald-100/90 transition-all"
          style={{ width: `calc(${progress}% - 4px)`, maxWidth: "calc(100% - 8px)" }}
          aria-hidden
        />
      )}
      <span className="relative">{formatGBP(valuePence)}</span>
    </button>
  );
}
