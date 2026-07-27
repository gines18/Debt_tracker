# Debt payoff grid (Budget Tracker feature)

This feature adds a **month-by-month debt + savings grid** at [`/plan`](/plan) for logged-in users on budget.tracker.

## 1. Apply the database migration

In the Supabase Dashboard → **SQL Editor**, run the full migration:

`supabase/migrations/20260727120000_debt_budget_tracker.sql`

Or with Supabase CLI:

```bash
supabase db push
```

If Realtime fails on `alter publication supabase_realtime add table`, enable replication manually:

**Database → Publications → supabase_realtime** → add `budgets`, `debts`, `monthly_records`.

Optional demo data: `supabase/seed_debt_budget_example.sql` (replace `YOUR-USER-UUID-HERE`).

## 2. Environment

Same as the rest of the app:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

No new env vars.

## 3. Routes & auth

| Route     | Access                                      |
|-----------|---------------------------------------------|
| `/`       | Monthly expense tracker (existing)          |
| `/plan`   | Debt payoff grid (new)                      |
| `/landing`, `/login` | Public                          |

`middleware.ts` already protects `/plan` (only authenticated users).

First visit to `/plan` calls `ensureDefaultBudget()` and creates a starter budget with two debts and a savings row.

## 4. Code layout

```
app/
  actions/debt-budget.ts     # Server Actions (CRUD)
  plan/page.tsx              # Server page → BudgetTrackerView
components/
  budget-tracker/            # UI (table, cells, dialogs)
  ui/                        # shadcn-style primitives
lib/budget-tracker/          # types, money, months, grid, zod
supabase/
  migrations/...             # Schema + RLS
  seed_debt_budget_example.sql
```

## 5. Data model

- **`budgets`** — one plan per user (multiple allowed); `title`, `start_date` (defines “Starting” column).
- **`debts`** — named rows; `sort_order` for display.
- **`monthly_records`** — amounts in **pence** (`amount_pence`). Savings rows: `is_savings = true`, `debt_id = null`.

Total debt per month is computed in the UI (not stored).

## 6. UX notes

- Inline click-to-edit amounts (Server Action + optional Realtime refresh).
- **Add debt** / **Add month column** (new month copies previous month’s values).
- Editable budget title and start date.
- Multiple budgets via dropdown; create / delete budgets.
- Toasts via `sonner` (see root `layout.tsx`).

## 7. Link from the main tracker

The monthly budget header includes **Debt plan** → `/plan`. The debt plan header links back to **Monthly budget** → `/`.

## 8. Dependencies added

`date-fns`, `zod`, `@tanstack/react-table`, `sonner`, Radix Dialog/Label/Slot, `lucide-react`, `clsx`, `tailwind-merge`, `class-variance-authority`.

Run `npm install` after pulling.

## 9. Local dev

```bash
npm run dev
```

Sign in → open [http://localhost:3000/plan](http://localhost:3000/plan).
