import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Headphones,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  Truck,
  Wallet,
} from "lucide-react";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { ProductCard } from "@/components/shop/ProductCard";
import { Button } from "@/components/ui/button";
import { formatPKR, productImageFallback, services } from "@/data/mock";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dukaan.pk — Online Shopping in Pakistan with COD" },
      {
        name: "description",
        content:
          "Dukaan.pk is Pakistan's multivendor marketplace. Shop electronics, fashion, home goods and book services — Cash on Delivery, guest checkout.",
      },
      { property: "og:title", content: "azadari.store" },
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

// Hero product slider — Daraz jaisa, sabse kam price/discount wale products dikhata hai
function HeroProductSlider({ deals }: { deals: ReturnType<typeof useCart>["catalog"] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (deals.length < 2) return;
    const timer = setInterval(() => setActive((i) => (i + 1) % deals.length), 4000);
    return () => clearInterval(timer);
  }, [deals.length]);

  if (deals.length === 0) return null;

  const product = deals[active]!;
  const discount = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;

  const goPrev = () => setActive((i) => (i - 1 + deals.length) % deals.length);
  const goNext = () => setActive((i) => (i + 1) % deals.length);

  return (
    <section className="relative isolate overflow-hidden border-b border-border bg-slate-950 text-white">
      <Link to="/products/$id" params={{ id: product.id }} aria-label={`View ${product.name}`} className="absolute inset-0 -z-20 block">
        <img src={product.image} alt={product.name} onError={(event) => { event.currentTarget.src = productImageFallback(product.name, product.image); }} className="h-full w-full object-cover object-center" />
      </Link>
      <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-r from-slate-950/95 via-slate-950/70 to-slate-950/10" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-32 bg-linear-to-t from-slate-950/80 to-transparent" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:py-14 lg:py-20">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
            {discount > 0 ? `Up to ${discount}% off today` : "Best prices, delivered nationwide"}
          </span>
          <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">Pakistan's COD marketplace</p>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-5xl">Shop smarter. Pay when it arrives.</h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/80 sm:text-base">Verified sellers, real value and Cash on Delivery across Pakistan.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-xl bg-orange-500 px-6 font-bold text-white shadow-lg hover:bg-orange-600"><Link to="/products">Explore products <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl border-white/40 bg-white/10 px-6 text-white hover:bg-white/20"><Link to="/services">Book a service</Link></Button>
          </div>
        </div>

        <div className="mt-10 grid max-w-3xl gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <Link to="/products/$id" params={{ id: product.id }} className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-xl backdrop-blur-md transition-colors hover:bg-white/15">
            <div className="flex items-center gap-4"><img src={product.image} alt={product.name} width={80} height={80} onError={(event) => { event.currentTarget.src = productImageFallback(product.name, product.image); }} className="h-20 w-20 rounded-xl object-cover" /><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-wide text-orange-300">Deal of the moment</p><h2 className="mt-1 truncate text-lg font-bold">{product.name}</h2><div className="mt-1 flex items-baseline gap-2"><span className="font-display text-xl font-extrabold">{formatPKR(product.price)}</span>{product.oldPrice && product.oldPrice > product.price && <span className="text-xs text-white/60 line-through">{formatPKR(product.oldPrice)}</span>}</div></div><ArrowRight className="h-5 w-5 shrink-0 text-orange-300" /></div>
          </Link>
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-slate-950/40 p-3 backdrop-blur-md sm:flex-col sm:items-stretch"><div className="flex gap-1.5">{deals.map((_, i) => <button key={i} onClick={() => setActive(i)} className={`h-1.5 rounded-full transition-all ${i === active ? "w-8 bg-orange-400" : "w-2 bg-white/40"}`} aria-label={`Deal ${i + 1}`} />)}</div><div className="flex gap-2"><Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-white/30 bg-white/10 text-white hover:bg-white/20" onClick={goPrev} aria-label="Previous deal"><ChevronLeft className="h-4 w-4" /></Button><Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-white/30 bg-white/10 text-white hover:bg-white/20" onClick={goNext} aria-label="Next deal"><ChevronRight className="h-4 w-4" /></Button></div></div>
        </div>
      </div>
    </section>
  );
}

function Index() {
  const { catalog, catalogHasMore, catalogLoadingMore, loadMoreCatalog } = useCart();

  const featured = catalog;
  const heroDeals = catalog
    .filter((product) => product.active && product.stock > 0)
    .sort((a, b) => Number(b.featured) - Number(a.featured) || (b.salesCount ?? 0) - (a.salesCount ?? 0) || a.price - b.price)
    .slice(0, 4);

  return (
    <ShopLayout>
      {/* Hero — ab sabse kam price wale products ka slider hai */}
      <HeroProductSlider deals={heroDeals} />

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

      {/* Featured products */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div><h2 className="truncate text-xl font-bold sm:text-2xl">Featured Products</h2><p className="mt-1 text-xs text-muted-foreground">Showing {featured.length} products, more available below</p></div>
          <Button asChild variant="ghost" size="sm" className="shrink-0">
            <Link to="/products">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        {featured.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Abhi koi product nahi hai.</p>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            {catalogHasMore && <div className="mt-8 flex justify-center"><Button variant="outline" className="rounded-xl px-8" disabled={catalogLoadingMore} onClick={() => void loadMoreCatalog()}>{catalogLoadingMore ? "Loading products..." : "Load more products"}</Button></div>}
          </>
        )}
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

      {/* Customer reassurance */}
      <section className="mx-auto max-w-7xl px-4 pb-8 pt-8">
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
          <div className="grid gap-8 bg-linear-to-br from-primary-soft via-card to-cyan-50 px-6 py-8 lg:grid-cols-[1fr_auto] lg:items-center lg:px-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Dukaan.pk promise</p>
              <h2 className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">Har order mein confidence ke saath shop karein</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Verified sellers, transparent prices aur COD delivery. Aap jo dekhte hain, wahi order karte hain.</p>
            </div>
            <Button asChild size="lg" className="w-fit rounded-xl px-6"><Link to="/products">Start shopping <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
          <div className="grid divide-y border-t sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {[{ icon: ShieldCheck, title: "Verified sellers", text: "Trusted stores se products" }, { icon: PackageCheck, title: "COD nationwide", text: "Parcel par payment karein" }, { icon: CheckCircle2, title: "Easy returns", text: "7-day return support" }].map((item) => (
              <div key={item.title} className="flex items-center gap-3 px-6 py-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"><item.icon className="h-5 w-5" /></span><div><p className="text-sm font-bold">{item.title}</p><p className="mt-0.5 text-xs text-muted-foreground">{item.text}</p></div></div>
            ))}
          </div>
        </div>
      </section>
    </ShopLayout>
  );
}