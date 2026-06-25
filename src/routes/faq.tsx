import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";

export const Route = createFileRoute("/faq")({
  head: () => ({ meta: [{ title: "FAQs — Triveni Bombay Bag House" }] }),
  component: FaqPage,
});

const FAQS = [
  ["What materials do you use?", "We use a curated selection of full-grain leather, saffiano, pebbled leather, premium nylon, recycled polyester and polycarbonate — chosen for durability and feel."],
  ["Are your products genuine leather?", "Our leather lines are made from genuine full-grain leather. Vegan and recycled options are clearly labelled."],
  ["What's the warranty?", "All bags come with a 1-year manufacturer warranty covering manufacturing defects."],
  ["How do I care for my bag?", "Wipe gently with a soft, dry cloth. Avoid direct sunlight and water. For leather pieces, condition every 3–4 months."],
  ["Can I exchange size or color?", "Yes — initiate an exchange within 7 days of delivery from your account."],
  ["Do you ship internationally?", "Currently we ship across India. International shipping is coming soon."],
  ["How do gift cards work?", "Digital gift cards are emailed instantly and never expire. Redeemable at checkout."],
  ["Do you offer corporate / bulk orders?", "Yes — write to hello@trivenibombay.com for custom quotes and branding options."],
];

function FaqPage() {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Help center</p>
        <h1 className="mt-3 font-serif text-5xl">Frequently asked questions</h1>
        <div className="mt-10 space-y-3">
          {FAQS.map(([q, a]) => (
            <details key={q} className="group rounded-xl border border-border p-5 hover:border-gold/40 transition">
              <summary className="cursor-pointer font-medium flex justify-between items-center gap-4">
                <span>{q}</span>
                <span className="text-gold group-open:rotate-45 transition">+</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}
