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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

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
                color: "#666",
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
              ticks: { font: { size: 10, family: "monospace" } },
            },
            y: {
              stacked: true,
              ticks: {
                callback: (value) => `£${(value as number).toLocaleString()}`,
                font: { size: 10, family: "monospace" },
                color: "#999",
              },
              grid: { color: "#eee" },
            },
          },
        },
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, []);

  return (
    <div style={{ background: "#fff", borderRadius: 10, padding: "1rem", border: "1px solid #e5e4e0", marginBottom: "1rem" }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 2, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
        How James paid off £7,000 using the snowball method
      </h2>
      <p style={{ fontSize: 13, color: "#666", marginBottom: 10, lineHeight: 1.5 }}>
        James earns £2,000/month — £2,000 credit card (15%), £1,500 credit card (23%), £3,500 loan.
        Snowball method: pay minimums on everything, throw extra at the smallest balance first.
      </p>

      <div style={{ marginBottom: 10, maxHeight: 250 }}>
        <canvas ref={canvasRef} />
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: 12 }}>
        <div style={{ background: "#E6F1FB", borderRadius: 6, padding: "4px 10px" }}>
          <span style={{ fontWeight: 700, color: "#378ADD" }}>Month 1–3</span>
          <span style={{ color: "#555", marginLeft: 4 }}>Paid off £1,500 card.</span>
        </div>
        <div style={{ background: "#FAECE7", borderRadius: 6, padding: "4px 10px" }}>
          <span style={{ fontWeight: 700, color: "#D85A30" }}>Month 4–6</span>
          <span style={{ color: "#555", marginLeft: 4 }}>Paid off £2,000 card.</span>
        </div>
        <div style={{ background: "#FAEEDA", borderRadius: 6, padding: "4px 10px" }}>
          <span style={{ fontWeight: 700, color: "#BA7517" }}>Month 7–11</span>
          <span style={{ color: "#555", marginLeft: 4 }}>Paid off £3,500 loan. Debt-free!</span>
        </div>
      </div>
    </div>
  );
}