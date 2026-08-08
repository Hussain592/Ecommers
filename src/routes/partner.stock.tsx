import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { partnerNav } from "@/components/dashboard/nav-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { products } from "@/data/mock";

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
  const initial = Object.fromEntries(products.slice(0, 8).map((p) => [p.id, p.stock]));
  const [stock, setStock] = useState<Record<string, number>>(initial);

  return (
    <DashboardShell
      brand="Zeeshan Ali"
      role="Partner Account"
      title="Stock Update"
      subtitle="Quantities update karein"
      nav={partnerNav}
      actions={
        <Button size="sm" className="rounded-xl" onClick={() => toast.success("Stock update ho gaya (demo)")}>
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
              {products.slice(0, 8).map((p) => (
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