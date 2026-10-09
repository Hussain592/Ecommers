import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Search,
  Star,
} from "lucide-react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { adminNav } from "@/components/dashboard/nav-config";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

import {
  formatPKR,
  productImageFallback,
} from "@/data/mock";

export const Route = createFileRoute("/admin/products")({
  head: () => ({
    meta: [
      {
        title: "azadari.store",
      },
      {
        name: "robots",
        content: "noindex",
      },
    ],
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

  vendor: {
    name: string;
  } | null;
};

function AdminProducts() {
  const [products, setProducts] =
    useState<ProductRow[]>([]);

  const [query, setQuery] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [busyId, setBusyId] =
    useState<string | null>(null);

  /*
   * =====================================
   * LOAD PRODUCTS
   * =====================================
   */
  const loadProducts = async () => {
    setLoading(true);

    const {
      data,
      error,
    } = await supabase
      .from("products")
      .select(
        "id, name, image, category, price, stock, active, featured, sales_count, vendors(name)",
      )
      .order(
        "featured",
        {
          ascending: false,
        },
      )
      .order(
        "sales_count",
        {
          ascending: false,
        },
      )
      .order(
        "created_at",
        {
          ascending: false,
        },
      );

    if (error) {
      console.error(
        "Unable to load products",
        error,
      );

      toast.error(
        "Products load nahi ho sake.",
      );

      setProducts([]);
      setLoading(false);

      return;
    }

    setProducts(
      (data ?? []).map(
        (product) => ({
          ...product,

          price: Number(
            product.price,
          ),

          stock: Number(
            product.stock ?? 0,
          ),

          sales_count: Number(
            product.sales_count ?? 0,
          ),

          vendor:
            product.vendors?.[0] ??
            null,
        }),
      ),
    );

    setLoading(false);
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  /*
   * =====================================
   * SEARCH
   * =====================================
   */
  const filtered =
    useMemo(() => {
      const search =
        query
          .trim()
          .toLowerCase();

      if (!search) {
        return products;
      }

      return products.filter(
        (product) =>
          `${product.name} ${product.category ?? ""} ${
            product.vendor?.name ?? ""
          } ${product.id}`
            .toLowerCase()
            .includes(search),
      );
    }, [
      products,
      query,
    ]);

  /*
   * =====================================
   * COUNTS
   * =====================================
   */
  const visibleCount =
    products.filter(
      (product) =>
        product.active,
    ).length;

  const hiddenCount =
    products.length -
    visibleCount;

  const featuredCount =
    products.filter(
      (product) =>
        product.featured,
    ).length;

  /*
   * =====================================
   * SHOW / HIDE PRODUCT
   * =====================================
   */
  const setVisibility =
    async (
      id: string,
      active: boolean,
    ) => {
      setBusyId(id);

      const {
        error,
      } = await supabase
        .from("products")
        .update({
          active,
        })
        .eq(
          "id",
          id,
        );

      setBusyId(null);

      if (error) {
        console.error(
          "Unable to update product visibility",
          error,
        );

        toast.error(
          "Product status update nahi ho saka.",
        );

        return;
      }

      setProducts(
        (current) =>
          current.map(
            (product) =>
              product.id === id
                ? {
                    ...product,
                    active,
                  }
                : product,
          ),
      );

      toast.success(
        active
          ? "Product website par show ho raha hai."
          : "Product website se hide ho gaya.",
      );
    };

  /*
   * =====================================
   * FEATURE / UNFEATURE
   * =====================================
   */
  const toggleFeatured =
    async (
      product: ProductRow,
    ) => {
      setBusyId(
        product.id,
      );

      const nextFeatured =
        !product.featured;

      const {
        error,
      } = await supabase
        .from("products")
        .update({
          featured:
            nextFeatured,
        })
        .eq(
          "id",
          product.id,
        );

      setBusyId(null);

      if (error) {
        console.error(
          "Unable to update featured status",
          error,
        );

        toast.error(
          "Featured status update nahi ho saka.",
        );

        return;
      }

      setProducts(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              product.id
                ? {
                    ...item,
                    featured:
                      nextFeatured,
                  }
                : item,
          ),
      );

      toast.success(
        nextFeatured
          ? "Product homepage par featured ho gaya."
          : "Product featured se remove ho gaya.",
      );
    };

  return (
    <DashboardShell
      brand="azadari.store"
      role="Owner / Admin"
      title="Product Review"
      subtitle="Products approve karein, feature karein ya website se hide karein"
      nav={adminNav}
    >
      {/* =====================================
          SUMMARY + SEARCH
      ===================================== */}
      <section className="rounded-2xl border border-[#ded5bd] bg-[#fffdf7] p-4 shadow-[0_4px_16px_rgba(8,43,33,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-4">

          <div className="flex flex-wrap gap-5">

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#89938e]">
                Visible
              </p>

              <p className="mt-1 text-xl font-extrabold text-[#0b513b]">
                {visibleCount}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#89938e]">
                Hidden
              </p>

              <p className="mt-1 text-xl font-extrabold text-[#102d24]">
                {hiddenCount}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#89938e]">
                Featured
              </p>

              <p className="mt-1 text-xl font-extrabold text-[#9a7927]">
                {featuredCount}
              </p>
            </div>

          </div>

          <div className="relative w-full max-w-sm">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b968f]"
            />

            <Input
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value,
                )
              }
              placeholder="Search product, ID or vendor..."
              aria-label="Search products"
              className="h-10 rounded-xl border-[#d8cdae] bg-white pl-9 focus-visible:ring-[#c9a24b]"
            />
          </div>

        </div>

        <p className="mt-3 text-xs text-[#748078]">
          Sirf active products public storefront par display hote hain.
        </p>
      </section>

      {/* =====================================
          LOADING
      ===================================== */}
      {loading ? (
        <div
          className="flex min-h-[260px] items-center justify-center"
          aria-live="polite"
        >
          <div className="text-center">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#0b513b]" />

            <p className="mt-3 text-sm text-[#6f7d75]">
              Products load ho rahe hain...
            </p>
          </div>
        </div>
      ) : (
        /* =====================================
            PRODUCTS TABLE
        ===================================== */
        <section className="overflow-hidden rounded-2xl border border-[#ded5bd] bg-[#fffdf7] shadow-[0_4px_16px_rgba(8,43,33,0.04)]">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[900px] text-sm">

              <thead className="border-b border-[#e9e1cf] bg-[#f7f3e8] text-left text-[11px] uppercase tracking-[0.1em] text-[#6f7d75]">

                <tr>
                  <th className="px-4 py-3">
                    Product
                  </th>

                  <th className="px-4 py-3">
                    Vendor
                  </th>

                  <th className="px-4 py-3">
                    Category
                  </th>

                  <th className="px-4 py-3">
                    Price / Stock
                  </th>

                  <th className="px-4 py-3">
                    Visibility
                  </th>

                  <th className="px-4 py-3">
                    Featured
                  </th>

                  <th className="px-4 py-3 text-right">
                    Action
                  </th>
                </tr>

              </thead>

              <tbody className="divide-y divide-[#eee6d2]">

                {filtered.map(
                  (product) => (
                    <tr
                      key={product.id}
                      className="transition-colors hover:bg-[#fbf8ef]"
                    >

                      {/* =====================================
                          PRODUCT + IMAGE
                      ===================================== */}
                      <td className="px-4 py-3">

                        <div className="flex min-w-[260px] items-center gap-3">

                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[#e2d8bf] bg-[#f7f3e8]">

                            <img
                              src={
                                product.image ||
                                productImageFallback(
                                  product.name,
                                  product.image ?? "",
                                )
                              }
                              alt={product.name}
                              width={112}
                              height={112}
                              loading="lazy"
                              decoding="async"

                              onError={(event) => {
                                const image =
                                  event.currentTarget;

                                /*
                                 * Agar original image fail ho:
                                 * pehle fallback try hoga.
                                 *
                                 * Agar fallback bhi fail ho:
                                 * favicon show hoga.
                                 */
                                if (
                                  image.dataset.fallbackTried ===
                                  "1"
                                ) {
                                  image.onerror = null;

                                  image.src =
                                    "/favicon.ico";

                                  return;
                                }

                                image.dataset.fallbackTried =
                                  "1";

                                image.src =
                                  productImageFallback(
                                    product.name,
                                    product.image ?? "",
                                  );
                              }}

                              className="h-full w-full object-contain p-1.5"
                            />

                          </div>

                          <div className="min-w-0">

                            <p className="max-w-[260px] truncate font-semibold text-[#102d24]">
                              {product.name}
                            </p>

                            <p className="mt-1 max-w-[260px] truncate font-mono text-[10px] text-[#89938e]">
                              {product.id}
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* =====================================
                          VENDOR
                      ===================================== */}
                      <td className="px-4 py-3 text-[#44564d]">
                        {product.vendor?.name ??
                          "Unassigned"}
                      </td>

                      {/* =====================================
                          CATEGORY
                      ===================================== */}
                      <td className="px-4 py-3">

                        <span className="inline-flex rounded-full border border-[#c9a24b]/25 bg-[#f7efd9] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#70591f]">
                          {product.category ??
                            "Uncategorized"}
                        </span>

                      </td>

                      {/* =====================================
                          PRICE / STOCK
                      ===================================== */}
                      <td className="px-4 py-3">

                        <p className="font-semibold text-[#0b513b]">
                          {formatPKR(
                            product.price,
                          )}
                        </p>

                        <p className="mt-1 text-xs text-[#748078]">
                          Stock{" "}
                          {product.stock}
                          {" · "}
                          {product.sales_count}
                          {" "}
                          sold
                        </p>

                      </td>

                      {/* =====================================
                          VISIBILITY
                      ===================================== */}
                      <td className="px-4 py-3">

                        <StatusBadge
                          status={
                            product.active
                              ? "Active"
                              : "Suspended"
                          }
                        />

                      </td>

                      {/* =====================================
                          FEATURED
                      ===================================== */}
                      <td className="px-4 py-3">

                        <Button
                          type="button"
                          variant={
                            product.featured
                              ? "default"
                              : "outline"
                          }
                          size="sm"

                          disabled={
                            busyId === product.id ||
                            !product.active
                          }

                          onClick={() =>
                            void toggleFeatured(
                              product,
                            )
                          }

                          className={
                            product.featured
                              ? "rounded-xl border border-[#c9a24b]/30 bg-[#082b21] text-[#fffaf0] hover:bg-[#0d3d2f]"
                              : "rounded-xl border-[#d8cdae] bg-white text-[#0b513b] hover:bg-[#f7efd9]"
                          }
                        >

                          {busyId ===
                          product.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Star
                              aria-hidden="true"
                              className={`mr-2 h-4 w-4 ${
                                product.featured
                                  ? "fill-[#d8b85c] text-[#d8b85c]"
                                  : ""
                              }`}
                            />
                          )}

                          {product.featured
                            ? "Featured"
                            : "Feature"}

                        </Button>

                      </td>

                      {/* =====================================
                          ACTION
                      ===================================== */}
                      <td className="px-4 py-3 text-right">

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"

                          disabled={
                            busyId ===
                            product.id
                          }

                          onClick={() =>
                            void setVisibility(
                              product.id,
                              !product.active,
                            )
                          }

                          className={
                            product.active
                              ? "rounded-xl border-[#e1d8c5] bg-white text-[#6a5950] hover:border-[#efc9cc] hover:bg-[#fff5f6] hover:text-[#a61f2b]"
                              : "rounded-xl border-[#c9a24b]/35 bg-[#082b21] text-[#fffaf0] hover:bg-[#0d3d2f]"
                          }
                        >

                          {busyId ===
                          product.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : product.active ? (
                            <EyeOff
                              aria-hidden="true"
                              className="mr-2 h-4 w-4"
                            />
                          ) : (
                            <Eye
                              aria-hidden="true"
                              className="mr-2 h-4 w-4"
                            />
                          )}

                          {product.active
                            ? "Hide"
                            : "Show"}

                        </Button>

                      </td>

                    </tr>
                  ),
                )}

              </tbody>

            </table>

          </div>

          {/* =====================================
              NO RESULTS
          ===================================== */}
          {filtered.length === 0 && (
            <div className="p-10 text-center">

              <p className="text-sm font-semibold text-[#102d24]">
                Koi product nahi mila.
              </p>

              <p className="mt-1 text-xs text-[#748078]">
                Search keyword change karke try karein.
              </p>

            </div>
          )}

        </section>
      )}

      {/* =====================================
          FOOT NOTE
      ===================================== */}
      <p className="flex items-center gap-2 text-xs text-[#748078]">

        <CheckCircle2
          aria-hidden="true"
          className="h-4 w-4 text-[#0b6b4c]"
        />

        Sirf active products public storefront par display hote hain.

      </p>

    </DashboardShell>
  );
}