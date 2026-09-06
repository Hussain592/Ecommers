import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BadgePercent, Loader2, Percent, Wallet } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { adminNav } from "@/components/dashboard/nav-config";
import { formatPKR } from "@/data/mock";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/commissions")({
  head: () => ({
    meta: [
      { title: "Commissions — Dukaan.pk Admin" },
      { name: "description", content: "Review commission records across the marketplace." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Commissions — Dukaan.pk Admin" },
      { property: "og:description", content: "Commission history." },
    ],
  }),
  component: AdminCommissions,
});

type CommissionRow = {
  id: string;
  order_id: string | null;
  partner_name: string;
  amount: number;
  status: string;
  created_at: string;
};

function AdminCommissions() {
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("commissions")
        .select("id, order_id, partner_name, amount, status, created_at")
        .order("created_at", { ascending: false });
      if (!error && data) setCommissions(data);
      setLoading(false);
    };
    void load();
  }, []);

  const total = commissions.reduce((s, c) => s + Number(c.amount), 0);
  const thisMonth = commissions
    .filter((c) => {
      const d = new Date(c.created_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, c) => s + Number(c.amount), 0);

  if (loading) {
    return (
      <DashboardShell brand="Dukaan.pk" role="Owner / Admin" title="Commissions" subtitle="Platform aur partner commission" nav={adminNav}>
        <div className="flex justify-center p-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell brand="Dukaan.pk" role="Owner / Admin" title="Commissions" subtitle="Platform aur partner commission" nav={adminNav}>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="This Month" value={formatPKR(thisMonth)} hint="Total commissions" icon={BadgePercent} />
        <StatCard label="Total (All Time)" value={formatPKR(total)} icon={Wallet} tone="success" />
        <StatCard label="Total Records" value={String(commissions.length)} icon={Percent} tone="warning" />
      </div>

      <section className="surface-card overflow-hidden">
        <h2 className="px-5 pt-5 font-bold">Commission Records</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">ID</th>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Partner</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {commissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Koi commission record nahi.</td>
                </tr>
              ) : (
                commissions.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">{c.id}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.order_id ?? "-"}</td>
                    <td className="px-4 py-3">{c.partner_name}</td>
                    <td className="px-4 py-3 font-medium">{formatPKR(Number(c.amount))}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status as never} /></td>
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