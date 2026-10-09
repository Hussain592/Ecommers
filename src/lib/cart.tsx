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

/*
 * Purana key intentionally same rakha hai.
 * Is se existing users ka cart delete nahi hoga.
 */
const KEY = "dukaan_cart";

/*
 * Initial page ko thora halka rakha hai.
 * 16 products = desktop par 4 x 4.
 * Baqi products "Load more" se aayenge.
 */
const PAGE_SIZE = 16;

/*
 * Home/catalog ko vendor JOIN ki zarurat nahi.
 * Vendor detail product page par vendor_id se separately load hoti hai.
 *
 * description abhi rakhi hai taa-ke agar product catalog se detail page
 * khole to existing detail page ka cached-product flow break na ho.
 */
const PRODUCT_SELECT =
  "id, name, description, image, price, compare_price, stock, category, vendor_id, created_at";

/*
 * React dev/StrictMode aur fast route remounts mein same first-page request
 * dobara fire na ho, isliye short in-memory cache.
 */
const FIRST_PAGE_CACHE_TTL = 30_000;

type CatalogRowsResult = {
  rows: any[];
};

let firstPageCache:
  | {
      expiresAt: number;
      result: CatalogRowsResult;
    }
  | null = null;

let firstPagePending: Promise<CatalogRowsResult> | null = null;

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

    vendor: "azadari.store Seller",

    vendorId: item.vendor_id ?? undefined,

    city: "",

    rating: 0,

    reviews: 0,

    image: item.image || "/favicon.ico",

    description: item.description ?? "",
  };
}

async function requestCatalogRows(
  offset: number,
): Promise<CatalogRowsResult> {
  const runRequest = async (): Promise<CatalogRowsResult> => {
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("active", true)
      .order("created_at", {
        ascending: false,
      })
      .order("id", {
        ascending: false,
      })
      /*
       * range inclusive hoti hai.
       * 16 display + 1 extra hasMore check ke liye.
       */
      .range(offset, offset + PAGE_SIZE);

    if (error) {
      throw error;
    }

    return {
      rows: data ?? [],
    };
  };

  /*
   * Sirf first page ko short cache karte hain.
   * Load-more pages fresh fetch hongi.
   */
  if (offset === 0) {
    const now = Date.now();

    if (
      firstPageCache &&
      firstPageCache.expiresAt > now
    ) {
      return firstPageCache.result;
    }

    if (firstPagePending) {
      return firstPagePending;
    }

    firstPagePending = runRequest()
      .then((result) => {
        firstPageCache = {
          expiresAt: Date.now() + FIRST_PAGE_CACHE_TTL,
          result,
        };

        return result;
      })
      .finally(() => {
        firstPagePending = null;
      });

    return firstPagePending;
  }

  return runRequest();
}

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [lines, setLines] = useState<CartLine[]>([]);

  const [cartHydrated, setCartHydrated] =
    useState(false);

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
   * Cart localStorage se load.
   *
   * cartHydrated isliye hai taa-ke first render par empty [] purane
   * localStorage cart ko accidentally overwrite na kare.
   */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);

      if (raw) {
        const parsed = JSON.parse(raw);

        if (Array.isArray(parsed)) {
          const safeLines = parsed.filter(
            (line): line is CartLine =>
              Boolean(
                line &&
                  typeof line.id === "string" &&
                  Number.isFinite(Number(line.qty)) &&
                  Number(line.qty) > 0,
              ),
          );

          setLines(
            safeLines.map((line) => ({
              id: line.id,
              qty: Number(line.qty),
            })),
          );
        }
      }
    } catch (error) {
      console.error(
        "Unable to load cart",
        error,
      );
    } finally {
      setCartHydrated(true);
    }
  }, []);

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
        const { rows } =
          await requestCatalogRows(offset);

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

          const merged = [
            ...previous,
            ...mapped,
          ];

          return Array.from(
            new Map(
              merged.map((product) => [
                product.id,
                product,
              ]),
            ).values(),
          );
        });

        setCatalogHasMore(
          rows.length > PAGE_SIZE,
        );

        setNextOffset(
          offset + pageRows.length,
        );
      } catch (error) {
        console.error(
          "Unable to load catalog",
          error,
        );

        if (!append) {
          setCatalog([]);
        }

        setCatalogHasMore(false);
      } finally {
        setCatalogLoading(false);
        setCatalogLoadingMore(false);
      }
    },
    [],
  );

  /*
   * Initial products.
   */
  useEffect(() => {
    void fetchCatalogPage(
      0,
      false,
    );
  }, [fetchCatalogPage]);

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
   * Cart IDs stable string.
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
   * Cart products separately fetch.
   *
   * Sirf cart ke actual IDs fetch hote hain.
   * Puri catalog dobara fetch nahi hoti.
   */
  useEffect(() => {
    let cancelled = false;

    const loadCartProducts =
      async () => {
        if (!cartIdsKey) {
          setCartProducts([]);
          return;
        }

        const ids =
          cartIdsKey.split(",");

        /*
         * Jo products already catalog mein hain unhein pehle reuse karo.
         * Is se normal home-page products add karne par unnecessary DB
         * request avoid ho sakti hai.
         */
        const catalogById = new Map(
          catalog.map((product) => [
            product.id,
            product,
          ]),
        );

        const alreadyAvailable =
          ids
            .map((id) =>
              catalogById.get(id),
            )
            .filter(Boolean) as Product[];

        const availableIds = new Set(
          alreadyAvailable.map(
            (product) => product.id,
          ),
        );

        const missingIds = ids.filter(
          (id) => !availableIds.has(id),
        );

        if (missingIds.length === 0) {
          setCartProducts(
            alreadyAvailable,
          );
          return;
        }

        try {
          const { data, error } =
            await supabase
              .from("products")
              .select(PRODUCT_SELECT)
              .in("id", missingIds);

          if (error) {
            console.error(
              "Unable to load cart products",
              error,
            );

            if (!cancelled) {
              setCartProducts(
                alreadyAvailable,
              );
            }

            return;
          }

          if (cancelled) {
            return;
          }

          const fetched =
            (data ?? []).map(
              mapProduct,
            );

          setCartProducts([
            ...alreadyAvailable,
            ...fetched,
          ]);
        } catch (error) {
          console.error(
            "Unexpected cart loading error",
            error,
          );

          if (!cancelled) {
            setCartProducts(
              alreadyAvailable,
            );
          }
        }
      };

    void loadCartProducts();

    return () => {
      cancelled = true;
    };
  }, [cartIdsKey, catalog]);

  /*
   * Cart save.
   */
  useEffect(() => {
    if (!cartHydrated) {
      return;
    }

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
  }, [lines, cartHydrated]);

  const value =
    useMemo<CartCtx>(() => {
      const productMap = new Map<
        string,
        Product
      >();

      for (const product of catalog) {
        productMap.set(
          product.id,
          product,
        );
      }

      for (const product of cartProducts) {
        productMap.set(
          product.id,
          product,
        );
      }

      const detailed = lines
        .map((line) => {
          const product =
            productMap.get(line.id);

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
