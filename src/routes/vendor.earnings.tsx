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
      { title: "azadari.store" },
      {
        name: "description",
        content: "Track your store earnings, payouts and settlement history on azadari.store.",
      },
      { property: "og:title", content: "Vendor Earnings — azadari.store" },
      { property: "og:description", content: "Revenue, pending payouts and settlement history." },
    ],
  }),
  component: VendorEarnings,
});

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

type OrderRow = { total: number; delivery_fee: number; status: string; created_at: string };
type PayoutRow = { id: string; amount: number; method: string; status: string; created_at: string };

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

      const { data: vendor } = await supabase
        .from("vendors")
        .select("id, name")
        .eq("owner_id", authData.user.id)
        .maybeSingle();
      if (!vendor) {
        setLoading(false);
        return;
      }
      setStoreName(vendor.name);

      const [ordersRes, payoutsRes] = await Promise.all([
        supabase
          .from("orders")
          .select("total, delivery_fee, status, created_at")
          .eq("vendor_id", vendor.id),
        supabase
          .from("payouts")
          .select("id, amount, method, status, created_at")
          .eq("recipient_vendor_id", vendor.id)
          .order("created_at", { ascending: false }),
      ]);

      setOrders(ordersRes.data ?? []);
      setPayouts(payoutsRes.data ?? []);
      setLoading(false);
    };
    void load();
  }, []);

  const now = new Date();
  const itemSubtotal = (order: OrderRow) => Number(order.total) - Number(order.delivery_fee ?? 0);
  // Cancelled orders never earn anything, so they are left out of every total.
  const earningOrders = orders.filter((o) => o.status !== "Cancelled");
  const lifetimeEarnings = earningOrders.reduce((s, o) => s + itemSubtotal(o), 0);
  const thisMonthEarnings = earningOrders
    .filter((o) => {
      const d = new Date(o.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, o) => s + itemSubtotal(o), 0);
  const pendingPayout = payouts
    .filter((p) => p.status === "Pending")
    .reduce((s, p) => s + Number(p.amount), 0);
  const codCollected = orders
    .filter((o) => o.status === "Delivered")
    .reduce((s, o) => s + Number(o.total), 0);

  const salesChart = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const monthSales = earningOrders
      .filter((o) => {
        const od = new Date(o.created_at);
        return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
      })
      .reduce((s, o) => s + itemSubtotal(o), 0);
    return { month: MONTH_LABELS[d.getMonth()], sales: monthSales };
  });
  const hasSales = salesChart.some((point) => point.sales > 0);
  const pendingPayoutCount = payouts.filter((p) => p.status === "Pending").length;

  if (loading) {
    return (
      <DashboardShell
        brand={storeName}
        role="Vendor Account"
        title="Earnings"
        subtitle="Revenue and payout history"
        nav={vendorNav}
      >
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
      subtitle="Revenue and payout history"
      nav={vendorNav}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Lifetime sales"
          value={formatPKR(lifetimeEarnings)}
          hint="Product sales, excluding delivery and cancelled orders"
          icon={TrendingUp}
        />
        <StatCard
          label="This month"
          value={formatPKR(thisMonthEarnings)}
          hint={now.toLocaleDateString("en-PK", { month: "long", year: "numeric" })}
          icon={Banknote}
          tone="success"
        />
        <StatCard
          label="Pending payout"
          value={formatPKR(pendingPayout)}
          hint={
            pendingPayoutCount > 0
              ? `${pendingPayoutCount} ${pendingPayoutCount === 1 ? "payout" : "payouts"} on the way to you`
              : "Nothing waiting right now"
          }
          icon={Clock}
          tone="warning"
        />
        <StatCard
          label="COD collected"
          value={formatPKR(codCollected)}
          hint="Cash collected from delivered orders"
          icon={Banknote}
        />
      </div>

      <section className="surface-card p-5">
        <h2 className="font-bold">Monthly sales</h2>
        <p className="text-xs text-muted-foreground">
          Last 6 months (PKR), excluding cancelled orders
        </p>
        <div className="relative mt-4 h-64 w-full">
          {!hasSales && (
            <div className="absolute inset-0 z-10 grid place-items-center px-6 text-center">
              <div className="rounded-2xl border border-border bg-card/90 px-5 py-4 shadow-sm backdrop-blur">
                <p className="text-sm font-semibold">No sales yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Your monthly sales will appear here once customers start ordering.
                </p>
              </div>
            </div>
          )}
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="var(--muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value) => [formatPKR(Number(value)), "Sales"]}
                cursor={{ fill: "var(--muted)" }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="sales" fill="var(--primary)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="px-5 pt-5">
          <h2 className="font-bold">Payout history</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            A payout is created when an order is delivered: product amount (without delivery fee)
            minus the azadari.store commission, minus any partner commission.
          </p>
        </div>
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
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No payouts yet.
                  </td>
                </tr>
              ) : (
                payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">{p.id}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("en-PK", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">{p.method}</td>
                    <td className="px-4 py-3 font-medium">{formatPKR(Number(p.amount))}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status as never} />
                    </td>
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
