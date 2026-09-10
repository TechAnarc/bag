import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";

export const Route = createFileRoute("/admin-signin")({
  head: () => ({ meta: [{ title: "Admin Sign In · TBH" }] }),
  component: SignIn,
});

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";

/**
 * Wave 1 — Admin Sign-In
 * Auth authority: Triveni Express backend (/api/v1/admin/auth/login)
 * Token: JWT stored in localStorage "admin_access_token" (Dual-Tap pattern)
 * Visual: Preserved Bombay Bag House dark login theme (gold/ink/cream)
 */
function SignIn() {
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@trivenibombaybaghouse.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Invalid credentials");
      }

      // Dual-Tap: store token in localStorage for Bearer header injection
      const token = data.data?.token || data.token;
      if (token) {
        localStorage.setItem("admin_access_token", token);
      } else {
        throw new Error("No token received from server");
      }

      toast.success("Welcome back");
      nav({ to: "/admin" as any });
    } catch (err: any) {
      toast.error(err?.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-cream">
      <div className="grid min-h-screen place-items-center px-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-gradient-to-br from-gold/40 to-transparent ring-1 ring-gold/40">
              <Lock className="size-6 text-gold" />
            </div>
            <h1 className="mt-4 font-serif text-3xl tracking-tight">TBH Admin Console</h1>
            <p className="mt-1 text-sm text-cream/50">Bombay Bag House · Enterprise Mission Control</p>
          </div>
          <form
            onSubmit={onSubmit}
            className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl"
          >
            <div>
              <label className="text-xs uppercase tracking-widest text-cream/50">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/40 px-4 text-sm outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-cream/50">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/40 px-4 text-sm outline-none focus:border-gold"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-gold text-sm font-medium uppercase tracking-widest text-ink hover:opacity-90 disabled:opacity-50"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              Sign in
            </button>
            <p className="text-center text-[11px] text-cream/40">
              Secured by Triveni Commerce Engine · JWT Authentication
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
