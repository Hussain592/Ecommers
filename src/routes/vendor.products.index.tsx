import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, PackagePlus, PackageSearch, Pencil, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { vendorNav } from "@/components/dashboard/nav-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatPKR } from "@/data/mock";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/vendor/products/")({
  head: () => ({
    meta: [
      { title: "Products — Vendor Dashboard | Dukaan.pk" },
      { name: "description", content: "Manage your product catalog, stock and status on Dukaan.pk." },
      { property: "og:title", content: "Vendor Products — Dukaan.pk" },
      { property: "og:description", content: "Add, edit and manage your store products." },
    ],
  }),
  component: VendorProducts,
});

type ProductRow = {
  id: string;
  name: string;
  image: string | null;
  price: number;
  stock: number;
  category: string;
  active: boolean;
};

function VendorProducts() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [status, setStatus] = useState("all");
  const [storeName, setStoreName] = useState("My Store");
  const [productList, setProductList] = useState<ProductRow[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
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

      const [productsRes, categoriesRes] = await Promise.all([
        supabase
          .from("products")
          .select("id, name, image, price, stock, category, active")
          .eq("vendor_id", vendor.id)
          .order("created_at", { ascending: false }),
        supabase.from("categories").select("name").eq("active", true).order("name"),
      ]);

      if (productsRes.error) {
        console.error("Unable to load products", productsRes.error);
        toast.error("Products load nahi ho sake.");
        setLoading(false);
        return;
      }

      setProductList(productsRes.data ?? []);
      setCategoryOptions((categoriesRes.data ?? []).map((c) => c.name));
      setLoading(false);
    };

    void loadProducts();
  }, []);

  const list = useMemo(
    () =>
      productList.filter(
        (p) =>
          p.name.toLowerCase().includes(q.toLowerCase()) &&
          (cat === "all" || p.category === cat) &&
          (status === "all" || (status === "active" ? p.active : !p.active)),
      ),
    [productList, q, cat, status],
  );

  const toggleActive = async (id: string, active: boolean) => {
    setBusyId(id);
    const { data, error } = await supabase.from("products").update({ active }).eq("id", id).select();
    setBusyId(null);

    if (error || !data || data.length === 0) {
      toast.error("Status update nahi ho saka.");
      return;
    }
    toast.success(active ? "Product active ho gaya." : "Product inactive ho gaya.");
    setProductList((prev) => prev.map((p) => (p.id === id ? { ...p, active } : p)));
  };

  const deleteProduct = async (id: string, name: string) => {
    setBusyId(id);
    const { data, error } = await supabase.from("products").delete().eq("id", id).select();
    setBusyId(null);

    if (error || !data || data.length === 0) {
      toast.error("Product delete nahi ho saka.");
      return;
    }
    toast.success(`"${name}" delete ho gaya.`);
    setProductList((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <DashboardShell
      brand={storeName}
      role="Vendor Account"
      title="Products"
      subtitle={`${list.length} products in your catalog`}
      nav={vendorNav}
      actions={
        <Button asChild size="sm" className="rounded-xl">
          <Link to="/vendor/products/new">
            <PackagePlus className="mr-2 h-4 w-4" /> Add New
          </Link>
        </Button>
      }
    >
      <div className="surface-card grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products..." className="h-10 rounded-xl pl-9" />
        </div>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="h-10 w-full rounded-xl sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categoryOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-10 w-full rounded-xl sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center p-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="Koi product nahi mila"
          description="Filters clear karein ya naya product add karein."
          action={
            <Button asChild className="rounded-xl">
              <Link to="/vendor/products/new">Add Product</Link>
            </Button>
          }
        />
      ) : (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-muted/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Price</th>
                  <th className="px-4 py-3 font-semibold">Stock</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={p.image ?? ""} alt={p.name} loading="lazy" width={800} height={800} className="h-11 w-11 rounded-xl bg-muted object-cover" />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                    <td className="px-4 py-3 font-medium">{formatPKR(p.price)}</td>
                    <td className="px-4 py-3">
                      <span className={p.stock === 0 ? "font-medium text-destructive" : p.stock < 10 ? "font-medium text-warning-foreground" : ""}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Switch
                        checked={p.active}
                        disabled={busyId === p.id}
                        onCheckedChange={(checked) => toggleActive(p.id, checked)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="outline" size="icon" className="h-8 w-8 rounded-lg">
                          <Link to="/vendor/products/$id/edit" params={{ id: p.id }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg text-destructive" disabled={busyId === p.id}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Product delete karein?</AlertDialogTitle>
                              <AlertDialogDescription>
                                "{p.name}" permanently remove ho jayega. Ye wapas nahi hoga.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteProduct(p.id, p.name)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}