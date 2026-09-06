import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Package, PackagePlus, ShoppingBag, TrendingUp, Wallet } from "lucide-react";
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
import { formatPKR } from "@/data/mock";
import { supabase } from "@/lib/supabase";

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

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type OrderRow = { id: string; customer_name: string; total: number; status: string; created_at: string };

function VendorDashboard() {
  const [loading, setLoading] = useState(true);
  const [storeName, setStoreName] = useState("My Store");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [pendingPayout, setPendingPayout] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        setLoading(false);
        return;
      }

      const { data: vendor } = await supabase.from("vendors").select("id, name").eq("owner_id", authData.user.id).maybeSingle();
      if (!vendor) {
        setLoading(false);
        return;
      }
      setStoreName(vendor.name);

      const [ordersRes, productsRes, payoutsRes] = await Promise.all([
        supabase.from("orders").select("id, customer_name, total, status, created_at").eq("vendor_id", vendor.id).order("created_at", { ascending: false }),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("vendor_id", vendor.id).eq("active", true),
        supabase.from("payouts").select("amount").eq("recipient_name", vendor.name).eq("status", "Pending"),
      ]);

      setOrders(ordersRes.data ?? []);
      setProductCount(productsRes.count ?? 0);
      setPendingPayout((payoutsRes.data ?? []).reduce((s, p) => s + Number(p.amount), 0));
      setLoading(false);
    };
    void load();
  }, []);

  const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
  const pendingOrders = orders.filter((o) => o.status === "Pending").length;

  const now = new Date();
  const salesChart = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const monthSales = orders
      .filter((o) => {
        const od = new Date(o.created_at);
        return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
      })
      .reduce((s, o) => s + Number(o.total), 0);
    return { month: MONTH_LABELS[d.getMonth()], sales: monthSales };
  });

  if (loading) {
    return (
      <DashboardShell brand={storeName} role="Vendor Account" title="Dashboard Overview" subtitle="Aaj ki performance ek nazar mein" nav={vendorNav}>
        <div className="flex justify-center p-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      brand={storeName}
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
        <StatCard label="Total Revenue" value={formatPKR(totalRevenue)} hint={`${orders.length} total orders`} icon={TrendingUp} />
        <StatCard label="Total Orders" value={String(orders.length)} hint={`${pendingOrders} pending`} icon={ShoppingBag} tone="warning" />
        <StatCard label="Active Products" value={String(productCount)} icon={Package} />
        <StatCard label="Pending Payout" value={formatPKR(pendingPayout)} icon={Wallet} tone="success" />
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
            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Abhi koi order nahi aaya.</p>
            ) : (
              orders.slice(0, 5).map((o) => (
                <div key={o.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-muted/60 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{o.customer_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{o.id} · {formatPKR(Number(o.total))}</p>
                  </div>
                  <StatusBadge status={o.status as never} />
                </div>
              ))
            )}
          </div>
          <Button asChild variant="outline" className="mt-4 w-full rounded-xl">
            <Link to="/vendor/orders">View all orders</Link>
          </Button>
        </section>
      </div>
    </DashboardShell>
  );
}