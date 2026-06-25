import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Instagram, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site-layout";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Triveni Bombay Bag House" },
      { name: "description", content: "Get in touch with Triveni Bombay Bag House — store, WhatsApp, Instagram and email." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [sent, setSent] = useState(false);
  return (
    <SiteLayout>
      <section className="bg-ink py-16 text-cream">
        <div className="mx-auto max-w-7xl px-4">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">We're here for you</p>
          <h1 className="mt-3 font-serif text-5xl md:text-6xl">Get in touch.</h1>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-[1fr_400px]">
        <form
          onSubmit={(e) => { e.preventDefault(); toast.success("Message sent — we'll be in touch within 24 hours."); setSent(true); }}
          className="rounded-2xl border border-border bg-card p-8"
        >
          <h2 className="font-serif text-2xl">Send us a note</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Field label="Full name" required />
            <Field label="Email" type="email" required />
            <Field label="Phone" type="tel" className="md:col-span-2" />
            <label className="md:col-span-2 block">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">Message *</span>
              <textarea required rows={5} className="mt-1.5 block w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold" />
            </label>
          </div>
          <button className="mt-6 rounded-full bg-gradient-gold px-8 py-3 text-xs uppercase tracking-widest text-ink">{sent ? "Send another" : "Send message"}</button>
        </form>

        <aside className="space-y-4">
          <Card icon={MapPin} t="Visit the showroom" lines={["123 Heritage Lane,", "Bandra West, Mumbai 400050"]} />
          <Card icon={Phone} t="Call" lines={["+91 98000 00000", "Mon–Sat · 10am–9pm"]} />
          <Card icon={Mail} t="Email" lines={["hello@trivenibombay.com"]} />
          <a href="https://wa.me/919800000000" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 hover:border-gold">
            <MessageCircle className="size-5 text-emerald-600" />
            <div>
              <p className="font-medium">Chat on WhatsApp</p>
              <p className="text-xs text-muted-foreground">Replies in minutes</p>
            </div>
          </a>
          <a href="https://instagram.com/triveni_bombay_bag_house" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 hover:border-gold">
            <Instagram className="size-5 text-gold" />
            <div>
              <p className="font-medium">@triveni_bombay_bag_house</p>
              <p className="text-xs text-muted-foreground">Latest arrivals & looks</p>
            </div>
          </a>
        </aside>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="aspect-[16/7] w-full overflow-hidden rounded-2xl border border-border">
          <iframe
            title="Map"
            className="size-full"
            src="https://www.google.com/maps?q=Bandra%20West%20Mumbai&output=embed"
            loading="lazy"
          />
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-20">
        <h2 className="font-serif text-3xl">Quick answers</h2>
        <div className="mt-5 space-y-3">
          {[
            ["How long does shipping take?", "Standard 3–6 business days; express 1–2 days."],
            ["What's your return policy?", "7-day no-questions-asked returns on unused items."],
            ["Do you offer bulk / corporate orders?", "Yes — write to hello@trivenibombay.com for a custom quote."],
          ].map(([q, a]) => (
            <details key={q} className="rounded-xl border border-border p-4">
              <summary className="cursor-pointer font-medium">{q}</summary>
              <p className="mt-2 text-sm text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
        <Link to="/faq" className="mt-6 inline-block text-xs uppercase tracking-widest text-gold">See all FAQs →</Link>
      </section>
    </SiteLayout>
  );
}

const Card = ({ icon: Icon, t, lines }: { icon: typeof Mail; t: string; lines: string[] }) => (
  <div className="rounded-2xl border border-border bg-card p-5">
    <Icon className="size-5 text-gold" />
    <p className="mt-3 font-medium">{t}</p>
    {lines.map((l) => <p key={l} className="text-sm text-muted-foreground">{l}</p>)}
  </div>
);

function Field({ label, className = "", ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}{rest.required ? " *" : ""}</span>
      <input {...rest} className="mt-1.5 block w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold" />
    </label>
  );
}
