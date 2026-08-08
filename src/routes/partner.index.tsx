import { createFileRoute, Link } from "@tanstack/react-router";
import { Boxes, CheckCircle2, Package, PackagePlus } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { partnerNav } from "@/components/dashboard/nav-config";
import { Button } from "@/components/ui/button";
import { products } from "@/data/mock";

export const Route = createFileRoute("/partner/")({
  head: () => ({
    meta: [
      { title: "Partner Dashboard — Dukaan.pk" },
      { name: "description", content: "Add products and update stock as a Dukaan.pk listing partner." },
      { property: "og:title", content: "Partner Dashboard — Dukaan.pk" },
      { property: "og:description", content: "Simple tools for partners to manage listings and stock." },
    ],
  }),
  component: PartnerDashboard,
});

function PartnerDashboard() {
  const mine = products.slice(0, 5);

  return (
    <DashboardShell
      brand="Zeeshan Ali"
      role="Partner Account"
      title="Dashboard"
      subtitle="Aapki listings ka summary"
      nav={partnerNav}
      actions={
        <Button asChild size="sm" className="rounded-xl">
          <Link to="/partner/add-product">
            <PackagePlus className="mr-2 h-4 w-4" /> Add Product
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="My Products" value="14" hint="Listed under Al-Madina Traders" icon={Package} />
        <StatCard label="Approved" value="11" icon={CheckCircle2} tone="success" />
        <StatCard label="Low Stock Items" value="3" hint="Update karna zaroori hai" icon={Boxes} tone="warning" />
      </div>

      <section className="surface-card p-5">
        <h2 className="font-bold">Recent Listings</h2>
        <div className="mt-4 space-y-3">
          {mine.map((p) => (
            <div key={p.id} className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-muted/60 p-3">
              <img src={p.image} alt={p.name} loading="lazy" width={800} height={800} className="h-11 w-11 rounded-xl object-cover" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{p.name}</p>
                <p className="truncate text-xs text-muted-foreground">{p.category} · Stock {p.stock}</p>
              </div>
              <Button asChild variant="outline" size="sm" className="rounded-lg">
                <Link to="/partner/stock">Update Stock</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      <p className="text-center text-xs text-muted-foreground">
        Note: Partner account par earnings, commission aur payout information available nahi hoti.
      </p>
    </DashboardShell>
  );
}