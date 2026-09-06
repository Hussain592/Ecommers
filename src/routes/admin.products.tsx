import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Eye, EyeOff, Loader2, Search, Star } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { adminNav } from "@/components/dashboard/nav-config";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { formatPKR, resolveProductImage } from "@/data/mock";

export const Route = createFileRoute("/admin/products")({
  head: () => ({ meta: [{ title: "Product Review — Dukaan.pk Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminProducts,
});

type ProductRow = { id: string; name: string; image: string | null; category: string | null; price: number; stock: number; active: boolean; featured: boolean; sales_count: number; vendor: { name: string } | null };

function AdminProducts() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("products").select("id, name, image, category, price, stock, active, featured, sales_count, vendors(name)").order("featured", { ascending: false }).order("sales_count", { ascending: false }).order("created_at", { ascending: false });
    if (error) {
      toast.error("Products load nahi ho sake.");
    } else {
      setProducts((data ?? []).map((product) => ({ ...product, price: Number(product.price), vendor: product.vendors?.[0] ?? null })));
    }
    setLoading(false);
  };

  useEffect(() => { void loadProducts(); }, []);

  const filtered = useMemo(() => products.filter((product) => `${product.name} ${product.category ?? ""} ${product.vendor?.name ?? ""}`.toLowerCase().includes(query.toLowerCase())), [products, query]);

  const setVisibility = async (id: string, active: boolean) => {
    setBusyId(id);
    const { error } = await supabase.from("products").update({ active }).eq("id", id);
    setBusyId(null);
    if (error) {
      toast.error("Product status update nahi ho saka.");
      return;
    }
    setProducts((current) => current.map((product) => product.id === id ? { ...product, active } : product));
    toast.success(active ? "Product website par show ho raha hai." : "Product website se hide ho gaya.");
  };

  const toggleFeatured = async (product: ProductRow) => {
    setBusyId(product.id);
    const { error } = await supabase.from("products").update({ featured: !product.featured }).eq("id", product.id);
    setBusyId(null);
    if (error) {
      toast.error("Featured status update nahi ho saka.");
      return;
    }
    setProducts((current) => current.map((item) => item.id === product.id ? { ...item, featured: !item.featured } : item));
    toast.success(product.featured ? "Product featured se remove ho gaya." : "Product homepage par featured ho gaya.");
  };

  return (
    <DashboardShell brand="Dukaan.pk" role="Owner / Admin" title="Product Review" subtitle="Products approve karein ya website se hide karein" nav={adminNav}>
      <div className="surface-card flex flex-wrap items-center justify-between gap-4 p-4">
        <div><p className="text-sm font-bold">{products.filter((product) => product.active).length} visible products</p><p className="text-xs text-muted-foreground">Inactive products customers ko nahi dikhte.</p></div>
        <div className="relative w-full max-w-sm"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search product or vendor" className="rounded-xl pl-9" /></div>
      </div>
      {loading ? (
        <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-195 text-sm">
              <thead className="bg-muted/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Vendor</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Price / Stock</th><th className="px-4 py-3">Visibility</th><th className="px-4 py-3">Featured</th><th className="px-4 py-3 text-right">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((product) => (
                  <tr key={product.id} className="hover:bg-muted/40"><td className="px-4 py-3"><div className="flex items-center gap-3"><img src={product.image || "/favicon.ico"} alt="" width={48} height={48} className="h-12 w-12 rounded-lg bg-muted object-cover" /><div><p className="font-semibold">{product.name}</p><p className="text-xs text-muted-foreground">{product.id}</p></div></div></td><td className="px-4 py-3">{product.vendor?.name ?? "Unassigned"}</td><td className="px-4 py-3 text-muted-foreground">{product.category ?? "Uncategorized"}</td><td className="px-4 py-3"><p className="font-semibold">{formatPKR(product.price)}</p><p className="text-xs text-muted-foreground">Stock {product.stock} · {product.sales_count} sold</p></td><td className="px-4 py-3"><StatusBadge status={product.active ? "Active" : "Suspended"} /></td><td className="px-4 py-3"><Button variant={product.featured ? "default" : "outline"} size="sm" className="rounded-lg" disabled={busyId === product.id || !product.active} onClick={() => void toggleFeatured(product)}><Star className={`mr-2 h-4 w-4 ${product.featured ? "fill-current" : ""}`} />{product.featured ? "Featured" : "Feature"}</Button></td><td className="px-4 py-3 text-right"><Button variant={product.active ? "outline" : "default"} size="sm" className="rounded-lg" disabled={busyId === product.id} onClick={() => void setVisibility(product.id, !product.active)}>{product.active ? <><EyeOff className="mr-2 h-4 w-4" /> Hide</> : <><Eye className="mr-2 h-4 w-4" /> Show</>}</Button></td></tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground">Koi product nahi mila.</div>}
        </div>
      )}
      <p className="flex items-center gap-2 text-xs text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-success" /> Sirf active products public storefront par display hote hain.</p>
    </DashboardShell>
  );
}
