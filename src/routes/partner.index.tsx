import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Boxes, CheckCircle2, Loader2, Package, PackagePlus } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { partnerNav } from "@/components/dashboard/nav-config";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

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

type ProductRow = {
  id: string;
  name: string;
  image: string | null;
  category: string;
  stock: number;
  active: boolean;
};

function PartnerDashboard() {
  const [partnerName, setPartnerName] = useState("Partner");
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase.from("users").select("name").eq("auth_id", authData.user.id).maybeSingle();
      if (profile?.name) setPartnerName(profile.name);

      const { data, error } = await supabase
        .from("products")
        .select("id, name, image, category, stock, active")
        .eq("created_by", authData.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Unable to load partner products", error);
        setLoading(false);
        return;
      }

      setProducts(data ?? []);
      setLoading(false);
    };
    void load();
  }, []);

  const approved = products.filter((p) => p.active).length;
  const lowStock = products.filter((p) => p.stock < 10).length;
  const recent = products.slice(0, 5);

  if (loading) {
    return (
      <DashboardShell brand={partnerName} role="Partner Account" title="Dashboard" subtitle="Aapki listings ka summary" nav={partnerNav}>
        <div className="flex justify-center p-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      brand={partnerName}
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
        <StatCard label="My Products" value={String(products.length)} icon={Package} />
        <StatCard label="Active" value={String(approved)} icon={CheckCircle2} tone="success" />
        <StatCard label="Low Stock Items" value={String(lowStock)} hint="Update karna zaroori hai" icon={Boxes} tone="warning" />
      </div>

      <section className="surface-card p-5">
        <h2 className="font-bold">Recent Listings</h2>
        {recent.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Abhi koi product add nahi kiya.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {recent.map((p) => (
              <div key={p.id} className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-muted/60 p-3">
                <img src={p.image ?? ""} alt={p.name} loading="lazy" width={800} height={800} className="h-11 w-11 rounded-xl bg-muted object-cover" />
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
        )}
      </section>

      <p className="text-center text-xs text-muted-foreground">
        Note: Partner account par earnings, commission aur payout information available nahi hoti.
      </p>
    </DashboardShell>
  );
}