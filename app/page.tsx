"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Chart, ArcElement, DoughnutController, Tooltip, Legend } from "chart.js";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

Chart.register(ArcElement, DoughnutController, Tooltip, Legend);

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = "Fixed" | "Essentials" | "Debt" | "Savings" | "Personal";

interface Expense {
  id: string;
  name: string;
  amount: number;
  cat: Category;
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
  { id: "pl_bank",   name: "Polish bank (debt)",  amount: 250,   cat: "Debt"       },
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

const DEBT_HELP_ORGS: DebtHelpOrg[] = [
  { name: "StepChange Debt Charity", website: "https://www.stepchange.org", phone: "0800 138 1111", description: "Free debt advice" },
  { name: "National Debtline", website: "https://www.nationaldebtline.org", phone: "0808 808 4000", description: "Free advice for people in England, Wales & Scotland" },
  { name: "Citizens Advice", website: "https://www.citizensadvice.org.uk", phone: "0800 144 8848", description: "Free, confidential advice" },
  { name: "PayPlan", website: "https://www.payplan.com", phone: "0800 280 2816", description: "Free debt management plans" },
  { name: "MoneyHelper", website: "https://www.moneyhelper.org.uk", phone: "0800 138 7777", description: "Government-backed money guidance" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) { return "£" + n.toFixed(2).replace(/\.00$/, ""); }
function uid()          { return Math.random().toString(36).slice(2, 9); }
function monthKey(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
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
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDebtHelpOpen, setIsDebtHelpOpen] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; mode: "add"|"edit"; expense: Expense|null }>({
    open: false, mode: "add", expense: null,
  });
  const [form,      setForm]      = useState({ name: "", amount: "", cat: "Fixed" as Category });
  const [formError, setFormError] = useState("");

  const donutRef      = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  // ── Auth ──────────────────────────────────────────────────────────────────

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
    expenses.forEach(e => { groups[e.cat] = (groups[e.cat] ?? 0) + e.amount; });
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
          tooltip: { callbacks: { label: i => " " + fmt(i.parsed as number) } },
        },
      },
    });
    return () => { chartInstance.current?.destroy(); };
  }, [expenses]);

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
    setForm({ name: "", amount: "", cat: "Fixed" });
    setFormError("");
    setModal({ open: true, mode: "add", expense: null });
  }
  function openEdit(e: Expense) {
    setForm({ name: e.name, amount: String(e.amount), cat: e.cat });
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
      updateMonth({ expenses: [...expenses, { id: uid(), name, amount, cat: form.cat }] });
    } else if (modal.expense) {
      updateMonth({
        expenses: expenses.map(e =>
          e.id === modal.expense!.id ? { ...e, name, amount, cat: form.cat } : e
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

  const totalBudgeted = expenses.reduce((s, e) => s + e.amount, 0);
  const paidTotal     = expenses.filter(e => paidIds.has(e.id)).reduce((s, e) => s + e.amount, 0);
  const remaining     = income - paidTotal;
  const unallocated   = income - totalBudgeted;
  const pct           = Math.min(Math.round((paidTotal / income) * 100), 100);
  const progressColor = pct > 85 ? "#D85A30" : pct > 60 ? "#BA7517" : "#1D9E75";

  const catGroups: Partial<Record<Category, number>> = {};
  expenses.forEach(e => { catGroups[e.cat] = (catGroups[e.cat] ?? 0) + e.amount; });

  const visible = activeCat === "All" ? expenses : expenses.filter(e => e.cat === activeCat);
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  const yearSummary = MONTH_NAMES.map((name, i) => {
    const k  = monthKey(year, i);
    const md = allData[k];
    if (!md) return { name: name.slice(0, 3), pct: 0, hasData: false };
    const total = md.expenses.reduce((s, e) => s + e.amount, 0);
    const paid  = md.expenses.filter(e => md.paidIds.includes(e.id)).reduce((s, e) => s + e.amount, 0);
    return { name: name.slice(0, 3), pct: total > 0 ? Math.round((paid / total) * 100) : 0, hasData: true };
  });

  // ─── Render ───────────────────────────────────────────────────────────────

  if (dbLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7f6f3", fontFamily: "monospace", color: "#999" }}>
        Loading your budget…
      </div>
    );
  }

  return (
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
        <button style={s.signOutBtn} onClick={signOut}>Sign out</button>
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
                  style={{ width: 90, padding: "2px 6px", borderRadius: 6, borderWidth: 1, borderStyle: "solid", borderColor: "#9FE1CB", fontSize: 13, fontFamily: "monospace", outline: "none", background: "#fff", color: "#0F6E56" }}
                />
                <button onClick={() => saveIncome(parseFloat(incomeInput))} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, borderWidth: 0, background: "#0F6E56", color: "#fff", cursor: "pointer", fontFamily: "monospace" }}>Save</button>
                <button onClick={() => setEditingIncome(false)} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, borderWidth: 0, background: "transparent", color: "#1D9E75", cursor: "pointer", fontFamily: "monospace" }}>Cancel</button>
              </span>
            ) : (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span>{fmt(income)}</span>
                <button onClick={startEditIncome} style={{ fontSize: 11, padding: "2px 7px", borderRadius: 6, borderWidth: 0, background: "#9FE1CB", color: "#0F6E56", cursor: "pointer", fontFamily: "monospace" }}>edit</button>
              </span>
            )}
          </div>
          <div style={s.bannerSub}>
            {unallocated >= 0
              ? `£${unallocated.toFixed(2)} unallocated · mark expenses paid to track`
              : `⚠ Over budget by £${Math.abs(unallocated).toFixed(2)}`}
          </div>
        </div>
        <button style={s.resetBtn} onClick={resetPaid}>reset paid</button>
      </div>

      {/* ── Summary grid ── */}
      <div style={s.summaryGrid}>
        {[
          { label: "Income",    val: fmt(income),        color: "#1a1a1a" },
          { label: "Budgeted",  val: fmt(totalBudgeted), color: totalBudgeted > income ? "#D85A30" : "#1a1a1a" },
          { label: "Paid out",  val: fmt(paidTotal),     color: "#D85A30" },
          { label: "Remaining", val: fmt(remaining),     color: remaining < 0 ? "#D85A30" : "#0F6E56" },
        ].map(m => (
          <div key={m.label} style={s.metric}>
            <div style={s.metricLabel}>{m.label}</div>
            <div style={{ ...s.metricVal, color: m.color }}>{m.val}</div>
          </div>
        ))}
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
        <button style={s.addBtn} onClick={openAdd}>+ Add</button>
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
            <div style={s.donutCenterVal}>{fmt(totalBudgeted)}</div>
            <div style={s.donutCenterLabel}>budgeted</div>
          </div>
        </div>
        <div style={s.legendList}>
          {(Object.keys(catGroups) as Category[]).map(cat => (
            <div key={cat} style={s.legendItem}>
              <span style={{ ...s.legendDot, background: CAT_COLORS[cat] }} />
              <span style={s.legendName}>{cat}</span>
              <span style={s.legendAmount}>{fmt(catGroups[cat]!)}</span>
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
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  shell:      { maxWidth: 760, margin: "0 auto", padding: "1.5rem 1rem 4rem", fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#1a1a1a" },
  topbar:     { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: 8 },
  logo:       { fontSize: 20, fontWeight: 700, letterSpacing: -0.5 },
  todayPill:  { fontSize: 11, background: "#E1F5EE", color: "#0F6E56", padding: "3px 8px", borderRadius: 20, fontFamily: "monospace" },
  syncPill:   { fontSize: 11, background: "#FAEEDA", color: "#BA7517", padding: "3px 8px", borderRadius: 20, fontFamily: "monospace" },
  userArea:   { display: "flex", alignItems: "center", gap: 8 },
  userEmail:  { fontSize: 12, color: "#999", fontFamily: "monospace", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const },
  signOutBtn: { fontSize: 11, color: "#999", background: "none", borderWidth: 0, cursor: "pointer", fontFamily: "monospace", textDecoration: "underline" },
  monthNav:   { display: "flex", alignItems: "center", gap: 4, background: "#f7f6f3", borderRadius: 20, padding: "3px 6px" },
  navBtn:     { background: "none", borderWidth: 0, cursor: "pointer", fontSize: 18, color: "#555", padding: "0 4px", lineHeight: 1 },
  navLabel:   { fontSize: 13, fontWeight: 600, fontFamily: "monospace", minWidth: 130, textAlign: "center" as const },
  yearBar:        { display: "grid", gridTemplateColumns: "repeat(12, minmax(0,1fr))", gap: 4, marginBottom: "1.5rem", padding: "12px", background: "#f7f6f3", borderRadius: 12 },
  yearMonth:      { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", borderWidth: 0, cursor: "pointer", padding: "4px 2px", borderRadius: 6 },
  yearMonthActive:{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
  yearMonthName:  { fontSize: 10, color: "#999", fontFamily: "monospace" },
  yearBarTrack:   { width: "100%", height: 4, background: "#e5e4e0", borderRadius: 2, overflow: "hidden" },
  yearBarFill:    { height: "100%", borderRadius: 2, transition: "width 0.3s" },
  yearMonthPct:   { fontSize: 9, color: "#bbb", fontFamily: "monospace" },
  banner:     { background: "#E1F5EE", borderWidth: 1, borderStyle: "solid", borderColor: "#9FE1CB", borderRadius: 10, padding: "12px 16px", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" },
  bannerTitle:{ fontSize: 13, color: "#0F6E56", fontWeight: 600 },
  bannerSub:  { fontSize: 11, color: "#1D9E75", fontFamily: "monospace", marginTop: 2 },
  resetBtn:   { fontSize: 11, color: "#999", background: "none", borderWidth: 0, cursor: "pointer", fontFamily: "monospace", textDecoration: "underline" },
  summaryGrid:{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 8, marginBottom: "1.5rem" },
  metric:     { background: "#f7f6f3", borderRadius: 10, padding: "10px 12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
  metricLabel:{ fontSize: 10, color: "#999", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 4 },
  metricVal:  { fontSize: 16, fontWeight: 700, fontFamily: "monospace", letterSpacing: -0.5, wordBreak: "break-all" },
  progressWrap: { marginBottom: "1.5rem" },
  progressLabel:{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#999", marginBottom: 6, fontFamily: "monospace" },
  progressBg:   { height: 8, background: "#efefeb", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4, transition: "width 0.4s ease" },
  tab:        { fontSize: 12, padding: "5px 12px", borderRadius: 20, borderWidth: 1, borderStyle: "solid", borderColor: "#e5e4e0", background: "#fff", cursor: "pointer", fontFamily: "monospace", color: "#555" },
  tabActive:  { background: "#1a1a1a", color: "#fff", borderWidth: 1, borderStyle: "solid", borderColor: "#1a1a1a" },
  addBtn:     { fontSize: 12, padding: "5px 14px", borderRadius: 20, borderWidth: 0, background: "#1D9E75", color: "#fff", cursor: "pointer", fontFamily: "monospace", fontWeight: 600, flexShrink: 0 },
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
  debtHelpWrap:   { marginTop: "1.25rem", background: "#FAEEDA", borderWidth: 1, borderStyle: "solid", borderColor: "#FAC775", borderRadius: 10, overflow: "hidden" },
  debtHelpToggle: { width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, background: "transparent", borderWidth: 0, padding: "12px 14px", cursor: "pointer", textAlign: "left" as const },
  debtHelpTitle:  { fontSize: 14, fontWeight: 700, color: "#7A4B11" },
  debtHelpIcon:   { fontSize: 18, fontWeight: 700, color: "#BA7517", lineHeight: 1, minWidth: 14, textAlign: "center" as const },
  debtHelpPanel:  { padding: "0 14px 12px" },
  debtHelpList:   { display: "flex", flexDirection: "column", gap: 10 },
  debtHelpItem:   { background: "rgba(255,255,255,0.55)", borderRadius: 8, padding: "9px 10px" },
  debtHelpLine:   { fontSize: 13, color: "#4A3A20", display: "flex", flexWrap: "wrap" as const, gap: 6, alignItems: "baseline" },
  debtHelpSep:    { color: "#BA7517" },
  debtHelpLink:   { color: "#B05E00", textDecoration: "underline", wordBreak: "break-all" as const },
  debtHelpDesc:   { marginTop: 4, fontSize: 12, color: "#7A5A2B", fontFamily: "monospace" },
  debtHelpNote:   { marginTop: 10, fontSize: 11, color: "#9B6A28", fontFamily: "monospace" },
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
  btnCancel:    { fontSize: 13, padding: "7px 16px", borderRadius: 8, borderWidth: 1, borderStyle: "solid", borderColor: "#ccc", background: "#f0f0f0", color: "#333", cursor: "pointer", fontFamily: "inherit" },
  btnSubmit:    { fontSize: 13, padding: "7px 16px", borderRadius: 8, borderWidth: 0, background: "#1a1a1a", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 },
};
