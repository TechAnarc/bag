import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { bootstrapAdmin } from "@/lib/admin.functions";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";

export const Route = createFileRoute("/admin-signin")({
  head: () => ({ meta: [{ title: "Admin Sign In · TBH" }] }),
  component: SignIn,
});

function SignIn() {
  const nav = useNavigate();
  const bootstrap = useServerFn(bootstrapAdmin);
  const [email, setEmail] = useState("trivenibag@gmail.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      // Try login first
      let { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error && (error.message.toLowerCase().includes("invalid") || error.message.toLowerCase().includes("credentials"))) {
        // Try bootstrap (no-op if admin already exists)
        const res = await bootstrap({ data: { email, password } });
        if (res.ok) {
          const retry = await supabase.auth.signInWithPassword({ email, password });
          error = retry.error;
        }
      }
      if (error) throw error;
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
            <p className="mt-1 text-sm text-cream/50">Triveni Bombay Bag House · Enterprise</p>
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
              First-time setup: enter the seeded credentials to provision your admin account.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
