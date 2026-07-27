-- Example seed for debt payoff grid (run AFTER replacing USER_ID)
-- Amounts are in pence (e.g. 500000 = £5,000)

-- 1) Find your user id:
-- select id, email from auth.users;

-- 2) Insert budget + debts + monthly records:

do $$
declare
  uid uuid := 'YOUR-USER-UUID-HERE';
  bid uuid := gen_random_uuid();
  d_pol uuid := gen_random_uuid();
  d_uk uuid := gen_random_uuid();
begin
  insert into public.budgets (id, user_id, title, start_date)
  values (bid, uid, 'Debt payoff plan', '2026-07-01');

  insert into public.debts (id, budget_id, name, sort_order) values
    (d_pol, bid, 'Polish debt', 0),
    (d_uk, bid, 'British debt', 1);

  insert into public.monthly_records (budget_id, debt_id, month, amount_pence, is_savings) values
    (bid, d_pol, '2026-07-01', 500000, false),
    (bid, d_uk,  '2026-07-01', 320000, false),
    (bid, null,  '2026-07-01', 150000, true),
    (bid, d_pol, '2026-08-01', 470000, false),
    (bid, d_uk,  '2026-08-01', 305000, false),
    (bid, null,  '2026-08-01', 180000, true),
    (bid, d_pol, '2026-09-01', 440000, false),
    (bid, d_uk,  '2026-09-01', 290000, false),
    (bid, null,  '2026-09-01', 210000, true);
end $$;
