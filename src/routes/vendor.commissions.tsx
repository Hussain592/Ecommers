import { createFileRoute } from "@tanstack/react-router";
import { BadgePercent, Users, Wallet } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { vendorNav } from "@/components/dashboard/nav-config";
import { commissions, formatPKR } from "@/data/mock";

export const Route = createFileRoute("/vendor/commissions")({
  head: () => ({
    meta: [
      { title: "Commissions — Vendor Dashboard | Dukaan.pk" },
      { name: "description", content: "Track partner commissions generated from your store orders." },
      { property: "og:title", content: "Vendor Commissions — Dukaan.pk" },
      { property: "og:description", content: "Partner commission breakdown per order." },
    ],
  }),
  component: VendorCommissions,
});

function VendorCommissions() {
  const total = commissions.reduce((s, c) => s + c.amount, 0);

  return (
    <DashboardShell
      brand="Al-Madina Traders"
      role="Vendor Account"
      title="Commissions"
      subtitle="Partners ko di jane wali commission"
      nav={vendorNav}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Commission" value={formatPKR(total)} icon={BadgePercent} />
        <StatCard label="Active Partners" value="3" hint="Commission rate 10%" icon={Users} tone="success" />
        <StatCard label="Pending Approval" value={formatPKR(634)} icon={Wallet} tone="warning" />
      </div>

      <section className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Commission ID</th>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Partner</th>
                <th className="px-4 py-3 font-semibold">Rate</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {commissions.map((c) => (
                <tr key={c.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium">{c.id}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.order}</td>
                  <td className="px-4 py-3">{c.partner}</td>
                  <td className="px-4 py-3">{c.rate}</td>
                  <td className="px-4 py-3 font-medium">{formatPKR(c.amount)}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardShell>
  );
}