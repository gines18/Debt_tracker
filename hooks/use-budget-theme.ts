"use client";

import { useCallback, useEffect, useState } from "react";
import {
  applyBudgetThemeDark,
  readBudgetThemeDark,
  writeBudgetThemeDark,
} from "@/lib/budget-tracker/theme";

export function useBudgetTheme() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const dark = readBudgetThemeDark();
    setDarkMode(dark);
    applyBudgetThemeDark(dark);
  }, []);

  const toggleTheme = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      writeBudgetThemeDark(next);
      return next;
    });
  }, []);

  return { darkMode, toggleTheme };
}
