"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Chart, ArcElement, DoughnutController, Tooltip, Legend } from "chart.js";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

Chart.register(ArcElement, DoughnutController, Tooltip, Legend);

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = "Fixed" | "Essentials" | "Debt" | "Savings" | "Personal";

type ExpenseCurrency = "GBP" | "PLN" | "EUR" | "USD";

const CURRENCY_SYMBOLS: Record<ExpenseCurrency, string> = {
  GBP: "£",
  PLN: "zł",
  EUR: "€",
  USD: "$",
};

interface Expense {
  id: string;
  name: string;
  amount: number;
  cat: Category;
  currency?: ExpenseCurrency;
}

type MonthData = {
  expenses: Expense[];
  paidIds:  string[];
};

type DebtHelpOrg = {
  name: string;
  website: string;
  phone: string;
  description: string;
};

type BudgetTheme = {
  bg: string;
  bgSecondary: string;
  bgTertiary: string;
  border: string;
  text: string;
  textMuted: string;
  textHint: string;
  surface: string;
  surfaceHover: string;
};

const THEME_LIGHT: BudgetTheme = {
  bg:         "#ffffff",
  bgSecondary:"#f7f6f3",
  bgTertiary: "#efefeb",
  border:     "#e5e4e0",
  text:       "#1a1a1a",
  textMuted:  "#999",
  textHint:   "#bbb",
  surface:    "#ffffff",
  surfaceHover:"#f7f6f3",
};

const THEME_DARK: BudgetTheme = {
  bg:         "#0f0f0f",
  bgSecondary:"#1a1a1a",
  bgTertiary: "#242424",
  border:     "#2e2e2e",
  text:       "#f0f0f0",
  textMuted:  "#888",
  textHint:   "#555",
  surface:    "#1a1a1a",
  surfaceHover:"#222",
};

const LS_BUDGET_THEME = "budgetTheme";

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_income = 1540;

const DEFAULT_EXPENSES: Expense[] = [
  { id: "rent",      name: "Rent",               amount: 60,    cat: "Fixed"      },
  { id: "council",   name: "Council tax",         amount: 140,   cat: "Fixed"      },
  { id: "water",     name: "Water",               amount: 35,    cat: "Fixed"      },
  { id: "gas",       name: "Gas",                 amount: 60,    cat: "Fixed"      },
  { id: "elec",      name: "Electricity",         amount: 60,    cat: "Fixed"      },
  { id: "life",      name: "Life insurance",      amount: 13,    cat: "Fixed"      },
  { id: "internet",  name: "Internet",            amount: 15,    cat: "Fixed"      },
  { id: "mobile",    name: "Mobile",              amount: 5.5,   cat: "Fixed"      },
  { id: "groceries", name: "Groceries",           amount: 300,   cat: "Essentials" },
  { id: "bus",       name: "Bus ticket",          amount: 61,    cat: "Essentials" },
  { id: "uk_bank",   name: "British bank (debt)", amount: 250,   cat: "Debt"       },
  { id: "pl_bank",   name: "Polish bank (debt)",  amount: 250,   cat: "Debt",      currency: "PLN" },
  { id: "buffer",    name: "Emergency buffer",    amount: 150,   cat: "Savings"    },
  { id: "fun",       name: "Fun / wants",         amount: 140.5, cat: "Personal"   },
];

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const CATEGORY_OPTIONS: Category[] = ["Fixed","Essentials","Debt","Savings","Personal"];

const CAT_COLORS: Record<Category, string> = {
  Fixed: "#378ADD", Essentials: "#1D9E75", Debt: "#D85A30", Savings: "#BA7517", Personal: "#7F77DD",
};
const CAT_BG: Record<Category, string> = {
  Fixed: "#E6F1FB", Essentials: "#E1F5EE", Debt: "#FAECE7", Savings: "#FAEEDA", Personal: "#EEEDFE",
};
const CAT_ICONS: Record<Category, string> = {
  Fixed: "🏠", Essentials: "🛒", Debt: "💳", Savings: "🏦", Personal: "✨",
};

const EXCHANGE_RATES: Record<string, number> = {
  GBP: 1,
  PLN: 0.19,   // 1 PLN = £0.19
  EUR: 1.17,   // 1 EUR = £1.17
  USD: 0.79,   // 1 USD = £0.79
};

const DEBT_HELP_ORGS: DebtHelpOrg[] = [
  { name: "StepChange Debt Charity", website: "https://www.stepchange.org", phone: "0800 138 1111", description: "Free debt advice" },
  { name: "National Debtline", website: "https://www.nationaldebtline.org", phone: "0808 808 4000", description: "Free advice for people in England, Wales & Scotland" },
  { name: "Citizens Advice", website: "https://www.citizensadvice.org.uk", phone: "0800 144 8848", description: "Free, confidential advice" },
  { name: "PayPlan", website: "https://www.payplan.com", phone: "0800 280 2816", description: "Free debt management plans" },
  { name: "MoneyHelper", website: "https://www.moneyhelper.org.uk", phone: "0800 138 7777", description: "Government-backed money guidance" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) { return "£" + n.toFixed(2).replace(/\.00$/, ""); }

function fmtDisplay(amount: number, displayCurrency: ExpenseCurrency): string {
  const n = amount.toFixed(2).replace(/\.00$/, "");
  switch (displayCurrency) {
    case "PLN": return CURRENCY_SYMBOLS.PLN + n;
    case "EUR": return CURRENCY_SYMBOLS.EUR + n;
    case "USD": return CURRENCY_SYMBOLS.USD + n;
    default:    return CURRENCY_SYMBOLS.GBP + n;
  }
}

function uid()          { return Math.random().toString(36).slice(2, 9); }
function monthKey(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function expenseCurrency(e: Expense): ExpenseCurrency {
  return e.currency ?? "GBP";
}

function toGBP(amount: number, currency: string, rates: Record<string, number> = EXCHANGE_RATES): number {
  return amount * (rates[currency] ?? 1);
}

function fmtCurrency(amount: number, currency: string): string {
  const n = amount.toFixed(2).replace(/\.00$/, "");
  switch (currency) {
    case "PLN": return "zł" + n;
    case "EUR": return "€" + n;
    case "USD": return "$" + n;
    default:    return "£" + n;
  }
}

const LS_EXCHANGE_RATES = "budgetExchangeRates";
const CURRENCY_OPTIONS: { value: ExpenseCurrency; label: string }[] = [
  { value: "GBP", label: "GBP £" },
  { value: "PLN", label: "PLN zł" },
  { value: "EUR", label: "EUR €" },
  { value: "USD", label: "USD $" },
];

const EMPTY_FORM = {
  name: "",
  amount: "",
  cat: "Fixed" as Category,
  currency: "GBP" as ExpenseCurrency,
};

function isExpenseCurrency(v: string): v is ExpenseCurrency {
  return v === "GBP" || v === "PLN" || v === "EUR" || v === "USD";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BudgetTracker() {
  const supabase = createClient();
  const today    = new Date();

  const [user,    setUser]    = useState<User | null>(null);
  const [year,    setYear]    = useState(today.getFullYear());
  const [month,   setMonth]   = useState(today.getMonth());
  const [allData, setAllData] = useState<Record<string, MonthData>>({});
  const [dbLoading, setDbLoading] = useState(true);
  const [syncing,   setSyncing]   = useState(false);

  const [income,        setIncome]        = useState(DEFAULT_income);
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeInput,   setIncomeInput]   = useState("");

  const [activeCat,     setActiveCat]     = useState<Category | "All">("All");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDebtHelpOpen, setIsDebtHelpOpen] = useState(false);
  const [copyMsg, setCopyMsg] = useState("");
  const [copyConfirmOpen, setCopyConfirmOpen] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; mode: "add"|"edit"; expense: Expense|null }>({
    open: false, mode: "add", expense: null,
  });
  const [form,      setForm]      = useState({ ...EMPTY_FORM });
  const [formError, setFormError] = useState("");

  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(() => ({ ...EXCHANGE_RATES }));
  const [displayCurrency, setDisplayCurrency] = useState<ExpenseCurrency>("GBP");
  const [ratesPanelOpen, setRatesPanelOpen] = useState(false);
  const [rateDraft, setRateDraft] = useState({
    GBP: "1", PLN: String(EXCHANGE_RATES.PLN), EUR: String(EXCHANGE_RATES.EUR), USD: String(EXCHANGE_RATES.USD),
  });

  const [darkMode, setDarkMode] = useState(false);

  const theme = darkMode ? THEME_DARK : THEME_LIGHT;
  const s = useMemo(() => buildStyles(theme, darkMode), [theme, darkMode]);

  const donutRef      = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const copyMsgTimerRef = useRef<number | null>(null);

  function convertAmount(amount: number, fromCurrency: string, toCurrency: string): number {
    const inGBP = amount * (exchangeRates[fromCurrency] ?? 1);
    return inGBP / (exchangeRates[toCurrency] ?? 1);
  }

  function toggleTheme() {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem(LS_BUDGET_THEME, next ? "dark" : "light");
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const saved = localStorage.getItem(LS_BUDGET_THEME);
    if (saved === "dark") setDarkMode(true);
  }, []);

  useEffect(() => {
    document.body.style.backgroundColor = theme.bg;
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, [theme.bg]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      const saved = data.user?.user_metadata?.monthly_income;
      if (saved) setIncome(Number(saved));
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      const saved = session?.user?.user_metadata?.monthly_income;
      if (saved) setIncome(Number(saved));
    });
    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  async function saveIncome(val: number) {
    if (isNaN(val) || val <= 0) return;
    setIncome(val);
    setEditingIncome(false);
    setSyncing(true);
    try {
      await supabase.auth.updateUser({ data: { monthly_income: val } });
    } catch (err) {
      console.error("Income save error:", err);
    } finally {
      setSyncing(false);
    }
  }

  function startEditIncome() {
    setIncomeInput(String(income));
    setEditingIncome(true);
  }

  function showCopyMessage(msg: string) {
    if (copyMsgTimerRef.current) window.clearTimeout(copyMsgTimerRef.current);
    setCopyMsg(msg);
    copyMsgTimerRef.current = window.setTimeout(() => setCopyMsg(""), 2000);
  }

  // ── Load data from Supabase ───────────────────────────────────────────────

  const loadData = useCallback(async () => {
    if (!user) return;
    setDbLoading(true);
    try {
      const { data, error } = await supabase
        .from("budget_months")
        .select("month_key, expenses, paid_ids")
        .eq("user_id", user.id);

      if (error) throw error;

      const built: Record<string, MonthData> = {};
      (data ?? []).forEach((row: { month_key: string; expenses: Expense[]; paid_ids: string[] }) => {
        built[row.month_key] = { expenses: row.expenses, paidIds: row.paid_ids };
      });
      setAllData(built);
    } catch (err) {
      console.error("Load error:", err);
    } finally {
      setDbLoading(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    return () => {
      if (copyMsgTimerRef.current) window.clearTimeout(copyMsgTimerRef.current);
    };
  }, []);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(LS_EXCHANGE_RATES) : null;
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      if (typeof parsed !== "object" || parsed === null) return;
      const merged: Record<string, number> = { ...EXCHANGE_RATES };
      (["GBP", "PLN", "EUR", "USD"] as ExpenseCurrency[]).forEach(k => {
        const v = parsed[k];
        if (typeof v === "number" && !Number.isNaN(v)) merged[k] = v;
      });
      merged.GBP = 1;
      setExchangeRates(merged);
      setRateDraft({
        GBP: "1",
        PLN: String(merged.PLN),
        EUR: String(merged.EUR),
        USD: String(merged.USD),
      });
    } catch {
      /* ignore invalid stored rates */
    }
  }, []);

  // ── Save month to Supabase (upsert) ───────────────────────────────────────

  const saveMonth = useCallback(async (key: string, data: MonthData) => {
    if (!user) return;
    setSyncing(true);
    try {
      const { error } = await supabase
        .from("budget_months")
        .upsert({
          user_id:   user.id,
          month_key: key,
          expenses:  data.expenses,
          paid_ids:  data.paidIds,
        }, { onConflict: "user_id,month_key" });
      if (error) throw error;
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSyncing(false);
    }
  }, [user]);

  // ── Current month data ────────────────────────────────────────────────────

  const key = monthKey(year, month);

  const monthData: MonthData = allData[key] ?? {
    expenses: [],
    paidIds:  [],
  };

  const expenses = monthData.expenses;
  const paidIds  = new Set(monthData.paidIds);

  // ── Ensure current month is seeded ───────────────────────────────────────

  useEffect(() => {
    if (!user || dbLoading) return;
    if (!allData[key]) {
      const newData: MonthData = { expenses: [], paidIds: [] };
      setAllData(prev => ({ ...prev, [key]: newData }));
      saveMonth(key, newData);
    }
  }, [key, user, dbLoading]);

  // ── Donut chart ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!donutRef.current) return;
    if (chartInstance.current) chartInstance.current.destroy();

    const groups: Partial<Record<Category, number>> = {};
    expenses.forEach(e => {
      const c = expenseCurrency(e);
      const v = convertAmount(e.amount, c, displayCurrency);
      groups[e.cat] = (groups[e.cat] ?? 0) + v;
    });
    const labels   = Object.keys(groups) as Category[];
    const data     = labels.map(l => groups[l]!);
    const bgColors = labels.map(l => CAT_COLORS[l]);

    chartInstance.current = new Chart(donutRef.current, {
      type: "doughnut",
      data: { labels, datasets: [{ data, backgroundColor: bgColors, borderWidth: 0, hoverOffset: 4 }] },
      options: {
        responsive: false, cutout: "72%",
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: i => " " + fmtDisplay(i.parsed as number, displayCurrency) } },
        },
      },
    });
    return () => { chartInstance.current?.destroy(); };
  }, [expenses, exchangeRates, displayCurrency]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  function updateMonth(patch: Partial<MonthData>) {
    const updated = { ...monthData, ...patch };
    setAllData(prev => ({ ...prev, [key]: updated }));
    saveMonth(key, updated);
  }

  function toggle(id: string) {
    const next = new Set(paidIds);
    next.has(id) ? next.delete(id) : next.add(id);
    updateMonth({ paidIds: [...next] });
  }

  function resetPaid() { updateMonth({ paidIds: [] }); }

  function openAdd() {
    setForm({ ...EMPTY_FORM });
    setFormError("");
    setModal({ open: true, mode: "add", expense: null });
  }
  function openEdit(e: Expense) {
    setForm({ name: e.name, amount: String(e.amount), cat: e.cat, currency: e.currency ?? "GBP" });
    setFormError("");
    setModal({ open: true, mode: "edit", expense: e });
  }
  function closeModal() { setModal({ open: false, mode: "add", expense: null }); }

  function submitForm() {
    const name   = form.name.trim();
    const amount = parseFloat(form.amount);
    if (!name)                        { setFormError("Name is required.");                    return; }
    if (isNaN(amount) || amount <= 0) { setFormError("Enter a valid amount greater than 0."); return; }

    if (modal.mode === "add") {
      updateMonth({
        expenses: [...expenses, { id: uid(), name, amount, cat: form.cat, currency: form.currency }],
      });
    } else if (modal.expense) {
      updateMonth({
        expenses: expenses.map(e =>
          e.id === modal.expense!.id ? { ...e, name, amount, cat: form.cat, currency: form.currency } : e
        ),
      });
    }
    closeModal();
  }

  function deleteExpense(id: string) {
    const next = new Set(paidIds);
    next.delete(id);
    updateMonth({ expenses: expenses.filter(e => e.id !== id), paidIds: [...next] });
    setDeleteConfirm(null);
  }

  function deleteAllExpenses() {
    updateMonth({ expenses: [], paidIds: [] });
    setConfirmDelete(false);
  }

  function saveExchangeRates() {
    const PLN = parseFloat(rateDraft.PLN);
    const EUR = parseFloat(rateDraft.EUR);
    const USD = parseFloat(rateDraft.USD);
    if ([PLN, EUR, USD].some(n => Number.isNaN(n) || n < 0)) return;
    const next = { GBP: 1, PLN, EUR, USD };
    setExchangeRates(next);
    localStorage.setItem(LS_EXCHANGE_RATES, JSON.stringify(next));
  }

  function copyFromPreviousMonth(forceOverwrite = false) {
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const prevKey = monthKey(prevYear, prevMonth);
    const prevData = allData[prevKey];

    if (!prevData || prevData.expenses.length === 0) {
      setCopyConfirmOpen(false);
      showCopyMessage("No data in previous month");
      return;
    }

    if (expenses.length > 0 && !forceOverwrite) {
      if (copyMsgTimerRef.current) window.clearTimeout(copyMsgTimerRef.current);
      setCopyMsg("Current month already has expenses — overwrite?");
      setCopyConfirmOpen(true);
      return;
    }

    const copiedExpenses = prevData.expenses.map(e => ({ ...e, id: uid() }));
    const newData: MonthData = { expenses: copiedExpenses, paidIds: [] };
    setAllData(prev => ({ ...prev, [key]: newData }));
    saveMonth(key, newData);
    setCopyConfirmOpen(false);
    showCopyMessage("Copied!");
  }

  // ── Month navigation ──────────────────────────────────────────────────────

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else              setMonth(m => m - 1);
    setActiveCat("All");
  }
  function nextMonth() {
    if (month === 11) { setMonth(0);  setYear(y => y + 1); }
    else               setMonth(m => m + 1);
    setActiveCat("All");
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const totalBudgeted = expenses.reduce((s, e) => s + toGBP(e.amount, expenseCurrency(e), exchangeRates), 0);
  const paidTotal     = expenses.filter(e => paidIds.has(e.id)).reduce((s, e) => s + toGBP(e.amount, expenseCurrency(e), exchangeRates), 0);
  const remaining     = income - paidTotal;
  const unallocated   = income - totalBudgeted;
  const pct           = income > 0 ? Math.min(Math.round((paidTotal / income) * 100), 100) : 0;
  const progressColor = pct > 85 ? "#D85A30" : pct > 60 ? "#BA7517" : "#1D9E75";

  const catGroups: Partial<Record<Category, number>> = {};
  expenses.forEach(e => {
    const gbp = toGBP(e.amount, expenseCurrency(e), exchangeRates);
    catGroups[e.cat] = (catGroups[e.cat] ?? 0) + gbp;
  });

  const visible = activeCat === "All" ? expenses : expenses.filter(e => e.cat === activeCat);
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  const yearSummary = MONTH_NAMES.map((name, i) => {
    const k  = monthKey(year, i);
    const md = allData[k];
    if (!md) return { name: name.slice(0, 3), pct: 0, hasData: false };
    const total = md.expenses.reduce((s, e) => s + toGBP(e.amount, expenseCurrency(e), exchangeRates), 0);
    const paid  = md.expenses.filter(e => md.paidIds.includes(e.id))
      .reduce((s, e) => s + toGBP(e.amount, expenseCurrency(e), exchangeRates), 0);
    return { name: name.slice(0, 3), pct: total > 0 ? Math.round((paid / total) * 100) : 0, hasData: true };
  });

  // ─── Render ───────────────────────────────────────────────────────────────

  if (dbLoading) {
    return (
      <div style={{ ...s.pageRoot, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace", color: theme.textMuted }}>
        Loading your budget…
      </div>
    );
  }

  return (
    <div style={s.pageRoot}>
    <main style={s.shell}>

      {/* ── Modal ── */}
      {modal.open && (
        <div style={s.overlay} onClick={closeModal}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <span style={s.modalTitle}>{modal.mode === "add" ? "Add expense" : "Edit expense"}</span>
              <button style={s.modalClose} onClick={closeModal}>✕</button>
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>Name</label>
              <input style={s.input} value={form.name} placeholder="e.g. Netflix" autoFocus
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && submitForm()} />
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>Amount</label>
              <input style={s.input} type="number" min="0" step="0.01" value={form.amount} placeholder="0.00"
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && submitForm()} />
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>Currency</label>
              <select
                style={s.select}
                value={isExpenseCurrency(form.currency) ? form.currency : "GBP"}
                onChange={e =>
                  setForm(f => ({ ...f, currency: e.target.value as ExpenseCurrency }))
                }
              >
                {CURRENCY_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>Category</label>
              <select style={s.select} value={form.cat}
                onChange={e => setForm(f => ({ ...f, cat: e.target.value as Category }))}>
                {CATEGORY_OPTIONS.map(c => (
                  <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>
                ))}
              </select>
            </div>
            {formError && <div style={s.formError}>{formError}</div>}
            <div style={s.modalActions}>
              <button style={s.btnCancel} onClick={closeModal}>Cancel</button>
              <button style={s.btnSubmit} onClick={submitForm}>
                {modal.mode === "add" ? "Add expense" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div style={s.topbar}>
        <div style={s.logo}>budget<span style={{ color: "#1D9E75" }}>.</span>tracker</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button type="button" style={s.themeBtn} onClick={toggleTheme} title={darkMode ? "Light mode" : "Dark mode"} aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
            {darkMode ? "☀" : "🌙"}
          </button>
          <button style={s.signOutBtn} onClick={signOut}>Sign out</button>
        </div>
        <div style={s.userArea}>
            <span style={s.userEmail}>{user?.email}</span>
          </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            rowGap: 6,
          }}
        >
          {syncing && <span style={s.syncPill}>saving…</span>}
          {isCurrentMonth && <span style={s.todayPill}>Today</span>}
          <div style={s.monthNav}>
            <button style={s.navBtn} onClick={prevMonth}>‹</button>
            <span style={s.navLabel}>{MONTH_NAMES[month]} {year}</span>
            <button style={s.navBtn} onClick={nextMonth}>›</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" as const }}>
            {(["GBP", "PLN", "EUR", "USD"] as ExpenseCurrency[]).map(code => (
              <button
                key={code}
                type="button"
                onClick={() => setDisplayCurrency(code)}
                style={{ ...s.tab, ...s.displayCurrTab, ...(displayCurrency === code ? s.tabActive : {}) }}
                title={`View in ${code}`}
              >
                {CURRENCY_SYMBOLS[code]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Year bar ── */}
      <div style={s.yearBar}>
        {yearSummary.map((m, i) => (
          <button key={i}
            style={{ ...s.yearMonth, ...(i === month ? s.yearMonthActive : {}) }}
            onClick={() => { setMonth(i); setActiveCat("All"); }}>
            <span style={s.yearMonthName}>{m.name}</span>
            <div style={s.yearBarTrack}>
              <div style={{ ...s.yearBarFill, width: `${m.pct}%`,
                background: m.pct > 85 ? "#D85A30" : m.pct > 50 ? "#BA7517" : "#1D9E75",
                opacity: m.hasData ? 1 : 0.3 }} />
            </div>
            <span style={s.yearMonthPct}>{m.hasData ? m.pct + "%" : "–"}</span>
          </button>
        ))}
      </div>

      {/* ── Banner ── */}
      <div style={s.banner}>
        <div>
          <div style={{ ...s.bannerTitle, display: "flex", alignItems: "center", gap: 8 }}>
            Monthly income:
            {editingIncome ? (
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 13, color: "#0F6E56" }}>£</span>
                <input
                  autoFocus
                  type="number"
                  min="1"
                  step="1"
                  value={incomeInput}
                  onChange={e => setIncomeInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") saveIncome(parseFloat(incomeInput));
                    if (e.key === "Escape") setEditingIncome(false);
                  }}
                  style={{ width: 90, padding: "2px 6px", borderRadius: 6, borderWidth: 1, borderStyle: "solid", borderColor: "#9FE1CB", fontSize: 13, fontFamily: "monospace", outline: "none", background: theme.surface, color: "#0F6E56" }}
                />
                <button onClick={() => saveIncome(parseFloat(incomeInput))} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, borderWidth: 0, background: "#0F6E56", color: "#fff", cursor: "pointer", fontFamily: "monospace" }}>Save</button>
                <button onClick={() => setEditingIncome(false)} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, borderWidth: 0, background: "transparent", color: "#1D9E75", cursor: "pointer", fontFamily: "monospace" }}>Cancel</button>
              </span>
            ) : (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span>{fmtDisplay(convertAmount(income, "GBP", displayCurrency), displayCurrency)}</span>
                <button onClick={startEditIncome} style={{ fontSize: 11, padding: "2px 7px", borderRadius: 6, borderWidth: 0, background: "#9FE1CB", color: "#0F6E56", cursor: "pointer", fontFamily: "monospace" }}>edit</button>
              </span>
            )}
          </div>
          <div style={s.bannerSub}>
            {unallocated >= 0
              ? `${fmtDisplay(convertAmount(unallocated, "GBP", displayCurrency), displayCurrency)} unallocated · mark expenses paid to track`
              : `⚠ Over budget by ${fmtDisplay(convertAmount(Math.abs(unallocated), "GBP", displayCurrency), displayCurrency)}`}
          </div>
        </div>
        <div style={s.bannerActions}>
          <button style={s.copyBtn} onClick={() => copyFromPreviousMonth()}>copy last month</button>
          <button style={s.resetBtn} onClick={resetPaid}>reset paid</button>
          {copyMsg && (
            <span style={s.copyMsg}>
              {copyMsg}
              {copyConfirmOpen && (
                <span style={s.copyConfirmActions}>
                  <button style={s.copyYesBtn} onClick={() => copyFromPreviousMonth(true)}>Yes</button>
                  <button style={s.copyNoBtn} onClick={() => { setCopyConfirmOpen(false); setCopyMsg(""); }}>No</button>
                </span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* ── Summary grid ── */}
      <div style={s.summaryGrid}>
        {[
          { label: "Income",    val: fmtDisplay(convertAmount(income, "GBP", displayCurrency), displayCurrency),        color: theme.text },
          { label: "Budgeted",  val: fmtDisplay(convertAmount(totalBudgeted, "GBP", displayCurrency), displayCurrency), color: totalBudgeted > income ? "#D85A30" : theme.text },
          { label: "Paid out",  val: fmtDisplay(convertAmount(paidTotal, "GBP", displayCurrency), displayCurrency),     color: "#D85A30" },
          { label: "Remaining", val: fmtDisplay(convertAmount(remaining, "GBP", displayCurrency), displayCurrency),     color: remaining < 0 ? "#D85A30" : "#0F6E56" },
        ].map(m => (
          <div key={m.label} style={s.metric}>
            <div style={s.metricLabel}>{m.label}</div>
            <div style={{ ...s.metricVal, color: m.color }}>{m.val}</div>
          </div>
        ))}
      </div>

      <div style={s.ratesSettingsRow}>
        <button
          type="button"
          style={s.ratesLink}
          onClick={() =>
            setRatesPanelOpen(prev => {
              if (!prev) {
                setRateDraft({
                  GBP: "1",
                  PLN: String(exchangeRates.PLN),
                  EUR: String(exchangeRates.EUR),
                  USD: String(exchangeRates.USD),
                });
              }
              return !prev;
            })
          }
        >
          {ratesPanelOpen ? "hide exchange rates" : "exchange rates"}
        </button>
        {ratesPanelOpen && (
          <div style={s.ratesPanel}>
            <div style={s.ratesPanelTitle}>Rates → GBP (manual)</div>
            <div style={s.ratesGrid}>
              {(["GBP", "PLN", "EUR", "USD"] as ExpenseCurrency[]).map(code => (
                <label key={code} style={s.rateField}>
                  <span style={s.rateLabel}>{code}</span>
                  <input
                    style={s.rateInput}
                    type="number"
                    min="0"
                    step="0.0001"
                    disabled={code === "GBP"}
                    value={code === "GBP" ? "1" : rateDraft[code]}
                    onChange={e => code !== "GBP" && setRateDraft(d => ({ ...d, [code]: e.target.value }))}
                  />
                </label>
              ))}
            </div>
            <button type="button" style={s.ratesSaveBtn} onClick={saveExchangeRates}>Save rates</button>
          </div>
        )}
      </div>

      {/* ── Progress bar ── */}
      <div style={s.progressWrap}>
        <div style={s.progressLabel}><span>Budget used</span><span>{pct}%</span></div>
        <div style={s.progressBg}>
          <div style={{ ...s.progressFill, width: `${pct}%`, background: progressColor }} />
        </div>
      </div>

      {/* ── Category tabs + Add ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
          {(["All", ...CATEGORY_OPTIONS] as (Category | "All")[]).map(c => (
            <button key={c} onClick={() => setActiveCat(c)}
              style={{ ...s.tab, ...(activeCat === c ? s.tabActive : {}) }}>
              {c}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {confirmDelete ? (
            <>
              <button style={s.confirmDeleteBtn} onClick={deleteAllExpenses}>Confirm delete</button>
              <button style={s.btnUndo} onClick={() => setConfirmDelete(false)}>Cancel</button>
            </>
          ) : (
            <button style={s.deleteAllBtn} onClick={() => setConfirmDelete(true)}>Delete all</button>
          )}
          <button style={s.addBtn} onClick={openAdd}>+ Add</button>
        </div>
      </div>

      {/* ── Expense list ── */}
      <div style={s.expenseList}>
        {visible.length === 0 && (
          <div style={s.emptyState}>
            No expenses here.{" "}
            <button style={s.emptyAdd} onClick={openAdd}>Add one →</button>
          </div>
        )}
        {visible.map(e => {
          const paid      = paidIds.has(e.id);
          const isConfirm = deleteConfirm === e.id;
          return (
            <div key={e.id} style={s.expenseRow}>
              <div style={{ ...s.expenseIcon, background: CAT_BG[e.cat] }}>{CAT_ICONS[e.cat]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...s.expenseName, ...(paid ? s.expenseNamePaid : {}) }}>{e.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>
                  <div style={s.expenseCat}>{e.cat}</div>
                  <span style={s.expenseCurrBadge}>{expenseCurrency(e)}</span>
                </div>
              </div>
              <div style={{ ...s.expenseAmount, color: paid ? theme.textHint : CAT_COLORS[e.cat], marginLeft: "auto", textAlign: "right" as const }}>
                {fmtDisplay(convertAmount(e.amount, expenseCurrency(e), displayCurrency), displayCurrency)}
              </div>
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
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Donut ── */}
      <div style={s.sectionTitle}>Spending breakdown</div>
      <div style={s.donutWrap}>
        <div style={{ position: "relative", width: 140, height: 140, flexShrink: 0 }}>
          <canvas ref={donutRef} width={140} height={140} />
          <div style={s.donutCenter}>
            <div style={s.donutCenterVal}>{fmtDisplay(convertAmount(totalBudgeted, "GBP", displayCurrency), displayCurrency)}</div>
            <div style={s.donutCenterLabel}>budgeted</div>
          </div>
        </div>
        <div style={s.legendList}>
          {(Object.keys(catGroups) as Category[]).map(cat => (
            <div key={cat} style={s.legendItem}>
              <span style={{ ...s.legendDot, background: CAT_COLORS[cat] }} />
              <span style={s.legendName}>{cat}</span>
              <span style={s.legendAmount}>{fmtDisplay(convertAmount(catGroups[cat]!, "GBP", displayCurrency), displayCurrency)}</span>
              <span style={s.legendPct}>{Math.round((catGroups[cat]! / income) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Debt help ── */}
      <div style={s.debtHelpWrap}>
        <button
          style={s.debtHelpToggle}
          onClick={() => setIsDebtHelpOpen(v => !v)}
          aria-expanded={isDebtHelpOpen}
          aria-controls="debt-help-panel"
        >
          <span style={s.debtHelpTitle}>Need help with debt?</span>
          <span style={s.debtHelpIcon}>{isDebtHelpOpen ? "−" : "+"}</span>
        </button>
        {isDebtHelpOpen && (
          <div id="debt-help-panel" style={s.debtHelpPanel}>
            <div style={s.debtHelpList}>
              {DEBT_HELP_ORGS.map(org => (
                <div key={org.name} style={s.debtHelpItem}>
                  <div style={s.debtHelpLine}>
                    <strong>{org.name}</strong>
                    <span style={s.debtHelpSep}>—</span>
                    <a href={org.website} target="_blank" rel="noreferrer" style={s.debtHelpLink}>
                      {org.website.replace(/^https?:\/\//, "")}
                    </a>
                    <span style={s.debtHelpSep}>—</span>
                    <span>{org.phone}</span>
                  </div>
                  <div style={s.debtHelpDesc}>{org.description}</div>
                </div>
              ))}
            </div>
            <div style={s.debtHelpNote}>All services are free and confidential</div>
          </div>
        )}
      </div>

    </main>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function buildStyles(theme: BudgetTheme, darkMode: boolean): Record<string, React.CSSProperties> {
  const tabActive = darkMode
    ? { background: "#e8e8e8", color: "#0f0f0f", borderWidth: 1, borderStyle: "solid" as const, borderColor: "#e8e8e8" }
    : { background: "#1a1a1a", color: "#fff", borderWidth: 1, borderStyle: "solid" as const, borderColor: "#1a1a1a" };
  const primaryCta = darkMode
    ? { background: "#e8e8e8", color: "#0f0f0f" }
    : { background: "#1a1a1a", color: "#fff" };

  return {
  pageRoot:   { minHeight: "100vh", width: "100%", background: theme.bg },
  shell:      { maxWidth: 760, margin: "0 auto", padding: "1.5rem 1rem 4rem", fontFamily: "'Segoe UI', system-ui, sans-serif", color: theme.text },
  themeBtn:   { fontSize: 16, background: "none", borderWidth: 0, cursor: "pointer", padding: "2px 6px", lineHeight: 1 },
  topbar:     { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: 8 },
  logo:       { fontSize: 20, fontWeight: 700, letterSpacing: -0.5, color: theme.text },
  todayPill:  { fontSize: 11, background: "#E1F5EE", color: "#0F6E56", padding: "3px 8px", borderRadius: 20, fontFamily: "monospace" },
  syncPill:   { fontSize: 11, background: "#FAEEDA", color: "#BA7517", padding: "3px 8px", borderRadius: 20, fontFamily: "monospace" },
  userArea:   { display: "flex", alignItems: "center", gap: 8 },
  userEmail:  { fontSize: 12, color: theme.textMuted, fontFamily: "monospace", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const },
  signOutBtn: { fontSize: 11, color: theme.textMuted, background: "none", borderWidth: 0, cursor: "pointer", fontFamily: "monospace", textDecoration: "underline" },
  monthNav:   { display: "flex", alignItems: "center", gap: 4, background: theme.bgSecondary, borderRadius: 20, padding: "3px 6px" },
  navBtn:     { background: "none", borderWidth: 0, cursor: "pointer", fontSize: 18, color: theme.textMuted, padding: "0 4px", lineHeight: 1 },
  navLabel:   { fontSize: 13, fontWeight: 600, fontFamily: "monospace", minWidth: 130, textAlign: "center" as const, color: theme.text },
  yearBar:        { display: "grid", gridTemplateColumns: "repeat(12, minmax(0,1fr))", gap: 4, marginBottom: "1.5rem", padding: "12px", background: theme.bgSecondary, borderRadius: 12 },
  yearMonth:      { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", borderWidth: 0, cursor: "pointer", padding: "4px 2px", borderRadius: 6 },
  yearMonthActive:{ background: theme.surface, boxShadow: darkMode ? "0 1px 4px rgba(0,0,0,0.4)" : "0 1px 4px rgba(0,0,0,0.08)" },
  yearMonthName:  { fontSize: 10, color: theme.textMuted, fontFamily: "monospace" },
  yearBarTrack:   { width: "100%", height: 4, background: theme.border, borderRadius: 2, overflow: "hidden" },
  yearBarFill:    { height: "100%", borderRadius: 2, transition: "width 0.3s" },
  yearMonthPct:   { fontSize: 9, color: theme.textHint, fontFamily: "monospace" },
  banner:     { background: darkMode ? "rgba(29, 158, 117, 0.12)" : "#E1F5EE", borderWidth: 1, borderStyle: "solid", borderColor: darkMode ? "rgba(159, 225, 203, 0.4)" : "#9FE1CB", borderRadius: 10, padding: "12px 16px", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" },
  bannerTitle:{ fontSize: 13, color: darkMode ? "#9FE1CB" : "#0F6E56", fontWeight: 600 },
  bannerSub:  { fontSize: 11, color: "#1D9E75", fontFamily: "monospace", marginTop: 2 },
  bannerActions: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const, justifyContent: "flex-end" as const },
  copyBtn:    { fontSize: 11, color: "#378ADD", background: "none", borderWidth: 0, cursor: "pointer", fontFamily: "monospace", textDecoration: "underline" },
  resetBtn:   { fontSize: 11, color: theme.textMuted, background: "none", borderWidth: 0, cursor: "pointer", fontFamily: "monospace", textDecoration: "underline" },
  copyMsg:    { fontSize: 11, color: theme.textMuted, fontFamily: "monospace", display: "inline-flex", alignItems: "center", gap: 6 },
  copyConfirmActions: { display: "inline-flex", alignItems: "center", gap: 4 },
  copyYesBtn: { fontSize: 11, padding: "2px 7px", borderRadius: 6, borderWidth: 0, background: "#378ADD", color: "#fff", cursor: "pointer", fontFamily: "monospace" },
  copyNoBtn:  { fontSize: 11, padding: "2px 7px", borderRadius: 6, borderWidth: 0, background: theme.bgTertiary, color: theme.textMuted, cursor: "pointer", fontFamily: "monospace" },
  summaryGrid:{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 8, marginBottom: "1.5rem" },
  metric:     { background: theme.bgSecondary, borderRadius: 10, padding: "10px 12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
  metricLabel:{ fontSize: 10, color: theme.textMuted, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 4 },
  metricVal:  { fontSize: 16, fontWeight: 700, fontFamily: "monospace", letterSpacing: -0.5, wordBreak: "break-all" },
  ratesSettingsRow: { marginTop: "-0.5rem", marginBottom: "1rem" },
  ratesLink:  { fontSize: 11, color: "#378ADD", background: "none", borderWidth: 0, cursor: "pointer", fontFamily: "monospace", textDecoration: "underline", padding: 0 },
  ratesPanel: { marginTop: 10, padding: "12px 14px", background: theme.bgSecondary, borderRadius: 10, borderWidth: 1, borderStyle: "solid", borderColor: theme.border },
  ratesPanelTitle: { fontSize: 11, color: theme.textMuted, fontFamily: "monospace", marginBottom: 10, textTransform: "uppercase" as const, letterSpacing: 0.5 },
  ratesGrid:      { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginBottom: 10 },
  rateField:      { display: "flex", flexDirection: "column", gap: 4 },
  rateLabel:      { fontSize: 11, color: theme.textMuted, fontFamily: "monospace" },
  rateInput:      { width: "100%", padding: "6px 8px", borderRadius: 8, borderWidth: 1, borderStyle: "solid", borderColor: theme.border, fontSize: 13, fontFamily: "monospace", outline: "none", boxSizing: "border-box" as const, background: theme.surface, color: theme.text },
  ratesSaveBtn:   { fontSize: 12, padding: "6px 12px", borderRadius: 8, borderWidth: 0, cursor: "pointer", fontFamily: "monospace", fontWeight: 600, ...primaryCta },
  progressWrap: { marginBottom: "1.5rem" },
  progressLabel:{ display: "flex", justifyContent: "space-between", fontSize: 12, color: theme.textMuted, marginBottom: 6, fontFamily: "monospace" },
  progressBg:   { height: 8, background: theme.bgTertiary, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4, transition: "width 0.4s ease" },
  tab:        { fontSize: 12, padding: "5px 12px", borderRadius: 20, borderWidth: 1, borderStyle: "solid", borderColor: theme.border, background: theme.surface, cursor: "pointer", fontFamily: "monospace", color: theme.textMuted },
  tabActive,
  displayCurrTab: { fontSize: 11, padding: "3px 8px" },
  addBtn:     { fontSize: 12, padding: "5px 14px", borderRadius: 20, borderWidth: 0, background: "#1D9E75", color: "#fff", cursor: "pointer", fontFamily: "monospace", fontWeight: 600, flexShrink: 0 },
  expenseList:    { display: "flex", flexDirection: "column", gap: 6 },
  expenseRow:     { display: "flex", alignItems: "center", gap: 10, background: theme.surface, borderWidth: 1, borderStyle: "solid", borderColor: theme.border, borderRadius: 10, padding: "10px 14px" },
  expenseIcon:    { width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 },
  expenseName:    { fontSize: 14, fontWeight: 600, color: theme.text },
  expenseNamePaid:{ textDecoration: "line-through", color: theme.textHint },
  expenseCat:     { fontSize: 11, color: theme.textMuted, fontFamily: "monospace" },
  expenseCurrBadge: { fontSize: 11, color: theme.textMuted, fontFamily: "monospace", background: theme.bgSecondary, padding: "2px 8px", borderRadius: 20 },
  expenseAmount:  { fontSize: 15, fontWeight: 700, fontFamily: "monospace", marginLeft: "auto" },
  statusBtn:      { fontSize: 11, padding: "3px 8px", borderRadius: 6, borderWidth: 0, cursor: "pointer", fontFamily: "monospace" },
  btnPaid:        { background: "#E1F5EE", color: "#0F6E56" },
  btnUndo:        { background: theme.bgTertiary, color: theme.textMuted, fontSize: 11, padding: "3px 8px", borderRadius: 6, borderWidth: 0, cursor: "pointer", fontFamily: "monospace" },
  btnIcon:        { fontSize: 12, padding: "3px 7px", borderRadius: 6, borderWidth: 0, background: theme.bgSecondary, color: theme.textMuted, cursor: "pointer" },
  deleteAllBtn:   { fontSize: 12, padding: "3px 7px", borderRadius: 6, borderWidth: 0, background: "#FAECE7", color: "#D85A30", cursor: "pointer" },
  confirmDeleteBtn: { fontSize: 11, padding: "3px 8px", borderRadius: 6, borderWidth: 0, background: "#D85A30", color: "#fff", cursor: "pointer", fontFamily: "monospace" },
  btnDelete:      { fontSize: 11, padding: "3px 8px", borderRadius: 6, borderWidth: 0, background: "#FAECE7", color: "#D85A30", cursor: "pointer", fontFamily: "monospace" },
  emptyState:     { fontSize: 13, color: theme.textMuted, padding: "1rem 0", textAlign: "center" as const },
  emptyAdd:       { background: "none", borderWidth: 0, color: "#1D9E75", cursor: "pointer", fontFamily: "monospace", fontSize: 13 },
  sectionTitle: { fontSize: 13, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", color: theme.textMuted, margin: "2rem 0 0.75rem", fontFamily: "monospace" },
  donutWrap:    { display: "flex", gap: 24, alignItems: "center", padding: "1rem", background: theme.bgSecondary, borderRadius: 10 },
  donutCenter:  { position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" },
  donutCenterVal:  { fontSize: 20, fontWeight: 700, fontFamily: "monospace", letterSpacing: -1, color: theme.text },
  donutCenterLabel:{ fontSize: 10, color: theme.textMuted, fontFamily: "monospace" },
  legendList:   { display: "flex", flexDirection: "column", gap: 8, flex: 1 },
  legendItem:   { display: "flex", alignItems: "center", gap: 8, fontSize: 12 },
  legendDot:    { width: 10, height: 10, borderRadius: 3, flexShrink: 0 },
  legendName:   { flex: 1, color: theme.textMuted },
  legendAmount: { fontFamily: "monospace", fontWeight: 500, color: theme.text },
  legendPct:    { fontFamily: "monospace", color: theme.textMuted, fontSize: 11, minWidth: 32, textAlign: "right" as const },
  debtHelpWrap:   { marginTop: "1.25rem", background: "#FAEEDA", borderWidth: 1, borderStyle: "solid", borderColor: "#FAC775", borderRadius: 10, overflow: "hidden" },
  debtHelpToggle: { width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, background: "transparent", borderWidth: 0, padding: "12px 14px", cursor: "pointer", textAlign: "left" as const },
  debtHelpTitle:  { fontSize: 14, fontWeight: 700, color: "#7A4B11" },
  debtHelpIcon:   { fontSize: 18, fontWeight: 700, color: "#BA7517", lineHeight: 1, minWidth: 14, textAlign: "center" as const },
  debtHelpPanel:  { padding: "0 14px 12px" },
  debtHelpList:   { display: "flex", flexDirection: "column", gap: 10 },
  debtHelpItem:   { background: darkMode ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.55)", borderRadius: 8, padding: "9px 10px" },
  debtHelpLine:   { fontSize: 13, color: "#4A3A20", display: "flex", flexWrap: "wrap" as const, gap: 6, alignItems: "baseline" },
  debtHelpSep:    { color: "#BA7517" },
  debtHelpLink:   { color: "#B05E00", textDecoration: "underline", wordBreak: "break-all" as const },
  debtHelpDesc:   { marginTop: 4, fontSize: 12, color: "#7A5A2B", fontFamily: "monospace" },
  debtHelpNote:   { marginTop: 10, fontSize: 11, color: "#9B6A28", fontFamily: "monospace" },
  overlay:      { position: "fixed", inset: 0, background: darkMode ? "rgba(0,0,0,0.65)" : "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modal:        { background: theme.surface, borderRadius: 14, padding: "1.5rem", width: "100%", maxWidth: 400, margin: "0 1rem", borderWidth: 1, borderStyle: "solid", borderColor: theme.border },
  modalHeader:  { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" },
  modalTitle:   { fontSize: 16, fontWeight: 700, color: theme.text },
  modalClose:   { background: "none", borderWidth: 0, cursor: "pointer", fontSize: 16, color: theme.textMuted, padding: "2px 6px" },
  fieldGroup:   { marginBottom: "1rem" },
  label:        { display: "block", fontSize: 12, color: theme.textMuted, fontFamily: "monospace", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: 0.5 },
  input:        { width: "100%", padding: "8px 12px", borderRadius: 8, borderWidth: 1, borderStyle: "solid", borderColor: theme.border, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const, background: theme.surface, color: theme.text },
  select:       { width: "100%", padding: "8px 12px", borderRadius: 8, borderWidth: 1, borderStyle: "solid", borderColor: theme.border, fontSize: 14, fontFamily: "inherit", background: theme.surface, color: theme.text, outline: "none", boxSizing: "border-box" as const },
  formError:    { fontSize: 12, color: "#D85A30", marginBottom: "0.75rem", fontFamily: "monospace" },
  modalActions: { display: "flex", gap: 8, justifyContent: "flex-end", marginTop: "1.25rem" },
  btnCancel:    { fontSize: 13, padding: "7px 16px", borderRadius: 8, borderWidth: 1, borderStyle: "solid", borderColor: theme.border, background: theme.bgSecondary, color: theme.text, cursor: "pointer", fontFamily: "inherit" },
  btnSubmit:    { fontSize: 13, padding: "7px 16px", borderRadius: 8, borderWidth: 0, cursor: "pointer", fontFamily: "inherit", fontWeight: 600, ...primaryCta },
  };
}
