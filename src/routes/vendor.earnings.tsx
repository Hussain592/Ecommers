import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Banknote, Clock, Loader2, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { vendorNav } from "@/components/dashboard/nav-config";
import { formatPKR } from "@/data/mock";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/vendor/earnings")({
  head: () => ({
    meta: [
      { title: "Earnings — Vendor Dashboard | Dukaan.pk" },
      { name: "description", content: "Track your store earnings, payouts and settlement history on Dukaan.pk." },
      { property: "og:title", content: "Vendor Earnings — Dukaan.pk" },
      { property: "og:description", content: "Revenue, pending payouts and settlement history." },
    ],
  }),
  component: VendorEarnings,
});

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type OrderRow = { total: number; status: string; created_at: string };
type PayoutRow = { pay_id: string; amount: number; method: string; status: string; created_at: string };

function VendorEarnings() {
  const [loading, setLoading] = useState(true);
  const [storeName, setStoreName] = useState("My Store");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);

  useEffect(() => {
    const load = async () => {
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

      const [ordersRes, payoutsRes] = await Promise.all([
        supabase.from("orders").select("total, status, created_at").eq("vendor_id", vendor.id),
        supabase.from("payouts").select("pay_id, amount, method, status, created_at").eq("recipient_name", vendor.name).order("created_at", { ascending: false }),
      ]);

      setOrders(ordersRes.data ?? []);
      setPayouts(payoutsRes.data ?? []);
      setLoading(false);
    };
    void load();
  }, []);

  const now = new Date();
  const lifetimeEarnings = orders.reduce((s, o) => s + Number(o.total), 0);
  const thisMonthEarnings = orders
    .filter((o) => {
      const d = new Date(o.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, o) => s + Number(o.total), 0);
  const pendingPayout = payouts.filter((p) => p.status === "Pending").reduce((s, p) => s + Number(p.amount), 0);
  const codCollected = orders.filter((o) => o.status === "Delivered").reduce((s, o) => s + Number(o.total), 0);

  const salesChart = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const monthSales = orders
      .filter((o) => {
        const od = new Date(o.created_at);
        return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
      })
      .reduce((s, o) => s + Number(o.total), 0);
    return { month: MONTH_LABELS[d.getMonth()], sales: monthSales };
  });

  if (loading) {
    return (
      <DashboardShell brand={storeName} role="Vendor Account" title="Earnings" subtitle="Revenue aur payout ka record" nav={vendorNav}>
        <div className="flex justify-center p-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      brand={storeName}
      role="Vendor Account"
      title="Earnings"
      subtitle="Revenue aur payout ka record"
      nav={vendorNav}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Lifetime Earnings" value={formatPKR(lifetimeEarnings)} icon={TrendingUp} />
        <StatCard label="This Month" value={formatPKR(thisMonthEarnings)} icon={Banknote} tone="success" />
        <StatCard label="Pending Payout" value={formatPKR(pendingPayout)} icon={Clock} tone="warning" />
        <StatCard label="COD Collected (Delivered)" value={formatPKR(codCollected)} icon={Banknote} />
      </div>

      <section className="surface-card p-5">
        <h2 className="font-bold">Monthly Earnings</h2>
        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: "var(--muted)" }}
                contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }}
              />
              <Bar dataKey="sales" fill="var(--primary)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="surface-card overflow-hidden">
        <h2 className="px-5 pt-5 font-bold">Payout History</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="bg-muted/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Payout ID</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Method</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Abhi koi payout record nahi.</td>
                </tr>
              ) : (
                payouts.map((p) => (
                  <tr key={p.pay_id} className="hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">{p.pay_id}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString("en-PK")}</td>
                    <td className="px-4 py-3">{p.method}</td>
                    <td className="px-4 py-3 font-medium">{formatPKR(Number(p.amount))}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status as never} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardShell>
  );
}