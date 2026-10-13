import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ClipboardList,
  Loader2,
  Package,
  PackageCheck,
  ShoppingBag,
  Store,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
      { title: "azadari.store" },
      {
        name: "description",
        content: "Platform-wide sales, vendors and order metrics for azadari.store owners.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin Overview — azadari.store" },
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

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

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

      const [ordersRes, vendorsRes, productsRes, activeProductsRes, categoriesRes] =
        await Promise.all([
          supabase
            .from("orders")
            .select("id, customer_name, vendor_id, total, status, created_at")
            .order("created_at", { ascending: false }),
          supabase.from("vendors").select("id, name, status"),
          supabase.from("products").select("id", { count: "exact", head: true }),
          supabase.from("products").select("id", { count: "exact", head: true }).eq("active", true),
          supabase
            .from("categories")
            .select("id", { count: "exact", head: true })
            .eq("active", true),
        ]);

      if (ordersRes.data) setOrders(ordersRes.data);
      if (vendorsRes.data) setVendors(vendorsRes.data);
      if (!productsRes.error) setProductCount(productsRes.count ?? 0);
      if (!activeProductsRes.error) setActiveProductCount(activeProductsRes.count ?? 0);
      if (!categoriesRes.error) setCategoryCount(categoriesRes.count ?? 0);

      if (
        ordersRes.error ||
        vendorsRes.error ||
        productsRes.error ||
        activeProductsRes.error ||
        categoriesRes.error
      ) {
        toast.error("Some dashboard data couldn't load. Refresh the page to try again.");
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
      <DashboardShell
        brand="azadari.store"
        role="Owner / Admin"
        title="Platform Overview"
        subtitle="Performance across the whole marketplace"
        nav={adminNav}
      >
        <div
          className="flex min-h-40 flex-col items-center justify-center gap-3 p-10"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      brand="azadari.store"
      role="Owner / Admin"
      title="Platform Overview"
      subtitle="Performance across the whole marketplace"
      nav={adminNav}
    >
      <section aria-label="Marketplace summary">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9a7927]">
              At a glance
            </p>
            <h2 className="mt-1 text-lg font-bold text-[#102d24]">Marketplace overview</h2>
          </div>
          <p className="text-xs text-muted-foreground">Updated from live marketplace data</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="GMV (This Month)"
            value={formatPKR(gmvThisMonth)}
            hint={`${orders.length} total orders lifetime`}
            icon={TrendingUp}
          />
          <StatCard
            label="Total Orders"
            value={String(orders.length)}
            hint={`${pendingOrders} pending confirmation`}
            icon={ShoppingBag}
            tone="warning"
          />
          <StatCard
            label="Active Vendors"
            value={String(activeVendors)}
            hint={`${pendingVendors} approval pending`}
            icon={Store}
            tone="success"
          />
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
      </section>

      <section aria-labelledby="admin-actions-heading">
        <div className="mb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="admin-actions-heading" className="text-base font-bold">
              Needs your attention
            </h2>
            <p className="text-xs text-muted-foreground">
              Review important work without searching through menus.
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Link
            to="/admin/orders"
            className="surface-card group flex min-h-28 items-center justify-between gap-4 border-l-4 border-l-[#c9a24b] p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary-soft/30 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#f7efd9] text-[#70591f]">
                <ClipboardList aria-hidden="true" className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">Review orders</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {pendingOrders} waiting for confirmation
                </span>
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              {pendingOrders > 0 && (
                <span
                  className="rounded-full bg-[#f7efd9] px-2 py-1 text-xs font-bold text-[#70591f]"
                  aria-label={`${pendingOrders} pending orders`}
                >
                  {pendingOrders}
                </span>
              )}
              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1"
              />
            </span>
          </Link>
          <Link
            to="/admin/vendors"
            className="surface-card group flex min-h-28 items-center justify-between gap-4 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary-soft/30 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e8f1eb] text-[#0b513b]">
                <Store aria-hidden="true" className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">Approve vendors</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {pendingVendors} awaiting approval
                </span>
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              {pendingVendors > 0 && (
                <span
                  className="rounded-full bg-[#e8f1eb] px-2 py-1 text-xs font-bold text-[#0b513b]"
                  aria-label={`${pendingVendors} pending vendor applications`}
                >
                  {pendingVendors}
                </span>
              )}
              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1"
              />
            </span>
          </Link>
          <Link
            to="/admin/products"
            className="surface-card group flex min-h-28 items-center justify-between gap-4 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary-soft/30 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e8f1eb] text-[#0b513b]">
                <PackageCheck aria-hidden="true" className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">Review products</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  Manage visibility and featured listings
                </span>
              </span>
            </span>
            <ArrowRight
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="surface-card p-5" aria-labelledby="sales-chart-heading">
          <h2 id="sales-chart-heading" className="font-bold">
            Marketplace Sales
          </h2>
          <p className="text-xs text-muted-foreground">Last 6 months (PKR, all vendors)</p>
          <div
            className="mt-4 h-64 w-full"
            role="img"
            aria-label={`Marketplace sales for the last six months in Pakistani rupees: ${salesChart.map(({ month, sales }) => `${month}, ${formatPKR(sales)}`).join("; ")}`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesChart}>
                <defs>
                  <linearGradient id="adminFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={(value: number) => formatPKR(value)}
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value) => formatPKR(Number(value))}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fill="url(#adminFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="surface-card p-5" aria-labelledby="top-vendors-heading">
          <h2 id="top-vendors-heading" className="font-bold">
            Top Vendors
          </h2>
          <ol className="mt-4 space-y-3" aria-label="Vendors ranked by order count">
            {topVendors.length === 0 ? (
              <li className="rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
                No vendors yet.
              </li>
            ) : (
              topVendors.map((v, index) => (
                <li
                  key={v.id}
                  className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-muted/60 p-3"
                >
                  <span
                    aria-hidden="true"
                    className="grid h-8 w-8 place-items-center rounded-full bg-[#f7efd9] text-xs font-bold text-[#70591f]"
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{v.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{v.orderCount} orders</p>
                  </div>
                  <StatusBadge status={(v.status ?? "Pending") as never} />
                </li>
              ))
            )}
          </ol>
        </section>
      </div>

      <section className="surface-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
          <h2 className="font-bold">Latest Orders (All Vendors)</h2>
          <Link
            to="/admin/orders"
            className="rounded-sm text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            View all orders
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <caption className="sr-only">
              Latest marketplace orders with customer, vendor, total and current status
            </caption>
            <thead className="bg-muted/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Order
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Customer
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Vendor
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Total
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {latestOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No orders yet.
                  </td>
                </tr>
              ) : (
                latestOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">{o.id}</td>
                    <td className="px-4 py-3">{o.customer_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {o.vendor_id ? (vendorNameById.get(o.vendor_id) ?? "-") : "-"}
                    </td>
                    <td className="px-4 py-3 font-medium">{formatPKR(Number(o.total))}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status as never} />
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
