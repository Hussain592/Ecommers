import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BadgePercent, Loader2, Users, Wallet } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { vendorNav } from "@/components/dashboard/nav-config";
import { formatPKR } from "@/data/mock";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/vendor/commissions")({
  head: () => ({
    meta: [
      { title: "azadari.store" },
      {
        name: "description",
        content: "Track partner commissions generated from your store orders.",
      },
      { property: "og:title", content: "Vendor Commissions — azadari.store" },
      { property: "og:description", content: "Partner commission breakdown per order." },
    ],
  }),
  component: VendorCommissions,
});

type CommissionRow = {
  id: string;
  order_id: string | null;
  partner_id: string | null;
  partner_name: string | null;
  product_name: string | null;
  rate: number | string;
  amount: number | string;
  status: string;
  created_at: string;
};

function VendorCommissions() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [storeName, setStoreName] = useState("My Store");
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        if (!cancelled) setLoading(false);
        return;
      }

      const { data: vendor } = await supabase
        .from("vendors")
        .select("id, name")
        .eq("owner_id", authData.user.id)
        .maybeSingle();

      if (!vendor) {
        if (!cancelled) setLoading(false);
        return;
      }

      if (!cancelled) setStoreName(vendor.name);

      const { data, error } = await supabase
        .from("commissions")
        .select(
          "id, order_id, partner_id, partner_name, product_name, rate, amount, status, created_at",
        )
        .eq("vendor_id", vendor.id)
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        console.error("Unable to load vendor commissions", error);
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

  const total = commissions.reduce((sum, c) => sum + Number(c.amount), 0);
  const pending = commissions
    .filter((c) => c.status === "Pending")
    .reduce((sum, c) => sum + Number(c.amount), 0);
  const partnerCount = new Set(
    commissions.map((c) => c.partner_id ?? c.partner_name).filter(Boolean),
  ).size;
  const rates = [...new Set(commissions.map((c) => Number(c.rate)))];
  const rateHint =
    rates.length === 0
      ? "Abhi koi commission nahi"
      : rates.length === 1
        ? `Commission rate ${rates[0]}%`
        : `Rates ${Math.min(...rates)}% – ${Math.max(...rates)}%`;

  return (
    <DashboardShell
      brand={storeName}
      role="Vendor Account"
      title="Commissions"
      subtitle="Partners ko di jane wali commission"
      nav={vendorNav}
    >
      {loading ? (
        <div className="flex justify-center p-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : loadError ? (
        <EmptyState
          icon={BadgePercent}
          title="Commissions load nahi ho sakin"
          description="Thori dair baad page refresh karein. Masla rahe to support se rabta karein."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Total Commission" value={formatPKR(total)} icon={BadgePercent} />
            <StatCard
              label="Active Partners"
              value={String(partnerCount)}
              hint={rateHint}
              icon={Users}
              tone="success"
            />
            <StatCard
              label="Pending Approval"
              value={formatPKR(pending)}
              icon={Wallet}
              tone="warning"
            />
          </div>

          {commissions.length === 0 ? (
            <EmptyState
              icon={BadgePercent}
              title="Abhi koi commission nahi"
              description="Jab koi partner aapke products bechega to us ki commission yahan nazar aayegi."
            />
          ) : (
            <section className="surface-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-muted/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Commission ID</th>
                      <th className="px-4 py-3 font-semibold">Order</th>
                      <th className="px-4 py-3 font-semibold">Partner</th>
                      <th className="px-4 py-3 font-semibold">Product</th>
                      <th className="px-4 py-3 font-semibold">Rate</th>
                      <th className="px-4 py-3 font-semibold">Amount</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {commissions.map((c) => (
                      <tr key={c.id} className="hover:bg-muted/40">
                        <td className="px-4 py-3 font-medium">{c.id}</td>
                        <td className="px-4 py-3 text-muted-foreground">{c.order_id ?? "—"}</td>
                        <td className="px-4 py-3">{c.partner_name ?? "Partner"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{c.product_name ?? "—"}</td>
                        <td className="px-4 py-3">{Number(c.rate)}%</td>
                        <td className="px-4 py-3 font-medium">{formatPKR(Number(c.amount))}</td>
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
