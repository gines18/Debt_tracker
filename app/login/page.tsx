"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Mode = "login" | "register" | "forgot";

export default function LoginPage() {
  const router  = useRouter();
  const supabase = createClient();

  const [mode,    setMode]    = useState<Mode>("login");
  const [email,   setEmail]   = useState("");
  const [password,setPassword]= useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/");
        router.refresh();

      } else if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${location.origin}/` },
        });
        if (error) throw error;
        setSuccess("Account created! Check your email to confirm, then log in.");
        setMode("login");

      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${location.origin}/reset-password`,
        });
        if (error) throw error;
        setSuccess("Password reset email sent — check your inbox.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const title = mode === "login" ? "Welcome back" : mode === "register" ? "Create account" : "Reset password";
  const btnLabel = mode === "login" ? "Sign in" : mode === "register" ? "Create account" : "Send reset email";

  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* Logo */}
        <div style={s.logo}>budget<span style={{ color: "#1D9E75" }}>.</span>tracker</div>
        <div style={s.subtitle}>{title}</div>

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.fieldGroup}>
            <label style={s.label}>Email</label>
            <input
              style={s.input}
              type="email"
              required
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          {mode !== "forgot" && (
            <div style={s.fieldGroup}>
              <label style={s.label}>Password</label>
              <input
                style={s.input}
                type="password"
                required
                minLength={6}
                placeholder={mode === "register" ? "At least 6 characters" : "••••••••"}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          )}

          {error   && <div style={s.errorBox}>{error}</div>}
          {success && <div style={s.successBox}>{success}</div>}

          <button style={{ ...s.submitBtn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? "Please wait…" : btnLabel}
          </button>
        </form>

        {/* Mode switchers */}
        <div style={s.links}>
          {mode === "login" && (<>
            <button style={s.link} onClick={() => { setMode("register"); setError(""); setSuccess(""); }}>
              No account? Register
            </button>
            <span style={s.dot}>·</span>
            <button style={s.link} onClick={() => { setMode("forgot"); setError(""); setSuccess(""); }}>
              Forgot password?
            </button>
          </>)}
          {mode === "register" && (
            <button style={s.link} onClick={() => { setMode("login"); setError(""); setSuccess(""); }}>
              Already have an account? Sign in
            </button>
          )}
          {mode === "forgot" && (
            <button style={s.link} onClick={() => { setMode("login"); setError(""); setSuccess(""); }}>
              Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:       { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7f6f3", fontFamily: "'Segoe UI', system-ui, sans-serif", padding: "1rem" },
  card:       { background: "#fff", borderRadius: 16, padding: "2rem", width: "100%", maxWidth: 380, boxShadow: "0 2px 16px rgba(0,0,0,0.08)" },
  logo:       { fontSize: 22, fontWeight: 700, letterSpacing: -0.5, marginBottom: 4 },
  subtitle:   { fontSize: 14, color: "#999", marginBottom: "1.75rem" },
  form:       { display: "flex", flexDirection: "column", gap: 0 },
  fieldGroup: { marginBottom: "1rem" },
  label:      { display: "block", fontSize: 12, color: "#999", fontFamily: "monospace", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: 0.5 },
  input:      { width: "100%", padding: "10px 12px", borderRadius: 8, borderWidth: 1, borderStyle: "solid", borderColor: "#e5e4e0", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const },
  errorBox:   { fontSize: 13, color: "#D85A30", background: "#FAECE7", borderRadius: 8, padding: "8px 12px", marginBottom: "1rem" },
  successBox: { fontSize: 13, color: "#0F6E56", background: "#E1F5EE", borderRadius: 8, padding: "8px 12px", marginBottom: "1rem" },
  submitBtn:  { width: "100%", padding: "11px", borderRadius: 8, borderWidth: 0, background: "#1a1a1a", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginTop: 4 },
  links:      { display: "flex", justifyContent: "center", gap: 8, marginTop: "1.25rem", flexWrap: "wrap" as const },
  link:       { background: "none", borderWidth: 0, cursor: "pointer", fontSize: 13, color: "#1D9E75", fontFamily: "inherit", textDecoration: "underline", padding: 0 },
  dot:        { color: "#ccc", fontSize: 13 },
};
