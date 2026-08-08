import { createFileRoute } from "@tanstack/react-router";
import { Banknote, Clock, Download, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { vendorNav } from "@/components/dashboard/nav-config";
import { Button } from "@/components/ui/button";
import { formatPKR, payouts, salesChart } from "@/data/mock";

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

function VendorEarnings() {
  return (
    <DashboardShell
      brand="Al-Madina Traders"
      role="Vendor Account"
      title="Earnings"
      subtitle="Revenue aur payout ka record"
      nav={vendorNav}
      actions={
        <Button size="sm" variant="outline" className="rounded-xl">
          <Download className="mr-2 h-4 w-4" /> Export
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Lifetime Earnings" value={formatPKR(1284500)} icon={TrendingUp} />
        <StatCard label="This Month" value={formatPKR(96000)} hint="+9.2% vs last month" icon={Banknote} tone="success" />
        <StatCard label="Pending Payout" value={formatPKR(74200)} hint="Release: 15 Aug" icon={Clock} tone="warning" />
        <StatCard label="COD Collected" value={formatPKR(88400)} hint="Courier settlement" icon={Banknote} />
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
              {payouts.filter((p) => p.type === "Vendor").map((p) => (
                <tr key={p.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium">{p.id}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.date}</td>
                  <td className="px-4 py-3">{p.method}</td>
                  <td className="px-4 py-3 font-medium">{formatPKR(p.amount)}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardShell>
  );
}