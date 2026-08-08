import { createFileRoute, Link } from "@tanstack/react-router";
import { Package, PackagePlus, ShoppingBag, TrendingUp, Wallet } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { vendorNav } from "@/components/dashboard/nav-config";
import { Button } from "@/components/ui/button";
import { formatPKR, orders, salesChart, vendorStats } from "@/data/mock";

export const Route = createFileRoute("/vendor/")({
  head: () => ({
    meta: [
      { title: "Vendor Dashboard — Dukaan.pk" },
      { name: "description", content: "Track your store sales, orders, stock and payouts on Dukaan.pk." },
      { property: "og:title", content: "Vendor Dashboard — Dukaan.pk" },
      { property: "og:description", content: "Manage your Dukaan.pk store in one place." },
    ],
  }),
  component: VendorDashboard,
});

function VendorDashboard() {
  return (
    <DashboardShell
      brand="Al-Madina Traders"
      role="Vendor Account"
      title="Dashboard Overview"
      subtitle="Aaj ki performance ek nazar mein"
      nav={vendorNav}
      actions={
        <Button asChild size="sm" className="rounded-xl">
          <Link to="/vendor/products/new">
            <PackagePlus className="mr-2 h-4 w-4" /> Add Product
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Revenue" value={formatPKR(vendorStats.revenue)} hint="+12.4% this month" icon={TrendingUp} />
        <StatCard label="Total Orders" value={String(vendorStats.orders)} hint="18 pending" icon={ShoppingBag} tone="warning" />
        <StatCard label="Active Products" value={String(vendorStats.products)} hint="3 out of stock" icon={Package} />
        <StatCard label="Pending Payout" value={formatPKR(vendorStats.pendingPayout)} hint="Next cycle: 15 Aug" icon={Wallet} tone="success" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="surface-card p-5">
          <h2 className="font-bold">Sales Trend</h2>
          <p className="text-xs text-muted-foreground">Last 6 months (PKR)</p>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesChart}>
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="sales" stroke="var(--primary)" strokeWidth={2} fill="url(#salesFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="surface-card p-5">
          <h2 className="font-bold">Recent Orders</h2>
          <div className="mt-4 space-y-3">
            {orders.slice(0, 5).map((o) => (
              <div key={o.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-muted/60 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{o.customer}</p>
                  <p className="truncate text-xs text-muted-foreground">{o.id} · {formatPKR(o.total)}</p>
                </div>
                <StatusBadge status={o.status} />
              </div>
            ))}
          </div>
          <Button asChild variant="outline" className="mt-4 w-full rounded-xl">
            <Link to="/vendor/orders">View all orders</Link>
          </Button>
        </section>
      </div>
    </DashboardShell>
  );
}