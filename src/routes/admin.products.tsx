import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Eye, EyeOff, Loader2, Search, Star, XCircle } from "lucide-react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { adminNav } from "@/components/dashboard/nav-config";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ProductPreviewDialog } from "@/components/dashboard/ProductPreviewDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import {
  PRODUCT_STATE_LABEL,
  productState,
  type ApprovalStatus,
  type ProductState,
} from "@/lib/product-status";

import { formatPKR, productImageFallback, productImageSource } from "@/data/mock";

export const Route = createFileRoute("/admin/products")({
  head: () => ({
    meta: [{ title: "azadari.store" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminProducts,
});

type ProductRow = {
  id: string;
  name: string;
  image: string | null;
  category: string | null;
  price: number;
  stock: number;
  active: boolean;
  featured: boolean;
  sales_count: number;
  approval_status: ApprovalStatus;
  rejection_reason: string | null;
  created_at: string;
  vendor: { name: string } | null;
};

type View = "pending" | "live" | "hidden" | "rejected" | "featured" | "all";

const PAGE_SIZE = 50;

const REJECT_REASONS = [
  "Photos are unclear or don't show the product.",
  "Name or description is incomplete.",
  "Price looks wrong.",
  "Wrong category.",
  "This product isn't allowed on azadari.store.",
];

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });

function AdminProducts() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [view, setView] = useState<View>("all");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [rejecting, setRejecting] = useState<ProductRow | null>(null);
  const [previewing, setPreviewing] = useState<ProductRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const loadProducts = async () => {
    setLoading(true);
    setLoadError(false);

    // The database returns at most 1,000 rows per request, so read the catalog page by page.
    type Row = Omit<ProductRow, "vendor" | "price" | "stock" | "sales_count"> & {
      price: number | string;
      stock: number | null;
      sales_count: number | null;
      vendors: { name: string } | { name: string }[] | null;
    };
    const PAGE = 1000;
    let data: Row[] = [];
    for (let from = 0; ; from += PAGE) {
      const page = await supabase
        .from("products")
        .select(
          "id, name, image, category, price, stock, active, featured, sales_count, approval_status, rejection_reason, created_at, vendors(name)",
        )
        .order("created_at", { ascending: false })
        .order("id", { ascending: true })
        .range(from, from + PAGE - 1);
      if (page.error) {
        console.error("Unable to load products", page.error);
        setLoadError(true);
        setLoading(false);
        return;
      }
      data = data.concat((page.data ?? []) as Row[]);
      if ((page.data ?? []).length < PAGE) break;
    }

    const rows: ProductRow[] = data.map(({ vendors, ...product }) => ({
      ...product,
      price: Number(product.price),
      stock: Number(product.stock ?? 0),
      sales_count: Number(product.sales_count ?? 0),
      // A product belongs to one vendor, so this usually comes back as an object.
      vendor: Array.isArray(vendors) ? (vendors[0] ?? null) : (vendors ?? null),
    }));

    setProducts(rows);
    // Open on the approval queue whenever something is waiting.
    setView(rows.some((product) => product.approval_status === "pending") ? "pending" : "all");
    setLoading(false);
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  const counts = useMemo(() => {
    const result: Record<View, number> = {
      pending: 0,
      live: 0,
      hidden: 0,
      rejected: 0,
      featured: 0,
      all: products.length,
    };
    for (const product of products) {
      result[productState(product)] += 1;
      if (product.featured) result.featured += 1;
    }
    return result;
  }, [products]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return products.filter(
      (product) =>
        (view === "all" ||
          (view === "featured" ? product.featured : productState(product) === view)) &&
        (!search ||
          `${product.name} ${product.category ?? ""} ${product.vendor?.name ?? ""} ${product.id}`
            .toLowerCase()
            .includes(search)),
    );
  }, [products, query, view]);

  useEffect(() => {
    setLimit(PAGE_SIZE);
  }, [query, view]);

  const updateProduct = async (
    product: ProductRow,
    changes: Partial<
      Pick<ProductRow, "active" | "featured" | "approval_status" | "rejection_reason">
    > & {
      reviewed_at?: string;
    },
    success: string,
  ) => {
    setBusyId(product.id);
    const { data, error } = await supabase
      .from("products")
      .update(changes)
      .eq("id", product.id)
      .select("id");
    setBusyId(null);

    if (error || !data || data.length === 0) {
      console.error("Unable to update product", error);
      toast.error("Couldn't update the product. Please try again.");
      return false;
    }

    const { reviewed_at: _ignored, ...local } = changes;
    setProducts((current) =>
      current.map((item) => (item.id === product.id ? { ...item, ...local } : item)),
    );
    toast.success(success);
    return true;
  };

  const approve = (product: ProductRow) =>
    updateProduct(
      product,
      {
        approval_status: "approved",
        active: true,
        rejection_reason: null,
        reviewed_at: new Date().toISOString(),
      },
      `"${product.name}" approved. It is now live.`,
    );

  const reject = async () => {
    if (!rejecting || !rejectReason.trim()) return;
    const ok = await updateProduct(
      rejecting,
      {
        approval_status: "rejected",
        active: false,
        featured: false,
        rejection_reason: rejectReason.trim(),
        reviewed_at: new Date().toISOString(),
      },
      `"${rejecting.name}" rejected. The vendor can see why and fix it.`,
    );
    if (ok) {
      setRejecting(null);
      setRejectReason("");
    }
  };

  const tabs: Array<{ key: View; label: string; tone: string }> = [
    { key: "pending", label: "Waiting for approval", tone: "text-[#a8721a]" },
    { key: "live", label: "Live", tone: "text-[#0b513b]" },
    { key: "hidden", label: "Hidden", tone: "text-[#102d24]" },
    { key: "rejected", label: "Rejected", tone: "text-[#a61f2b]" },
    { key: "featured", label: "Featured", tone: "text-[#9a7927]" },
    { key: "all", label: "All", tone: "text-[#102d24]" },
  ];

  return (
    <DashboardShell
      brand="azadari.store"
      role="Owner / Admin"
      title="Product Review"
      subtitle={
        counts.pending > 0
          ? `${counts.pending} ${counts.pending === 1 ? "product is" : "products are"} waiting for your approval`
          : "Approve, hide or feature products"
      }
      nav={adminNav}
    >
      <section className="rounded-2xl border border-[#ded5bd] bg-[#fffdf7] p-4 shadow-[0_4px_16px_rgba(8,43,33,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Show products">
            {tabs.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setView(item.key)}
                aria-pressed={view === item.key}
                className={`rounded-xl px-3 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b] ${
                  view === item.key ? "bg-[#f3ead3] ring-1 ring-[#c9a24b]/40" : "hover:bg-[#f7f3e8]"
                }`}
              >
                <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#89938e]">
                  {item.label}
                </span>
                <span className={`mt-1 block text-xl font-extrabold tabular-nums ${item.tone}`}>
                  {counts[item.key]}
                </span>
              </button>
            ))}
          </div>

          <div className="relative w-full max-w-sm">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b968f]"
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search product, ID or vendor..."
              aria-label="Search products"
              className="h-10 rounded-xl border-[#d8cdae] bg-white pl-9 focus-visible:ring-[#c9a24b]"
            />
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex min-h-65 items-center justify-center" role="status">
          <div className="text-center">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#0b513b]" />
            <p className="mt-3 text-sm text-[#6f7d75]">Loading products...</p>
          </div>
        </div>
      ) : loadError ? (
        <div
          className="rounded-2xl border border-[#ded5bd] bg-[#fffdf7] p-10 text-center"
          role="alert"
        >
          <p className="text-sm font-semibold text-[#102d24]">Couldn't load products.</p>
          <p className="mt-1 text-xs text-[#748078]">
            If you just updated the website, make sure the latest database migration has been run.
          </p>
          <Button className="mt-4 rounded-xl" onClick={() => void loadProducts()}>
            Try again
          </Button>
        </div>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-[#ded5bd] bg-[#fffdf7] shadow-[0_4px_16px_rgba(8,43,33,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-245 text-sm">
              <thead className="border-b border-[#e9e1cf] bg-[#f7f3e8] text-left text-[11px] uppercase tracking-widest text-[#6f7d75]">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price / Stock</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#eee6d2]">
                {filtered.slice(0, limit).map((product) => {
                  const state: ProductState = productState(product);
                  const busy = busyId === product.id;
                  return (
                    <tr key={product.id} className="transition-colors hover:bg-[#fbf8ef]">
                      <td className="px-4 py-3">
                        <div className="flex min-w-65 items-center gap-3">
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[#e2d8bf] bg-[#f7f3e8]">
                            <img
                              src={productImageSource(product.name, product.image)}
                              alt=""
                              width={112}
                              height={112}
                              loading="lazy"
                              decoding="async"
                              onError={(event) => {
                                const image = event.currentTarget;
                                if (image.dataset["fallbackTried"] === "1") {
                                  image.onerror = null;
                                  image.src = "/favicon.ico";
                                  return;
                                }
                                image.dataset["fallbackTried"] = "1";
                                image.src = productImageFallback(product.name, product.image);
                              }}
                              className="h-full w-full object-contain p-1.5"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="max-w-65 truncate font-semibold text-[#102d24]">
                              {product.name}
                            </p>
                            <p className="mt-1 max-w-65 truncate text-[11px] text-[#89938e]">
                              Added {formatDate(product.created_at)}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-[#44564d]">
                        {product.vendor?.name ?? (
                          <span className="text-[#89938e]">azadari.store</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full border border-[#c9a24b]/25 bg-[#f7efd9] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#70591f]">
                          {product.category ?? "Uncategorized"}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#0b513b]">{formatPKR(product.price)}</p>
                        <p className="mt-1 text-xs text-[#748078]">
                          {product.stock} in stock · {product.sales_count} sold
                        </p>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-col items-start gap-1">
                          <StatusBadge status={PRODUCT_STATE_LABEL[state]} />
                          {product.featured && state === "live" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#9a7927]">
                              <Star aria-hidden="true" className="h-3 w-3 fill-current" />
                              Featured
                            </span>
                          )}
                          {state === "rejected" && product.rejection_reason && (
                            <span className="max-w-55 text-[11px] text-[#86545a]">
                              {product.rejection_reason}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {busy && (
                            <Loader2
                              aria-label="Saving"
                              className="h-4 w-4 animate-spin text-[#0b513b]"
                            />
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPreviewing(product)}
                            aria-label={`Preview ${product.name}`}
                            className="rounded-xl border-[#d8cdae] bg-white text-[#0b513b] hover:bg-[#f7efd9]"
                          >
                            <Eye aria-hidden="true" className="mr-1.5 h-4 w-4" />
                            Preview
                          </Button>

                          {(state === "pending" || state === "rejected") && (
                            <Button
                              size="sm"
                              disabled={busy}
                              onClick={() => void approve(product)}
                              className="rounded-xl bg-[#082b21] text-[#fffaf0] hover:bg-[#0d3d2f]"
                            >
                              <CheckCircle2 aria-hidden="true" className="mr-1.5 h-4 w-4" />
                              Approve
                            </Button>
                          )}

                          {state === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() => {
                                setRejecting(product);
                                setRejectReason("");
                              }}
                              className="rounded-xl border-[#e1d8c5] bg-white text-[#a61f2b] hover:bg-[#fff5f6] hover:text-[#a61f2b]"
                            >
                              <XCircle aria-hidden="true" className="mr-1.5 h-4 w-4" />
                              Reject
                            </Button>
                          )}

                          {state === "live" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy}
                                aria-pressed={product.featured}
                                onClick={() =>
                                  void updateProduct(
                                    product,
                                    { featured: !product.featured },
                                    product.featured
                                      ? "Removed from the homepage."
                                      : "Now featured on the homepage.",
                                  )
                                }
                                className="rounded-xl border-[#d8cdae] bg-white text-[#0b513b] hover:bg-[#f7efd9]"
                              >
                                <Star
                                  aria-hidden="true"
                                  className={`mr-1.5 h-4 w-4 ${product.featured ? "fill-[#d8b85c] text-[#d8b85c]" : ""}`}
                                />
                                {product.featured ? "Unfeature" : "Feature"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy}
                                onClick={() =>
                                  void updateProduct(
                                    product,
                                    { active: false, featured: false },
                                    `"${product.name}" is hidden from the store.`,
                                  )
                                }
                                className="rounded-xl border-[#e1d8c5] bg-white text-[#6a5950] hover:border-[#efc9cc] hover:bg-[#fff5f6] hover:text-[#a61f2b]"
                              >
                                <EyeOff aria-hidden="true" className="mr-1.5 h-4 w-4" />
                                Hide
                              </Button>
                            </>
                          )}

                          {state === "hidden" && (
                            <Button
                              size="sm"
                              disabled={busy}
                              onClick={() =>
                                void updateProduct(
                                  product,
                                  { active: true },
                                  `"${product.name}" is live again.`,
                                )
                              }
                              className="rounded-xl bg-[#082b21] text-[#fffaf0] hover:bg-[#0d3d2f]"
                            >
                              <Eye aria-hidden="true" className="mr-1.5 h-4 w-4" />
                              Show
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered.length > limit && (
            <div className="flex flex-col items-center gap-2 border-t border-[#eee6d2] p-4 text-xs text-[#748078] sm:flex-row sm:justify-between">
              <span>
                Showing {limit} of {filtered.length}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl border-[#d8cdae] bg-white text-[#0b513b] hover:bg-[#f7efd9]"
                onClick={() => setLimit((current) => current + PAGE_SIZE)}
              >
                Show {Math.min(PAGE_SIZE, filtered.length - limit)} more
              </Button>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="p-10 text-center">
              <p className="text-sm font-semibold text-[#102d24]">
                {view === "pending" && !query.trim()
                  ? "Nothing waiting for approval."
                  : "No products found."}
              </p>
              <p className="mt-1 text-xs text-[#748078]">
                {view === "pending" && !query.trim()
                  ? "New products from vendors and partners will appear here."
                  : "Try a different search term or filter."}
              </p>
            </div>
          )}
        </section>
      )}

      <p className="flex items-center gap-2 text-xs text-[#748078]">
        <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-[#0b6b4c]" />
        Customers only see products marked Live.
      </p>

      <ProductPreviewDialog
        productId={previewing?.id ?? null}
        onClose={() => setPreviewing(null)}
        actions={
          previewing &&
          (productState(previewing) === "pending" || productState(previewing) === "rejected") ? (
            <>
              {productState(previewing) === "pending" && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setRejecting(previewing);
                    setRejectReason("");
                    setPreviewing(null);
                  }}
                  className="rounded-xl text-[#a61f2b]"
                >
                  <XCircle aria-hidden="true" className="mr-1.5 h-4 w-4" />
                  Reject
                </Button>
              )}
              <Button
                disabled={busyId === previewing.id}
                onClick={() => {
                  const target = previewing;
                  setPreviewing(null);
                  void approve(target);
                }}
                className="rounded-xl bg-[#082b21] text-[#fffaf0] hover:bg-[#0d3d2f]"
              >
                <CheckCircle2 aria-hidden="true" className="mr-1.5 h-4 w-4" />
                Approve
              </Button>
            </>
          ) : undefined
        }
      />

      <Dialog
        open={rejecting !== null}
        onOpenChange={(open) => {
          if (!open) setRejecting(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject "{rejecting?.name}"?</DialogTitle>
            <DialogDescription>
              The vendor will see this reason, fix the product and send it back for review.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {REJECT_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setRejectReason(reason)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    rejectReason === reason
                      ? "border-[#0b513b] bg-[#e8f1eb] text-[#0b513b]"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reject-reason">Reason for the vendor</Label>
              <Textarea
                id="reject-reason"
                rows={3}
                maxLength={300}
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="Pick a reason above or write your own."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>
              Cancel
            </Button>
            <Button
              disabled={!rejectReason.trim() || busyId === rejecting?.id}
              onClick={() => void reject()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reject product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
