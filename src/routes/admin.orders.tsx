import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { adminNav } from "@/components/dashboard/nav-config";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPKR } from "@/data/mock";
import { supabase } from "@/lib/supabase";

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

type OrderRow = {
  id: string;
  customer_name: string;
  phone: string;
  city: string;
  vendor_id: string | null;
  total: number;
  status: string;
  created_at: string;
};

function AdminOrders() {
  const [tab, setTab] = useState("All");
  const [q, setQ] = useState("");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [vendorNames, setVendorNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    const [ordersRes, vendorsRes] = await Promise.all([
      supabase.from("orders").select("id, customer_name, phone, city, vendor_id, total, status, created_at").order("created_at", { ascending: false }),
      supabase.from("vendors").select("id, name"),
    ]);

    if (ordersRes.error) {
      console.error(ordersRes.error);
      toast.error("Orders load nahi ho sake.");
      setLoading(false);
      return;
    }

    setOrders(ordersRes.data ?? []);
    setVendorNames(new Map((vendorsRes.data ?? []).map((v) => [v.id, v.name])));
    setLoading(false);
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setBusyId(id);
    const { data, error } = await supabase.from("orders").update({ status }).eq("id", id).select();
    setBusyId(null);

    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data || data.length === 0) {
      toast.error("Permission nahi mili.");
      return;
    }

    toast.success("Order status update ho gaya.");
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));

    // Order 'Delivered' hone par, vendor ka payout automatically ban jaye
    if (status === "Delivered") {
      const order = orders.find((o) => o.id === id);
      if (order?.vendor_id) {
        const vendorName = vendorNames.get(order.vendor_id);
        if (vendorName) {
          const { data: existing } = await supabase.from("payouts").select("pay_id").eq("pay_id", `PYT-${id}`).maybeSingle();
          if (!existing) {
            const { data: rateRow } = await supabase.from("platform_settings").select("value").eq("key", "commission_rate").maybeSingle();
            const rate = rateRow?.value ? Number(rateRow.value) : 8;
            const netAmount = Number(order.total) * (1 - rate / 100);
            await supabase.from("payouts").insert({
              pay_id: `PYT-${id}`,
              recipient_name: vendorName,
              recipient_type: "Vendor",
              amount: netAmount,
              method: "Bank Transfer",
              status: "Pending",
            });
          }
        }
      }
    }
  };

  const list = orders.filter(
    (o) =>
      (tab === "All" || o.status === tab) &&
      (o.id.toLowerCase().includes(q.toLowerCase()) || (o.vendor_id && (vendorNames.get(o.vendor_id) ?? "").toLowerCase().includes(q.toLowerCase()))),
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

      {loading ? (
        <div className="flex justify-center p-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
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
                      <p>{o.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{o.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{o.vendor_id ? vendorNames.get(o.vendor_id) ?? "-" : "-"}</td>
                    <td className="px-4 py-3">{o.city}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-medium">{formatPKR(Number(o.total))}</td>
                    <td className="px-4 py-3">
                      <Select
                        value={o.status}
                        onValueChange={(status) => updateStatus(o.id, status)}
                        disabled={busyId === o.id}
                      >
                        <SelectTrigger className="h-8 w-36 rounded-lg text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {tabs.slice(1).map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {list.length === 0 && <p className="px-4 py-10 text-center text-sm text-muted-foreground">Koi order nahi mila.</p>}
        </div>
      )}
    </DashboardShell>
  );
}