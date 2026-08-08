import { createFileRoute } from "@tanstack/react-router";
import { Banknote, Clock, Send } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { adminNav } from "@/components/dashboard/nav-config";
import { Button } from "@/components/ui/button";
import { formatPKR, payouts } from "@/data/mock";

export const Route = createFileRoute("/admin/payouts")({
  head: () => ({
    meta: [
      { title: "Payouts — Dukaan.pk Admin" },
      { name: "description", content: "Process vendor and partner payouts across the marketplace." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Payouts — Dukaan.pk Admin" },
      { property: "og:description", content: "Payout queue and settlement history." },
    ],
  }),
  component: AdminPayouts,
});

function AdminPayouts() {
  return (
    <DashboardShell brand="Dukaan.pk" role="Owner / Admin" title="Payouts" subtitle="Vendors aur partners ki settlements" nav={adminNav}>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Pending Payouts" value={formatPKR(82800)} hint="2 requests" icon={Clock} tone="warning" />
        <StatCard label="Paid This Month" value={formatPKR(66200)} icon={Banknote} tone="success" />
        <StatCard label="Total Settled" value={formatPKR(2140000)} icon={Banknote} />
      </div>

      <section className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-sm">
            <thead className="bg-muted/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Payout ID</th>
                <th className="px-4 py-3 font-semibold">Recipient</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Method</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payouts.map((p) => (
                <tr key={p.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium">{p.id}</td>
                  <td className="px-4 py-3">{p.to}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.type}</td>
                  <td className="px-4 py-3">{p.method}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.date}</td>
                  <td className="px-4 py-3 font-medium">{formatPKR(p.amount)}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg"
                      disabled={p.status === "Paid"}
                      onClick={() => toast.success("Payout released (demo)")}
                    >
                      <Send className="mr-1.5 h-3.5 w-3.5" /> Release
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardShell>
  );
}