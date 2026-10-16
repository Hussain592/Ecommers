import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BadgePercent, CheckCircle2, Clock, Info, Loader2, Wallet } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { partnerNav } from "@/components/dashboard/nav-config";
import { formatPKR } from "@/data/mock";
import { supabase } from "@/lib/supabase";
import { useAccountName } from "@/lib/use-account-name";

export const Route = createFileRoute("/partner/earnings")({
  head: () => ({
    meta: [
      { title: "azadari.store" },
      { property: "og:title", content: "My Commission — azadari.store" },
      {
        name: "description",
        content: "Commission you earn on delivered orders of the products you added.",
      },
    ],
  }),
  component: PartnerEarnings,
});

type CommissionRow = {
  id: string;
  order_id: string | null;
  product_name: string | null;
  quantity: number | null;
  sale_amount: number | string | null;
  rate: number | string;
  amount: number | string;
  status: string;
  created_at: string;
  paid_at: string | null;
};

const sumAmount = (rows: CommissionRow[]) => rows.reduce((sum, c) => sum + Number(c.amount), 0);

function PartnerEarnings() {
  const partnerName = useAccountName("Partner");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      // RLS only returns this partner's own commissions.
      const { data, error } = await supabase
        .from("commissions")
        .select(
          "id, order_id, product_name, quantity, sale_amount, rate, amount, status, created_at, paid_at",
        )
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        console.error("Unable to load partner commissions", error);
        setLoadError(true);
      } else {
        setCommissions((data ?? []) as CommissionRow[]);
      }
      setLoading(false);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const pending = commissions.filter((c) => c.status === "Pending");
  const approved = commissions.filter((c) => c.status === "Approved");
  const paid = commissions.filter((c) => c.status === "Paid");

  return (
    <DashboardShell
      brand={partnerName}
      role="Partner Account"
      title="My Commission"
      subtitle="What you earn from the products you added"
      nav={partnerNav}
    >
      <section className="surface-card flex gap-3 p-4 text-sm">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
        <div className="space-y-1">
          <p className="font-semibold">How you earn</p>
          <p className="text-muted-foreground">
            When an order containing a product you added is <strong>delivered</strong>, you earn a
            percentage of that product's sale. The admin first <strong>approves</strong> it, then
            pays it and marks it <strong>Paid</strong>. Cancelled or returned orders don't earn
            commission.
          </p>
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center p-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : loadError ? (
        <EmptyState
          icon={BadgePercent}
          title="Couldn't load your commission"
          description="Refresh the page in a few minutes. If the problem continues, contact your vendor or support."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Waiting for approval"
              value={formatPKR(sumAmount(pending))}
              hint={`${pending.length} ${pending.length === 1 ? "sale" : "sales"}`}
              icon={Clock}
              tone="warning"
            />
            <StatCard
              label="Approved, not paid yet"
              value={formatPKR(sumAmount(approved))}
              hint={`${approved.length} ${approved.length === 1 ? "sale" : "sales"}`}
              icon={Wallet}
            />
            <StatCard
              label="Paid to you"
              value={formatPKR(sumAmount(paid))}
              hint={`${paid.length} ${paid.length === 1 ? "sale" : "sales"}`}
              icon={CheckCircle2}
              tone="success"
            />
          </div>

          {commissions.length === 0 ? (
            <EmptyState
              icon={BadgePercent}
              title="No commission yet"
              description="Your commission appears here as soon as an order with one of your products is delivered."
            />
          ) : (
            <section className="surface-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-muted/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold">Order</th>
                      <th className="px-4 py-3 font-semibold">Product</th>
                      <th className="px-4 py-3 text-right font-semibold">Sale</th>
                      <th className="px-4 py-3 text-right font-semibold">Rate</th>
                      <th className="px-4 py-3 text-right font-semibold">Your commission</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {commissions.map((c) => (
                      <tr key={c.id} className="hover:bg-muted/40">
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                          {new Date(c.created_at).toLocaleDateString("en-PK", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3 font-medium">{c.order_id ?? "—"}</td>
                        <td className="px-4 py-3">
                          {c.product_name ?? "—"}
                          {c.quantity ? (
                            <span className="text-muted-foreground"> × {c.quantity}</span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {c.sale_amount === null ? "—" : formatPKR(Number(c.sale_amount))}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{Number(c.rate)}%</td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums">
                          {formatPKR(Number(c.amount))}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={c.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </DashboardShell>
  );
}
