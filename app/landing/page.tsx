"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// ─── Scroll reveal hook ───────────────────────────────────────────────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

// ─── Animated number counter ──────────────────────────────────────────────────
function Counter({ target, prefix = "", suffix = "" }: { target: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, visible } = useReveal();

  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const duration = 1800;
    const step = 16;
    const increment = target / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, step);
    return () => clearInterval(timer);
  }, [visible, target]);

  return (
    <div ref={ref} className="tabular-nums">
      {prefix}{count.toLocaleString()}{suffix}
    </div>
  );
}

// ─── Reveal wrapper ───────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, className = "", from = "bottom" }: {
  children: React.ReactNode; delay?: number; className?: string; from?: "bottom" | "left" | "right"
}) {
  const { ref, visible } = useReveal();
  const translate = from === "left" ? "-translate-x-12" : from === "right" ? "translate-x-12" : "translate-y-10";
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-x-0 translate-y-0" : `opacity-0 ${translate}`} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ─── Debt counter animation ───────────────────────────────────────────────────
function DebtMeter() {
  const { ref, visible } = useReveal();
  const [amount, setAmount] = useState(8400);

  useEffect(() => {
    if (!visible) return;
    let current = 8400;
    const target = 0;
    const duration = 3000;
    const steps = 60;
    const decrement = (current - target) / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      current = Math.max(0, current - decrement * (1 + step * 0.02));
      setAmount(Math.round(current));
      if (step >= steps) { setAmount(0); clearInterval(timer); }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [visible]);

  const pct = ((8400 - amount) / 8400) * 100;

  return (
    <div ref={ref} className="relative bg-stone-900 rounded-2xl p-8 border border-stone-700">
      <div className="text-stone-400 text-xs font-mono uppercase tracking-widest mb-3">Total debt remaining</div>
      <div className={`text-5xl font-black tabular-nums transition-colors duration-500 ${amount === 0 ? "text-emerald-400" : "text-red-400"}`}>
        £{amount.toLocaleString()}
      </div>
      <div className="mt-6 h-2 bg-stone-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400 rounded-full transition-all duration-100 ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs font-mono text-stone-500">
        <span>£8,400 owed</span>
        <span className={pct === 100 ? "text-emerald-400" : ""}>{Math.round(pct)}% cleared</span>
      </div>
    </div>
  );
}

// ─── Budget card mock ─────────────────────────────────────────────────────────
function BudgetCardMock() {
  const items = [
    { name: "Rent", amount: "£60", cat: "Fixed", paid: true, color: "bg-blue-500" },
    { name: "Groceries", amount: "£300", cat: "Essentials", paid: true, color: "bg-emerald-500" },
    { name: "Debt payment", amount: "£500", cat: "Debt", paid: true, color: "bg-red-500" },
    { name: "Emergency buffer", amount: "£150", cat: "Savings", paid: false, color: "bg-amber-500" },
    { name: "Fun / wants", amount: "£140", cat: "Personal", paid: false, color: "bg-purple-500" },
  ];

  return (
    <div className="bg-stone-900 rounded-2xl border border-stone-700 overflow-hidden shadow-2xl">
      <div className="px-5 py-4 border-b border-stone-700 flex items-center justify-between">
        <span className="text-white font-bold text-sm">budget<span className="text-emerald-400">.</span>tracker</span>
        <span className="text-stone-400 text-xs font-mono">March 2026</span>
      </div>
      <div className="grid grid-cols-3 gap-px bg-stone-700 text-center text-xs">
        {[["Income", "£1,540", "text-white"], ["Paid out", "£860", "text-red-400"], ["Remaining", "£680", "text-emerald-400"]].map(([l, v, c]) => (
          <div key={l} className="bg-stone-900 py-3 px-2">
            <div className="text-stone-500 font-mono uppercase tracking-wider text-[10px]">{l}</div>
            <div className={`font-black text-lg ${c}`}>{v}</div>
          </div>
        ))}
      </div>
      <div className="p-3 space-y-2">
        {items.map((item, i) => (
          <Reveal key={item.name} delay={i * 80}>
            <div className={`flex items-center gap-3 rounded-lg px-3 py-2 ${item.paid ? "bg-stone-800/50" : "bg-stone-800"}`}>
              <div className={`w-2 h-2 rounded-full ${item.color}`} />
              <span className={`flex-1 text-sm font-medium ${item.paid ? "line-through text-stone-500" : "text-white"}`}>{item.name}</span>
              <span className={`text-sm font-mono font-bold ${item.paid ? "text-stone-500" : "text-white"}`}>{item.amount}</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${item.paid ? "bg-emerald-900/50 text-emerald-400" : "bg-stone-700 text-stone-400"}`}>
                {item.paid ? "paid" : "pending"}
              </span>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="bg-stone-950 text-white min-h-screen overflow-x-hidden" style={{ fontFamily: "'Georgia', serif" }}>

      {/* ── Nav ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrollY > 60 ? "bg-stone-950/95 backdrop-blur border-b border-stone-800" : ""}`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "monospace" }}>
            budget<span className="text-emerald-400">.</span>tracker
          </span>
          <Link
            href="/login"
            className="text-sm font-mono bg-emerald-500 hover:bg-emerald-400 text-stone-950 px-4 py-2 rounded-full transition-colors font-bold"
          >
            Get started →
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-16 overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.3) 40px, rgba(255,255,255,0.3) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.3) 40px, rgba(255,255,255,0.3) 41px)`
        }} />

        {/* Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-96 md:h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #10b981, transparent 70%)" }} />

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <div className="inline-block text-emerald-400 text-xs font-mono uppercase tracking-[0.3em] border border-emerald-900 bg-emerald-950/50 px-4 py-2 rounded-full mb-8 animate-pulse">
            A true story about money
          </div>

          <h1 className="text-4xl md:text-7xl lg:text-8xl font-black leading-none tracking-tighter mb-6"
            style={{ fontFamily: "Georgia, serif" }}>
            He owed
            <br />
            <span className="text-red-400 line-through decoration-4">£8,400</span>
            <br />
            <span className="text-emerald-400">to no one.</span>
          </h1>

          <p className="text-stone-400 text-lg md:text-xl max-w-xl mx-auto leading-relaxed mb-10">
            This is Marcus. In 2024, he was drowning in debt, living paycheck to paycheck, with no idea where his money went. 
            <span className="text-white"> This is how he got out.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login"
              className="bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold px-8 py-4 rounded-full text-base transition-all hover:scale-105 font-mono">
              Start your story →
            </Link>
            <a href="#story"
              className="border border-stone-700 hover:border-stone-500 text-stone-300 font-mono px-8 py-4 rounded-full text-base transition-all hover:text-white">
              Read Marcus's story ↓
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-stone-600">
          <span className="text-xs font-mono uppercase tracking-widest">Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-stone-600 to-transparent animate-pulse" />
        </div>
      </section>

      {/* ── Chapter 1: The Problem ── */}
      <section id="story" className="py-16 md:py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-emerald-400 font-mono text-xs uppercase tracking-[0.3em] mb-4">Chapter 01</div>
            <h2 className="text-3xl md:text-6xl font-black tracking-tighter mb-8 md:mb-16 leading-none">
              The spiral<br />
              <span className="text-stone-500">nobody talks about.</span>
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              {[
                { quote: "I had two bank accounts — a Polish one and a British one. Both in the red.", delay: 0 },
                { quote: "I knew I owed money. I just didn't know how much. Checking the balance felt like opening a letter I didn't want to read.", delay: 100 },
                { quote: "Payday came. Payday went. I had nothing to show for it. No savings. No plan. Just rent paid and the rest… gone.", delay: 200 },
              ].map((item) => (
                <Reveal key={item.quote} delay={item.delay} from="left">
                  <blockquote className="border-l-2 border-stone-700 pl-6">
                    <p className="text-stone-300 text-lg leading-relaxed italic">"{item.quote}"</p>
                    <cite className="text-stone-600 text-sm font-mono mt-2 block not-italic">— Marcus, Sheffield</cite>
                  </blockquote>
                </Reveal>
              ))}
            </div>

            <Reveal from="right" delay={150}>
              <div className="bg-stone-900 rounded-2xl p-8 border border-stone-800 space-y-4">
                <div className="text-stone-500 text-xs font-mono uppercase tracking-widest">Marcus's finances · January 2024</div>
                {[
                  { label: "Monthly income", val: "£1,540", color: "text-white" },
                  { label: "Known fixed bills", val: "£749", color: "text-stone-300" },
                  { label: "Debt repayments", val: "unknown", color: "text-red-400" },
                  { label: "Savings", val: "£0", color: "text-red-400" },
                  { label: "Money unaccounted for", val: "£791+", color: "text-amber-400" },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center py-2 border-b border-stone-800 last:border-0">
                    <span className="text-stone-400 text-sm">{row.label}</span>
                    <span className={`font-mono font-bold text-sm ${row.color}`}>{row.val}</span>
                  </div>
                ))}
                <div className="pt-2 text-center text-stone-600 text-xs font-mono italic">
                  "I thought I was doing okay."
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-stone-800" />
        </div>
        <Reveal>
          <div className="relative flex justify-center">
            <span className="bg-stone-950 px-8 text-stone-600 font-mono text-sm uppercase tracking-widest">Then something changed</span>
          </div>
        </Reveal>
      </div>

      {/* ── Chapter 2: The Turning Point ── */}
      <section className="py-16 md:py-32 px-6 bg-stone-900/30">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-emerald-400 font-mono text-xs uppercase tracking-[0.3em] mb-4">Chapter 02</div>
            <h2 className="text-3xl md:text-6xl font-black tracking-tighter mb-8 md:mb-16 leading-none">
              £500 a month.<br />
              <span className="text-emerald-400">That was the plan.</span>
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <Reveal from="left">
              <BudgetCardMock />
            </Reveal>

            <div className="space-y-8">
              <Reveal delay={100}>
                <p className="text-stone-300 text-xl leading-relaxed">
                  Marcus started writing down every expense. Not in a spreadsheet. Not in his head. In a tracker — every pound assigned a job before payday.
                </p>
              </Reveal>
              <Reveal delay={200}>
                <p className="text-stone-400 text-lg leading-relaxed">
                  £250 to the British bank. £250 to the Polish bank. Every month. No exceptions. No skipping because it "wasn't that much."
                </p>
              </Reveal>
              <Reveal delay={300}>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Monthly debt payment", val: "£500", color: "text-red-400" },
                    { label: "Emergency buffer", val: "£150", color: "text-amber-400" },
                    { label: "Fun money kept", val: "£140", color: "text-purple-400" },
                    { label: "Sleep quality", val: "better", color: "text-emerald-400" },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-stone-900 rounded-xl p-4 border border-stone-800">
                      <div className={`text-xl md:text-2xl font-black font-mono ${stat.color}`}>{stat.val}</div>
                      <div className="text-stone-500 text-xs mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── Chapter 3: The Numbers ── */}
      <section className="py-16 md:py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Reveal>
            <div className="text-emerald-400 font-mono text-xs uppercase tracking-[0.3em] mb-4">Chapter 03</div>
            <h2 className="text-3xl md:text-6xl font-black tracking-tighter mb-6">
              Watch the debt<br />disappear.
            </h2>
            <p className="text-stone-400 text-lg mb-16 max-w-xl mx-auto">
              Month by month. Payment by payment. The number that once kept him awake started shrinking.
            </p>
          </Reveal>

          <Reveal delay={200}>
            <DebtMeter />
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            {[
              { label: "Months to clear debt", value: 17, suffix: "mo" },
              { label: "Saved alongside debt", value: 2550, prefix: "£" },
              { label: "Budget accuracy", value: 94, suffix: "%" },
            ].map((stat) => (
              <Reveal key={stat.label} delay={100}>
                <div className="bg-stone-900 rounded-2xl p-6 border border-stone-800">
                  <div className="text-3xl md:text-4xl font-black font-mono text-emerald-400">
                    <Counter target={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                  </div>
                  <div className="text-stone-500 text-sm mt-2">{stat.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Chapter 4: The Quote ── */}
      <section className="py-16 md:py-32 px-6 bg-emerald-950/20 border-y border-emerald-900/30">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <div className="text-center">
              <div className="text-emerald-800 text-8xl font-serif leading-none mb-6">"</div>
              <blockquote className="text-2xl md:text-4xl font-black leading-tight tracking-tight mb-8" style={{ fontFamily: "Georgia, serif" }}>
                I didn't earn more money. I didn't win anything. I just finally knew{" "}
                <span className="text-emerald-400">where every pound was going.</span>
              </blockquote>
              <cite className="text-stone-500 font-mono text-sm not-italic uppercase tracking-widest">Marcus · Sheffield, England · Debt-free since October 2025</cite>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-16 md:py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-20">
              <div className="text-emerald-400 font-mono text-xs uppercase tracking-[0.3em] mb-4">The tool</div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tighter">
                Simple. Honest. Yours.
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              {
                icon: "📅",
                title: "Every month, a fresh start",
                desc: "Navigate between months. See your whole year at a glance. Each month is independent — your January doesn't haunt your July.",
                delay: 0,
              },
              {
                icon: "✓",
                title: "Mark it paid. Mean it.",
                desc: "Every bill gets marked when it's done. Watch your remaining balance update in real time. No guessing, no surprises on day 28.",
                delay: 100,
              },
              {
                icon: "☁",
                title: "Your data, everywhere",
                desc: "Backed by Supabase. Log in from your phone, your laptop, a library computer. Your budget follows you.",
                delay: 200,
              },
              {
                icon: "✏",
                title: "Add, edit, remove anything",
                desc: "Your expenses aren't ours to decide. Build the budget that fits your life — not a template someone else designed.",
                delay: 300,
              },
              {
                icon: "£",
                title: "Change your income anytime",
                desc: "Got a raise? Lost a shift? Update your income and everything recalculates instantly. Your budget lives in the real world.",
                delay: 400,
              },
              {
                icon: "→",
                title: "Free. No ads. No nonsense.",
                desc: "No premium tier. No upsells. No ads. Just a clean tool that does one thing well.",
                delay: 500,
              },
            ].map((f) => (
              <Reveal key={f.title} delay={f.delay}>
                <div className="group bg-stone-900 hover:bg-stone-800 rounded-2xl p-6 border border-stone-800 hover:border-stone-600 transition-all duration-300 h-full">
                  <div className="text-3xl mb-4">{f.icon}</div>
                  <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
                  <p className="text-stone-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-16 md:py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ background: "radial-gradient(ellipse at center, #10b981 0%, transparent 70%)" }} />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <Reveal>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-6">
              Your story
              <br />
              <span className="text-emerald-400">starts today.</span>
            </h2>
            <p className="text-stone-400 text-xl mb-12 max-w-xl mx-auto leading-relaxed">
              Marcus started with £8,400 of debt and no plan. You already have the plan. Now you need the tool.
            </p>
            <Link
              href="/login"
              className="inline-block bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xl px-12 py-5 rounded-full transition-all hover:scale-105 font-mono"
            >
              Create your free account →
            </Link>
            <p className="text-stone-600 text-sm font-mono mt-6">No credit card. No catch. Just your budget.</p>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-stone-800 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-stone-500 font-mono text-sm">
            budget<span className="text-emerald-600">.</span>tracker — built for real people
          </span>
          <div className="flex gap-6 text-stone-600 text-sm font-mono">
            <Link href="/login" className="hover:text-stone-300 transition-colors">Sign in</Link>
            <Link href="/login" className="hover:text-stone-300 transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
