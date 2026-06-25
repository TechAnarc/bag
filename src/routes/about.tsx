import { createFileRoute } from "@tanstack/react-router";
import { Award, Heart, ShieldCheck, Sparkles } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import story from "@/assets/story-craft.jpg";
import showcase from "@/assets/showcase-signature.jpg";
import gallery1 from "@/assets/cat-women.jpg";
import gallery2 from "@/assets/cat-travel.jpg";
import gallery3 from "@/assets/cat-office.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Triveni Bombay Bag House" },
      { name: "description", content: "The story, mission and craftsmanship behind Triveni Bombay Bag House." },
      { property: "og:title", content: "About Triveni Bombay Bag House" },
      { property: "og:image", content: "https://images.unsplash.com/photo-1591348278863-a8fb3887e2aa?w=1200" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <SiteLayout>
      <section className="relative h-[55vh] overflow-hidden">
        <img src={story} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent" />
        <div className="relative mx-auto flex h-full max-w-7xl items-end px-4 pb-12 text-cream">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gold">Our Heritage</p>
            <h1 className="mt-3 font-serif text-5xl md:text-7xl">Every Journey<br /> Deserves the Perfect Bag.</h1>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Brand story</p>
          <h2 className="mt-3 font-serif text-4xl">A house built on craft.</h2>
          <p className="mt-5 leading-relaxed text-muted-foreground">
            Triveni Bombay Bag House began as a small atelier on the lanes of Bombay — three generations of bag makers obsessing over the details no one else notices. Today, we offer a world-class collection of bags for every chapter of life, while staying true to the craft that started it all.
          </p>
        </div>
        <img src={showcase} alt="" className="aspect-[4/5] rounded-2xl object-cover shadow-luxe" />
      </section>

      <section className="bg-ink py-20 text-cream">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-3">
          <Pillar t="Mission" d="To equip every customer with bags that are stylish, durable and built for the way they actually live." />
          <Pillar t="Vision" d="To be India's most loved house of bags — known for craftsmanship, design and an exceptional ownership experience." />
          <Pillar t="Promise" d="A commitment to materials we'd carry ourselves, finishes we're proud to sign, and service that treats you like family." />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="font-serif text-4xl">Why TBH</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { i: Sparkles, t: "Premium Quality", d: "Materials and finishes built to outlast trends." },
            { i: Award, t: "Latest Designs", d: "New arrivals every season." },
            { i: ShieldCheck, t: "Trusted Service", d: "Concierge support, every day of the week." },
            { i: Heart, t: "Loved by 50,000+", d: "Customers across the country." },
          ].map((p) => (
            <div key={p.t} className="rounded-2xl border border-border p-6">
              <p.i className="size-6 text-gold" />
              <p className="mt-4 font-serif text-xl">{p.t}</p>
              <p className="mt-2 text-sm text-muted-foreground">{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20">
        <h2 className="font-serif text-4xl">Inside the showroom</h2>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <img src={gallery1} className="aspect-[4/5] rounded-2xl object-cover" alt="" />
          <img src={gallery2} className="aspect-[4/5] rounded-2xl object-cover" alt="" />
          <img src={gallery3} className="aspect-[4/5] rounded-2xl object-cover" alt="" />
        </div>
      </section>
    </SiteLayout>
  );
}

const Pillar = ({ t, d }: { t: string; d: string }) => (
  <div>
    <p className="text-xs uppercase tracking-[0.3em] text-gold">{t}</p>
    <p className="mt-3 leading-relaxed text-cream/80">{d}</p>
  </div>
);
