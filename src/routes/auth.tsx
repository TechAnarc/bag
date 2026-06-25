import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/site-layout";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign In — Triveni Bombay Bag House" }] }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  return (
    <SiteLayout>
      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-16 md:grid-cols-2">
        <div className="hidden rounded-2xl bg-ink p-10 text-cream md:block">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">The TBH Club</p>
          <h2 className="mt-4 font-serif text-4xl leading-tight">Carry the<br /> story of you.</h2>
          <p className="mt-6 text-sm text-cream/70">Sign in for faster checkout, exclusive private sales, and early access to new collections.</p>
          <ul className="mt-8 space-y-3 text-sm text-cream/80">
            <li>• Save addresses & payment methods</li>
            <li>• Order tracking & easy returns</li>
            <li>• Reward points on every purchase</li>
            <li>• Concierge support, 7 days a week</li>
          </ul>
        </div>
        <div>
          <div className="flex gap-2">
            <button onClick={() => setMode("login")} className={`flex-1 rounded-full py-2 text-xs uppercase tracking-widest ${mode === "login" ? "bg-ink text-cream" : "border border-border"}`}>Sign in</button>
            <button onClick={() => setMode("register")} className={`flex-1 rounded-full py-2 text-xs uppercase tracking-widest ${mode === "register" ? "bg-ink text-cream" : "border border-border"}`}>Create account</button>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="mt-8 space-y-4">
            {mode === "register" && <Field label="Full name" />}
            <Field label="Email" type="email" />
            {mode !== "forgot" && <Field label="Password" type="password" />}
            {mode === "register" && <Field label="Confirm password" type="password" />}

            <button className="w-full rounded-full bg-gradient-gold py-3 text-xs uppercase tracking-widest text-ink">
              {mode === "login" ? "Sign in" : mode === "register" ? "Create account" : "Send reset link"}
            </button>
            {mode === "login" && (
              <button type="button" onClick={() => setMode("forgot")} className="block text-center text-xs text-muted-foreground hover:text-foreground w-full">Forgot password?</button>
            )}
            {mode === "forgot" && (
              <button type="button" onClick={() => setMode("login")} className="block text-center text-xs text-muted-foreground hover:text-foreground w-full">← Back to sign in</button>
            )}
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or continue with<span className="h-px flex-1 bg-border" /></div>
          <div className="grid grid-cols-2 gap-2">
            <button className="flex items-center justify-center gap-2 rounded-full border border-border py-2.5 text-xs">
              <svg className="size-4" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 11v3.4h5.4c-.2 1.4-1.6 4.1-5.4 4.1-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.7 14.6 3 12 3 7 3 3 7 3 12s4 9 9 9c5.2 0 8.7-3.6 8.7-8.8 0-.6-.1-1-.1-1.2H12z"/></svg>
              Google
            </button>
            <button className="flex items-center justify-center gap-2 rounded-full border border-border py-2.5 text-xs">
              <svg className="size-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 12.5c-.04-3.16 2.58-4.69 2.7-4.77-1.47-2.15-3.77-2.45-4.59-2.48-1.95-.2-3.81 1.15-4.8 1.15-.99 0-2.53-1.12-4.16-1.09-2.14.03-4.12 1.24-5.21 3.16-2.22 3.85-.57 9.55 1.6 12.67 1.06 1.53 2.32 3.24 3.97 3.18 1.6-.07 2.2-1.03 4.13-1.03 1.93 0 2.46 1.03 4.13 1 1.71-.03 2.79-1.55 3.84-3.08 1.21-1.77 1.7-3.49 1.73-3.57-.04-.02-3.32-1.27-3.34-5.06z"/></svg>
              Apple
            </button>
          </div>
          <p className="mt-6 text-center text-[11px] text-muted-foreground">Auth UI demo · Connect Lovable Cloud later to enable real sign-in.</p>
        </div>
      </div>
    </SiteLayout>
  );
}

function Field({ label, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <input {...rest} className="mt-1.5 block w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold" />
    </label>
  );
}
