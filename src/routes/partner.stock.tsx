import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { partnerNav } from "@/components/dashboard/nav-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type Product } from "@/data/mock";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/partner/stock")({
  head: () => ({
    meta: [
      { title: "Stock Update — Partner | Dukaan.pk" },
      { name: "description", content: "Update available stock quantities for your Dukaan.pk listings." },
      { property: "og:title", content: "Stock Update — Dukaan.pk" },
      { property: "og:description", content: "Keep your listed product stock accurate." },
    ],
  }),
  component: PartnerStock,
});

function PartnerStock() {
  const { user } = useAuth();
  const [productList, setProductList] = useState<Product[]>([]);
  const [stock, setStock] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      if (!user) return;
      const { data, error } = await supabase.from("products").select("id, name, category, stock, image, price, description, active").eq("created_by", user.id);
      if (error) { toast.error(error.message); return; }
      const mapped = data.map((product) => ({ id: product.id, name: product.name, category: product.category ?? "Uncategorized", stock: product.stock, image: product.image || "/favicon.ico", price: Number(product.price), description: product.description ?? "", active: product.active ?? true, slug: "", vendor: "Your Store", city: "", rating: 0, reviews: 0 }));
      setProductList(mapped);
      setStock(Object.fromEntries(mapped.map((product) => [product.id, product.stock])));
    };
    void loadProducts();
  }, [user]);

  const saveAll = async () => {
    setSaving(true);
    const results = await Promise.all(productList.map((product) => supabase.from("products").update({ stock: stock[product.id] ?? 0 }).eq("id", product.id)));
    setSaving(false);
    const failed = results.find((result) => result.error);
    if (failed?.error) toast.error(failed.error.message); else toast.success("Stock Supabase mein update ho gaya.");
  };

  return (
    <DashboardShell
      brand="Zeeshan Ali"
      role="Partner Account"
      title="Stock Update"
      subtitle="Quantities update karein"
      nav={partnerNav}
      actions={
        <Button size="sm" disabled={saving} className="rounded-xl" onClick={() => void saveAll()}>
          <Save className="mr-2 h-4 w-4" /> Save All
        </Button>
      }
    >
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="bg-muted/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Current Stock</th>
                <th className="px-4 py-3 text-right font-semibold">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {productList.map((p) => (
                <tr key={p.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt={p.name} loading="lazy" width={800} height={800} className="h-10 w-10 rounded-lg object-cover" />
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                  <td className="px-4 py-3">{p.stock}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <Input
                        type="number"
                        className="h-9 w-24 rounded-lg"
                        value={stock[p.id] ?? 0}
                        onChange={(e) => setStock((s) => ({ ...s, [p.id]: Number(e.target.value) }))}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
