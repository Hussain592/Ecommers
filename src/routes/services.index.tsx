import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, type ComponentType } from "react";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Hammer,
  MapPin,
  Paintbrush,
  Scissors,
  Search,
  ShieldCheck,
  Star,
  Users,
  Utensils,
} from "lucide-react";

import { ShopLayout } from "@/components/shop/ShopLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatPKR } from "@/data/mock";

export const Route = createFileRoute("/services/")({
  head: () => ({
    meta: [
      {
        title: "azadari.store",
      },
      {
        name: "description",
        content:
          "Islamic and Azadari services on azadari.store — Quran learning, Majlis setup, Niyaz catering, tailoring, custom Alam work and Islamic calligraphy across Pakistan.",
      },
      {
        property: "og:title",
        content: "Islamic Services — azadari.store",
      },
      {
        property: "og:description",
        content:
          "Find Islamic and Azadari service providers across Pakistan with clear pricing and simple booking.",
      },
    ],
  }),

  component: ServicesPage,
});

type IslamicService = {
  id: string;
  name: string;
  category: string;
  description: string;
  city: string;
  duration: string;
  rating: number;
  reviews: number;
  startingPrice: number;

  icon: ComponentType<{
    className?: string;
    "aria-hidden"?: boolean;
  }>;
};

const islamicServices: IslamicService[] = [
  {
    id: "quran-tajweed-classes",
    name: "Quran & Tajweed Classes",
    category: "Quran Learning",
    description:
      "One-to-one Quran, Nazra and Tajweed learning with an experienced teacher for children and adults.",
    city: "Online",
    duration: "30–45 mins",
    rating: 4.9,
    reviews: 126,
    startingPrice: 2500,
    icon: BookOpen,
  },

  {
    id: "majlis-setup",
    name: "Majlis Setup & Decoration",
    category: "Majlis Services",
    description:
      "Complete Majlis arrangement including floor setup, black draping, seating and respectful decoration.",
    city: "Karachi",
    duration: "2–4 hours",
    rating: 4.8,
    reviews: 74,
    startingPrice: 7000,
    icon: Users,
  },

  {
    id: "niyaz-catering",
    name: "Niyaz & Tabarruk Catering",
    category: "Food & Niyaz",
    description:
      "Clean and reliable Niyaz preparation, packing and delivery for Majalis and religious gatherings.",
    city: "Karachi",
    duration: "Same day",
    rating: 4.9,
    reviews: 98,
    startingPrice: 5000,
    icon: Utensils,
  },

  {
    id: "azadari-clothing-stitching",
    name: "Azadari Clothing Stitching",
    category: "Clothing",
    description:
      "Custom black kurtas, abayas and modest clothing stitching with size and style customization.",
    city: "Pakistan",
    duration: "3–5 days",
    rating: 4.7,
    reviews: 53,
    startingPrice: 1800,
    icon: Scissors,
  },

  {
    id: "alam-custom-work",
    name: "Custom Alam & Decorative Work",
    category: "Custom Craft",
    description:
      "Custom decorative Alam work, name plates and respectful finishing according to your requirements.",
    city: "Karachi",
    duration: "5–10 days",
    rating: 4.8,
    reviews: 41,
    startingPrice: 6000,
    icon: Hammer,
  },

  {
    id: "islamic-calligraphy",
    name: "Islamic Calligraphy & Custom Art",
    category: "Islamic Art",
    description:
      "Custom Arabic and Islamic calligraphy for home, Majlis spaces, gifts and personalized decor.",
    city: "Pakistan",
    duration: "4–7 days",
    rating: 4.9,
    reviews: 67,
    startingPrice: 2500,
    icon: Paintbrush,
  },
];

const categories = [
  "All",
  "Quran Learning",
  "Majlis Services",
  "Food & Niyaz",
  "Clothing",
  "Custom Craft",
  "Islamic Art",
];

function ServicesPage() {
  const [q, setQ] =
    useState("");

  const [
    category,
    setCategory,
  ] = useState("All");

  const list =
    useMemo(() => {
      const search =
        q
          .trim()
          .toLowerCase();

      return islamicServices.filter(
        (service) => {
          const matchesCategory =
            category ===
              "All" ||
            service.category ===
              category;

          const matchesSearch =
            !search ||
            service.name
              .toLowerCase()
              .includes(search) ||
            service.category
              .toLowerCase()
              .includes(search) ||
            service.description
              .toLowerCase()
              .includes(search) ||
            service.city
              .toLowerCase()
              .includes(search);

          return (
            matchesCategory &&
            matchesSearch
          );
        },
      );
    }, [
      q,
      category,
    ]);

  return (
    <ShopLayout>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
        {/* =========================
            HERO
        ========================= */}
        <section className="overflow-hidden rounded-3xl border border-[#c9a24b]/25 bg-[#061f18] px-5 py-7 text-[#fffaf0] shadow-[0_12px_30px_rgba(8,43,33,0.10)] sm:px-8 sm:py-9">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d8b85c]">
            azadari.store services
          </p>

          <div className="mt-2 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h1 className="max-w-2xl text-3xl font-extrabold leading-tight sm:text-4xl">
                Islamic & Azadari
                Services
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#d8d1bf] sm:text-base">
                Quran learning,
                Majlis arrangements,
                Niyaz, custom Islamic
                work aur doosri useful
                services — simple aur
                clear booking ke saath.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-[#c9a24b]/20 bg-white/5 px-3 py-2.5">
                <ShieldCheck className="mb-1 h-4 w-4 text-[#d8b85c]" />

                <p className="font-semibold text-[#fffaf0]">
                  Trusted providers
                </p>
              </div>

              <div className="rounded-xl border border-[#c9a24b]/20 bg-white/5 px-3 py-2.5">
                <CheckCircle2 className="mb-1 h-4 w-4 text-[#d8b85c]" />

                <p className="font-semibold text-[#fffaf0]">
                  Clear service info
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================
            SEARCH + FILTER
        ========================= */}
        <section
          aria-label="Find services"
          className="mt-6 rounded-2xl border border-[#ded5bd] bg-[#fffdf7] p-4 shadow-[0_4px_16px_rgba(8,43,33,0.05)]"
        >
          <label
            htmlFor="service-search"
            className="text-sm font-bold text-[#102d24]"
          >
            Find a service
          </label>

          <div className="relative mt-2 max-w-2xl">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#718078]" />

            <Input
              id="service-search"
              value={q}
              onChange={(
                event,
              ) =>
                setQ(
                  event.target
                    .value,
                )
              }
              placeholder="Search Quran classes, Niyaz, Majlis setup..."
              className="h-11 rounded-xl border-[#d8cdae] bg-white pl-10 text-sm focus-visible:ring-[#c9a24b]"
            />
          </div>

          <div
            className="mt-4 flex gap-2 overflow-x-auto pb-1"
            aria-label="Service categories"
          >
            {categories.map(
              (item) => {
                const active =
                  category ===
                  item;

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      setCategory(
                        item,
                      )
                    }
                    aria-pressed={
                      active
                    }
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b] ${
                      active
                        ? "border-[#0b513b] bg-[#0b513b] text-white"
                        : "border-[#ded5bd] bg-white text-[#52635b] hover:border-[#c9a24b]/60 hover:bg-[#f7efd9]"
                    }`}
                  >
                    {item}
                  </button>
                );
              },
            )}
          </div>
        </section>

        {/* =========================
            RESULT HEADER
        ========================= */}
        <div className="mt-7 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9a7927]">
              Available Services
            </p>

            <h2 className="mt-1 text-xl font-extrabold text-[#102d24]">
              {category === "All"
                ? "Explore Services"
                : category}
            </h2>
          </div>

          <p className="text-xs text-[#748078]">
            {list.length}{" "}
            {list.length === 1
              ? "service"
              : "services"}
          </p>
        </div>

        {/* =========================
            EMPTY STATE
        ========================= */}
        {list.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-[#ded5bd] bg-[#fffdf7] px-5 py-12 text-center">
            <Search className="mx-auto h-7 w-7 text-[#9a7927]" />

            <h3 className="mt-3 font-bold text-[#102d24]">
              Koi service nahi mili
            </h3>

            <p className="mt-1 text-sm text-[#748078]">
              Search ya category
              change karke dobara
              try karein.
            </p>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setQ("");
                setCategory(
                  "All",
                );
              }}
              className="mt-4 rounded-xl border-[#c9a24b]/50 text-[#0b513b]"
            >
              Reset filters
            </Button>
          </div>
        ) : (
          /* =========================
              SERVICES GRID
          ========================= */
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map(
              (service) => {
                const Icon =
                  service.icon;

                return (
                  <article
                    key={
                      service.id
                    }
                    className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-[#ded5bd] bg-[#fffdf7] shadow-[0_4px_16px_rgba(8,43,33,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-[#c9a24b]/70 hover:shadow-[0_16px_34px_rgba(8,43,33,0.11)]"
                  >
                    {/* Visual top */}
                    <div className="relative overflow-hidden border-b border-[#eadfc4] bg-[linear-gradient(135deg,#f7efd9_0%,#fffdf7_55%,#eef5ee_100%)] px-5 py-5">
                      <div
                        aria-hidden="true"
                        className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#c9a24b]/10"
                      />

                      <div className="relative flex items-start justify-between gap-4">
                        <span className="grid h-12 w-12 place-items-center rounded-2xl border border-[#c9a24b]/30 bg-[#082b21] text-[#e2c56c] shadow-sm">
                          <Icon
                            className="h-5 w-5"
                            aria-hidden="true"
                          />
                        </span>

                        <span className="rounded-full border border-[#c9a24b]/30 bg-[#fffdf7]/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.09em] text-[#70591f]">
                          {
                            service.category
                          }
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      {/* Main focus */}
                      <Link
                        to="/services/$id"
                        params={{
                          id: service.id,
                        }}
                        className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b]"
                      >
                        <h3 className="text-[17px] font-extrabold leading-6 text-[#102d24] transition-colors group-hover:text-[#0b513b]">
                          {
                            service.name
                          }
                        </h3>
                      </Link>

                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#69776f]">
                        {
                          service.description
                        }
                      </p>

                      {/* Metadata */}
                      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-[#6f7d75]">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin
                            className="h-3.5 w-3.5 text-[#9a7927]"
                            aria-hidden="true"
                          />

                          {
                            service.city
                          }
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          <Clock
                            className="h-3.5 w-3.5 text-[#9a7927]"
                            aria-hidden="true"
                          />

                          {
                            service.duration
                          }
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          <Star
                            className="h-3.5 w-3.5 fill-[#c99a20] text-[#c99a20]"
                            aria-hidden="true"
                          />

                          <strong className="font-semibold text-[#102d24]">
                            {
                              service.rating
                            }
                          </strong>

                          <span>
                            (
                            {
                              service.reviews
                            }
                            )
                          </span>
                        </span>
                      </div>

                      {/* Price + CTA */}
                      <div className="mt-auto pt-5">
                        <div className="flex items-end justify-between gap-4 border-t border-[#eee6d2] pt-4">
                          <div>
                            <p className="text-[10px] font-medium uppercase tracking-wide text-[#89938e]">
                              Starting from
                            </p>

                            <p className="mt-0.5 font-display text-xl font-extrabold text-[#0b513b]">
                              {formatPKR(
                                service.startingPrice,
                              )}
                            </p>
                          </div>

                          <Button
                            asChild
                            size="sm"
                            className="h-9 rounded-xl border border-[#c9a24b]/30 bg-[#082b21] px-4 text-xs font-bold text-[#fffaf0] shadow-none hover:bg-[#0d3d2f] focus-visible:ring-[#c9a24b]"
                          >
                            <Link
                              to="/services/$id"
                              params={{
                                id: service.id,
                              }}
                              aria-label={`View details for ${service.name}`}
                            >
                              View Details
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              },
            )}
          </div>
        )}
      </main>
    </ShopLayout>
  );
}