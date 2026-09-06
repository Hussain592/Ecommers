import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, Loader2, Search } from "lucide-react";
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
import { formatPKR } from "@/data/mock";
import { supabase } from "@/lib/supabase";

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

type OrderRow = {
  id: string;
  customer_name: string;
  phone: string;
  city: string;
  total: number;
  status: string;
  items: unknown;
  created_at: string;
};

function VendorOrders() {
  const [tab, setTab] = useState("All");
  const [q, setQ] = useState("");
  const [storeName, setStoreName] = useState("My Store");
  const [orderList, setOrderList] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        setLoading(false);
        return;
      }

      const { data: vendor } = await supabase.from("vendors").select("id, name").eq("owner_id", authData.user.id).maybeSingle();
      if (!vendor) {
        setLoading(false);
        return;
      }
      setStoreName(vendor.name);

      const { data, error } = await supabase
        .from("orders")
        .select("id, customer_name, phone, city, total, status, items, created_at")
        .eq("vendor_id", vendor.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Unable to load vendor orders", error);
        setLoading(false);
        return;
      }

      setOrderList(data ?? []);
      setLoading(false);
    };
    void loadOrders();
  }, []);

  const list = orderList.filter(
    (o) =>
      (tab === "All" || o.status === tab) &&
      (o.id.toLowerCase().includes(q.toLowerCase()) || o.customer_name.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <DashboardShell
      brand={storeName}
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

      {loading ? (
        <div className="flex justify-center p-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
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
                      <p className="font-medium">{o.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{o.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{o.city}</td>
                    <td className="px-4 py-3">{Array.isArray(o.items) ? o.items.length : 0}</td>
                    <td className="px-4 py-3 font-medium">{formatPKR(Number(o.total))}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status as never} /></td>
                    <td className="px-4 py-3 text-right">
                      <select
                        aria-label={`Update ${o.id} status`}
                        value={o.status}
                        className="mr-2 h-8 rounded-lg border border-border bg-background px-2 text-xs"
                        onChange={async (event) => {
                          const status = event.target.value;
                          const { error } = await supabase.from("orders").update({ status }).eq("id", o.id);
                          if (error) return;
                          setOrderList((current) => current.map((item) => (item.id === o.id ? { ...item, status } : item)));

                          // Order 'Delivered' hone par, apna payout automatically ban jaye
                          if (status === "Delivered") {
                            const { data: existing } = await supabase.from("payouts").select("pay_id").eq("pay_id", `PYT-${o.id}`).maybeSingle();
                            if (!existing) {
                              const { data: rateRow } = await supabase.from("platform_settings").select("value").eq("key", "commission_rate").maybeSingle();
                              const rate = rateRow?.value ? Number(rateRow.value) : 8;
                              const netAmount = Number(o.total) * (1 - rate / 100);
                              await supabase.from("payouts").insert({
                                pay_id: `PYT-${o.id}`,
                                recipient_name: storeName,
                                recipient_type: "Vendor",
                                amount: netAmount,
                                method: "Bank Transfer",
                                status: "Pending",
                              });
                            }
                          }
                        }}
                      >
                        {tabs.slice(1).map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="rounded-lg">
                            <Eye className="mr-1.5 h-3.5 w-3.5" /> View
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Order {o.id}</DialogTitle>
                            <DialogDescription>Cash on Delivery order details</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span>{o.customer_name}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{o.phone}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">City</span><span>{o.city}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Items</span><span>{Array.isArray(o.items) ? o.items.length : 0}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{new Date(o.created_at).toLocaleDateString("en-PK")}</span></div>
                            <div className="flex justify-between font-semibold"><span>Total</span><span>{formatPKR(Number(o.total))}</span></div>
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
      )}
    </DashboardShell>
  );
}