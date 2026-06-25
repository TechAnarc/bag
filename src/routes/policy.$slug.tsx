import { createFileRoute, notFound } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";

export const Route = createFileRoute("/policy/$slug")({
  component: PolicyPage,
  notFoundComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-4 py-32 text-center">
        <h1 className="font-serif text-3xl">Policy not found</h1>
      </div>
    </SiteLayout>
  ),
});

const POLICIES: Record<string, { title: string; body: string[] }> = {
  shipping: {
    title: "Shipping Policy",
    body: [
      "We ship across India with trusted logistics partners. Standard delivery takes 3–6 business days, with express options available at checkout.",
      "Orders above ₹2,499 ship free. Express shipping is available for an additional ₹199.",
      "Once dispatched, you'll receive a tracking link via SMS and email.",
    ],
  },
  returns: {
    title: "Return & Exchange Policy",
    body: [
      "We offer a 7-day return window for unused items in original condition with tags attached.",
      "To initiate a return, visit your Account → Orders, or write to hello@trivenibombay.com.",
      "Refunds are processed within 5–7 business days after the item reaches our warehouse.",
    ],
  },
  privacy: {
    title: "Privacy Policy",
    body: [
      "We respect your privacy. Personal information is used solely to fulfil orders, provide support, and improve our service.",
      "We never sell your data to third parties. Marketing communications are opt-in and can be unsubscribed at any time.",
      "For full details on data handling, contact our data protection officer at privacy@trivenibombay.com.",
    ],
  },
  terms: {
    title: "Terms & Conditions",
    body: [
      "By using this website, you agree to the following terms and conditions.",
      "All content, images and trademarks are property of Triveni Bombay Bag House. Unauthorized reproduction is prohibited.",
      "Prices and availability are subject to change without notice. We reserve the right to cancel orders due to pricing or stock errors.",
    ],
  },
};

function PolicyPage() {
  const { slug } = Route.useParams();
  const policy = POLICIES[slug];
  if (!policy) throw notFound();

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Legal</p>
        <h1 className="mt-3 font-serif text-5xl">{policy.title}</h1>
        <div className="prose prose-neutral mt-8 max-w-none text-muted-foreground">
          {policy.body.map((p, i) => <p key={i} className="leading-relaxed">{p}</p>)}
        </div>
      </div>
    </SiteLayout>
  );
}
