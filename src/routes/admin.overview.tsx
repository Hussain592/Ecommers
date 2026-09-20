import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Package, ShoppingBag, Store, TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { adminNav } from "@/components/dashboard/nav-config";
import { formatPKR } from "@/data/mock";
import { supabase } from "@/lib/supabase";

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

type OrderRow = {
  id: string;
  customer_name: string;
  vendor_id: string | null;
  total: number;
  status: string;
  created_at: string;
};

type VendorRow = {
  id: string;
  name: string;
  status: string | null;
};

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function AdminOverview() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [productCount, setProductCount] = useState<number | null>(null);
  const [activeProductCount, setActiveProductCount] = useState<number | null>(null);
  const [categoryCount, setCategoryCount] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const [ordersRes, vendorsRes, productsRes, activeProductsRes, categoriesRes] = await Promise.all([
        supabase.from("orders").select("id, customer_name, vendor_id, total, status, created_at").order("created_at", { ascending: false }),
        supabase.from("vendors").select("id, name, status"),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("active", true),
        supabase.from("categories").select("id", { count: "exact", head: true }).eq("active", true),
      ]);

      if (ordersRes.data) setOrders(ordersRes.data);
      if (vendorsRes.data) setVendors(vendorsRes.data);
      if (!productsRes.error) setProductCount(productsRes.count ?? 0);
      if (!activeProductsRes.error) setActiveProductCount(activeProductsRes.count ?? 0);
      if (!categoriesRes.error) setCategoryCount(categoriesRes.count ?? 0);

      if (ordersRes.error || vendorsRes.error || productsRes.error || activeProductsRes.error || categoriesRes.error) {
        toast.error("Kuch live dashboard data load nahi ho saka. Dobara refresh karein.");
      }

      setLoading(false);
    };
    void load();
  }, []);

  const vendorNameById = new Map(vendors.map((v) => [v.id, v.name]));

  const now = new Date();
  const gmvThisMonth = orders
    .filter((o) => {
      const d = new Date(o.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, o) => sum + Number(o.total), 0);

  const pendingOrders = orders.filter((o) => o.status === "Pending").length;
  const activeVendors = vendors.filter((v) => v.status === "Active").length;
  const pendingVendors = vendors.filter((v) => v.status === "Pending").length;

  // Last 6 months sales chart
  const salesChart = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const monthSales = orders
      .filter((o) => {
        const od = new Date(o.created_at);
        return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
      })
      .reduce((sum, o) => sum + Number(o.total), 0);
    return { month: MONTH_LABELS[d.getMonth()], sales: monthSales };
  });

  // Top vendors by order count
  const orderCountByVendor = new Map<string, number>();
  orders.forEach((o) => {
    if (!o.vendor_id) return;
    orderCountByVendor.set(o.vendor_id, (orderCountByVendor.get(o.vendor_id) ?? 0) + 1);
  });
  const topVendors = [...vendors]
    .map((v) => ({ ...v, orderCount: orderCountByVendor.get(v.id) ?? 0 }))
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, 4);

  const latestOrders = orders.slice(0, 8);

  if (loading) {
    return (
      <DashboardShell brand="Dukaan.pk" role="Owner / Admin" title="Platform Overview" subtitle="Poore marketplace ki performance" nav={adminNav}>
        <div className="flex justify-center p-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell brand="Dukaan.pk" role="Owner / Admin" title="Platform Overview" subtitle="Poore marketplace ki performance" nav={adminNav}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="GMV (This Month)" value={formatPKR(gmvThisMonth)} hint={`${orders.length} total orders lifetime`} icon={TrendingUp} />
        <StatCard label="Total Orders" value={String(orders.length)} hint={`${pendingOrders} pending confirmation`} icon={ShoppingBag} tone="warning" />
        <StatCard label="Active Vendors" value={String(activeVendors)} hint={`${pendingVendors} approval pending`} icon={Store} tone="success" />
        <StatCard
          label="Listed Products"
          value={productCount === null ? "-" : String(productCount)}
          hint={
            activeProductCount === null || categoryCount === null
              ? "Live data unavailable"
              : `${activeProductCount} live across ${categoryCount} categories`
          }
          icon={Package}
        />
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
            {topVendors.length === 0 ? (
              <p className="text-sm text-muted-foreground">Abhi koi vendor nahi.</p>
            ) : (
              topVendors.map((v) => (
                <div key={v.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-muted/60 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{v.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{v.orderCount} orders</p>
                  </div>
                  <StatusBadge status={(v.status ?? "Pending") as never} />
                </div>
              ))
            )}
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
              {latestOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Abhi koi order nahi aaya.
                  </td>
                </tr>
              ) : (
                latestOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">{o.id}</td>
                    <td className="px-4 py-3">{o.customer_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{o.vendor_id ? vendorNameById.get(o.vendor_id) ?? "-" : "-"}</td>
                    <td className="px-4 py-3 font-medium">{formatPKR(Number(o.total))}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status as never} /></td>
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
