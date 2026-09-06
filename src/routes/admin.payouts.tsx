import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Banknote, Clock, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { adminNav } from "@/components/dashboard/nav-config";
import { Button } from "@/components/ui/button";
import { formatPKR } from "@/data/mock";
import { supabase } from "@/lib/supabase";

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

type PayoutRow = {
  pay_id: string;
  recipient_name: string;
  recipient_type: string;
  amount: number;
  method: string;
  status: string;
  created_at: string;
  paid_at: string | null;
};

function AdminPayouts() {
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadPayouts = async () => {
    const { data, error } = await supabase
      .from("payouts")
      .select("pay_id, recipient_name, recipient_type, amount, method, status, created_at, paid_at")
      .order("created_at", { ascending: false });
    if (!error && data) setPayouts(data);
    setLoading(false);
  };

  useEffect(() => {
    void loadPayouts();
  }, []);

  const release = async (payId: string) => {
    setBusyId(payId);
    const { data, error } = await supabase
      .from("payouts")
      .update({ status: "Paid", paid_at: new Date().toISOString() })
      .eq("pay_id", payId)
      .select();
    setBusyId(null);

    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data || data.length === 0) {
      toast.error("Permission nahi mili.");
      return;
    }

    toast.success("Payout release ho gaya.");
    setPayouts((prev) => prev.map((p) => (p.pay_id === payId ? { ...p, status: "Paid", paid_at: new Date().toISOString() } : p)));
  };

  const pending = payouts.filter((p) => p.status === "Pending");
  const pendingTotal = pending.reduce((s, p) => s + Number(p.amount), 0);
  const paidThisMonth = payouts
    .filter((p) => {
      if (p.status !== "Paid" || !p.paid_at) return false;
      const d = new Date(p.paid_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, p) => s + Number(p.amount), 0);
  const totalSettled = payouts.filter((p) => p.status === "Paid").reduce((s, p) => s + Number(p.amount), 0);

  if (loading) {
    return (
      <DashboardShell brand="Dukaan.pk" role="Owner / Admin" title="Payouts" subtitle="Vendors aur partners ki settlements" nav={adminNav}>
        <div className="flex justify-center p-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell brand="Dukaan.pk" role="Owner / Admin" title="Payouts" subtitle="Vendors aur partners ki settlements" nav={adminNav}>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Pending Payouts" value={formatPKR(pendingTotal)} hint={`${pending.length} requests`} icon={Clock} tone="warning" />
        <StatCard label="Paid This Month" value={formatPKR(paidThisMonth)} icon={Banknote} tone="success" />
        <StatCard label="Total Settled" value={formatPKR(totalSettled)} icon={Banknote} />
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
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Koi payout record nahi.</td>
                </tr>
              ) : (
                payouts.map((p) => (
                  <tr key={p.pay_id} className="hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">{p.pay_id}</td>
                    <td className="px-4 py-3">{p.recipient_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.recipient_type}</td>
                    <td className="px-4 py-3">{p.method}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-medium">{formatPKR(Number(p.amount))}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status as never} /></td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg"
                        disabled={p.status === "Paid" || busyId === p.pay_id}
                        onClick={() => release(p.pay_id)}
                      >
                        <Send className="mr-1.5 h-3.5 w-3.5" /> Release
                      </Button>
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