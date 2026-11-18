import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, ShieldCheck, Truck, CreditCard, Smartphone, Wallet, Loader2, Tag } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site-layout";
import { inr } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import api from "@/lib/axios";

type CheckoutSearch = { couponCode?: string };

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (res: any) => void) => void;
    };
  }
}

function loadRazorpaySdk(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export const Route = createFileRoute("/checkout")({
  validateSearch: (s: Record<string, unknown>): CheckoutSearch => ({
    couponCode: typeof s.couponCode === "string" && s.couponCode.trim() ? s.couponCode.trim().toUpperCase() : undefined,
  }),
  head: () => ({ meta: [{ title: "Checkout — Bombay Bag House" }] }),
  component: Checkout,
});

const STEPS = ["Address", "Delivery", "Payment", "Review"] as const;

function Checkout() {
  const { cart, products, cartSubtotal, clearCart, refreshProducts } = useStore();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const items = cart.map((c) => ({ ...c, product: products.find((p) => p.id === c.id)! })).filter((i) => i.product);
  const [step, setStep] = useState(0);
  const [slot, setSlot] = useState("Standard");
  const [method, setMethod] = useState<"card" | "upi" | "cod">("card");
  const [isPlacing, setIsPlacing] = useState(false);
  const [couponCode] = useState<string | undefined>(search.couponCode);
  const [discount, setDiscount] = useState(0);
  const [freeShippingCoupon, setFreeShippingCoupon] = useState(false);
  // Idempotency key to prevent double charges on duplicate submissions (must be declared before early returns)
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

  // Address state
  const [address, setAddress] = useState({
    fullName: "",
    mobile: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });

  useEffect(() => {
    if (!couponCode || cartSubtotal <= 0) return;
    api.post("/coupons/validate", { code: couponCode, itemTotal: cartSubtotal })
      .then((res) => {
        const d = res.data?.data;
        if (d?.isFreeShipping) {
          setFreeShippingCoupon(true);
          setDiscount(0);
        } else if (typeof d?.discountAmount === "number") {
          setFreeShippingCoupon(false);
          setDiscount(d.discountAmount);
        }
      })
      .catch(() => {
        setDiscount(0);
        setFreeShippingCoupon(false);
      });
  }, [couponCode, cartSubtotal]);

  const baseShipping = cartSubtotal > 2499 ? 0 : 99;
  const slotCharge = slot === "Express" ? 199 : slot === "Same-Day" ? 399 : 0;
  const shipping = (freeShippingCoupon ? 0 : baseShipping) + slotCharge;
  const total = Math.max(0, cartSubtotal + shipping - discount);

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

  const finalizeOrderSuccess = (order: any) => {
    const orderNumber = order?.orderNumber || order?.id || "BBH";
    clearCart();
    refreshProducts();
    toast.success("Order placed successfully!", {
      description: `Confirmation #${orderNumber}. Thank you for choosing Bombay Bag House.`,
    });
    try {
      const existing = JSON.parse(localStorage.getItem("bbh_recent_orders") || "[]");
      localStorage.setItem("bbh_recent_orders", JSON.stringify([order, ...existing].slice(0, 10)));
    } catch {}
    navigate({ to: "/account" });
  };

  const placeOrder = async () => {
    if (isPlacing) return;
    setIsPlacing(true);

    try {
      // Map payment method enum to backend Prisma PaymentMethod
      const paymentMethodMap: Record<string, string> = {
        card: "RAZORPAY",
        upi: "RAZORPAY",
        cod: "COD",
      };

      const payload = {
        paymentMethod: paymentMethodMap[method] || "COD",
        shippingAddress: address,
        billingAddress: address,
        customerNotes: `Delivery Slot: ${slot}`,
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.qty,
        })),
        deliveryMethod: "SHIP",
        couponCode,
        idempotencyKey,
      };

      const res = await api.post("/orders", payload);
      const data = res.data?.data;
      const order = data?.order || data;
      const razorpayOrder = data?.razorpayOrder;
      const razorpayKeyId = data?.razorpayKeyId;

      if (method !== "cod") {
        if (!razorpayOrder?.id || !razorpayKeyId) {
          setIdempotencyKey(crypto.randomUUID());
          throw new Error("Online payment gateway is not configured yet. Please select Cash on Delivery or configure Razorpay test keys.");
        }
        const loaded = await loadRazorpaySdk();
        if (!loaded || !window.Razorpay) {
          throw new Error("Unable to load Razorpay payment gateway. Please check your connection and try again.");
        }
        await new Promise<void>((resolve, reject) => {
          const rzp = new window.Razorpay!({
            key: razorpayKeyId,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency || "INR",
            name: "Triveni Bombay Bag House",
            description: `Order #${order?.orderNumber || order?.id}`,
            order_id: razorpayOrder.id,
            prefill: {
              name: address.fullName,
              email: address.email,
              contact: address.mobile,
            },
            theme: { color: "#D4AF37" },
            modal: {
              ondismiss: () => reject(new Error("Payment was cancelled before completion.")),
            },
            handler: async (paymentRes: any) => {
              try {
                const verifyRes = await api.post("/orders/verify-payment", {
                  orderId: order.id,
                  razorpay_order_id: paymentRes.razorpay_order_id,
                  razorpay_payment_id: paymentRes.razorpay_payment_id,
                  razorpay_signature: paymentRes.razorpay_signature,
                });
                const verifiedOrder = verifyRes.data?.data?.order || order;
                finalizeOrderSuccess(verifiedOrder);
                resolve();
              } catch (verifyErr: any) {
                reject(new Error(verifyErr.response?.data?.message || "Server-side payment signature verification failed."));
              }
            },
          });
          rzp.on("payment.failed", (failRes: any) => {
            reject(new Error(failRes?.error?.description || "Payment declined by bank/gateway."));
          });
          rzp.open();
        });
        return;
      }

      finalizeOrderSuccess(order);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to place order";
      toast.error("Checkout failed", { description: msg });
    } finally {
      setIsPlacing(false);
    }
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
                  <Field label="Full name" required value={address.fullName} onChange={(e) => setAddress({ ...address, fullName: e.target.value })} />
                  <Field label="Mobile" type="tel" required value={address.mobile} onChange={(e) => setAddress({ ...address, mobile: e.target.value })} />
                  <Field label="Email" type="email" required value={address.email} onChange={(e) => setAddress({ ...address, email: e.target.value })} className="md:col-span-2" />
                  <Field label="Address line 1" required value={address.addressLine1} onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })} className="md:col-span-2" />
                  <Field label="Address line 2" value={address.addressLine2} onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })} className="md:col-span-2" />
                  <Field label="City" required value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
                  <Field label="State" required value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} />
                  <Field label="PIN" required value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} />
                  <Field label="Country" value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} required />
                </div>
                <button type="submit" className="mt-3 rounded-full bg-ink py-3 text-xs uppercase tracking-widest text-cream">Continue to delivery</button>
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
                  <button onClick={() => setStep(2)} className="rounded-full border border-border px-6 py-3 text-xs uppercase tracking-widest" disabled={isPlacing}>Back</button>
                  <button onClick={placeOrder} disabled={isPlacing} className="flex-1 flex items-center justify-center gap-2 rounded-full bg-gradient-gold py-3 text-xs uppercase tracking-widest text-ink font-semibold disabled:opacity-50">
                    {isPlacing ? <><Loader2 className="size-4 animate-spin" /> Placing Order...</> : "Place order"}
                  </button>
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
              {discount > 0 && (
                <div className="flex justify-between text-gold-dark font-medium">
                  <span className="inline-flex items-center gap-1"><Tag className="size-3.5" /> {couponCode}</span>
                  <span>- {inr(discount)}</span>
                </div>
              )}
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
