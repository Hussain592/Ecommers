import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, PackageSearch, Search } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { partnerNav } from "@/components/dashboard/nav-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/partner/products")({
  head: () => ({
    meta: [
      { title: "My Products — Partner | Dukaan.pk" },
      { name: "description", content: "View the products you have listed as a Dukaan.pk partner." },
      { property: "og:title", content: "Partner Products — Dukaan.pk" },
      { property: "og:description", content: "Your listed products and their approval status." },
    ],
  }),
  component: PartnerProducts,
});

type ProductRow = {
  id: string;
  name: string;
  image: string | null;
  category: string;
  stock: number;
  active: boolean;
};

function PartnerProducts() {
  const [q, setQ] = useState("");
  const [partnerName, setPartnerName] = useState("Partner");
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
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

    void loadProducts();
  }, []);

  const list = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <DashboardShell
      brand={partnerName}
      role="Partner Account"
      title="My Products"
      subtitle={`${list.length} listings`}
      nav={partnerNav}
    >
      <div className="surface-card p-4">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search my products" className="h-10 rounded-xl pl-9" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="Koi listing nahi mili"
          description="Naya product add karein ya search clear karein."
          action={
            <Button asChild className="rounded-xl">
              <Link to="/partner/add-product">Add Product</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => (
            <div key={p.id} className="surface-card p-4">
              <div className="flex gap-3">
                <img src={p.image ?? ""} alt={p.name} loading="lazy" width={800} height={800} className="h-16 w-16 rounded-xl bg-muted object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.category}</p>
                  <div className="mt-2">
                    <StatusBadge status={p.active ? "Active" : "Inactive"} />
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl bg-muted/60 p-3 text-sm">
                <span className="text-muted-foreground">Stock</span>
                <span className="font-display font-bold">{p.stock}</span>
              </div>
              <Button asChild variant="outline" className="mt-3 w-full rounded-xl">
                <Link to="/partner/stock">Update Stock</Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}