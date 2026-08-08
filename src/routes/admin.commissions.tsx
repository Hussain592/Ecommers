import { createFileRoute } from "@tanstack/react-router";
import { BadgePercent, Percent, Wallet } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { adminNav } from "@/components/dashboard/nav-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { commissions, formatPKR } from "@/data/mock";

export const Route = createFileRoute("/admin/commissions")({
  head: () => ({
    meta: [
      { title: "Commissions — Dukaan.pk Admin" },
      { name: "description", content: "Set platform commission rates and review commission records." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Commissions — Dukaan.pk Admin" },
      { property: "og:description", content: "Commission configuration and history." },
    ],
  }),
  component: AdminCommissions,
});

function AdminCommissions() {
  const total = commissions.reduce((s, c) => s + c.amount, 0);

  return (
    <DashboardShell brand="Dukaan.pk" role="Owner / Admin" title="Commissions" subtitle="Platform aur partner commission" nav={adminNav}>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Platform Commission" value={formatPKR(184300)} hint="This month" icon={BadgePercent} />
        <StatCard label="Partner Commission" value={formatPKR(total)} icon={Wallet} tone="success" />
        <StatCard label="Default Rate" value="10%" hint="Applies to new vendors" icon={Percent} tone="warning" />
      </div>

      <section className="surface-card p-5">
        <h2 className="font-bold">Commission Settings</h2>
        <form
          className="mt-4 grid gap-4 sm:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            toast.success("Commission rates update (demo)");
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="pr">Platform Rate (%)</Label>
            <Input id="pr" type="number" defaultValue={8} className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ptr">Partner Rate (%)</Label>
            <Input id="ptr" type="number" defaultValue={10} className="rounded-xl" />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full rounded-xl">Save Rates</Button>
          </div>
        </form>
      </section>

      <section className="surface-card overflow-hidden">
        <h2 className="px-5 pt-5 font-bold">Commission Records</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">ID</th>
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