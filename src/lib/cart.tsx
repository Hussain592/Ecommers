import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { type Product } from "@/data/mock";
import { supabase } from "@/lib/supabase";

export type CartLine = {
  id: string;
  qty: number;
};

type CartCtx = {
  lines: CartLine[];
  add: (id: string, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;

  count: number;

  detailed: Array<{
    product: Product;
    qty: number;
  }>;

  subtotal: number;

  catalog: Product[];
  catalogLoading: boolean;

  catalogHasMore: boolean;
  catalogLoadingMore: boolean;

  loadMoreCatalog: () => void;
};

const Ctx = createContext<CartCtx | null>(null);

const KEY = "dukaan_cart";

/*
  24 isliye:
  Desktop = 4 × 6
  Tablet = 3 × 8
  Mobile = 2 × 12
*/
const PAGE_SIZE = 24;

const PRODUCT_SELECT =
  "id, name, description, image, price, compare_price, stock, category, vendor_id, created_at, vendors(name)";

function mapProduct(item: any): Product {
  return {
    id: item.id,

    name: item.name,

    slug: String(item.name ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, ""),

    category: item.category ?? "Uncategorized",

    price: Number(item.price ?? 0),

    oldPrice:
      item.compare_price !== null &&
      item.compare_price !== undefined
        ? Number(item.compare_price)
        : undefined,

    stock: Number(item.stock ?? 0),

    active: true,

    vendor:
      item.vendors?.[0]?.name ??
      item.vendors?.name ??
      "Dukaan.pk Seller",

    vendorId: item.vendor_id ?? undefined,

    city: "",

    rating: 0,

    reviews: 0,

    image: item.image || "/favicon.ico",

    description: item.description ?? "",
  };
}

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [lines, setLines] = useState<CartLine[]>([]);

  const [catalog, setCatalog] = useState<Product[]>([]);

  const [cartProducts, setCartProducts] = useState<Product[]>(
    [],
  );

  const [catalogLoading, setCatalogLoading] =
    useState(true);

  const [catalogHasMore, setCatalogHasMore] =
    useState(true);

  const [
    catalogLoadingMore,
    setCatalogLoadingMore,
  ] = useState(false);

  const [nextOffset, setNextOffset] =
    useState(0);

  /*
    Cart localStorage se load
  */
  useEffect(() => {
    try {
      const raw =
        localStorage.getItem(KEY);

      if (!raw) return;

      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        setLines(parsed);
      }
    } catch (error) {
      console.error(
        "Unable to load cart",
        error,
      );
    }
  }, []);

  /*
    Products fetch

    Hum 24 show karte hain
    lekin database se 25 mangte hain.

    25th product sirf ye check karta hai
    ke aur products available hain ya nahi.
  */
  const fetchCatalogPage = useCallback(
    async (
      offset: number,
      append: boolean,
    ) => {
      if (append) {
        setCatalogLoadingMore(true);
      } else {
        setCatalogLoading(true);
      }

      try {
        const { data, error } =
          await supabase
            .from("products")
            .select(PRODUCT_SELECT)
            .eq("active", true)

            /*
              Important:

              created_at ke saath id bhi order
              kar rahe hain taa-ke same created_at
              wale demo products pagination mein
              overlap na karein.
            */
            .order("created_at", {
              ascending: false,
            })
            .order("id", {
              ascending: false,
            })

            /*
              range inclusive hoti hai.

              0 → 24 = 25 rows

              first 24 display
              25th = hasMore check
            */
            .range(
              offset,
              offset + PAGE_SIZE,
            );

        if (error) {
          console.error(
            "Unable to load catalog",
            error,
          );

          return;
        }

        const rows = data ?? [];

        /*
          Sirf 24 products display.
        */
        const pageRows = rows.slice(
          0,
          PAGE_SIZE,
        );

        const mapped =
          pageRows.map(mapProduct);

        setCatalog((previous) => {
          if (!append) {
            return mapped;
          }

          /*
            Existing + next page
          */
          const merged = [
            ...previous,
            ...mapped,
          ];

          /*
            Duplicate IDs remove
          */
          return Array.from(
            new Map(
              merged.map((product) => [
                product.id,
                product,
              ]),
            ).values(),
          );
        });

        /*
          25 rows milein to next page exists.
        */
        setCatalogHasMore(
          rows.length > PAGE_SIZE,
        );

        /*
          Example:
          0 → 24
          24 → 48
          48 → 72
        */
        setNextOffset(
          offset + pageRows.length,
        );
      } catch (error) {
        console.error(
          "Unexpected catalog error",
          error,
        );
      } finally {
        setCatalogLoading(false);
        setCatalogLoadingMore(false);
      }
    },
    [],
  );

  /*
    Initial 24 products.
  */
  useEffect(() => {
    void fetchCatalogPage(
      0,
      false,
    );
  }, [fetchCatalogPage]);

  /*
    Load More button.
  */
  const loadMoreCatalog =
    useCallback(() => {
      if (
        catalogLoadingMore ||
        !catalogHasMore
      ) {
        return;
      }

      void fetchCatalogPage(
        nextOffset,
        true,
      );
    }, [
      catalogLoadingMore,
      catalogHasMore,
      nextOffset,
      fetchCatalogPage,
    ]);

  /*
    Cart IDs.
  */
  const cartIdsKey = useMemo(
    () =>
      lines
        .map((line) => line.id)
        .sort()
        .join(","),
    [lines],
  );

  /*
    Cart products separately fetch.

    Isliye agar Product #800 cart mein
    hai aur homepage par first 24 hi loaded
    hain, tab bhi cart mein product show hoga.
  */
  useEffect(() => {
    const loadCartProducts =
      async () => {
        if (!cartIdsKey) {
          setCartProducts([]);
          return;
        }

        const ids =
          cartIdsKey.split(",");

        try {
          const { data, error } =
            await supabase
              .from("products")
              .select(PRODUCT_SELECT)
              .in("id", ids);

          if (error) {
            console.error(
              "Unable to load cart products",
              error,
            );

            return;
          }

          setCartProducts(
            (data ?? []).map(
              mapProduct,
            ),
          );
        } catch (error) {
          console.error(
            "Unexpected cart loading error",
            error,
          );
        }
      };

    void loadCartProducts();
  }, [cartIdsKey]);

  /*
    Cart save.
  */
  useEffect(() => {
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify(lines),
      );
    } catch (error) {
      console.error(
        "Unable to save cart",
        error,
      );
    }
  }, [lines]);

  const value =
    useMemo<CartCtx>(() => {
      const detailed = lines
        .map((line) => {
          const product =
            cartProducts.find(
              (p) =>
                p.id === line.id,
            ) ??
            catalog.find(
              (p) =>
                p.id === line.id,
            );

          if (!product) {
            return null;
          }

          return {
            product,
            qty: line.qty,
          };
        })
        .filter(
          Boolean,
        ) as Array<{
        product: Product;
        qty: number;
      }>;

      return {
        lines,

        add: (
          id,
          qty = 1,
        ) => {
          setLines(
            (previous) => {
              const existing =
                previous.find(
                  (line) =>
                    line.id === id,
                );

              if (existing) {
                return previous.map(
                  (line) =>
                    line.id === id
                      ? {
                          ...line,
                          qty:
                            line.qty +
                            qty,
                        }
                      : line,
                );
              }

              return [
                ...previous,
                {
                  id,
                  qty,
                },
              ];
            },
          );
        },

        remove: (id) => {
          setLines(
            (previous) =>
              previous.filter(
                (line) =>
                  line.id !== id,
              ),
          );
        },

        setQty: (
          id,
          qty,
        ) => {
          setLines(
            (previous) => {
              if (qty <= 0) {
                return previous.filter(
                  (line) =>
                    line.id !== id,
                );
              }

              return previous.map(
                (line) =>
                  line.id === id
                    ? {
                        ...line,
                        qty,
                      }
                    : line,
              );
            },
          );
        },

        clear: () => {
          setLines([]);
        },

        count: lines.reduce(
          (
            total,
            line,
          ) =>
            total +
            line.qty,
          0,
        ),

        detailed,

        subtotal:
          detailed.reduce(
            (
              total,
              item,
            ) =>
              total +
              item.product.price *
                item.qty,
            0,
          ),

        catalog,

        catalogLoading,

        catalogHasMore,

        catalogLoadingMore,

        loadMoreCatalog,
      };
    }, [
      lines,
      catalog,
      cartProducts,
      catalogLoading,
      catalogHasMore,
      catalogLoadingMore,
      loadMoreCatalog,
    ]);

  return (
    <Ctx.Provider value={value}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const ctx =
    useContext(Ctx);

  if (!ctx) {
    throw new Error(
      "useCart must be used inside CartProvider",
    );
  }

  return ctx;
}