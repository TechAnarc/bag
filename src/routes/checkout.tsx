import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, ShieldCheck, Truck, CreditCard, Smartphone, Wallet } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site-layout";
import { inr } from "@/lib/catalog";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Triveni Bombay Bag House" }] }),
  component: Checkout,
});

const STEPS = ["Address", "Delivery", "Payment", "Review"] as const;

function Checkout() {
  const { cart, products, cartSubtotal, clearCart } = useStore();
  const navigate = Route.useNavigate();
  const items = cart.map((c) => ({ ...c, product: products.find((p) => p.id === c.id)! })).filter((i) => i.product);
  const [step, setStep] = useState(0);
  const [slot, setSlot] = useState("Standard");
  const [method, setMethod] = useState<"card" | "upi" | "cod">("card");
  const shipping = cartSubtotal > 2499 ? 0 : 99;
  const total = cartSubtotal + shipping;

  if (items.length === 0) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-2xl px-4 py-32 text-center">
          <h1 className="font-serif text-3xl">No items to checkout</h1>
          <Link to="/shop" className="mt-6 inline-block rounded-full bg-ink px-6 py-3 text-xs uppercase tracking-widest text-cream">Shop now</Link>
        </div>
      </SiteLayout>
    );
  }

  const placeOrder = () => {
    const orderId = "TBH" + Math.random().toString(36).slice(2, 8).toUpperCase();
    clearCart();
    toast.success("Order placed!", { description: `Confirmation #${orderId}` });
    navigate({ to: "/account" });
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-serif text-4xl">Checkout</h1>

        <ol className="mt-6 flex flex-wrap gap-3 text-xs">
          {STEPS.map((s, i) => (
            <li key={s} className={`flex items-center gap-2 rounded-full px-4 py-1.5 ${i === step ? "bg-ink text-cream" : i < step ? "bg-gold/15 text-gold-dark" : "bg-muted text-muted-foreground"}`}>
              {i < step ? <Check className="size-3.5" /> : <span>{i + 1}</span>} {s}
            </li>
          ))}
        </ol>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
          <div className="rounded-2xl border border-border bg-card p-6">
            {step === 0 && (
              <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); setStep(1); }}>
                <p className="font-serif text-2xl">Shipping address</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Full name" required />
                  <Field label="Mobile" type="tel" required />
                  <Field label="Email" type="email" required className="md:col-span-2" />
                  <Field label="Address line 1" required className="md:col-span-2" />
                  <Field label="Address line 2" className="md:col-span-2" />
                  <Field label="City" required />
                  <Field label="State" required />
                  <Field label="PIN" required />
                  <Field label="Country" defaultValue="India" required />
                </div>
                <button className="mt-3 rounded-full bg-ink py-3 text-xs uppercase tracking-widest text-cream">Continue to delivery</button>
              </form>
            )}

            {step === 1 && (
              <div>
                <p className="font-serif text-2xl">Delivery slot</p>
                <div className="mt-5 space-y-3">
                  {[
                    { k: "Standard", d: "3–6 business days", c: "Free over ₹2,499" },
                    { k: "Express", d: "1–2 business days", c: "+ ₹199" },
                    { k: "Same-Day", d: "Select metros only", c: "+ ₹399" },
                  ].map((o) => (
                    <label key={o.k} className={`flex cursor-pointer items-center justify-between rounded-xl border-2 p-4 ${slot === o.k ? "border-gold bg-gold/5" : "border-border"}`}>
                      <div>
                        <p className="font-medium">{o.k}</p>
                        <p className="text-xs text-muted-foreground">{o.d}</p>
                      </div>
                      <div className="text-right text-sm">{o.c}</div>
                      <input type="radio" name="slot" className="sr-only" checked={slot === o.k} onChange={() => setSlot(o.k)} />
                    </label>
                  ))}
                </div>
                <div className="mt-6 flex gap-2">
                  <button onClick={() => setStep(0)} className="rounded-full border border-border px-6 py-3 text-xs uppercase tracking-widest">Back</button>
                  <button onClick={() => setStep(2)} className="flex-1 rounded-full bg-ink py-3 text-xs uppercase tracking-widest text-cream">Continue to payment</button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <p className="font-serif text-2xl">Payment method</p>
                <div className="mt-5 space-y-3">
                  {[
                    { k: "card", icon: CreditCard, t: "Credit / Debit Card", d: "Visa, Mastercard, Amex · via Razorpay" },
                    { k: "upi", icon: Smartphone, t: "UPI", d: "GPay, PhonePe, Paytm, BHIM" },
                    { k: "cod", icon: Wallet, t: "Cash on Delivery", d: "Pay when your order arrives" },
                  ].map((o) => (
                    <label key={o.k} className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 ${method === o.k ? "border-gold bg-gold/5" : "border-border"}`}>
                      <o.icon className="size-5" />
                      <div className="flex-1">
                        <p className="font-medium">{o.t}</p>
                        <p className="text-xs text-muted-foreground">{o.d}</p>
                      </div>
                      <input type="radio" name="method" className="sr-only" checked={method === o.k} onChange={() => setMethod(o.k as never)} />
                    </label>
                  ))}
                </div>
                <div className="mt-6 flex gap-2">
                  <button onClick={() => setStep(1)} className="rounded-full border border-border px-6 py-3 text-xs uppercase tracking-widest">Back</button>
                  <button onClick={() => setStep(3)} className="flex-1 rounded-full bg-ink py-3 text-xs uppercase tracking-widest text-cream">Review order</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <p className="font-serif text-2xl">Review & place order</p>
                <ul className="mt-5 divide-y divide-border">
                  {items.map(({ id, qty, product }) => (
                    <li key={id} className="flex gap-3 py-3">
                      <img src={product.images[0]} alt="" className="size-16 rounded-lg object-cover" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">Qty {qty} · {inr(product.price)}</p>
                      </div>
                      <p className="text-sm font-semibold">{inr(product.price * qty)}</p>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-muted-foreground">Delivery: {slot} · Payment: {method.toUpperCase()}</p>
                <div className="mt-6 flex gap-2">
                  <button onClick={() => setStep(2)} className="rounded-full border border-border px-6 py-3 text-xs uppercase tracking-widest">Back</button>
                  <button onClick={placeOrder} className="flex-1 rounded-full bg-gradient-gold py-3 text-xs uppercase tracking-widest text-ink">Place order</button>
                </div>
              </div>
            )}
          </div>

          <aside className="h-fit rounded-2xl border border-border bg-card p-6">
            <p className="font-serif text-xl">Order summary</p>
            <ul className="mt-4 space-y-2 text-sm">
              {items.map(({ id, qty, product }) => (
                <li key={id} className="flex justify-between gap-2">
                  <span className="text-muted-foreground line-clamp-1">{qty}× {product.name}</span>
                  <span>{inr(product.price * qty)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{inr(cartSubtotal)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Shipping</span><span>{shipping === 0 ? "Free" : inr(shipping)}</span></div>
              <div className="mt-2 flex justify-between border-t border-border pt-2 font-semibold"><span>Total</span><span>{inr(total)}</span></div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
              <p className="flex items-center gap-1"><ShieldCheck className="size-3.5 text-gold" /> Secure SSL</p>
              <p className="flex items-center gap-1"><Truck className="size-3.5 text-gold" /> Tracked shipping</p>
            </div>
          </aside>
        </div>
      </div>
    </SiteLayout>
  );
}

function Field({ label, className = "", ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}{rest.required ? " *" : ""}</span>
      <input {...rest} className="mt-1.5 block w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold" />
    </label>
  );
}
