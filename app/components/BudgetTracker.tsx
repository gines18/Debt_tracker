"use client";

import { useState, useEffect, useRef } from "react";
<<<<<<< HEAD
import {
  Chart,
  ArcElement,
  DoughnutController,
  Tooltip,
  Legend,
} from "chart.js";
=======
import { Chart, ArcElement, DoughnutController, Tooltip, Legend } from "chart.js";
>>>>>>> dc8c70b06b61225d390414458dba6927cfd9fd99

Chart.register(ArcElement, DoughnutController, Tooltip, Legend);

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = "Fixed" | "Essentials" | "Debt" | "Savings" | "Personal";

interface Expense {
  id: string;
  name: string;
  amount: number;
  cat: Category;
}

// monthKey = "2026-03"
type MonthData = {
<<<<<<< HEAD
  expenses: Expense[]; // the expense list for that month (copied from template on first open)
  paidIds: string[]; // which expense ids are marked paid
=======
  expenses: Expense[];   // the expense list for that month (copied from template on first open)
  paidIds: string[];     // which expense ids are marked paid
>>>>>>> dc8c70b06b61225d390414458dba6927cfd9fd99
};

// ─── Constants ────────────────────────────────────────────────────────────────

const INCOME = 1540;

const DEFAULT_EXPENSES: Expense[] = [
<<<<<<< HEAD
  { id: "rent", name: "Rent", amount: 60, cat: "Fixed" },
  { id: "council", name: "Council tax", amount: 140, cat: "Fixed" },
  { id: "water", name: "Water", amount: 35, cat: "Fixed" },
  { id: "gas", name: "Gas", amount: 60, cat: "Fixed" },
  { id: "elec", name: "Electricity", amount: 60, cat: "Fixed" },
  { id: "life", name: "Life insurance", amount: 13, cat: "Fixed" },
  { id: "internet", name: "Internet", amount: 15, cat: "Fixed" },
  { id: "mobile", name: "Mobile", amount: 5.5, cat: "Fixed" },
  { id: "groceries", name: "Groceries", amount: 300, cat: "Essentials" },
  { id: "bus", name: "Bus ticket", amount: 61, cat: "Essentials" },
  { id: "uk_bank", name: "British bank (debt)", amount: 250, cat: "Debt" },
  { id: "pl_bank", name: "Polish bank (debt)", amount: 250, cat: "Debt" },
  { id: "buffer", name: "Emergency buffer", amount: 150, cat: "Savings" },
  { id: "fun", name: "Fun / wants", amount: 140.5, cat: "Personal" },
];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const CATEGORY_OPTIONS: Category[] = [
  "Fixed",
  "Essentials",
  "Debt",
  "Savings",
  "Personal",
];

const CAT_COLORS: Record<Category, string> = {
  Fixed: "#378ADD",
  Essentials: "#1D9E75",
  Debt: "#D85A30",
  Savings: "#BA7517",
  Personal: "#7F77DD",
};
const CAT_BG: Record<Category, string> = {
  Fixed: "#E6F1FB",
  Essentials: "#E1F5EE",
  Debt: "#FAECE7",
  Savings: "#FAEEDA",
  Personal: "#EEEDFE",
};
const CAT_ICONS: Record<Category, string> = {
  Fixed: "🏠",
  Essentials: "🛒",
  Debt: "💳",
  Savings: "🏦",
  Personal: "✨",
=======
  { id: "rent",      name: "Rent",                amount: 60,    cat: "Fixed"      },
  { id: "council",   name: "Council tax",          amount: 140,   cat: "Fixed"      },
  { id: "water",     name: "Water",                amount: 35,    cat: "Fixed"      },
  { id: "gas",       name: "Gas",                  amount: 60,    cat: "Fixed"      },
  { id: "elec",      name: "Electricity",          amount: 60,    cat: "Fixed"      },
  { id: "life",      name: "Life insurance",       amount: 13,    cat: "Fixed"      },
  { id: "internet",  name: "Internet",             amount: 15,    cat: "Fixed"      },
  { id: "mobile",    name: "Mobile",               amount: 5.5,   cat: "Fixed"      },
  { id: "groceries", name: "Groceries",            amount: 300,   cat: "Essentials" },
  { id: "bus",       name: "Bus ticket",           amount: 61,    cat: "Essentials" },
  { id: "uk_bank",   name: "British bank (debt)",  amount: 250,   cat: "Debt"       },
  { id: "pl_bank",   name: "Polish bank (debt)",   amount: 250,   cat: "Debt"       },
  { id: "buffer",    name: "Emergency buffer",     amount: 150,   cat: "Savings"    },
  { id: "fun",       name: "Fun / wants",          amount: 140.5, cat: "Personal"   },
];

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const CATEGORY_OPTIONS: Category[] = ["Fixed","Essentials","Debt","Savings","Personal"];

const CAT_COLORS: Record<Category, string> = {
  Fixed:      "#378ADD",
  Essentials: "#1D9E75",
  Debt:       "#D85A30",
  Savings:    "#BA7517",
  Personal:   "#7F77DD",
};
const CAT_BG: Record<Category, string> = {
  Fixed:      "#E6F1FB",
  Essentials: "#E1F5EE",
  Debt:       "#FAECE7",
  Savings:    "#FAEEDA",
  Personal:   "#EEEDFE",
};
const CAT_ICONS: Record<Category, string> = {
  Fixed: "🏠", Essentials: "🛒", Debt: "💳", Savings: "🏦", Personal: "✨",
>>>>>>> dc8c70b06b61225d390414458dba6927cfd9fd99
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return "£" + n.toFixed(2).replace(/\.00$/, "");
}
function uid() {
  return Math.random().toString(36).slice(2, 9);
}
function monthKey(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}
function loadAll(): Record<string, MonthData> {
  try {
    const raw = localStorage.getItem("budgetAllMonths");
    return raw ? JSON.parse(raw) : {};
<<<<<<< HEAD
  } catch {
    return {};
  }
}
function saveAll(data: Record<string, MonthData>) {
  try {
    localStorage.setItem("budgetAllMonths", JSON.stringify(data));
  } catch {}
=======
  } catch { return {}; }
}
function saveAll(data: Record<string, MonthData>) {
  try { localStorage.setItem("budgetAllMonths", JSON.stringify(data)); } catch {}
>>>>>>> dc8c70b06b61225d390414458dba6927cfd9fd99
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BudgetTracker() {
  const today = new Date();
<<<<<<< HEAD
  const [year, setYear] = useState(today.getFullYear());
=======
  const [year,  setYear]  = useState(today.getFullYear());
>>>>>>> dc8c70b06b61225d390414458dba6927cfd9fd99
  const [month, setMonth] = useState(today.getMonth()); // 0-based

  // All months stored together
  const [allData, setAllData] = useState<Record<string, MonthData>>({});

  // UI state
<<<<<<< HEAD
  const [activeCat, setActiveCat] = useState<Category | "All">("All");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [modal, setModal] = useState<{
    open: boolean;
    mode: "add" | "edit";
    expense: Expense | null;
  }>({
    open: false,
    mode: "add",
    expense: null,
  });
  const [form, setForm] = useState({
    name: "",
    amount: "",
    cat: "Fixed" as Category,
  });
  const [formError, setFormError] = useState("");

  const donutRef = useRef<HTMLCanvasElement>(null);
=======
  const [activeCat,     setActiveCat]     = useState<Category | "All">("All");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [modal, setModal] = useState<{ open: boolean; mode: "add"|"edit"; expense: Expense|null }>({
    open: false, mode: "add", expense: null,
  });
  const [form,      setForm]      = useState({ name: "", amount: "", cat: "Fixed" as Category });
  const [formError, setFormError] = useState("");

  const donutRef      = useRef<HTMLCanvasElement>(null);
>>>>>>> dc8c70b06b61225d390414458dba6927cfd9fd99
  const chartInstance = useRef<Chart | null>(null);

  // ── Load from localStorage once ───────────────────────────────────────────
  useEffect(() => {
    const stored = loadAll();
    setAllData(stored);
  }, []);

  // ── Get or initialise this month's data ───────────────────────────────────
  const key = monthKey(year, month);

  const monthData: MonthData = allData[key] ?? {
<<<<<<< HEAD
    expenses: DEFAULT_EXPENSES.map((e) => ({ ...e, id: e.id })),
    paidIds: [],
  };

  const expenses = monthData.expenses;
  const paidIds = new Set(monthData.paidIds);
=======
    expenses: DEFAULT_EXPENSES.map(e => ({ ...e, id: e.id })),
    paidIds:  [],
  };

  const expenses = monthData.expenses;
  const paidIds  = new Set(monthData.paidIds);
>>>>>>> dc8c70b06b61225d390414458dba6927cfd9fd99

  // ── Persist whenever allData changes ─────────────────────────────────────
  useEffect(() => {
    if (Object.keys(allData).length > 0) saveAll(allData);
  }, [allData]);

  // ── Ensure current month exists in allData ────────────────────────────────
  useEffect(() => {
<<<<<<< HEAD
    setAllData((prev) => {
=======
    setAllData(prev => {
>>>>>>> dc8c70b06b61225d390414458dba6927cfd9fd99
      if (prev[key]) return prev;
      const updated = {
        ...prev,
        [key]: {
<<<<<<< HEAD
          expenses: DEFAULT_EXPENSES.map((e) => ({ ...e })),
          paidIds: [],
=======
          expenses: DEFAULT_EXPENSES.map(e => ({ ...e })),
          paidIds:  [],
>>>>>>> dc8c70b06b61225d390414458dba6927cfd9fd99
        },
      };
      return updated;
    });
  }, [key]);

  // ── Donut chart ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!donutRef.current) return;
    if (chartInstance.current) chartInstance.current.destroy();

    const groups: Partial<Record<Category, number>> = {};
<<<<<<< HEAD
    expenses.forEach((e) => {
      groups[e.cat] = (groups[e.cat] ?? 0) + e.amount;
    });
    const labels = Object.keys(groups) as Category[];
    const data = labels.map((l) => groups[l]!);
    const bgColors = labels.map((l) => CAT_COLORS[l]);

    chartInstance.current = new Chart(donutRef.current, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          { data, backgroundColor: bgColors, borderWidth: 0, hoverOffset: 4 },
        ],
      },
      options: {
        responsive: false,
        cutout: "72%",
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: (i) => " " + fmt(i.parsed as number) },
          },
        },
      },
    });
    return () => {
      chartInstance.current?.destroy();
    };
=======
    expenses.forEach(e => { groups[e.cat] = (groups[e.cat] ?? 0) + e.amount; });
    const labels    = Object.keys(groups) as Category[];
    const data      = labels.map(l => groups[l]!);
    const bgColors  = labels.map(l => CAT_COLORS[l]);

    chartInstance.current = new Chart(donutRef.current, {
      type: "doughnut",
      data: { labels, datasets: [{ data, backgroundColor: bgColors, borderWidth: 0, hoverOffset: 4 }] },
      options: {
        responsive: false, cutout: "72%",
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: i => " " + fmt(i.parsed as number) } },
        },
      },
    });
    return () => { chartInstance.current?.destroy(); };
>>>>>>> dc8c70b06b61225d390414458dba6927cfd9fd99
  }, [expenses]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  function updateMonth(patch: Partial<MonthData>) {
<<<<<<< HEAD
    setAllData((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? monthData), ...patch },
=======
    setAllData(prev => ({
      ...prev,
      [key]: { ...( prev[key] ?? monthData ), ...patch },
>>>>>>> dc8c70b06b61225d390414458dba6927cfd9fd99
    }));
  }

  function toggle(id: string) {
    const next = new Set(paidIds);
    next.has(id) ? next.delete(id) : next.add(id);
    updateMonth({ paidIds: [...next] });
  }

<<<<<<< HEAD
  function resetPaid() {
    updateMonth({ paidIds: [] });
  }
=======
  function resetPaid() { updateMonth({ paidIds: [] }); }
>>>>>>> dc8c70b06b61225d390414458dba6927cfd9fd99

  function openAdd() {
    setForm({ name: "", amount: "", cat: "Fixed" });
    setFormError("");
    setModal({ open: true, mode: "add", expense: null });
  }
  function openEdit(e: Expense) {
    setForm({ name: e.name, amount: String(e.amount), cat: e.cat });
    setFormError("");
    setModal({ open: true, mode: "edit", expense: e });
  }
<<<<<<< HEAD
  function closeModal() {
    setModal({ open: false, mode: "add", expense: null });
  }

  function submitForm() {
    const name = form.name.trim();
    const amount = parseFloat(form.amount);
    if (!name) {
      setFormError("Name is required.");
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      setFormError("Enter a valid amount greater than 0.");
      return;
    }

    if (modal.mode === "add") {
      updateMonth({
        expenses: [...expenses, { id: uid(), name, amount, cat: form.cat }],
      });
    } else if (modal.expense) {
      updateMonth({
        expenses: expenses.map((e) =>
          e.id === modal.expense!.id
            ? { ...e, name, amount, cat: form.cat }
            : e,
=======
  function closeModal() { setModal({ open: false, mode: "add", expense: null }); }

  function submitForm() {
    const name   = form.name.trim();
    const amount = parseFloat(form.amount);
    if (!name)                          { setFormError("Name is required.");                       return; }
    if (isNaN(amount) || amount <= 0)   { setFormError("Enter a valid amount greater than 0.");    return; }

    if (modal.mode === "add") {
      updateMonth({ expenses: [...expenses, { id: uid(), name, amount, cat: form.cat }] });
    } else if (modal.expense) {
      updateMonth({
        expenses: expenses.map(e =>
          e.id === modal.expense!.id ? { ...e, name, amount, cat: form.cat } : e
>>>>>>> dc8c70b06b61225d390414458dba6927cfd9fd99
        ),
      });
    }
    closeModal();
  }

  function deleteExpense(id: string) {
    const next = new Set(paidIds);
    next.delete(id);
<<<<<<< HEAD
    updateMonth({
      expenses: expenses.filter((e) => e.id !== id),
      paidIds: [...next],
    });
=======
    updateMonth({ expenses: expenses.filter(e => e.id !== id), paidIds: [...next] });
>>>>>>> dc8c70b06b61225d390414458dba6927cfd9fd99
    setDeleteConfirm(null);
  }

  // ── Month navigation ──────────────────────────────────────────────────────

  function prevMonth() {
<<<<<<< HEAD
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
    setActiveCat("All");
  }
  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
=======
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else              setMonth(m => m - 1);
    setActiveCat("All");
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else               setMonth(m => m + 1);
>>>>>>> dc8c70b06b61225d390414458dba6927cfd9fd99
    setActiveCat("All");
  }

  // ── Derived values ────────────────────────────────────────────────────────

  const totalBudgeted = expenses.reduce((s, e) => s + e.amount, 0);
<<<<<<< HEAD
  const paidTotal = expenses
    .filter((e) => paidIds.has(e.id))
    .reduce((s, e) => s + e.amount, 0);
  const remaining = INCOME - paidTotal;
  const unallocated = INCOME - totalBudgeted;
  const pct = Math.min(Math.round((paidTotal / INCOME) * 100), 100);
  const progressColor = pct > 85 ? "#D85A30" : pct > 60 ? "#BA7517" : "#1D9E75";

  const catGroups: Partial<Record<Category, number>> = {};
  expenses.forEach((e) => {
    catGroups[e.cat] = (catGroups[e.cat] ?? 0) + e.amount;
  });

  const visible =
    activeCat === "All"
      ? expenses
      : expenses.filter((e) => e.cat === activeCat);

  const isCurrentMonth =
    year === today.getFullYear() && month === today.getMonth();

  // Year overview: paidTotal per month
  const yearSummary = MONTH_NAMES.map((name, i) => {
    const k = monthKey(year, i);
    const md = allData[k];
    if (!md) return { name: name.slice(0, 3), pct: 0, hasData: false };
    const total = md.expenses.reduce((s, e) => s + e.amount, 0);
    const paid = md.expenses
      .filter((e) => md.paidIds.includes(e.id))
      .reduce((s, e) => s + e.amount, 0);
    return {
      name: name.slice(0, 3),
      pct: total > 0 ? Math.round((paid / total) * 100) : 0,
      hasData: true,
    };
=======
  const paidTotal     = expenses.filter(e => paidIds.has(e.id)).reduce((s, e) => s + e.amount, 0);
  const remaining     = INCOME - paidTotal;
  const unallocated   = INCOME - totalBudgeted;
  const pct           = Math.min(Math.round((paidTotal / INCOME) * 100), 100);
  const progressColor = pct > 85 ? "#D85A30" : pct > 60 ? "#BA7517" : "#1D9E75";

  const catGroups: Partial<Record<Category, number>> = {};
  expenses.forEach(e => { catGroups[e.cat] = (catGroups[e.cat] ?? 0) + e.amount; });

  const visible = activeCat === "All" ? expenses : expenses.filter(e => e.cat === activeCat);

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  // Year overview: paidTotal per month
  const yearSummary = MONTH_NAMES.map((name, i) => {
    const k  = monthKey(year, i);
    const md = allData[k];
    if (!md) return { name: name.slice(0, 3), pct: 0, hasData: false };
    const total  = md.expenses.reduce((s, e) => s + e.amount, 0);
    const paid   = md.expenses.filter(e => md.paidIds.includes(e.id)).reduce((s, e) => s + e.amount, 0);
    return { name: name.slice(0, 3), pct: total > 0 ? Math.round((paid / total) * 100) : 0, hasData: true };
>>>>>>> dc8c70b06b61225d390414458dba6927cfd9fd99
  });

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <main style={s.shell}>
<<<<<<< HEAD
      {/* ── Modal ── */}
      {modal.open && (
        <div style={s.overlay} onClick={closeModal}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <span style={s.modalTitle}>
                {modal.mode === "add" ? "Add expense" : "Edit expense"}
              </span>
              <button style={s.modalClose} onClick={closeModal}>
                ✕
              </button>
=======

      {/* ── Modal ── */}
      {modal.open && (
        <div style={s.overlay} onClick={closeModal}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <span style={s.modalTitle}>{modal.mode === "add" ? "Add expense" : "Edit expense"}</span>
              <button style={s.modalClose} onClick={closeModal}>✕</button>
>>>>>>> dc8c70b06b61225d390414458dba6927cfd9fd99
            </div>

            <div style={s.fieldGroup}>
              <label style={s.label}>Name</label>
<<<<<<< HEAD
              <input
                style={s.input}
                value={form.name}
                placeholder="e.g. Netflix"
                autoFocus
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                onKeyDown={(e) => e.key === "Enter" && submitForm()}
              />
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>Amount (£)</label>
              <input
                style={s.input}
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                placeholder="0.00"
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
                onKeyDown={(e) => e.key === "Enter" && submitForm()}
              />
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>Category</label>
              <select
                style={s.select}
                value={form.cat}
                onChange={(e) =>
                  setForm((f) => ({ ...f, cat: e.target.value as Category }))
                }
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {CAT_ICONS[c]} {c}
                  </option>
=======
              <input style={s.input} value={form.name} placeholder="e.g. Netflix" autoFocus
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && submitForm()} />
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>Amount (£)</label>
              <input style={s.input} type="number" min="0" step="0.01" value={form.amount} placeholder="0.00"
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && submitForm()} />
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>Category</label>
              <select style={s.select} value={form.cat}
                onChange={e => setForm(f => ({ ...f, cat: e.target.value as Category }))}>
                {CATEGORY_OPTIONS.map(c => (
                  <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>
>>>>>>> dc8c70b06b61225d390414458dba6927cfd9fd99
                ))}
              </select>
            </div>

            {formError && <div style={s.formError}>{formError}</div>}

            <div style={s.modalActions}>
<<<<<<< HEAD
              <button style={s.btnCancel} onClick={closeModal}>
                Cancel
              </button>
=======
              <button style={s.btnCancel} onClick={closeModal}>Cancel</button>
>>>>>>> dc8c70b06b61225d390414458dba6927cfd9fd99
              <button style={s.btnSubmit} onClick={submitForm}>
                {modal.mode === "add" ? "Add expense" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div style={s.topbar}>
<<<<<<< HEAD
        <div style={s.logo}>
          budget<span style={{ color: "#1D9E75" }}>.</span>tracker
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isCurrentMonth && <span style={s.todayPill}>Today</span>}
          <div style={s.monthNav}>
            <button style={s.navBtn} onClick={prevMonth}>
              ‹
            </button>
            <span style={s.navLabel}>
              {MONTH_NAMES[month]} {year}
            </span>
            <button style={s.navBtn} onClick={nextMonth}>
              ›
            </button>
=======
        <div style={s.logo}>budget<span style={{ color: "#1D9E75" }}>.</span>tracker</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isCurrentMonth && (
            <span style={s.todayPill}>Today</span>
          )}
          <div style={s.monthNav}>
            <button style={s.navBtn} onClick={prevMonth}>‹</button>
            <span style={s.navLabel}>{MONTH_NAMES[month]} {year}</span>
            <button style={s.navBtn} onClick={nextMonth}>›</button>
>>>>>>> dc8c70b06b61225d390414458dba6927cfd9fd99
          </div>
        </div>
      </div>

      {/* ── Year bar ── */}
      <div style={s.yearBar}>
        {yearSummary.map((m, i) => (
<<<<<<< HEAD
          <button
            key={i}
            style={{
              ...s.yearMonth,
              ...(i === month && year === today.getFullYear()
                ? s.yearMonthActive
                : {}),
            }}
            onClick={() => {
              setMonth(i);
              setActiveCat("All");
            }}
          >
            <span style={s.yearMonthName}>{m.name}</span>
            <div style={s.yearBarTrack}>
              <div
                style={{
                  ...s.yearBarFill,
                  width: `${m.pct}%`,
                  background:
                    m.pct > 85 ? "#D85A30" : m.pct > 50 ? "#BA7517" : "#1D9E75",
                  opacity: m.hasData ? 1 : 0.3,
                }}
              />
=======
          <button key={i} style={{ ...s.yearMonth, ...(i === month && year === today.getFullYear() ? s.yearMonthActive : {}) }}
            onClick={() => { setMonth(i); setActiveCat("All"); }}>
            <span style={s.yearMonthName}>{m.name}</span>
            <div style={s.yearBarTrack}>
              <div style={{
                ...s.yearBarFill,
                width: `${m.pct}%`,
                background: m.pct > 85 ? "#D85A30" : m.pct > 50 ? "#BA7517" : "#1D9E75",
                opacity: m.hasData ? 1 : 0.3,
              }} />
>>>>>>> dc8c70b06b61225d390414458dba6927cfd9fd99
            </div>
            <span style={s.yearMonthPct}>{m.hasData ? m.pct + "%" : "–"}</span>
          </button>
        ))}
      </div>

      {/* ── Banner ── */}
      <div style={s.banner}>
        <div>
          <div style={s.bannerTitle}>Monthly income: £1,540.00</div>
          <div style={s.bannerSub}>
            {unallocated >= 0
              ? `£${unallocated.toFixed(2)} unallocated · mark expenses paid to track`
              : `⚠ Over budget by £${Math.abs(unallocated).toFixed(2)}`}
          </div>
        </div>
<<<<<<< HEAD
        <button style={s.resetBtn} onClick={resetPaid}>
          reset paid
        </button>
=======
        <button style={s.resetBtn} onClick={resetPaid}>reset paid</button>
>>>>>>> dc8c70b06b61225d390414458dba6927cfd9fd99
      </div>

      {/* ── Summary grid ── */}
      <div style={s.summaryGrid}>
        {[
<<<<<<< HEAD
          { label: "Income", val: fmt(INCOME), color: "#1a1a1a" },
          {
            label: "Budgeted",
            val: fmt(totalBudgeted),
            color: totalBudgeted > INCOME ? "#D85A30" : "#1a1a1a",
          },
          { label: "Paid out", val: fmt(paidTotal), color: "#D85A30" },
          {
            label: "Remaining",
            val: fmt(remaining),
            color: remaining < 0 ? "#D85A30" : "#0F6E56",
          },
        ].map((m) => (
=======
          { label: "Income",    val: fmt(INCOME),        color: "#1a1a1a" },
          { label: "Budgeted",  val: fmt(totalBudgeted), color: totalBudgeted > INCOME ? "#D85A30" : "#1a1a1a" },
          { label: "Paid out",  val: fmt(paidTotal),     color: "#D85A30" },
          { label: "Remaining", val: fmt(remaining),     color: remaining < 0 ? "#D85A30" : "#0F6E56" },
        ].map(m => (
>>>>>>> dc8c70b06b61225d390414458dba6927cfd9fd99
          <div key={m.label} style={s.metric}>
            <div style={s.metricLabel}>{m.label}</div>
            <div style={{ ...s.metricVal, color: m.color }}>{m.val}</div>
          </div>
        ))}
      </div>

      {/* ── Progress bar ── */}
      <div style={s.progressWrap}>
<<<<<<< HEAD
        <div style={s.progressLabel}>
          <span>Budget used</span>
          <span>{pct}%</span>
        </div>
        <div style={s.progressBg}>
          <div
            style={{
              ...s.progressFill,
              width: `${pct}%`,
              background: progressColor,
            }}
          />
=======
        <div style={s.progressLabel}><span>Budget used</span><span>{pct}%</span></div>
        <div style={s.progressBg}>
          <div style={{ ...s.progressFill, width: `${pct}%`, background: progressColor }} />
>>>>>>> dc8c70b06b61225d390414458dba6927cfd9fd99
        </div>
      </div>

      {/* ── Category tabs + Add ── */}
<<<<<<< HEAD
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
          {(["All", ...CATEGORY_OPTIONS] as (Category | "All")[]).map((c) => (
            <button
              key={c}
              onClick={() => setActiveCat(c)}
              style={{ ...s.tab, ...(activeCat === c ? s.tabActive : {}) }}
            >
=======
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
          {(["All", ...CATEGORY_OPTIONS] as (Category|"All")[]).map(c => (
            <button key={c} onClick={() => setActiveCat(c)}
              style={{ ...s.tab, ...(activeCat === c ? s.tabActive : {}) }}>
>>>>>>> dc8c70b06b61225d390414458dba6927cfd9fd99
              {c}
            </button>
          ))}
        </div>
<<<<<<< HEAD
        <button style={s.addBtn} onClick={openAdd}>
          + Add
        </button>
=======
        <button style={s.addBtn} onClick={openAdd}>+ Add</button>
>>>>>>> dc8c70b06b61225d390414458dba6927cfd9fd99
      </div>

      {/* ── Expense list ── */}
      <div style={s.expenseList}>
        {visible.length === 0 && (
          <div style={s.emptyState}>
            No expenses in this category.{" "}
<<<<<<< HEAD
            <button style={s.emptyAdd} onClick={openAdd}>
              Add one →
            </button>
          </div>
        )}
        {visible.map((e) => {
          const paid = paidIds.has(e.id);
          const isConfirm = deleteConfirm === e.id;
          return (
            <div key={e.id} style={s.expenseRow}>
              <div style={{ ...s.expenseIcon, background: CAT_BG[e.cat] }}>
                {CAT_ICONS[e.cat]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    ...s.expenseName,
                    ...(paid ? s.expenseNamePaid : {}),
                  }}
                >
                  {e.name}
                </div>
                <div style={s.expenseCat}>{e.cat}</div>
              </div>
              <div
                style={{
                  ...s.expenseAmount,
                  color: paid ? "#bbb" : CAT_COLORS[e.cat],
                }}
              >
                {fmt(e.amount)}
              </div>
              {isConfirm ? (
                <div style={{ display: "flex", gap: 4, marginLeft: 6 }}>
                  <button
                    style={s.btnDelete}
                    onClick={() => deleteExpense(e.id)}
                  >
                    Delete
                  </button>
                  <button
                    style={s.btnUndo}
                    onClick={() => setDeleteConfirm(null)}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 4, marginLeft: 6 }}>
                  <button
                    style={{
                      ...s.statusBtn,
                      ...(paid ? s.btnUndo : s.btnPaid),
                    }}
                    onClick={() => toggle(e.id)}
                  >
                    {paid ? "undo" : "paid"}
                  </button>
                  <button
                    style={s.btnIcon}
                    onClick={() => openEdit(e)}
                    title="Edit"
                  >
                    ✏
                  </button>
                  <button
                    style={{ ...s.btnIcon, color: "#D85A30" }}
                    onClick={() => setDeleteConfirm(e.id)}
                    title="Delete"
                  >
                    ✕
                  </button>
=======
            <button style={s.emptyAdd} onClick={openAdd}>Add one →</button>
          </div>
        )}
        {visible.map(e => {
          const paid        = paidIds.has(e.id);
          const isConfirm   = deleteConfirm === e.id;
          return (
            <div key={e.id} style={s.expenseRow}>
              <div style={{ ...s.expenseIcon, background: CAT_BG[e.cat] }}>{CAT_ICONS[e.cat]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...s.expenseName, ...(paid ? s.expenseNamePaid : {}) }}>{e.name}</div>
                <div style={s.expenseCat}>{e.cat}</div>
              </div>
              <div style={{ ...s.expenseAmount, color: paid ? "#bbb" : CAT_COLORS[e.cat] }}>{fmt(e.amount)}</div>
              {isConfirm ? (
                <div style={{ display: "flex", gap: 4, marginLeft: 6 }}>
                  <button style={s.btnDelete} onClick={() => deleteExpense(e.id)}>Delete</button>
                  <button style={s.btnUndo}   onClick={() => setDeleteConfirm(null)}>Cancel</button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 4, marginLeft: 6 }}>
                  <button style={{ ...s.statusBtn, ...(paid ? s.btnUndo : s.btnPaid) }} onClick={() => toggle(e.id)}>
                    {paid ? "undo" : "paid"}
                  </button>
                  <button style={s.btnIcon} onClick={() => openEdit(e)} title="Edit">✏</button>
                  <button style={{ ...s.btnIcon, color: "#D85A30" }} onClick={() => setDeleteConfirm(e.id)} title="Delete">✕</button>
>>>>>>> dc8c70b06b61225d390414458dba6927cfd9fd99
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Donut chart ── */}
      <div style={s.sectionTitle}>Spending breakdown</div>
      <div style={s.donutWrap}>
<<<<<<< HEAD
        <div
          style={{
            position: "relative",
            width: 140,
            height: 140,
            flexShrink: 0,
          }}
        >
=======
        <div style={{ position: "relative", width: 140, height: 140, flexShrink: 0 }}>
>>>>>>> dc8c70b06b61225d390414458dba6927cfd9fd99
          <canvas ref={donutRef} width={140} height={140} />
          <div style={s.donutCenter}>
            <div style={s.donutCenterVal}>{fmt(totalBudgeted)}</div>
            <div style={s.donutCenterLabel}>budgeted</div>
          </div>
        </div>
        <div style={s.legendList}>
<<<<<<< HEAD
          {(Object.keys(catGroups) as Category[]).map((cat) => (
=======
          {(Object.keys(catGroups) as Category[]).map(cat => (
>>>>>>> dc8c70b06b61225d390414458dba6927cfd9fd99
            <div key={cat} style={s.legendItem}>
              <span style={{ ...s.legendDot, background: CAT_COLORS[cat] }} />
              <span style={s.legendName}>{cat}</span>
              <span style={s.legendAmount}>{fmt(catGroups[cat]!)}</span>
<<<<<<< HEAD
              <span style={s.legendPct}>
                {Math.round((catGroups[cat]! / INCOME) * 100)}%
              </span>
=======
              <span style={s.legendPct}>{Math.round((catGroups[cat]! / INCOME) * 100)}%</span>
>>>>>>> dc8c70b06b61225d390414458dba6927cfd9fd99
            </div>
          ))}
        </div>
      </div>
<<<<<<< HEAD
=======

>>>>>>> dc8c70b06b61225d390414458dba6927cfd9fd99
    </main>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
<<<<<<< HEAD
  shell: {
    maxWidth: 760,
    margin: "0 auto",
    padding: "1.5rem 1rem 4rem",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    color: "#1a1a1a",
  },
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
  },
  logo: { fontSize: 20, fontWeight: 700, letterSpacing: -0.5 },
  todayPill: {
    fontSize: 11,
    background: "#E1F5EE",
    color: "#0F6E56",
    padding: "3px 8px",
    borderRadius: 20,
    fontFamily: "monospace",
  },

  // Month navigation
  monthNav: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    background: "#f7f6f3",
    borderRadius: 20,
    padding: "3px 6px",
  },
  navBtn: {
    background: "none",
    borderWidth: 0,
    cursor: "pointer",
    fontSize: 18,
    color: "#555",
    padding: "0 4px",
    lineHeight: 1,
  },
  navLabel: {
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "monospace",
    minWidth: 130,
    textAlign: "center" as const,
  },

  // Year bar
  yearBar: {
    display: "grid",
    gridTemplateColumns: "repeat(12, minmax(0,1fr))",
    gap: 4,
    marginBottom: "1.5rem",
    padding: "12px",
    background: "#f7f6f3",
    borderRadius: 12,
  },
  yearMonth: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    background: "none",
    borderWidth: 0,
    cursor: "pointer",
    padding: "4px 2px",
    borderRadius: 6,
  },
  yearMonthActive: {
    background: "#fff",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  yearMonthName: { fontSize: 10, color: "#999", fontFamily: "monospace" },
  yearBarTrack: {
    width: "100%",
    height: 4,
    background: "#e5e4e0",
    borderRadius: 2,
    overflow: "hidden",
  },
  yearBarFill: { height: "100%", borderRadius: 2, transition: "width 0.3s" },
  yearMonthPct: { fontSize: 9, color: "#bbb", fontFamily: "monospace" },

  // Banner
  banner: {
    background: "#E1F5EE",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#9FE1CB",
    borderRadius: 10,
    padding: "12px 16px",
    marginBottom: "1.5rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bannerTitle: { fontSize: 13, color: "#0F6E56", fontWeight: 600 },
  bannerSub: {
    fontSize: 11,
    color: "#1D9E75",
    fontFamily: "monospace",
    marginTop: 2,
  },
  resetBtn: {
    fontSize: 11,
    color: "#999",
    background: "none",
    borderWidth: 0,
    cursor: "pointer",
    fontFamily: "monospace",
    textDecoration: "underline",
  },

  // Summary
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0,1fr))",
    gap: 10,
    marginBottom: "1.5rem",
  },
  metric: { background: "#f7f6f3", borderRadius: 10, padding: "12px 14px" },
  metricLabel: {
    fontSize: 11,
    color: "#999",
    fontFamily: "monospace",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  metricVal: {
    fontSize: 20,
    fontWeight: 700,
    fontFamily: "monospace",
    letterSpacing: -1,
  },

  // Progress
  progressWrap: { marginBottom: "1.5rem" },
  progressLabel: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    color: "#999",
    marginBottom: 6,
    fontFamily: "monospace",
  },
  progressBg: {
    height: 8,
    background: "#efefeb",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
    transition: "width 0.4s ease",
  },

  // Tabs
  tab: {
    fontSize: 12,
    padding: "5px 12px",
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#e5e4e0",
    background: "#fff",
    cursor: "pointer",
    fontFamily: "monospace",
    color: "#555",
  },
  tabActive: {
    background: "#1a1a1a",
    color: "#fff",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#1a1a1a",
  },
  addBtn: {
    fontSize: 12,
    padding: "5px 14px",
    borderRadius: 20,
    borderWidth: 0,
    background: "#1D9E75",
    color: "#fff",
    cursor: "pointer",
    fontFamily: "monospace",
    fontWeight: 600,
    flexShrink: 0,
  },

  // Expense rows
  expenseList: { display: "flex", flexDirection: "column", gap: 6 },
  expenseRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#fff",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#e5e4e0",
    borderRadius: 10,
    padding: "10px 14px",
  },
  expenseIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    flexShrink: 0,
  },
  expenseName: { fontSize: 14, fontWeight: 600 },
  expenseNamePaid: { textDecoration: "line-through", color: "#bbb" },
  expenseCat: { fontSize: 11, color: "#999", fontFamily: "monospace" },
  expenseAmount: {
    fontSize: 15,
    fontWeight: 700,
    fontFamily: "monospace",
    marginLeft: "auto",
  },
  statusBtn: {
    fontSize: 11,
    padding: "3px 8px",
    borderRadius: 6,
    borderWidth: 0,
    cursor: "pointer",
    fontFamily: "monospace",
  },
  btnPaid: { background: "#E1F5EE", color: "#0F6E56" },
  btnUndo: {
    background: "#efefeb",
    color: "#999",
    fontSize: 11,
    padding: "3px 8px",
    borderRadius: 6,
    borderWidth: 0,
    cursor: "pointer",
    fontFamily: "monospace",
  },
  btnIcon: {
    fontSize: 12,
    padding: "3px 7px",
    borderRadius: 6,
    borderWidth: 0,
    background: "#f7f6f3",
    color: "#555",
    cursor: "pointer",
  },
  btnDelete: {
    fontSize: 11,
    padding: "3px 8px",
    borderRadius: 6,
    borderWidth: 0,
    background: "#FAECE7",
    color: "#D85A30",
    cursor: "pointer",
    fontFamily: "monospace",
  },
  emptyState: {
    fontSize: 13,
    color: "#999",
    padding: "1rem 0",
    textAlign: "center" as const,
  },
  emptyAdd: {
    background: "none",
    borderWidth: 0,
    color: "#1D9E75",
    cursor: "pointer",
    fontFamily: "monospace",
    fontSize: 13,
  },

  // Donut
  sectionTitle: {
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: "#999",
    margin: "2rem 0 0.75rem",
    fontFamily: "monospace",
  },
  donutWrap: {
    display: "flex",
    gap: 24,
    alignItems: "center",
    padding: "1rem",
    background: "#f7f6f3",
    borderRadius: 10,
  },
  donutCenter: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  },
  donutCenterVal: {
    fontSize: 20,
    fontWeight: 700,
    fontFamily: "monospace",
    letterSpacing: -1,
  },
  donutCenterLabel: { fontSize: 10, color: "#999", fontFamily: "monospace" },
  legendList: { display: "flex", flexDirection: "column", gap: 8, flex: 1 },
  legendItem: { display: "flex", alignItems: "center", gap: 8, fontSize: 12 },
  legendDot: { width: 10, height: 10, borderRadius: 3, flexShrink: 0 },
  legendName: { flex: 1, color: "#555" },
  legendAmount: { fontFamily: "monospace", fontWeight: 500 },
  legendPct: {
    fontFamily: "monospace",
    color: "#999",
    fontSize: 11,
    minWidth: 32,
    textAlign: "right" as const,
  },

  // Modal
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  modal: {
    background: "#fff",
    borderRadius: 14,
    padding: "1.5rem",
    width: "100%",
    maxWidth: 400,
    margin: "0 1rem",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.25rem",
  },
  modalTitle: { fontSize: 16, fontWeight: 700 },
  modalClose: {
    background: "none",
    borderWidth: 0,
    cursor: "pointer",
    fontSize: 16,
    color: "#999",
    padding: "2px 6px",
  },
  fieldGroup: { marginBottom: "1rem" },
  label: {
    display: "block",
    fontSize: 12,
    color: "#999",
    fontFamily: "monospace",
    marginBottom: 6,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  input: {
    width: "100%",
    padding: "8px 12px",
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#e5e4e0",
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box" as const,
  },
  select: {
    width: "100%",
    padding: "8px 12px",
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#e5e4e0",
    fontSize: 14,
    fontFamily: "inherit",
    background: "#fff",
    outline: "none",
    boxSizing: "border-box" as const,
  },
  formError: {
    fontSize: 12,
    color: "#D85A30",
    marginBottom: "0.75rem",
    fontFamily: "monospace",
  },
  modalActions: {
    display: "flex",
    gap: 8,
    justifyContent: "flex-end",
    marginTop: "1.25rem",
  },
  btnCancel: {
    fontSize: 13,
    padding: "7px 16px",
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#e5e4e0",
    background: "#fff",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  btnSubmit: {
    fontSize: 13,
    padding: "7px 16px",
    borderRadius: 8,
    borderWidth: 0,
    background: "#1a1a1a",
    color: "#fff",
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: 600,
  },
=======
  shell:      { maxWidth: 760, margin: "0 auto", padding: "1.5rem 1rem 4rem", fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#1a1a1a" },
  topbar:     { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" },
  logo:       { fontSize: 20, fontWeight: 700, letterSpacing: -0.5 },
  todayPill:  { fontSize: 11, background: "#E1F5EE", color: "#0F6E56", padding: "3px 8px", borderRadius: 20, fontFamily: "monospace" },

  // Month navigation
  monthNav:   { display: "flex", alignItems: "center", gap: 4, background: "#f7f6f3", borderRadius: 20, padding: "3px 6px" },
  navBtn:     { background: "none", borderWidth: 0, cursor: "pointer", fontSize: 18, color: "#555", padding: "0 4px", lineHeight: 1 },
  navLabel:   { fontSize: 13, fontWeight: 600, fontFamily: "monospace", minWidth: 130, textAlign: "center" as const },

  // Year bar
  yearBar:        { display: "grid", gridTemplateColumns: "repeat(12, minmax(0,1fr))", gap: 4, marginBottom: "1.5rem", padding: "12px", background: "#f7f6f3", borderRadius: 12 },
  yearMonth:      { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", borderWidth: 0, cursor: "pointer", padding: "4px 2px", borderRadius: 6 },
  yearMonthActive:{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
  yearMonthName:  { fontSize: 10, color: "#999", fontFamily: "monospace" },
  yearBarTrack:   { width: "100%", height: 4, background: "#e5e4e0", borderRadius: 2, overflow: "hidden" },
  yearBarFill:    { height: "100%", borderRadius: 2, transition: "width 0.3s" },
  yearMonthPct:   { fontSize: 9, color: "#bbb", fontFamily: "monospace" },

  // Banner
  banner:     { background: "#E1F5EE", borderWidth: 1, borderStyle: "solid", borderColor: "#9FE1CB", borderRadius: 10, padding: "12px 16px", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" },
  bannerTitle:{ fontSize: 13, color: "#0F6E56", fontWeight: 600 },
  bannerSub:  { fontSize: 11, color: "#1D9E75", fontFamily: "monospace", marginTop: 2 },
  resetBtn:   { fontSize: 11, color: "#999", background: "none", borderWidth: 0, cursor: "pointer", fontFamily: "monospace", textDecoration: "underline" },

  // Summary
  summaryGrid:{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 10, marginBottom: "1.5rem" },
  metric:     { background: "#f7f6f3", borderRadius: 10, padding: "12px 14px" },
  metricLabel:{ fontSize: 11, color: "#999", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  metricVal:  { fontSize: 20, fontWeight: 700, fontFamily: "monospace", letterSpacing: -1 },

  // Progress
  progressWrap: { marginBottom: "1.5rem" },
  progressLabel:{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#999", marginBottom: 6, fontFamily: "monospace" },
  progressBg:   { height: 8, background: "#efefeb", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4, transition: "width 0.4s ease" },

  // Tabs
  tab:        { fontSize: 12, padding: "5px 12px", borderRadius: 20, borderWidth: 1, borderStyle: "solid", borderColor: "#e5e4e0", background: "#fff", cursor: "pointer", fontFamily: "monospace", color: "#555" },
  tabActive:  { background: "#1a1a1a", color: "#fff", borderWidth: 1, borderStyle: "solid", borderColor: "#1a1a1a" },
  addBtn:     { fontSize: 12, padding: "5px 14px", borderRadius: 20, borderWidth: 0, background: "#1D9E75", color: "#fff", cursor: "pointer", fontFamily: "monospace", fontWeight: 600, flexShrink: 0 },

  // Expense rows
  expenseList:    { display: "flex", flexDirection: "column", gap: 6 },
  expenseRow:     { display: "flex", alignItems: "center", gap: 10, background: "#fff", borderWidth: 1, borderStyle: "solid", borderColor: "#e5e4e0", borderRadius: 10, padding: "10px 14px" },
  expenseIcon:    { width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 },
  expenseName:    { fontSize: 14, fontWeight: 600 },
  expenseNamePaid:{ textDecoration: "line-through", color: "#bbb" },
  expenseCat:     { fontSize: 11, color: "#999", fontFamily: "monospace" },
  expenseAmount:  { fontSize: 15, fontWeight: 700, fontFamily: "monospace", marginLeft: "auto" },
  statusBtn:      { fontSize: 11, padding: "3px 8px", borderRadius: 6, borderWidth: 0, cursor: "pointer", fontFamily: "monospace" },
  btnPaid:        { background: "#E1F5EE", color: "#0F6E56" },
  btnUndo:        { background: "#efefeb", color: "#999", fontSize: 11, padding: "3px 8px", borderRadius: 6, borderWidth: 0, cursor: "pointer", fontFamily: "monospace" },
  btnIcon:        { fontSize: 12, padding: "3px 7px", borderRadius: 6, borderWidth: 0, background: "#f7f6f3", color: "#555", cursor: "pointer" },
  btnDelete:      { fontSize: 11, padding: "3px 8px", borderRadius: 6, borderWidth: 0, background: "#FAECE7", color: "#D85A30", cursor: "pointer", fontFamily: "monospace" },
  emptyState:     { fontSize: 13, color: "#999", padding: "1rem 0", textAlign: "center" as const },
  emptyAdd:       { background: "none", borderWidth: 0, color: "#1D9E75", cursor: "pointer", fontFamily: "monospace", fontSize: 13 },

  // Donut
  sectionTitle: { fontSize: 13, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", color: "#999", margin: "2rem 0 0.75rem", fontFamily: "monospace" },
  donutWrap:    { display: "flex", gap: 24, alignItems: "center", padding: "1rem", background: "#f7f6f3", borderRadius: 10 },
  donutCenter:  { position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" },
  donutCenterVal:  { fontSize: 20, fontWeight: 700, fontFamily: "monospace", letterSpacing: -1 },
  donutCenterLabel:{ fontSize: 10, color: "#999", fontFamily: "monospace" },
  legendList:   { display: "flex", flexDirection: "column", gap: 8, flex: 1 },
  legendItem:   { display: "flex", alignItems: "center", gap: 8, fontSize: 12 },
  legendDot:    { width: 10, height: 10, borderRadius: 3, flexShrink: 0 },
  legendName:   { flex: 1, color: "#555" },
  legendAmount: { fontFamily: "monospace", fontWeight: 500 },
  legendPct:    { fontFamily: "monospace", color: "#999", fontSize: 11, minWidth: 32, textAlign: "right" as const },

  // Modal
  overlay:      { position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modal:        { background: "#fff", borderRadius: 14, padding: "1.5rem", width: "100%", maxWidth: 400, margin: "0 1rem" },
  modalHeader:  { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" },
  modalTitle:   { fontSize: 16, fontWeight: 700 },
  modalClose:   { background: "none", borderWidth: 0, cursor: "pointer", fontSize: 16, color: "#999", padding: "2px 6px" },
  fieldGroup:   { marginBottom: "1rem" },
  label:        { display: "block", fontSize: 12, color: "#999", fontFamily: "monospace", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: 0.5 },
  input:        { width: "100%", padding: "8px 12px", borderRadius: 8, borderWidth: 1, borderStyle: "solid", borderColor: "#e5e4e0", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const },
  select:       { width: "100%", padding: "8px 12px", borderRadius: 8, borderWidth: 1, borderStyle: "solid", borderColor: "#e5e4e0", fontSize: 14, fontFamily: "inherit", background: "#fff", outline: "none", boxSizing: "border-box" as const },
  formError:    { fontSize: 12, color: "#D85A30", marginBottom: "0.75rem", fontFamily: "monospace" },
  modalActions: { display: "flex", gap: 8, justifyContent: "flex-end", marginTop: "1.25rem" },
  btnCancel:    { fontSize: 13, padding: "7px 16px", borderRadius: 8, borderWidth: 1, borderStyle: "solid", borderColor: "#e5e4e0", background: "#fff", cursor: "pointer", fontFamily: "inherit" },
  btnSubmit:    { fontSize: 13, padding: "7px 16px", borderRadius: 8, borderWidth: 0, background: "#1a1a1a", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 },
>>>>>>> dc8c70b06b61225d390414458dba6927cfd9fd99
};
