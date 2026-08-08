import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Search, Star, Clock } from "lucide-react";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatPKR, services } from "@/data/mock";

export const Route = createFileRoute("/services/")({
  head: () => ({
    meta: [
      { title: "Home & Repair Services — Dukaan.pk" },
      {
        name: "description",
        content:
          "Book AC repair, home cleaning, beauty and auto services from verified providers in Pakistan. Pay cash after service.",
      },
      { property: "og:title", content: "Services — Dukaan.pk" },
      { property: "og:description", content: "Verified service providers across Pakistan, cash payment after service." },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const [q, setQ] = useState("");
  const list = services.filter(
    (s) =>
      s.name.toLowerCase().includes(q.toLowerCase()) || s.category.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <ShopLayout>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Services</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Verified professionals — payment service ke baad, cash mein.
        </p>

        <div className="relative mt-6 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search services..."
            className="h-11 rounded-xl pl-9"
          />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((s) => (
            <div key={s.id} className="surface-card p-5 transition-shadow hover:shadow-card">
              <span className="inline-flex rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-primary">
                {s.category}
              </span>
              <h3 className="mt-3 text-base font-bold">{s.name}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{s.city}</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{s.duration}</span>
                <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-warning text-warning" />{s.rating}</span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground">Starting from</p>
                  <p className="font-display text-lg font-bold text-primary">{formatPKR(s.startingPrice)}</p>
                </div>
                <Button asChild size="sm" className="rounded-lg">
                  <Link to="/services/$id" params={{ id: s.id }}>View Details</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ShopLayout>
  );
}