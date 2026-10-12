"use client";

import { useEffect, useRef } from "react";
import {
  Chart,
  BarElement,
  BarController,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { useBudgetTheme } from "@/hooks/use-budget-theme";

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface DebtRecord {
  month: string;
  creditCard1: number;
  creditCard2: number;
  loan: number;
}

const storyData: DebtRecord[] = [
  { month: "Month 1", creditCard1: 2000, creditCard2: 1500, loan: 3500 },
  { month: "Month 3", creditCard1: 1700, creditCard2: 0, loan: 3350 },
  { month: "Month 6", creditCard1: 0, creditCard2: 0, loan: 3000 },
  { month: "Month 9", creditCard1: 0, creditCard2: 0, loan: 900 },
  { month: "Month 11", creditCard1: 0, creditCard2: 0, loan: 0 },
];

export function DebtPayoffStory() {
  const { darkMode } = useBudgetTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const tickColor = darkMode ? "#888" : "#999";
    const legendColor = darkMode ? "#aaa" : "#666";
    const gridColor = darkMode ? "#2e2e2e" : "#eee";

    chartRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: storyData.map((d) => d.month),
        datasets: [
          {
            label: "Credit Card 1 (15%)",
            data: storyData.map((d) => d.creditCard1),
            backgroundColor: "#378ADD",
            borderRadius: 4,
          },
          {
            label: "Credit Card 2 (23%)",
            data: storyData.map((d) => d.creditCard2),
            backgroundColor: "#D85A30",
            borderRadius: 4,
          },
          {
            label: "Loan",
            data: storyData.map((d) => d.loan),
            backgroundColor: "#BA7517",
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 2.5,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              usePointStyle: true,
              padding: 8,
              font: { size: 10, family: "monospace" },
              color: legendColor,
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const val = context.parsed.y ?? 0;
                return `${context.dataset.label}: £${val.toLocaleString()}`;
              },
            },
          },
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: { font: { size: 10, family: "monospace" }, color: tickColor },
          },
          y: {
            stacked: true,
            ticks: {
              callback: (value) => `£${(value as number).toLocaleString()}`,
              font: { size: 10, family: "monospace" },
              color: tickColor,
            },
            grid: { color: gridColor },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [darkMode]);

  return (
    <div className="mb-4 rounded-[10px] border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-[#1a1a1a]">
      <h2 className="mb-0.5 text-base font-bold font-[family-name:var(--font-geist-sans)] dark:text-stone-100">
        How James paid off £7,000 using the snowball method
      </h2>
      <p className="mb-2.5 text-[13px] leading-normal text-stone-500 dark:text-stone-400">
        James earns £2,000/month — £2,000 credit card (15%), £1,500 credit card (23%), £3,500 loan.
        Snowball method: pay minimums on everything, throw extra at the smallest balance first.
      </p>

      <div className="mb-2.5 max-h-[250px]">
        <canvas ref={canvasRef} />
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <div className="rounded-md bg-[#E6F1FB] px-2.5 py-1 dark:bg-blue-950/40">
          <span className="font-bold text-[#378ADD]">Month 1–3</span>
          <span className="ml-1 text-stone-600 dark:text-stone-400">Paid off £1,500 card.</span>
        </div>
        <div className="rounded-md bg-[#FAECE7] px-2.5 py-1 dark:bg-orange-950/35">
          <span className="font-bold text-[#D85A30]">Month 4–6</span>
          <span className="ml-1 text-stone-600 dark:text-stone-400">Paid off £2,000 card.</span>
        </div>
        <div className="rounded-md bg-[#FAEEDA] px-2.5 py-1 dark:bg-amber-950/35">
          <span className="font-bold text-[#BA7517]">Month 7–11</span>
          <span className="ml-1 text-stone-600 dark:text-stone-400">Paid off £3,500 loan. Debt-free!</span>
        </div>
      </div>
    </div>
  );
}
