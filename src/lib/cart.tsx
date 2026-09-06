import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { products, resolveProductImage, type Product } from "@/data/mock";
import { supabase } from "@/lib/supabase";

export type CartLine = { id: string; qty: number };

type CartCtx = {
  lines: CartLine[];
  add: (id: string, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  count: number;
  detailed: Array<{ product: Product; qty: number }>;
  subtotal: number;
  catalog: Product[];
  catalogLoading: boolean;
  catalogLoadingMore: boolean;
  catalogHasMore: boolean;
  loadMoreCatalog: () => Promise<void>;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "dukaan_cart";
const PAGE_SIZE = 20;

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [catalog, setCatalog] = useState<Product[]>(products);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogLoadingMore, setCatalogLoadingMore] = useState(false);
  const [catalogHasMore, setCatalogHasMore] = useState(true);
  const [backendLoaded, setBackendLoaded] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const loadCatalog = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, image, price, compare_price, stock, category, vendor_id, featured, sales_count, vendors(name, address)")
        .eq("active", true)
        .order("featured", { ascending: false })
        .order("sales_count", { ascending: false })
        .order("created_at", { ascending: false })
        .range(0, PAGE_SIZE - 1);

      if (error || !data || data.length === 0) {
        setCatalogHasMore(false);
        setCatalogLoading(false);
        return;
      }

      const backendProducts = data.map((item) => ({
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
        city: item.vendors?.[0]?.address ?? "Pakistan",
        rating: 0,
        reviews: 0,
        image: resolveProductImage(item.image),
        description: item.description ?? "",
        featured: item.featured ?? false,
        salesCount: item.sales_count ?? 0,
      }));
      const backendIds = new Set(backendProducts.map((product) => product.id));
      setCatalog([...backendProducts, ...products.filter((product) => !backendIds.has(product.id))]);
      setBackendLoaded(data.length);
      setCatalogHasMore(data.length === PAGE_SIZE);
      setCatalogLoading(false);
    };
    void loadCatalog();
  }, []);

  const loadMoreCatalog = async () => {
    if (catalogLoading || catalogLoadingMore || !catalogHasMore) return;
    setCatalogLoadingMore(true);
    const { data, error } = await supabase
      .from("products")
      .select("id, name, description, image, price, compare_price, stock, category, vendor_id, featured, sales_count, vendors(name, address)")
      .eq("active", true)
      .order("featured", { ascending: false })
      .order("sales_count", { ascending: false })
      .order("created_at", { ascending: false })
      .range(backendLoaded, backendLoaded + PAGE_SIZE - 1);

    if (!error && data) {
      const backendProducts = data.map((item) => ({
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
        city: item.vendors?.[0]?.address ?? "Pakistan",
        rating: 0,
        reviews: 0,
        image: resolveProductImage(item.image),
        description: item.description ?? "",
        featured: item.featured ?? false,
        salesCount: item.sales_count ?? 0,
      }));
      setCatalog((current) => [...current, ...backendProducts]);
      setBackendLoaded((current) => current + data.length);
      setCatalogHasMore(data.length === PAGE_SIZE);
    }
    setCatalogLoadingMore(false);
  };

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      /* ignore */
    }
  }, [lines]);

  const value = useMemo<CartCtx>(() => {
    const detailed = lines
      .map((l) => {
        const product = catalog.find((p) => p.id === l.id);
        return product ? { product, qty: l.qty } : null;
      })
      .filter(Boolean) as Array<{ product: Product; qty: number }>;

    return {
      lines,
      add: (id, qty = 1) =>
        setLines((prev) =>
          prev.some((l) => l.id === id)
            ? prev.map((l) => (l.id === id ? { ...l, qty: l.qty + qty } : l))
            : [...prev, { id, qty }],
        ),
      remove: (id) => setLines((prev) => prev.filter((l) => l.id !== id)),
      setQty: (id, qty) =>
        setLines((prev) =>
          qty <= 0
            ? prev.filter((l) => l.id !== id)
            : prev.map((l) => (l.id === id ? { ...l, qty } : l)),
        ),
      clear: () => setLines([]),
      count: lines.reduce((s, l) => s + l.qty, 0),
      detailed,
      subtotal: detailed.reduce((s, d) => s + d.product.price * d.qty, 0),
      catalog,
      catalogLoading,
      catalogLoadingMore,
      catalogHasMore,
      loadMoreCatalog,
    };
  }, [backendLoaded, catalog, catalogHasMore, catalogLoading, catalogLoadingMore, lines]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}