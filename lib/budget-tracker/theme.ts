export const LS_BUDGET_THEME = "budgetTheme";

export function readBudgetThemeDark(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(LS_BUDGET_THEME) === "dark";
}

export function applyBudgetThemeDark(dark: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", dark);
  document.body.style.backgroundColor = dark ? "#0f0f0f" : "";
}

export function writeBudgetThemeDark(dark: boolean) {
  localStorage.setItem(LS_BUDGET_THEME, dark ? "dark" : "light");
  applyBudgetThemeDark(dark);
}
