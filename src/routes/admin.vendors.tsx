import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Search, Ban, Eye } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { adminNav } from "@/components/dashboard/nav-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { vendorsList } from "@/data/mock";

export const Route = createFileRoute("/admin/vendors")({
  head: () => ({
    meta: [
      { title: "Vendors — Dukaan.pk Admin" },
      { name: "description", content: "Approve, suspend and review all marketplace vendors." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Vendors — Dukaan.pk Admin" },
      { property: "og:description", content: "Vendor management for platform owners." },
    ],
  }),
  component: AdminVendors,
});

function AdminVendors() {
  const [q, setQ] = useState("");
  const list = vendorsList.filter((v) => v.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <DashboardShell brand="Dukaan.pk" role="Owner / Admin" title="Vendors" subtitle={`${list.length} registered vendors`} nav={adminNav}>
      <div className="surface-card p-4">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search vendors" className="h-10 rounded-xl pl-9" />
        </div>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] text-sm">
            <thead className="bg-muted/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Vendor</th>
                <th className="px-4 py-3 font-semibold">Owner</th>
                <th className="px-4 py-3 font-semibold">City</th>
                <th className="px-4 py-3 font-semibold">Products</th>
                <th className="px-4 py-3 font-semibold">Orders</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((v) => (
                <tr key={v.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <p className="font-medium">{v.name}</p>
                    <p className="text-xs text-muted-foreground">{v.id} · joined {v.joined}</p>
                  </td>
                  <td className="px-4 py-3">{v.owner}</td>
                  <td className="px-4 py-3 text-muted-foreground">{v.city}</td>
                  <td className="px-4 py-3">{v.products}</td>
                  <td className="px-4 py-3">{v.orders}</td>
                  <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => toast("Vendor profile (demo)")}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg text-success" onClick={() => toast.success("Vendor approved (demo)")}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg text-destructive" onClick={() => toast("Vendor suspended (demo)")}>
                        <Ban className="h-3.5 w-3.5" />
                      </Button>
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