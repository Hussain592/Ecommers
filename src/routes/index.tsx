import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Headphones,
  RotateCcw,
  ShieldCheck,
  Truck,
  Wallet,
} from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { ProductCard } from "@/components/shop/ProductCard";
import { Button } from "@/components/ui/button";
import { categories, formatPKR, products, services } from "@/data/mock";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dukaan.pk — Online Shopping in Pakistan with COD" },
      {
        name: "description",
        content:
          "Dukaan.pk is Pakistan's multivendor marketplace. Shop electronics, fashion, home goods and book services — Cash on Delivery, guest checkout.",
      },
      { property: "og:title", content: "Dukaan.pk — Online Shopping in Pakistan with COD" },
      {
        property: "og:description",
        content: "Thousands of products from verified Pakistani sellers. Cash on Delivery nationwide.",
      },
    ],
  }),
  component: Index,
});

const perks = [
  { icon: Wallet, title: "Cash on Delivery", text: "Parcel milne par cash payment" },
  { icon: Truck, title: "Nationwide Delivery", text: "Pooray Pakistan mein 2-4 din" },
  { icon: RotateCcw, title: "7-Day Returns", text: "Aasan return policy" },
  { icon: Headphones, title: "Local Support", text: "Urdu support helpline" },
];

function Index() {
  const featured = products.slice(0, 8);

  return (
    <ShopLayout>
      {/* Hero */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 lg:grid-cols-2 lg:py-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
              <ShieldCheck className="h-3.5 w-3.5" /> 100% COD · No advance payment
            </span>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
              Pakistan ka apna <span className="text-primary">multivendor</span> online bazaar
            </h1>
            <p className="mt-4 max-w-lg text-sm text-muted-foreground sm:text-base">
              Verified sellers se products khareedein aur trusted providers se services book karein — sab kuch
              Cash on Delivery par, bina account banaye.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-xl">
                <Link to="/products">
                  Shop Now <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-xl">
                <Link to="/services">Book a Service</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-sm">
              {[
                ["12K+", "Products"],
                ["450+", "Verified Vendors"],
                ["30+", "Cities"],
              ].map(([n, l]) => (
                <div key={l}>
                  <p className="font-display text-xl font-extrabold text-primary">{n}</p>
                  <p className="text-xs text-muted-foreground">{l}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="surface-card overflow-hidden">
            <img
              src={heroImg}
              alt="Pakistani shoppers with delivery parcels from Dukaan.pk"
              width={1600}
              height={1100}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {perks.map((p) => (
            <div key={p.title} className="surface-card flex items-start gap-3 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                <p.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{p.title}</p>
                <p className="text-xs text-muted-foreground">{p.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-6">
        <h2 className="text-xl font-bold sm:text-2xl">Shop by Category</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c}
              to="/products"
              className="surface-card p-4 text-center text-sm font-semibold transition-colors hover:border-primary hover:text-primary"
            >
              {c}
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <h2 className="truncate text-xl font-bold sm:text-2xl">Featured Products</h2>
          <Button asChild variant="ghost" size="sm" className="shrink-0">
            <Link to="/products">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <h2 className="truncate text-xl font-bold sm:text-2xl">Popular Services</h2>
          <Button asChild variant="ghost" size="sm" className="shrink-0">
            <Link to="/services">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.slice(0, 3).map((s) => (
            <Link
              key={s.id}
              to="/services/$id"
              params={{ id: s.id }}
              className="surface-card p-5 transition-shadow hover:shadow-card"
            >
              <span className="inline-flex rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-accent-foreground">
                {s.category}
              </span>
              <h3 className="mt-3 font-bold">{s.name}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>
              <p className="mt-3 font-display font-bold text-primary">
                From {formatPKR(s.startingPrice)}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Vendor CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-4 pt-8">
        <div className="gradient-primary rounded-3xl px-6 py-12 text-center text-primary-foreground">
          <h2 className="font-display text-2xl font-extrabold sm:text-3xl">Apni dukaan online le aayein</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm opacity-90">
            Dukaan.pk par free mein seller banein — products list karein, COD orders lein aur apni earnings
            dashboard par track karein.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-6 rounded-xl">
            <Link to="/login">Become a Vendor</Link>
          </Button>
        </div>
      </section>
    </ShopLayout>
  );
}
