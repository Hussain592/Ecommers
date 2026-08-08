import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { adminNav } from "@/components/dashboard/nav-config";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPKR, orders } from "@/data/mock";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({
    meta: [
      { title: "Orders — Dukaan.pk Admin" },
      { name: "description", content: "All marketplace COD orders across every vendor." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Orders — Dukaan.pk Admin" },
      { property: "og:description", content: "Full order pipeline across the marketplace." },
    ],
  }),
  component: AdminOrders,
});

const tabs = ["All", "Pending", "Confirmed", "Dispatched", "Delivered", "Cancelled"];

function AdminOrders() {
  const [tab, setTab] = useState("All");
  const [q, setQ] = useState("");
  const list = orders.filter(
    (o) =>
      (tab === "All" || o.status === tab) &&
      (o.id.toLowerCase().includes(q.toLowerCase()) || o.vendor.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <DashboardShell brand="Dukaan.pk" role="Owner / Admin" title="Orders" subtitle="Saare vendors ke COD orders" nav={adminNav}>
      <div className="surface-card space-y-4 p-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl">
            {tabs.map((t) => (
              <TabsTrigger key={t} value={t} className="rounded-lg text-xs">{t}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Order ID ya vendor" className="h-10 rounded-xl pl-9" />
        </div>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-muted/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Vendor</th>
                <th className="px-4 py-3 font-semibold">City</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((o) => (
                <tr key={o.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium">{o.id}</td>
                  <td className="px-4 py-3">
                    <p>{o.customer}</p>
                    <p className="text-xs text-muted-foreground">{o.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{o.vendor}</td>
                  <td className="px-4 py-3">{o.city}</td>
                  <td className="px-4 py-3 text-muted-foreground">{o.date}</td>
                  <td className="px-4 py-3 font-medium">{formatPKR(o.total)}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {list.length === 0 && <p className="px-4 py-10 text-center text-sm text-muted-foreground">Koi order nahi mila.</p>}
      </div>
    </DashboardShell>
  );
}