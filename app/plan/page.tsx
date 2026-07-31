import { ensureDefaultBudget, listBudgets } from "@/app/actions/debt-budget";
import { DebtPayoffStory } from "@/components/budget-tracker/debt-payoff-story";
import { BudgetTrackerView } from "@/components/budget-tracker/budget-tracker-view";

export const metadata = {
  title: "Debt plan — budget.tracker",
  description: "Track debt payoff and savings growth month by month.",
};

export default async function DebtPlanPage() {
  const snapshot = await ensureDefaultBudget();
  const budgets = await listBudgets();

  return (
    <div className="mx-auto max-w-6xl px-4">
      <BudgetTrackerView initialSnapshot={snapshot} initialBudgets={budgets} />
      <DebtPayoffStory />
    </div>
  );
}
