import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Clock, MapPin, Star } from "lucide-react";
import { toast } from "sonner";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatPKR, services } from "@/data/mock";

export const Route = createFileRoute("/services/$id")({
  head: () => ({
    meta: [
      { title: "Service Detail — Dukaan.pk" },
      { name: "description", content: "Service details, pricing and booking request form on Dukaan.pk." },
      { property: "og:title", content: "Service Detail — Dukaan.pk" },
      { property: "og:description", content: "Book a verified service provider and pay cash after the job." },
    ],
  }),
  component: ServiceDetail,
});

function ServiceDetail() {
  const { id } = Route.useParams();
  const service = services.find((s) => s.id === id);

  if (!service) {
    return (
      <ShopLayout>
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Service not found</h1>
          <Button asChild className="mt-4 rounded-xl">
            <Link to="/services">Back to services</Link>
          </Button>
        </div>
      </ShopLayout>
    );
  }

  return (
    <ShopLayout>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <nav className="text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">Home</Link> /{" "}
          <Link to="/services" className="hover:text-primary">Services</Link> /{" "}
          <span className="text-foreground">{service.name}</span>
        </nav>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div>
            <span className="inline-flex rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-primary">
              {service.category}
            </span>
            <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">{service.name}</h1>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{service.city}</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{service.duration}</span>
              <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-warning text-warning" />{service.rating}</span>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{service.description}</p>

            <h2 className="mt-8 text-lg font-bold">Kya include hai</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {service.includes.map((i) => (
                <li key={i} className="surface-card flex items-center gap-2 p-3 text-sm">
                  <Check className="h-4 w-4 text-success" /> {i}
                </li>
              ))}
            </ul>

            <div className="surface-card mt-8 p-5">
              <h3 className="font-bold">Provider</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {service.provider} · Verified partner on Dukaan.pk
              </p>
            </div>
          </div>

          <aside className="surface-card h-fit p-5 lg:sticky lg:top-24">
            <p className="text-xs text-muted-foreground">Starting from</p>
            <p className="font-display text-3xl font-extrabold text-primary">
              {formatPKR(service.startingPrice)}
            </p>
            <form
              className="mt-5 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                toast.success("Booking request bhej di gayi (demo)", {
                  description: "Team aapko call karke slot confirm karegi.",
                });
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="sname">Full Name</Label>
                <Input id="sname" required placeholder="Ahmed Raza" className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sphone">Phone</Label>
                <Input id="sphone" required placeholder="03XX-XXXXXXX" className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="saddr">Address / Details</Label>
                <Textarea id="saddr" placeholder="Area, city aur kaam ki tafseel" className="rounded-xl" />
              </div>
              <Button type="submit" size="lg" className="w-full rounded-xl">
                Request Booking
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Payment service complete hone ke baad, cash mein.
              </p>
            </form>
          </aside>
        </div>
      </div>
    </ShopLayout>
  );
}