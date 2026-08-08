import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, PackageSearch } from "lucide-react";
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
import { categories, products } from "@/data/mock";

export const Route = createFileRoute("/products/")({
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
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [sort, setSort] = useState("popular");

  const list = useMemo(() => {
    let items = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q.toLowerCase()) && (cat === "all" || p.category === cat),
    );
    if (sort === "low") items = [...items].sort((a, b) => a.price - b.price);
    if (sort === "high") items = [...items].sort((a, b) => b.price - a.price);
    if (sort === "rating") items = [...items].sort((a, b) => b.rating - a.rating);
    return items;
  }, [q, cat, sort]);

  return (
    <ShopLayout>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-extrabold sm:text-3xl">All Products</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {list.length} products available with Cash on Delivery
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
              <SelectItem value="rating">Top Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {list.length === 0 ? (
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
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {list.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </ShopLayout>
  );
}