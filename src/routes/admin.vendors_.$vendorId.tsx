import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Ban, Loader2, Mail, MapPin, Package, Phone, ShoppingBag, Store, Truck, Wallet } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { adminNav } from "@/components/dashboard/nav-config";
import { Button } from "@/components/ui/button";
import { formatPKR } from "@/data/mock";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/vendors_/$vendorId")({
  head: () => ({
    meta: [
      { title: "Vendor Details — Dukaan.pk Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminVendorDetail,
});

type VendorInfo = {
  id: string;
  name: string;
  contact: string | null;
  email: string | null;
  address: string | null;
  status: string | null;
  created_at: string;
};

type ProductRow = {
  id: string;
  name: string;
  image: string | null;
  price: number;
  stock: number;
  active: boolean;
};

type OrderRow = {
  id: string;
  total: number;
  status: string;
};

function AdminVendorDetail() {
  const { vendorId } = Route.useParams();
  const [vendor, setVendor] = useState<VendorInfo | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const [vendorRes, productsRes, ordersRes] = await Promise.all([
      supabase.from("vendors").select("id, name, contact, email, address, status, created_at").eq("id", vendorId).maybeSingle(),
      supabase.from("products").select("id, name, image, price, stock, active").eq("vendor_id", vendorId).order("created_at", { ascending: false }),
      supabase.from("orders").select("id, total, status").eq("vendor_id", vendorId),
    ]);

    if (vendorRes.data) setVendor(vendorRes.data);
    setProducts(productsRes.data ?? []);
    setOrders(ordersRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId]);

  const updateStatus = async (status: "Active" | "Suspended") => {
    setBusy(true);
    const { data, error } = await supabase.from("vendors").update({ status }).eq("id", vendorId).select();
    setBusy(false);

    if (error || !data || data.length === 0) {
      toast.error("Status update nahi ho saka.");
      return;
    }

    toast.success(status === "Active" ? "Vendor active ho gaya." : "Vendor suspend ho gaya.");
    setVendor((prev) => (prev ? { ...prev, status } : prev));
  };

  const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
  const deliveredOrders = orders.filter((o) => o.status === "Delivered").length;
  const activeProducts = products.filter((p) => p.active).length;

  if (loading) {
    return (
      <DashboardShell brand="Dukaan.pk" role="Owner / Admin" title="Vendor Details" subtitle="" nav={adminNav}>
        <div className="flex justify-center p-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardShell>
    );
  }

  if (!vendor) {
    return (
      <DashboardShell brand="Dukaan.pk" role="Owner / Admin" title="Vendor Details" subtitle="" nav={adminNav}>
        <p className="text-sm text-muted-foreground">Vendor nahi mila.</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      brand="Dukaan.pk"
      role="Owner / Admin"
      title={vendor.name}
      subtitle="Vendor ki poori details"
      nav={adminNav}
      actions={
        <Link to="/admin/vendors" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Vendors list
        </Link>
      }
    >
      <div className="surface-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
              <Store className="h-7 w-7" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">{vendor.name}</h2>
                <StatusBadge status={(vendor.status ?? "Pending") as never} />
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {vendor.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {vendor.email}</span>}
                {vendor.contact && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {vendor.contact}</span>}
                {vendor.address && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {vendor.address}</span>}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Joined: {new Date(vendor.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl text-success" disabled={busy || vendor.status === "Active"} onClick={() => updateStatus("Active")}>
              <Check className="mr-1.5 h-4 w-4" /> Approve
            </Button>
            <Button variant="outline" className="rounded-xl text-destructive" disabled={busy || vendor.status === "Suspended"} onClick={() => updateStatus("Suspended")}>
              <Ban className="mr-1.5 h-4 w-4" /> Suspend
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Total Products" value={String(products.length)} hint={`${activeProducts} active`} icon={Package} />
        <StatCard label="Total Orders" value={String(orders.length)} icon={ShoppingBag} />
        <StatCard label="Delivered Orders" value={String(deliveredOrders)} icon={Truck} tone="success" />
        <StatCard label="Total Revenue" value={formatPKR(totalRevenue)} icon={Wallet} tone="warning" />
      </div>

      <section className="surface-card overflow-hidden">
        <h2 className="px-5 pt-5 font-bold">Products ({products.length})</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="bg-muted/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Stock</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Koi product nahi.</td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={p.image ?? ""} alt={p.name} className="h-10 w-10 rounded-lg bg-muted object-cover" />
                        <span className="font-medium">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{formatPKR(p.price)}</td>
                    <td className="px-4 py-3">{p.stock}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.active ? "Active" : "Inactive"} /></td>
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
