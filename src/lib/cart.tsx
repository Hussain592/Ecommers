import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { type Product } from "@/data/mock";
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
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "dukaan_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

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
      // Supabase ek dafa mein sirf 1000 rows deta hai, isliye page-by-page (batch mein) saare products lete hain
      let allData: Array<Record<string, unknown>> = [];
      let from = 0;
      const batchSize = 1000;
      let keepGoing = true;

      while (keepGoing) {
        const { data, error } = await supabase
          .from("products")
          .select("id, name, description, image, price, compare_price, stock, category, vendor_id, vendors(name)")
          .eq("active", true)
          .order("created_at", { ascending: false })
          .range(from, from + batchSize - 1);

        if (error) {
          console.error("Unable to load catalog", error);
          keepGoing = false;
          break;
        }

        allData = allData.concat(data ?? []);
        if (!data || data.length < batchSize) {
          keepGoing = false;
        } else {
          from += batchSize;
        }
      }

      setCatalog(allData.map((item: any) => ({
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
      })));
      setCatalogLoading(false);
    };
    void loadCatalog();
  }, []);

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
    };
  }, [catalog, lines, catalogLoading]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}