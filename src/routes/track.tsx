import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Package, Truck } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";

export const Route = createFileRoute("/track")({
  head: () => ({ meta: [{ title: "Track Order — Triveni Bombay Bag House" }] }),
  component: TrackPage,
});

function TrackPage() {
  const [id, setId] = useState("");
  const [showResult, setShowResult] = useState(false);

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Order tracking</p>
        <h1 className="mt-3 font-serif text-5xl">Where's my order?</h1>

        <form onSubmit={(e) => { e.preventDefault(); setShowResult(true); }} className="mt-8 flex flex-col gap-3 sm:flex-row">
          <input value={id} onChange={(e) => setId(e.target.value)} placeholder="Order ID e.g. TBH4F92A" className="flex-1 rounded-full border border-border bg-background px-5 py-3 text-sm outline-none focus:border-gold" />
          <button className="rounded-full bg-ink px-8 py-3 text-xs uppercase tracking-widest text-cream">Track</button>
        </form>

        {showResult && (
          <div className="mt-10 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Order</p>
                <p className="font-medium">#{id || "TBH4F92A"}</p>
              </div>
              <span className="rounded-full bg-gold/15 px-3 py-1 text-xs text-gold-dark">In transit</span>
            </div>
            <div className="mt-8 space-y-6">
              {[
                { i: Check, t: "Order placed", d: "Wed 19 Jun · 11:42 AM", done: true },
                { i: Package, t: "Packed at warehouse", d: "Thu 20 Jun · 09:10 AM", done: true },
                { i: Truck, t: "Out for delivery", d: "Expected today", done: false },
                { i: Check, t: "Delivered", d: "Pending", done: false },
              ].map((s, i) => (
                <div key={i} className="flex gap-4">
                  <div className={`grid size-10 place-items-center rounded-full ${s.done ? "bg-gold text-ink" : "bg-muted text-muted-foreground"}`}>
                    <s.i className="size-4" />
                  </div>
                  <div>
                    <p className={`font-medium ${s.done ? "" : "text-muted-foreground"}`}>{s.t}</p>
                    <p className="text-xs text-muted-foreground">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
