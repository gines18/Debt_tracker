-- Debt payoff & savings grid (budgets / debts / monthly_records)
-- Run in Supabase SQL Editor or via CLI: supabase db push

-- ─── Tables ─────────────────────────────────────────────────────────────────

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'My debt plan',
  start_date date not null default (date_trunc('month', current_date))::date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists budgets_user_id_idx on public.budgets (user_id);

create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.budgets (id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists debts_budget_id_idx on public.debts (budget_id);

create table if not exists public.monthly_records (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.budgets (id) on delete cascade,
  debt_id uuid references public.debts (id) on delete cascade,
  month date not null,
  amount_pence bigint not null default 0 check (amount_pence >= 0),
  is_savings boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint monthly_records_savings_debt_check check (
    (is_savings = true and debt_id is null)
    or (is_savings = false and debt_id is not null)
  )
);

create index if not exists monthly_records_budget_month_idx
  on public.monthly_records (budget_id, month);

-- One cell per debt per month; one savings cell per month per budget
create unique index if not exists monthly_records_debt_month_uniq
  on public.monthly_records (budget_id, debt_id, month)
  where debt_id is not null;

create unique index if not exists monthly_records_savings_month_uniq
  on public.monthly_records (budget_id, month)
  where is_savings = true;

-- ─── updated_at trigger ─────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists budgets_set_updated_at on public.budgets;
create trigger budgets_set_updated_at
  before update on public.budgets
  for each row execute function public.set_updated_at();

drop trigger if exists monthly_records_set_updated_at on public.monthly_records;
create trigger monthly_records_set_updated_at
  before update on public.monthly_records
  for each row execute function public.set_updated_at();

-- ─── RLS ────────────────────────────────────────────────────────────────────

alter table public.budgets enable row level security;
alter table public.debts enable row level security;
alter table public.monthly_records enable row level security;

-- budgets
create policy "budgets_select_own"
  on public.budgets for select
  using (auth.uid() = user_id);

create policy "budgets_insert_own"
  on public.budgets for insert
  with check (auth.uid() = user_id);

create policy "budgets_update_own"
  on public.budgets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "budgets_delete_own"
  on public.budgets for delete
  using (auth.uid() = user_id);

-- debts (via budget ownership)
create policy "debts_select_own"
  on public.debts for select
  using (
    exists (
      select 1 from public.budgets b
      where b.id = debts.budget_id and b.user_id = auth.uid()
    )
  );

create policy "debts_insert_own"
  on public.debts for insert
  with check (
    exists (
      select 1 from public.budgets b
      where b.id = debts.budget_id and b.user_id = auth.uid()
    )
  );

create policy "debts_update_own"
  on public.debts for update
  using (
    exists (
      select 1 from public.budgets b
      where b.id = debts.budget_id and b.user_id = auth.uid()
    )
  );

create policy "debts_delete_own"
  on public.debts for delete
  using (
    exists (
      select 1 from public.budgets b
      where b.id = debts.budget_id and b.user_id = auth.uid()
    )
  );

-- monthly_records
create policy "monthly_records_select_own"
  on public.monthly_records for select
  using (
    exists (
      select 1 from public.budgets b
      where b.id = monthly_records.budget_id and b.user_id = auth.uid()
    )
  );

create policy "monthly_records_insert_own"
  on public.monthly_records for insert
  with check (
    exists (
      select 1 from public.budgets b
      where b.id = monthly_records.budget_id and b.user_id = auth.uid()
    )
  );

create policy "monthly_records_update_own"
  on public.monthly_records for update
  using (
    exists (
      select 1 from public.budgets b
      where b.id = monthly_records.budget_id and b.user_id = auth.uid()
    )
  );

create policy "monthly_records_delete_own"
  on public.monthly_records for delete
  using (
    exists (
      select 1 from public.budgets b
      where b.id = monthly_records.budget_id and b.user_id = auth.uid()
    )
  );

-- ─── Realtime (enable in Dashboard → Database → Publications if needed) ─────

alter publication supabase_realtime add table public.budgets;
alter publication supabase_realtime add table public.debts;
alter publication supabase_realtime add table public.monthly_records;

-- ─── Example seed (replace USER_ID with auth.users id after sign-up) ────────
/*
insert into public.budgets (id, user_id, title, start_date)
values (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  'YOUR-USER-UUID-HERE',
  'Debt payoff plan',
  '2026-07-01'
);

insert into public.debts (budget_id, name, sort_order) values
  ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'Polish debt', 0),
  ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'British debt', 1);

-- After inserting debts, use their ids in monthly_records below.
-- Starting month Jul 2026, then Aug / Sep with sample payoff trajectory.
*/
