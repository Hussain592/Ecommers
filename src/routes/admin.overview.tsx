import { createFileRoute } from "@tanstack/react-router";
import { Package, ShoppingBag, Store, TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { adminNav } from "@/components/dashboard/nav-config";
import { formatPKR, orders, salesChart, vendorsList } from "@/data/mock";

export const Route = createFileRoute("/admin/overview")({
  head: () => ({
    meta: [
      { title: "Platform Overview — Dukaan.pk Admin" },
      { name: "description", content: "Platform-wide sales, vendors and order metrics for Dukaan.pk owners." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin Overview — Dukaan.pk" },
      { property: "og:description", content: "Marketplace performance at a glance." },
    ],
  }),
  component: AdminOverview,
});

function AdminOverview() {
  return (
    <DashboardShell brand="Dukaan.pk" role="Owner / Admin" title="Platform Overview" subtitle="Poore marketplace ki performance" nav={adminNav}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="GMV (This Month)" value={formatPKR(3860000)} hint="+18.2% MoM" icon={TrendingUp} />
        <StatCard label="Total Orders" value="4,218" hint="312 pending confirmation" icon={ShoppingBag} tone="warning" />
        <StatCard label="Active Vendors" value="452" hint="14 approval pending" icon={Store} tone="success" />
        <StatCard label="Listed Products" value="12,904" hint="Across 6 categories" icon={Package} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="surface-card p-5">
          <h2 className="font-bold">Marketplace Sales</h2>
          <p className="text-xs text-muted-foreground">Last 6 months (PKR, all vendors)</p>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesChart}>
                <defs>
                  <linearGradient id="adminFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }} />
                <Area type="monotone" dataKey="sales" stroke="var(--primary)" strokeWidth={2} fill="url(#adminFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="surface-card p-5">
          <h2 className="font-bold">Top Vendors</h2>
          <div className="mt-4 space-y-3">
            {vendorsList.map((v) => (
              <div key={v.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-muted/60 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{v.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{v.city} · {v.orders} orders</p>
                </div>
                <StatusBadge status={v.status} />
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="surface-card overflow-hidden">
        <h2 className="px-5 pt-5 font-bold">Latest Orders (All Vendors)</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Vendor</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium">{o.id}</td>
                  <td className="px-4 py-3">{o.customer}</td>
                  <td className="px-4 py-3 text-muted-foreground">{o.vendor}</td>
                  <td className="px-4 py-3 font-medium">{formatPKR(o.total)}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardShell>
  );
}