import { createFileRoute, Link } from "@tanstack/react-router";

import { useEffect, useState } from "react";

import {

  ArrowRight,

  BookOpen,

  CheckCircle2,

  ChevronLeft,

  ChevronRight,

  Headphones,

  PackageCheck,

  RotateCcw,

  ShieldCheck,

  Truck,

  Users,

  Utensils,

  Wallet,

} from "lucide-react";

import { ShopLayout } from "@/components/shop/ShopLayout";

import { ProductCard } from "@/components/shop/ProductCard";

import { Button } from "@/components/ui/button";

import {

  formatPKR,

  productImageFallback,

  type Product,

} from "@/data/mock";

import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/")({
  head: () => ({

    meta: [

      { title: "azadari.store" },

      {

        name: "description",

        content:

          "azadari.store is an Islamic marketplace for books, prayer essentials, Majlis items, clothing and accessories with Cash on Delivery across Pakistan.",

      },

      {

        property: "og:title",

        content: "azadari.store",

      },

      {

        property: "og:description",

        content:

          "Shop Islamic products from trusted sellers with Cash on Delivery across Pakistan.",

      },

    ],

  }),

  component: Index,

});

const perks = [

  {

    icon: Wallet,

    title: "Cash on Delivery",

    text: "Parcel milne par cash payment",

  },

  {

    icon: Truck,

    title: "Nationwide Delivery",

    text: "Pooray Pakistan mein delivery",

  },

  {

    icon: RotateCcw,

    title: "Easy Returns",

    text: "Simple return support",

  },

  {

    icon: Headphones,

    title: "Local Support",

    text: "Madad jab aapko zaroorat ho",

  },

];

const homeIslamicServices = [

  {

    id: "quran-tajweed-classes",

    name: "Quran & Tajweed Classes",

    category: "Quran Learning",

    description:

      "One-to-one Quran, Nazra aur Tajweed learning for children and adults.",

    startingPrice: 2500,

    meta: "Online · 30–45 mins",

    icon: BookOpen,

  },

  {

    id: "majlis-setup",

    name: "Majlis Setup & Decoration",

    category: "Majlis Services",

    description:

      "Majlis floor setup, black draping, seating aur respectful decoration.",

    startingPrice: 7000,

    meta: "Karachi · 2–4 hours",

    icon: Users,

  },

  {

    id: "niyaz-catering",

    name: "Niyaz & Tabarruk Catering",

    category: "Food & Niyaz",

    description:

      "Niyaz preparation, clean packing aur delivery for Majalis and gatherings.",

    startingPrice: 5000,

    meta: "Karachi · Same day",

    icon: Utensils,

  },

];

function HeroProductSlider({

  deals,

}: {

  deals: Product[];

}) {

  const [active, setActive] = useState(0);

  const [paused, setPaused] = useState(false);

  useEffect(() => {

    if (paused || deals.length < 2) return;

    const timer = setInterval(() => {

      setActive((current) => (current + 1) % deals.length);

    }, 5000);

    return () => clearInterval(timer);

  }, [deals.length, paused]);

  if (deals.length === 0) {

    return null;

  }

  const product = deals[active]!;

  const discount =

    product.oldPrice && product.oldPrice > product.price

      ? Math.round(

          ((product.oldPrice - product.price) / product.oldPrice) * 100,

        )

      : 0;

  const goPrev = () => {

    setActive(

      (current) => (current - 1 + deals.length) % deals.length,

    );

  };

  const goNext = () => {

    setActive((current) => (current + 1) % deals.length);

  };

  return (

    <section

      className="relative isolate overflow-hidden border-b border-[#c9a24b]/25 bg-[#061f18] text-[#fffaf0]"

      onMouseEnter={() => setPaused(true)}

      onMouseLeave={() => setPaused(false)}

      onFocusCapture={() => setPaused(true)}

      onBlurCapture={() => setPaused(false)}

      aria-label="Islamic marketplace highlights"

    >

      <div

        aria-hidden="true"

        className="pointer-events-none absolute inset-0 -z-20 opacity-50"

        style={{

          backgroundImage: `

            radial-gradient(circle at 12% 18%, rgba(201,162,75,0.18), transparent 24%),

            radial-gradient(circle at 88% 36%, rgba(201,162,75,0.12), transparent 28%),

            linear-gradient(

              135deg,

              transparent 25%,

              rgba(255,255,255,0.025) 25%,

              rgba(255,255,255,0.025) 50%,

              transparent 50%,

              transparent 75%,

              rgba(255,255,255,0.025) 75%

            )

          `,

          backgroundSize: "auto, auto, 42px 42px",

        }}

      />

      <div

        aria-hidden="true"

        className="pointer-events-none absolute -right-32 -top-32 -z-10 h-96 w-96 rounded-full bg-[#c9a24b]/10 blur-3xl"

      />

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:py-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)] lg:items-center lg:py-20">

        <div className="max-w-2xl">

          <span className="inline-flex rounded-full border border-[#c9a24b]/35 bg-[#c9a24b]/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#e5c96f]">

            azadari.store

          </span>

          <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-[#d8b85c]">

            Islamic Marketplace

          </p>

          <h1 className="mt-3 max-w-xl text-3xl font-extrabold leading-tight text-[#fffaf0] sm:text-5xl">

            Deen ke Sath,

            <span className="text-[#e2c56c]"> Har Zaroorat</span>

          </h1>

          <p className="mt-5 max-w-xl text-sm leading-7 text-[#ddd6c4] sm:text-base">

            Islamic books, prayer essentials, Majlis items, clothing aur

            accessories — trusted sellers se, Pakistan bhar mein Cash on

            Delivery ke saath.

          </p>

          <div className="mt-7 flex flex-wrap gap-3">

            <Button

              asChild

              size="lg"

              className="h-11 rounded-xl border border-[#d8b85c]/50 bg-[#c9a24b] px-6 font-bold text-[#082b21] shadow-lg hover:bg-[#ddbd61] focus-visible:ring-2 focus-visible:ring-[#f1d77e]"

            >

              <Link to="/products">

                Explore Products

                <ArrowRight className="ml-2 h-4 w-4" />

              </Link>

            </Button>

            <Button

              asChild

              size="lg"

              variant="outline"

              className="h-11 rounded-xl border-[#d8b85c]/45 bg-white/5 px-6 font-semibold text-[#fffaf0] hover:bg-white/10 hover:text-white focus-visible:ring-[#d8b85c]"

            >

              <Link to="/services">Explore Services</Link>

            </Button>

          </div>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs text-[#cfc7b5]">

            <span className="flex items-center gap-2">

              <ShieldCheck

                aria-hidden="true"

                className="h-4 w-4 text-[#d8b85c]"

              />

              Trusted Sellers

            </span>

            <span className="flex items-center gap-2">

              <Truck

                aria-hidden="true"

                className="h-4 w-4 text-[#d8b85c]"

              />

              COD Nationwide

            </span>

            <span className="flex items-center gap-2">

              <RotateCcw

                aria-hidden="true"

                className="h-4 w-4 text-[#d8b85c]"

              />

              Easy Returns

            </span>

          </div>

        </div>

        <div className="relative">

          <div

            aria-hidden="true"

            className="absolute -inset-4 rounded-[32px] bg-[#c9a24b]/10 blur-2xl"

          />

          <div className="relative overflow-hidden rounded-3xl border border-[#c9a24b]/30 bg-[#0b3025]/90 p-4 shadow-2xl backdrop-blur sm:p-5">

            <div className="flex items-center justify-between gap-3">

              <div>

                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#d8b85c]">

                  Featured Product

                </p>

                <p className="mt-1 text-xs text-[#bdb5a3]">

                  Selected from our marketplace

                </p>

              </div>

              {discount > 0 && (

                <span className="rounded-full bg-[#a61f2b] px-2.5 py-1 text-xs font-bold text-white">

                  -{discount}%

                </span>

              )}

            </div>

            <Link

              to="/products/$id"

              params={{ id: product.id }}

              aria-label={`View ${product.name}`}

              className="mt-4 block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8b85c]"

            >

              <div className="grid gap-4 rounded-2xl border border-white/10 bg-black/10 p-3 sm:grid-cols-[120px_minmax(0,1fr)] sm:items-center">

                <div className="aspect-square overflow-hidden rounded-xl bg-[#fffaf0]">

                  <img

                    src={product.image}

                    alt={product.name}

                    width={500}

                    height={500}

                    onError={(event) => {

                      event.currentTarget.src = productImageFallback(

                        product.name,

                        product.image,

                      );

                    }}

                    className="h-full w-full object-cover"

                  />

                </div>

                <div className="min-w-0">

                  <p className="text-xs font-semibold uppercase tracking-wide text-[#d8b85c]">

                    {product.category}

                  </p>

                  <h2 className="mt-1 line-clamp-2 text-lg font-bold text-[#fffaf0]">

                    {product.name}

                  </h2>

                  <div className="mt-3 flex flex-wrap items-baseline gap-2">

                    <span className="font-display text-xl font-extrabold text-[#e5c96f]">

                      {formatPKR(product.price)}

                    </span>

                    {product.oldPrice &&

                      product.oldPrice > product.price && (

                        <span className="text-xs text-[#a9a294] line-through">

                          {formatPKR(product.oldPrice)}

                        </span>

                      )}

                  </div>

                  <p className="mt-2 text-xs text-[#c8c1b1]">

                    {product.stock > 0

                      ? `${product.stock} available`

                      : "Currently unavailable"}

                  </p>

                </div>

              </div>

            </Link>

            {deals.length > 1 && (

              <div className="mt-4 flex items-center justify-between gap-4">

                <div

                  className="flex items-center gap-1.5"

                  aria-label="Featured product slides"

                >

                  {deals.map((_, index) => (

                    <button

                      key={index}

                      type="button"

                      onClick={() => setActive(index)}

                      aria-label={`Show featured product ${index + 1}`}

                      aria-current={index === active ? "true" : undefined}

                      className={`h-2 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8b85c] ${

                        index === active

                          ? "w-8 bg-[#d8b85c]"

                          : "w-2 bg-white/30 hover:bg-white/50"

                      }`}

                    />

                  ))}

                </div>

                <div className="flex gap-2">

                  <Button

                    type="button"

                    variant="outline"

                    size="icon"

                    className="h-9 w-9 rounded-full border-[#d8b85c]/40 bg-white/5 text-[#fffaf0] hover:bg-[#c9a24b] hover:text-[#082b21]"

                    onClick={goPrev}

                    aria-label="Previous featured product"

                  >

                    <ChevronLeft className="h-4 w-4" />

                  </Button>

                  <Button

                    type="button"

                    variant="outline"

                    size="icon"

                    className="h-9 w-9 rounded-full border-[#d8b85c]/40 bg-white/5 text-[#fffaf0] hover:bg-[#c9a24b] hover:text-[#082b21]"

                    onClick={goNext}

                    aria-label="Next featured product"

                  >

                    <ChevronRight className="h-4 w-4" />

                  </Button>

                </div>

              </div>

            )}

          </div>

        </div>

      </div>

      <div

        aria-hidden="true"

        className="h-px bg-linear-to-r from-transparent via-[#c9a24b]/70 to-transparent"

      />

    </section>

  );

}

function Index() {
  const {
    catalog,
    catalogLoading,
    catalogHasMore,
    catalogLoadingMore,
    loadMoreCatalog,
  } = useCart();

  /*
   * Homepage aur product-detail ab SAME catalog source use karte hain.
   *
   * Pehle homepage apna alag Route loader use kar raha tha,
   * jabke product detail CartProvider catalog use karta tha.
   * Ab duplicate product source remove kar diya gaya hai.
   */
  const featured = catalog;

  const heroDeals = catalog
    .filter(
      (product) =>
        product.active &&
        product.stock > 0,
    )
    .sort(
      (a, b) =>
        Number(b.featured) - Number(a.featured) ||
        (b.salesCount ?? 0) - (a.salesCount ?? 0) ||
        a.price - b.price,
    )
    .slice(0, 4);

  return (

    <ShopLayout>

      <HeroProductSlider deals={heroDeals} />

      <section className="mx-auto max-w-7xl px-4 py-8">

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {perks.map((perk) => (

            <div

              key={perk.title}

              className="flex items-start gap-3 rounded-2xl border border-[#d8cdae]/70 bg-[#fffdf7] p-4 shadow-[0_4px_16px_rgba(8,43,33,0.05)]"

            >

              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#c9a24b]/25 bg-[#f7efd9] text-[#0b513b]">

                <perk.icon className="h-5 w-5" aria-hidden="true" />

              </span>

              <div className="min-w-0">

                <p className="text-sm font-bold text-[#102d24]">

                  {perk.title}

                </p>

                <p className="mt-0.5 text-xs text-[#6f7e77]">

                  {perk.text}

                </p>

              </div>

            </div>

          ))}

        </div>

      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">

        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">

          <div>

            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9a7927]">

              Curated Marketplace

            </p>

            <h2 className="mt-1 truncate text-xl font-extrabold text-[#102d24] sm:text-2xl">

              Featured Products

            </h2>

            <p className="mt-1 text-xs text-[#6f7e77]">

              {catalogLoading && featured.length === 0
                ? "Loading products..."
                : `Showing ${featured.length} products, more available below`}

            </p>

          </div>

          <Button

            asChild

            variant="ghost"

            size="sm"

            className="shrink-0 rounded-lg text-[#0b513b] hover:bg-[#f7efd9] hover:text-[#082b21]"

          >

            <Link to="/products">

              View all

              <ArrowRight className="ml-1 h-4 w-4" />

            </Link>

          </Button>

        </div>

        {catalogLoading && featured.length === 0 ? (
          <div
            className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
            aria-label="Products loading"
          >
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-[22px] border border-[#ded5bd] bg-[#fffdf7]"
              >
                <div className="aspect-[4/5] animate-pulse bg-[#f2ecdd]" />

                <div className="space-y-3 p-4">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-[#eee6d4]" />
                  <div className="h-5 w-1/2 animate-pulse rounded bg-[#eee6d4]" />
                  <div className="h-10 w-full animate-pulse rounded-xl bg-[#e8e0cf]" />
                </div>
              </div>
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-[#d8cdae]/70 bg-[#fffdf7] p-6 text-sm text-[#6f7e77]">
            Abhi koi product nahi hai.
          </div>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {featured.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>

            {catalogHasMore && (
              <div className="mt-8 flex justify-center">
                <Button
                  variant="outline"
                  className="h-11 rounded-xl border-[#c9a24b]/50 bg-[#fffdf7] px-8 font-semibold text-[#0b513b] hover:bg-[#f7efd9] hover:text-[#082b21] focus-visible:ring-[#c9a24b]"
                  disabled={catalogLoadingMore}
                  onClick={() => void loadMoreCatalog()}
                >
                  {catalogLoadingMore
                    ? "Loading products..."
                    : "Load more products"}
                </Button>
              </div>
            )}
          </>
        )}

      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">

        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">

          <div>

            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9a7927]">

              Islamic Services

            </p>

            <h2 className="mt-1 truncate text-xl font-extrabold text-[#102d24] sm:text-2xl">

              Popular Services

            </h2>

            <p className="mt-1 max-w-xl text-xs leading-5 text-[#6f7e77] sm:text-sm">

              Quran learning, Majlis arrangements aur Niyaz services — clear

              details aur simple booking ke saath.

            </p>

          </div>

          <Button

            asChild

            variant="ghost"

            size="sm"

            className="shrink-0 rounded-lg text-[#0b513b] hover:bg-[#f7efd9] hover:text-[#082b21]"

          >

            <Link to="/services">

              View all

              <ArrowRight className="ml-1 h-4 w-4" />

            </Link>

          </Button>

        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {homeIslamicServices.map((service) => {

            const Icon = service.icon;

            return (

              <Link

                key={service.id}

                to="/services/$id"

                params={{ id: service.id }}

                aria-label={`View ${service.name}`}

                className="group overflow-hidden rounded-[22px] border border-[#ded5bd] bg-[#fffdf7] shadow-[0_4px_16px_rgba(8,43,33,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-[#c9a24b]/70 hover:shadow-[0_14px_30px_rgba(8,43,33,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b]"

              >

                <div className="flex items-start justify-between gap-4 border-b border-[#eadfc4] bg-[linear-gradient(135deg,#f7efd9_0%,#fffdf7_60%,#eef5ee_100%)] p-5">

                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[#c9a24b]/30 bg-[#082b21] text-[#e2c56c]">

                    <Icon className="h-5 w-5" aria-hidden="true" />

                  </span>

                  <span className="max-w-[65%] truncate rounded-full border border-[#c9a24b]/30 bg-[#fffdf7]/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.09em] text-[#70591f]">

                    {service.category}

                  </span>

                </div>

                <div className="p-5">

                  <h3 className="text-[17px] font-extrabold leading-6 text-[#102d24] transition-colors group-hover:text-[#0b513b]">

                    {service.name}

                  </h3>

                  <p className="mt-2 line-clamp-2 min-h-[3rem] text-sm leading-6 text-[#69776f]">

                    {service.description}

                  </p>

                  <p className="mt-3 text-[11px] font-medium text-[#7c8881]">

                    {service.meta}

                  </p>

                  <div className="mt-4 flex items-end justify-between gap-4 border-t border-[#eee6d2] pt-4">

                    <div>

                      <p className="text-[10px] font-medium uppercase tracking-wide text-[#89938e]">

                        Starting from

                      </p>

                      <p className="mt-0.5 font-display text-lg font-extrabold text-[#0b513b]">

                        {formatPKR(service.startingPrice)}

                      </p>

                    </div>

                    <span className="inline-flex items-center text-xs font-bold text-[#0b513b]">

                      View Details

                      <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />

                    </span>

                  </div>

                </div>

              </Link>

            );

          })}

        </div>

      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 pt-8">

        <div className="overflow-hidden rounded-3xl border border-[#c9a24b]/30 bg-[#fffdf7] shadow-[0_12px_30px_rgba(8,43,33,0.08)]">

          <div className="grid gap-8 bg-linear-to-br from-[#082b21] via-[#0b382b] to-[#123f31] px-6 py-8 lg:grid-cols-[1fr_auto] lg:items-center lg:px-10">

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d8b85c]">

                azadari.store promise

              </p>

              <h2 className="mt-2 font-display text-2xl font-extrabold text-[#fffaf0] sm:text-3xl">

                Bharose ke saath Islamic shopping

              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-[#d9d1bd]">

                Trusted sellers, clear prices aur Cash on Delivery. Shopping ko

                simple, understandable aur reliable rakhna hamari priority hai.

              </p>

            </div>

            <Button

              asChild

              size="lg"

              className="w-fit rounded-xl border border-[#d8b85c]/50 bg-[#c9a24b] px-6 font-bold text-[#082b21] hover:bg-[#ddbd61]"

            >

              <Link to="/products">

                Start shopping

                <ArrowRight className="ml-2 h-4 w-4" />

              </Link>

            </Button>

          </div>

          <div className="grid divide-y divide-[#d8cdae]/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0">

            {[

              {

                icon: ShieldCheck,

                title: "Trusted sellers",

                text: "Marketplace sellers se products",

              },

              {

                icon: PackageCheck,

                title: "COD nationwide",

                text: "Parcel milne par payment",

              },

              {

                icon: CheckCircle2,

                title: "Easy shopping",

                text: "Clear actions aur simple checkout",

              },

            ].map((item) => (

              <div

                key={item.title}

                className="flex items-center gap-3 px-6 py-4"

              >

                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#c9a24b]/25 bg-[#f7efd9] text-[#0b513b]">

                  <item.icon className="h-5 w-5" aria-hidden="true" />

                </span>

                <div>

                  <p className="text-sm font-bold text-[#102d24]">

                    {item.title}

                  </p>

                  <p className="mt-0.5 text-xs text-[#6f7e77]">

                    {item.text}

                  </p>

                </div>

              </div>

            ))}

          </div>

        </div>

      </section>

    </ShopLayout>

  );

}
