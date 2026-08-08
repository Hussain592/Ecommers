import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, Search } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { vendorNav } from "@/components/dashboard/nav-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatPKR, orders } from "@/data/mock";

export const Route = createFileRoute("/vendor/orders")({
  head: () => ({
    meta: [
      { title: "Orders — Vendor Dashboard | Dukaan.pk" },
      { name: "description", content: "View and manage COD orders received by your Dukaan.pk store." },
      { property: "og:title", content: "Vendor Orders — Dukaan.pk" },
      { property: "og:description", content: "Track and update your COD order pipeline." },
    ],
  }),
  component: VendorOrders,
});

const tabs = ["All", "Pending", "Confirmed", "Dispatched", "Delivered", "Cancelled"];

function VendorOrders() {
  const [tab, setTab] = useState("All");
  const [q, setQ] = useState("");

  const list = orders.filter(
    (o) =>
      (tab === "All" || o.status === tab) &&
      (o.id.toLowerCase().includes(q.toLowerCase()) || o.customer.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <DashboardShell
      brand="Al-Madina Traders"
      role="Vendor Account"
      title="Orders"
      subtitle="Saare COD orders yahan manage karein"
      nav={vendorNav}
    >
      <div className="surface-card space-y-4 p-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl">
            {tabs.map((t) => (
              <TabsTrigger key={t} value={t} className="rounded-lg text-xs">
                {t}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Order ID ya customer search karein" className="h-10 rounded-xl pl-9" />
        </div>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Order ID</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">City</th>
                <th className="px-4 py-3 font-semibold">Items</th>
                <th className="px-4 py-3 font-semibold">Total (COD)</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((o) => (
                <tr key={o.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium">{o.id}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{o.customer}</p>
                    <p className="text-xs text-muted-foreground">{o.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{o.city}</td>
                  <td className="px-4 py-3">{o.items}</td>
                  <td className="px-4 py-3 font-medium">{formatPKR(o.total)}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="rounded-lg">
                          <Eye className="mr-1.5 h-3.5 w-3.5" /> View
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Order {o.id}</DialogTitle>
                          <DialogDescription>Cash on Delivery order details (demo data)</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span>{o.customer}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{o.phone}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">City</span><span>{o.city}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Items</span><span>{o.items}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{o.date}</span></div>
                          <div className="flex justify-between font-semibold"><span>Total</span><span>{formatPKR(o.total)}</span></div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {list.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">Is filter par koi order nahi hai.</p>
        )}
      </div>
    </DashboardShell>
  );
}