import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, PackagePlus, PackageSearch, Pencil, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { vendorNav } from "@/components/dashboard/nav-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { formatPKR, productImageFallback, productImageSource } from "@/data/mock";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { PRODUCT_STATE_HELP, PRODUCT_STATE_LABEL, productState } from "@/lib/product-status";

export const Route = createFileRoute("/vendor/products/")({
  head: () => ({
    meta: [
      { title: "azadari.store" },
      {
        name: "description",
        content: "Manage your product catalog, stock and status on azadari.store.",
      },
      { property: "og:title", content: "Vendor Products — azadari.store" },
      { property: "og:description", content: "Add, edit and manage your store products." },
    ],
  }),
  component: VendorProducts,
});

const LOW_STOCK = 10;

type ProductRow = {
  id: string;
  name: string;
  image: string | null;
  price: number;
  stock: number;
  category: string;
  active: boolean;
  approval_status: string | null;
  rejection_reason: string | null;
};

function StockLabel({ stock }: { stock: number }) {
  if (stock === 0)
    return (
      <span className="inline-flex rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
        Out of stock
      </span>
    );
  if (stock < LOW_STOCK)
    return (
      <span className="inline-flex rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning-foreground">
        Low · {stock} left
      </span>
    );
  return <span className="tabular-nums">{stock} in stock</span>;
}

function VendorProducts() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [status, setStatus] = useState("all");
  const [storeName, setStoreName] = useState("My Store");
  const [productList, setProductList] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        setLoading(false);
        return;
      }

      const { data: vendor } = await supabase
        .from("vendors")
        .select("id, name")
        .eq("owner_id", authData.user.id)
        .maybeSingle();
      if (!vendor) {
        setLoading(false);
        return;
      }
      setStoreName(vendor.name);

      const { data, error } = await supabase
        .from("products")
        .select(
          "id, name, image, price, stock, category, active, approval_status, rejection_reason",
        )
        .eq("vendor_id", vendor.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Unable to load products", error);
        setLoadError(true);
      } else {
        setProductList(data ?? []);
      }
      setLoading(false);
    };

    void loadProducts();
  }, []);

  // Only offer categories the vendor actually uses, so no filter ever returns an empty list by surprise.
  const categoryOptions = useMemo(
    () => [...new Set(productList.map((p) => p.category).filter(Boolean))].sort(),
    [productList],
  );

  const summary = useMemo(
    () => ({
      live: productList.filter((p) => productState(p) === "live").length,
      pending: productList.filter((p) => productState(p) === "pending").length,
      attention: productList.filter((p) => ["rejected", "hidden"].includes(productState(p))).length,
      low: productList.filter((p) => p.stock < LOW_STOCK).length,
    }),
    [productList],
  );

  const query = q.trim().toLowerCase();
  const list = useMemo(
    () =>
      productList.filter(
        (p) =>
          (!query || p.name.toLowerCase().includes(query) || p.id.toLowerCase().includes(query)) &&
          (cat === "all" || p.category === cat) &&
          (status === "all" ||
            (status === "live" && productState(p) === "live") ||
            (status === "pending" && productState(p) === "pending") ||
            (status === "attention" && ["rejected", "hidden"].includes(productState(p))) ||
            (status === "low" && p.stock < LOW_STOCK)),
      ),
    [productList, query, cat, status],
  );

  const filtersActive = query !== "" || cat !== "all" || status !== "all";

  const clearFilters = () => {
    setQ("");
    setCat("all");
    setStatus("all");
  };

  const deleteProduct = async (product: ProductRow) => {
    setBusyId(product.id);
    const { data, error } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id)
      .select("id");
    setBusyId(null);

    if (error || !data || data.length === 0) {
      toast.error("Couldn't delete the product. Please try again.");
      return;
    }
    toast.success(`"${product.name}" deleted.`);
    setProductList((prev) => prev.filter((p) => p.id !== product.id));
  };

  return (
    <DashboardShell
      brand={storeName}
      role="Vendor Account"
      title="Products"
      subtitle={`${productList.length} ${productList.length === 1 ? "product" : "products"} in your catalog`}
      nav={vendorNav}
      actions={
        <Button asChild size="sm" className="rounded-xl">
          <Link to="/vendor/products/new">
            <PackagePlus aria-hidden="true" className="mr-2 h-4 w-4" /> Add product
          </Link>
        </Button>
      }
    >
      <section className="surface-card grid gap-4 p-4 sm:p-5">
        <div className="flex flex-wrap gap-x-6 gap-y-2" role="group" aria-label="Quick filters">
          {[
            { label: "Live", value: summary.live, tone: "text-[#0b513b]", filter: "live" },
            {
              label: "Waiting for approval",
              value: summary.pending,
              tone: "text-[#a8721a]",
              filter: "pending",
            },
            {
              label: "Needs attention",
              value: summary.attention,
              tone: "text-[#a61f2b]",
              filter: "attention",
            },
            { label: "Low stock", value: summary.low, tone: "text-[#9a7927]", filter: "low" },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setStatus(status === item.filter ? "all" : item.filter)}
              aria-pressed={status === item.filter}
              className={cn(
                "rounded-xl px-2 py-1 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                status === item.filter && "bg-muted",
              )}
            >
              <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                {item.label}
              </span>
              <span className={cn("mt-1 block font-display text-2xl font-extrabold", item.tone)}>
                {item.value}
              </span>
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or product ID"
              aria-label="Search products"
              className="h-10 rounded-xl pl-9"
            />
          </div>
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger
              className="h-10 w-full rounded-xl sm:w-44"
              aria-label="Filter by category"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categoryOptions.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-10 w-full rounded-xl sm:w-36" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All products</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="pending">Waiting for approval</SelectItem>
              <SelectItem value="attention">Rejected or hidden</SelectItem>
              <SelectItem value="low">Low stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center p-10" role="status" aria-label="Loading products">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : loadError ? (
        <EmptyState
          icon={PackageSearch}
          title="Couldn't load your products"
          description="Check your connection and refresh the page."
          action={
            <Button className="rounded-xl" onClick={() => window.location.reload()}>
              Refresh page
            </Button>
          }
        />
      ) : productList.length === 0 ? (
        <EmptyState
          icon={PackagePlus}
          title="Add your first product"
          description="Products you add are reviewed by the admin before they go live."
          action={
            <Button asChild className="rounded-xl">
              <Link to="/vendor/products/new">Add product</Link>
            </Button>
          }
        />
      ) : list.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="No products match your filters"
          description="Try a different search, or clear the filters to see everything."
          action={
            filtersActive && (
              <Button variant="outline" className="rounded-xl" onClick={clearFilters}>
                Clear filters
              </Button>
            )
          }
        />
      ) : (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-muted/70 text-left text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
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
                {list.map((p) => {
                  const busy = busyId === p.id;
                  return (
                    <tr key={p.id} className="hover:bg-muted/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-white">
                            <img
                              src={productImageSource(p.name, p.image)}
                              alt=""
                              loading="lazy"
                              width={96}
                              height={96}
                              onError={(event) => {
                                const image = event.currentTarget;
                                if (image.dataset["fallbackTried"] === "1") {
                                  image.onerror = null;
                                  image.src = "/favicon.ico";
                                  return;
                                }
                                image.dataset["fallbackTried"] = "1";
                                image.src = productImageFallback(p.name, p.image);
                              }}
                              className="h-full w-full object-contain p-1"
                            />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{p.name}</p>
                            <p className="text-[11px] text-muted-foreground">{p.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {p.category ? (
                          <span className="inline-flex rounded-full border border-[#c9a24b]/25 bg-[#f7efd9] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#70591f]">
                            {p.category}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#0b513b]">
                        {formatPKR(p.price)}
                      </td>
                      <td className="px-4 py-3">
                        <StockLabel stock={p.stock} />
                      </td>
                      <td className="px-4 py-3">
                        {/* Status is set by the admin; vendors only see it. */}
                        <div className="flex max-w-60 flex-col items-start gap-1">
                          <StatusBadge status={PRODUCT_STATE_LABEL[productState(p)]} />
                          <span className="text-[11px] leading-4 text-muted-foreground">
                            {productState(p) === "rejected" && p.rejection_reason
                              ? `Reason: ${p.rejection_reason}`
                              : PRODUCT_STATE_HELP[productState(p)]}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button asChild variant="outline" size="sm" className="rounded-lg">
                            <Link
                              to="/vendor/products/$id/edit"
                              params={{ id: p.id }}
                              aria-label={
                                productState(p) === "rejected"
                                  ? `Fix and resubmit ${p.name}`
                                  : `Edit ${p.name}`
                              }
                            >
                              <Pencil aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />
                              {productState(p) === "rejected" ? "Fix and resubmit" : "Edit"}
                            </Link>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
                                disabled={busy}
                                aria-label={`Delete ${p.name}`}
                                title="Delete"
                              >
                                <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete this product?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  "{p.name}" will be permanently removed from your store. This can't
                                  be undone. To pause sales for now, set the stock to 0 instead.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Keep product</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => void deleteProduct(p)}
                                >
                                  Delete product
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
