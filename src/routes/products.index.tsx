import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, PackageSearch, Loader2 } from "lucide-react";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { ProductCard } from "@/components/shop/ProductCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/data/mock";

const PAGE_SIZE = 20;

export const Route = createFileRoute("/products/")({
  validateSearch: (search: Record<string, unknown>) => ({
    category: typeof search["category"] === "string" ? search["category"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "All Products — Dukaan.pk Online Shopping Pakistan" },
      {
        name: "description",
        content:
          "Browse thousands of products from verified Pakistani sellers on Dukaan.pk. Cash on Delivery nationwide, no advance payment.",
      },
      { property: "og:title", content: "All Products — Dukaan.pk" },
      { property: "og:description", content: "Shop electronics, fashion, home and beauty with COD across Pakistan." },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const { category } = Route.useSearch();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState(category ?? "all");
  const [sort, setSort] = useState("popular");
  const [categories, setCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (category) setCat(category);
  }, [category]);

  useEffect(() => {
    const loadCategories = async () => {
      const { data, error } = await supabase.from("categories").select("name").eq("active", true).order("name");
      if (!error && data) setCategories(data.map((c) => c.name));
    };
    void loadCategories();
  }, []);

  const fetchPage = async (pageNum: number, replace: boolean) => {
    let query = supabase
      .from("products")
      .select("id, name, description, image, price, compare_price, stock, category, vendor_id, vendors(name)")
      .eq("active", true);

    if (cat !== "all") query = query.eq("category", cat);
    if (q.trim()) query = query.ilike("name", `%${q.trim()}%`);

    if (sort === "low") query = query.order("price", { ascending: true });
    else if (sort === "high") query = query.order("price", { ascending: false });
    else query = query.order("created_at", { ascending: false });

    query = query.range(pageNum * PAGE_SIZE, pageNum * PAGE_SIZE + PAGE_SIZE - 1);

    const { data, error } = await query;
    if (error) {
      console.error("Unable to load products", error);
      setHasMore(false);
      return;
    }

    const mapped: Product[] = (data ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      category: item.category ?? "Uncategorized",
      price: Number(item.price),
      oldPrice: item.compare_price ? Number(item.compare_price) : undefined,
      stock: item.stock,
      active: true,
      vendor: item.vendors?.[0]?.name ?? "Dukaan.pk Seller",
      vendorId: item.vendor_id ?? undefined,
      city: "",
      rating: 0,
      reviews: 0,
      image: item.image || "/favicon.ico",
      description: item.description ?? "",
    }));

    setProducts((prev) => (replace ? mapped : [...prev, ...mapped]));
    setHasMore(mapped.length === PAGE_SIZE);
  };

  // Filters (category, search, sort) badalne par, pehle page se dobara load karein
  useEffect(() => {
    setLoading(true);
    setPage(0);
    void fetchPage(0, true).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat, q, sort]);

  const loadMore = async () => {
    setLoadingMore(true);
    const nextPage = page + 1;
    await fetchPage(nextPage, false);
    setPage(nextPage);
    setLoadingMore(false);
  };

  return (
    <ShopLayout>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-extrabold sm:text-3xl">
          {cat === "all" ? "All Products" : cat}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {products.length}{hasMore ? "+" : ""} products available with Cash on Delivery
        </p>

        <div className="surface-card mt-6 grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products..."
              className="h-10 rounded-xl pl-9"
            />
          </div>
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger className="h-10 w-full rounded-xl sm:w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="h-10 w-full rounded-xl sm:w-44">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="low">Price: Low to High</SelectItem>
              <SelectItem value="high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : products.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={PackageSearch}
              title="Koi product nahi mila"
              description="Filter change karein ya doosra keyword try karein."
              action={
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => {
                    setQ("");
                    setCat("all");
                  }}
                >
                  Reset filters
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>

            {hasMore && (
              <div className="mt-8 flex justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-xl"
                  disabled={loadingMore}
                  onClick={loadMore}
                >
                  {loadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Load more products
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </ShopLayout>
  );
}