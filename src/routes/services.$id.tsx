import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Hammer,
  MapPin,
  Paintbrush,
  Scissors,
  ShieldCheck,
  Star,
  Users,
  Utensils,
} from "lucide-react";
import { toast } from "sonner";

import { ShopLayout } from "@/components/shop/ShopLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatPKR } from "@/data/mock";

export const Route = createFileRoute("/services/$id")({
  head: () => ({
    meta: [
      { title: "azadari.store" },
      {
        name: "description",
        content:
          "Islamic and Azadari service details, pricing and booking requests on azadari.store.",
      },
      {
        property: "og:title",
        content: "Islamic Service Detail — azadari.store",
      },
      {
        property: "og:description",
        content:
          "View Islamic and Azadari service details and send a simple booking request.",
      },
    ],
  }),
  component: ServiceDetail,
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
  provider: string;
  includes: string[];
  icon: typeof BookOpen;
};

const islamicServices: IslamicService[] = [
  {
    id: "quran-tajweed-classes",
    name: "Quran & Tajweed Classes",
    category: "Quran Learning",
    description:
      "One-to-one Quran, Nazra and Tajweed learning with an experienced teacher for children and adults. Timing can be arranged according to availability.",
    city: "Online",
    duration: "30–45 mins",
    rating: 4.9,
    reviews: 126,
    startingPrice: 2500,
    provider: "Verified Quran Teacher",
    icon: BookOpen,
    includes: [
      "One-to-one learning session",
      "Nazra and Tajweed guidance",
      "Flexible class timing",
      "Progress-focused learning",
    ],
  },
  {
    id: "majlis-setup",
    name: "Majlis Setup & Decoration",
    category: "Majlis Services",
    description:
      "Complete Majlis arrangement including floor setup, black draping, seating and respectful decoration according to your space and gathering requirements.",
    city: "Karachi",
    duration: "2–4 hours",
    rating: 4.8,
    reviews: 74,
    startingPrice: 7000,
    provider: "Azadari Event Services",
    icon: Users,
    includes: [
      "Basic Majlis floor arrangement",
      "Black draping setup",
      "Seating arrangement",
      "Setup according to available space",
    ],
  },
  {
    id: "niyaz-catering",
    name: "Niyaz & Tabarruk Catering",
    category: "Food & Niyaz",
    description:
      "Clean and reliable Niyaz preparation, packing and delivery for Majalis and religious gatherings. Quantity and menu can be discussed before confirmation.",
    city: "Karachi",
    duration: "Same day",
    rating: 4.9,
    reviews: 98,
    startingPrice: 5000,
    provider: "Niyaz Catering Partner",
    icon: Utensils,
    includes: [
      "Fresh food preparation",
      "Clean packing",
      "Quantity planning support",
      "Delivery coordination",
    ],
  },
  {
    id: "azadari-clothing-stitching",
    name: "Azadari Clothing Stitching",
    category: "Clothing",
    description:
      "Custom black kurtas, abayas and modest clothing stitching with size and style customization. Final timing depends on design and order volume.",
    city: "Pakistan",
    duration: "3–5 days",
    rating: 4.7,
    reviews: 53,
    startingPrice: 1800,
    provider: "Azadari Tailoring Partner",
    icon: Scissors,
    includes: [
      "Custom size stitching",
      "Basic style customization",
      "Black clothing options",
      "Order confirmation before stitching",
    ],
  },
  {
    id: "alam-custom-work",
    name: "Custom Alam & Decorative Work",
    category: "Custom Craft",
    description:
      "Custom decorative Alam work, name plates and respectful finishing according to your requirements. Design details are confirmed before work begins.",
    city: "Karachi",
    duration: "5–10 days",
    rating: 4.8,
    reviews: 41,
    startingPrice: 6000,
    provider: "Custom Craft Partner",
    icon: Hammer,
    includes: [
      "Custom design discussion",
      "Material selection guidance",
      "Decorative finishing",
      "Requirement confirmation before work",
    ],
  },
  {
    id: "islamic-calligraphy",
    name: "Islamic Calligraphy & Custom Art",
    category: "Islamic Art",
    description:
      "Custom Arabic and Islamic calligraphy for home, Majlis spaces, gifts and personalized decor. Size, text and style are discussed before confirmation.",
    city: "Pakistan",
    duration: "4–7 days",
    rating: 4.9,
    reviews: 67,
    startingPrice: 2500,
    provider: "Islamic Art Partner",
    icon: Paintbrush,
    includes: [
      "Custom text selection",
      "Size and style discussion",
      "Personalized artwork",
      "Final design confirmation",
    ],
  },
];

function ServiceDetail() {
  const { id } = Route.useParams();

  const service = islamicServices.find(
    (item) => item.id === id,
  );

  if (!service) {
    return (
      <ShopLayout>
        <main className="mx-auto max-w-3xl px-4 py-20 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[#c9a24b]/30 bg-[#f7efd9] text-[#0b513b]">
            <CheckCircle2 className="h-6 w-6" />
          </div>

          <h1 className="mt-4 text-2xl font-extrabold text-[#102d24]">
            Service not found
          </h1>

          <p className="mt-2 text-sm text-[#6f7d75]">
            Ye service available nahi hai ya iska link change ho chuka hai.
          </p>

          <Button
            asChild
            className="mt-5 rounded-xl bg-[#082b21] text-[#fffaf0] hover:bg-[#0d3d2f]"
          >
            <Link to="/services">
              Back to services
            </Link>
          </Button>
        </main>
      </ShopLayout>
    );
  }

  const Icon = service.icon;

  return (
    <ShopLayout>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="text-xs text-[#748078]"
        >
          <Link
            to="/"
            className="rounded-sm hover:text-[#0b513b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b]"
          >
            Home
          </Link>

          <span className="mx-2 text-[#b7b1a4]">/</span>

          <Link
            to="/services"
            className="rounded-sm hover:text-[#0b513b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b]"
          >
            Services
          </Link>

          <span className="mx-2 text-[#b7b1a4]">/</span>

          <span className="text-[#102d24]">
            {service.name}
          </span>
        </nav>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start">
          {/* Main content */}
          <section>
            {/* Service hero */}
            <div className="overflow-hidden rounded-3xl border border-[#c9a24b]/25 bg-[#061f18] text-[#fffaf0] shadow-[0_14px_34px_rgba(8,43,33,0.10)]">
              <div className="grid gap-6 px-6 py-7 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start sm:px-8 sm:py-9">
                <div className="grid h-16 w-16 place-items-center rounded-2xl border border-[#c9a24b]/35 bg-white/5 text-[#e2c56c]">
                  <Icon className="h-7 w-7" aria-hidden="true" />
                </div>

                <div className="min-w-0">
                  <span className="inline-flex rounded-full border border-[#c9a24b]/30 bg-[#c9a24b]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#e2c56c]">
                    {service.category}
                  </span>

                  <h1 className="mt-3 text-2xl font-extrabold leading-tight sm:text-3xl">
                    {service.name}
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[#d8d1bf]">
                    {service.description}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-xs text-[#d8d1bf]">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin
                        className="h-4 w-4 text-[#d8b85c]"
                        aria-hidden="true"
                      />
                      {service.city}
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                      <Clock
                        className="h-4 w-4 text-[#d8b85c]"
                        aria-hidden="true"
                      />
                      {service.duration}
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                      <Star
                        className="h-4 w-4 fill-[#d8b85c] text-[#d8b85c]"
                        aria-hidden="true"
                      />
                      <strong className="font-semibold text-[#fffaf0]">
                        {service.rating}
                      </strong>
                      <span>({service.reviews} reviews)</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Includes */}
            <section className="mt-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9a7927]">
                  Service details
                </p>

                <h2 className="mt-1 text-xl font-extrabold text-[#102d24]">
                  Kya include hai
                </h2>

                <p className="mt-1 text-sm text-[#6f7d75]">
                  Booking se pehle clear information taa-ke customer ko pata ho ke kya expect karna hai.
                </p>
              </div>

              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {service.includes.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-[#ded5bd] bg-[#fffdf7] p-4 text-sm text-[#33463e] shadow-[0_3px_12px_rgba(8,43,33,0.04)]"
                  >
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#e8f3ed] text-[#0b6b4c]">
                      <Check
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                    </span>

                    <span className="leading-6">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Provider */}
            <section className="mt-8 rounded-2xl border border-[#ded5bd] bg-[#fffdf7] p-5 shadow-[0_4px_16px_rgba(8,43,33,0.05)]">
              <div className="flex items-start gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#c9a24b]/25 bg-[#f7efd9] text-[#0b513b]">
                  <ShieldCheck
                    className="h-5 w-5"
                    aria-hidden="true"
                  />
                </span>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#9a7927]">
                    Service provider
                  </p>

                  <h3 className="mt-1 font-extrabold text-[#102d24]">
                    {service.provider}
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-[#6f7d75]">
                    Provider details aur booking availability request confirm hone ke baad verify ki jayegi.
                  </p>
                </div>
              </div>
            </section>
          </section>

          {/* Booking card */}
          <aside className="h-fit rounded-3xl border border-[#d8cdae] bg-[#fffdf7] p-5 shadow-[0_14px_34px_rgba(8,43,33,0.09)] lg:sticky lg:top-24">
            <div className="border-b border-[#eee6d2] pb-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#89938e]">
                Starting from
              </p>

              <p className="mt-1 font-display text-3xl font-extrabold text-[#0b513b]">
                {formatPKR(service.startingPrice)}
              </p>

              <p className="mt-1 text-xs leading-5 text-[#748078]">
                Final price service details, quantity aur requirements ke mutabiq confirm hogi.
              </p>
            </div>

            <form
              className="mt-5 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();

                toast.success(
                  "Booking request bhej di gayi (demo)",
                  {
                    description:
                      "Provider availability confirm karke aapse contact kiya jayega.",
                  },
                );
              }}
            >
              <div className="space-y-1.5">
                <Label
                  htmlFor="service-name"
                  className="text-sm font-semibold text-[#102d24]"
                >
                  Full Name
                </Label>

                <Input
                  id="service-name"
                  name="name"
                  autoComplete="name"
                  required
                  placeholder="Ahmed Raza"
                  className="h-11 rounded-xl border-[#d8cdae] bg-white focus-visible:ring-[#c9a24b]"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="service-phone"
                  className="text-sm font-semibold text-[#102d24]"
                >
                  Phone Number
                </Label>

                <Input
                  id="service-phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  placeholder="03XX-XXXXXXX"
                  className="h-11 rounded-xl border-[#d8cdae] bg-white focus-visible:ring-[#c9a24b]"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="service-details"
                  className="text-sm font-semibold text-[#102d24]"
                >
                  Address / Requirements
                </Label>

                <Textarea
                  id="service-details"
                  name="details"
                  rows={4}
                  placeholder="Area, city aur service ki zaroori details..."
                  className="rounded-xl border-[#d8cdae] bg-white focus-visible:ring-[#c9a24b]"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="h-11 w-full rounded-xl border border-[#c9a24b]/35 bg-[#082b21] font-bold text-[#fffaf0] hover:bg-[#0d3d2f] focus-visible:ring-[#c9a24b]"
              >
                Request Booking
              </Button>

              <div className="rounded-xl border border-[#c9a24b]/20 bg-[#f7efd9]/70 p-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#0b6b4c]"
                    aria-hidden="true"
                  />

                  <p className="text-xs leading-5 text-[#5f6d65]">
                    Request bhejne se payment charge nahi hogi. Booking details pehle confirm ki jayengi.
                  </p>
                </div>
              </div>
            </form>
          </aside>
        </div>
      </main>
    </ShopLayout>
  );
}
