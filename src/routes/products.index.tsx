import { createFileRoute } from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
  PackageSearch,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { ShopLayout } from "@/components/shop/ShopLayout";
import { ProductCard } from "@/components/shop/ProductCard";
import { EmptyState } from "@/components/dashboard/EmptyState";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { supabase } from "@/lib/supabase";
import type { Product } from "@/data/mock";

/* ============================================================
   CONFIG
============================================================ */

const PAGE_SIZE = 16;

const PRODUCT_LIST_SELECT =
  "id, name, image, price, compare_price, stock, category, vendor_id";

const CACHE_TTL = 30_000;

/* ============================================================
   TYPES
============================================================ */

type ProductPageResult = {
  products: Product[];
  hasMore: boolean;
};

type CategoryRow = {
  id: string;
  name: string;
  parent_id: string | null;
  sort_order: number | null;
};

/* ============================================================
   CACHE
============================================================ */

const pageCache = new Map<
  string,
  {
    expiresAt: number;
    result: ProductPageResult;
  }
>();

const pendingPages = new Map<
  string,
  Promise<ProductPageResult>
>();

/* ============================================================
   ROUTE
============================================================ */

export const Route = createFileRoute("/products/")({
  validateSearch: (
    search: Record<string, unknown>,
  ) => ({
    category:
      typeof search["category"] === "string"
        ? search["category"]
        : undefined,
  }),

  head: () => ({
    meta: [
      {
        title: "azadari.store",
      },
      {
        name: "description",
        content:
          "Browse Islamic products from marketplace sellers on azadari.store with Cash on Delivery across Pakistan.",
      },
      {
        property: "og:title",
        content: "All Products — azadari.store",
      },
      {
        property: "og:description",
        content:
          "Shop Islamic books, prayer essentials, Majlis items, clothing and accessories with Cash on Delivery across Pakistan.",
      },
    ],
  }),

  component: ProductsPage,
});

/* ============================================================
   PRODUCT MAPPER
============================================================ */

function mapListProduct(
  item: any,
): Product {
  return {
    id: item.id,

    name: item.name,

    slug: String(
      item.name ?? "",
    )
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-",
      )
      .replace(
        /(^-|-$)/g,
        "",
      ),

    category:
      item.category ??
      "Uncategorized",

    price: Number(
      item.price ?? 0,
    ),

    oldPrice:
      item.compare_price !== null &&
      item.compare_price !== undefined
        ? Number(
            item.compare_price,
          )
        : undefined,

    stock: Number(
      item.stock ?? 0,
    ),

    active: true,

    vendor:
      "azadari.store Seller",

    vendorId:
      item.vendor_id ??
      undefined,

    city: "",

    rating: 0,

    reviews: 0,

    image:
      item.image ||
      "/favicon.ico",

    description: "",
  };
}

/* ============================================================
   CATEGORY HELPERS
============================================================ */

/*
 * Selected category ke children / grandchildren.
 */

function getDescendantNames(
  categoryId: string,
  categories: CategoryRow[],
) {
  const names: string[] = [];

  const visited =
    new Set<string>();

  const visit = (
    id: string,
  ) => {
    if (
      visited.has(id)
    ) {
      return;
    }

    visited.add(id);

    const current =
      categories.find(
        (item) =>
          item.id === id,
      );

    if (!current) {
      return;
    }

    names.push(
      current.name,
    );

    const children =
      categories.filter(
        (item) =>
          item.parent_id ===
          current.id,
      );

    children.forEach(
      (child) =>
        visit(child.id),
    );
  };

  visit(categoryId);

  return names;
}

/*
 * Selected category ke parents / ancestors.
 *
 * Example:
 *
 * Black Tasbeeh
 * ↓
 * Tasbeeh
 *
 * Isse old existing products bhi show ho sakte hain,
 * kyun ke unki category abhi "Tasbeeh" hai.
 */

function getAncestorNames(
  categoryId: string,
  categories: CategoryRow[],
) {
  const names: string[] = [];

  let current =
    categories.find(
      (item) =>
        item.id === categoryId,
    );

  const visited =
    new Set<string>();

  while (current) {
    if (
      visited.has(
        current.id,
      )
    ) {
      break;
    }

    visited.add(
      current.id,
    );

    names.push(
      current.name,
    );

    if (
      !current.parent_id
    ) {
      break;
    }

    current =
      categories.find(
        (item) =>
          item.id ===
          current?.parent_id,
      );
  }

  return names;
}

/*
 * Actual product filter values.
 *
 * IMPORTANT:
 *
 * Black Tasbeeh click:
 *
 * [
 *   "Black Tasbeeh",
 *   "Tasbeeh"
 * ]
 *
 * Old parent-category products abhi bhi
 * child click par show ho sakte hain.
 */

function getCategoryFilterNames(
  categoryId: string,
  categories: CategoryRow[],
) {
  const descendants =
    getDescendantNames(
      categoryId,
      categories,
    );

  const ancestors =
    getAncestorNames(
      categoryId,
      categories,
    );

  return Array.from(
    new Set([
      ...descendants,
      ...ancestors,
    ]),
  );
}

/*
 * Child category ka root/main category.
 */

function getRootCategoryId(
  categoryId: string,
  categories: CategoryRow[],
) {
  let current =
    categories.find(
      (item) =>
        item.id === categoryId,
    );

  const visited =
    new Set<string>();

  while (
    current?.parent_id
  ) {
    if (
      visited.has(
        current.id,
      )
    ) {
      break;
    }

    visited.add(
      current.id,
    );

    const parent =
      categories.find(
        (item) =>
          item.id ===
          current?.parent_id,
      );

    if (!parent) {
      break;
    }

    current =
      parent;
  }

  return (
    current?.id ??
    categoryId
  );
}

/* ============================================================
   GET PRODUCTS
============================================================ */

async function getProductPage({
  pageNum,
  categoryValues,
  search,
  sort,
}: {
  pageNum: number;
  categoryValues: string[];
  search: string;
  sort: string;
}): Promise<ProductPageResult> {
  const normalizedSearch =
    search.trim();

  const normalizedCategories =
    [...categoryValues].sort(
      (a, b) =>
        a.localeCompare(b),
    );

  const cacheKey =
    JSON.stringify({
      pageNum,

      categories:
        normalizedCategories,

      search:
        normalizedSearch.toLowerCase(),

      sort,
    });

  const now =
    Date.now();

  const cached =
    pageCache.get(
      cacheKey,
    );

  if (
    cached &&
    cached.expiresAt > now
  ) {
    return cached.result;
  }

  const existingPending =
    pendingPages.get(
      cacheKey,
    );

  if (
    existingPending
  ) {
    return existingPending;
  }

  const request =
    (async () => {
      let query =
        supabase
          .from(
            "products",
          )
          .select(
            PRODUCT_LIST_SELECT,
          )
          .eq(
            "active",
            true,
          );

      /*
       * Multiple category names support.
       */

      if (
        normalizedCategories.length >
        0
      ) {
        query =
          query.in(
            "category",
            normalizedCategories,
          );
      }

      /*
       * Search.
       */

      if (
        normalizedSearch
      ) {
        query =
          query.ilike(
            "name",
            `%${normalizedSearch}%`,
          );
      }

      /*
       * Sort.
       */

      if (
        sort === "low"
      ) {
        query =
          query.order(
            "price",
            {
              ascending: true,
            },
          );
      } else if (
        sort === "high"
      ) {
        query =
          query.order(
            "price",
            {
              ascending: false,
            },
          );
      } else {
        query =
          query
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
      }

      const start =
        pageNum *
        PAGE_SIZE;

      const end =
        start +
        PAGE_SIZE;

      const {
        data,
        error,
      } =
        await query.range(
          start,
          end,
        );

      if (error) {
        throw error;
      }

      const rows =
        data ?? [];

      const visibleRows =
        rows.slice(
          0,
          PAGE_SIZE,
        );

      const result: ProductPageResult =
        {
          products:
            visibleRows.map(
              mapListProduct,
            ),

          hasMore:
            rows.length >
            PAGE_SIZE,
        };

      pageCache.set(
        cacheKey,
        {
          expiresAt:
            Date.now() +
            CACHE_TTL,

          result,
        },
      );

      return result;
    })();

  pendingPages.set(
    cacheKey,
    request,
  );

  try {
    return await request;
  } finally {
    pendingPages.delete(
      cacheKey,
    );
  }
}

/* ============================================================
   PRODUCTS PAGE
============================================================ */

function ProductsPage() {
  const {
    category,
  } =
    Route.useSearch();

  /* Search */

  const [
    q,
    setQ,
  ] =
    useState("");

  const [
    debouncedQ,
    setDebouncedQ,
  ] =
    useState("");

  /* Selected category */

  const [
    cat,
    setCat,
  ] =
    useState(
      category ??
        "all",
    );

  /* Sort */

  const [
    sort,
    setSort,
  ] =
    useState(
      "popular",
    );

  /* Category tree */

  const [
    categories,
    setCategories,
  ] =
    useState<CategoryRow[]>(
      [],
    );

  /*
   * Active products mein jo category names
   * actually use ho rahe hain.
   *
   * null = abhi load nahi huay / load fail hua.
   */

  const [
    activeProductCategoryNames,
    setActiveProductCategoryNames,
  ] =
    useState<Set<string> | null>(
      null,
    );

  /* Menu */

  const [
    categoryMenuOpen,
    setCategoryMenuOpen,
  ] =
    useState(false);

  const [
    activeRootId,
    setActiveRootId,
  ] =
    useState<string | null>(
      null,
    );

  const categoryMenuRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  /* Products */

  const [
    products,
    setProducts,
  ] =
    useState<Product[]>(
      [],
    );

  const [
    page,
    setPage,
  ] =
    useState(0);

  const [
    hasMore,
    setHasMore,
  ] =
    useState(true);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    loadingMore,
    setLoadingMore,
  ] =
    useState(false);

  const requestIdRef =
    useRef(0);

  /* ========================================================
     URL CATEGORY
  ======================================================== */

  useEffect(() => {
    if (category) {
      setCat(
        category,
      );
    }
  }, [
    category,
  ]);

  /* ========================================================
     SEARCH DEBOUNCE
  ======================================================== */

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          setDebouncedQ(
            q.trim(),
          );
        },

        350,
      );

    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, [
    q,
  ]);

  /* ========================================================
     LOAD CATEGORY TREE
  ======================================================== */

  useEffect(() => {
    let cancelled =
      false;

    const loadCategories =
      async () => {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              "categories",
            )
            .select(
              "id, name, parent_id, sort_order",
            )
            .eq(
              "active",
              true,
            )
            .order(
              "sort_order",
              {
                ascending: true,
              },
            )
            .order(
              "name",
              {
                ascending: true,
              },
            );

        if (
          cancelled
        ) {
          return;
        }

        if (error) {
          console.error(
            "Unable to load category tree",
            error,
          );

          return;
        }

        setCategories(
          (
            data ??
            []
          ) as CategoryRow[],
        );
      };

    void loadCategories();

    return () => {
      cancelled =
        true;
    };
  }, []);

  /* ========================================================
     LOAD ACTIVE PRODUCT CATEGORY NAMES

     Customer-facing menu mein sirf woh category/subcategory
     show hogi jahan kam az kam 1 ACTIVE product ho.
  ======================================================== */

  useEffect(() => {
    let cancelled =
      false;

    const loadActiveProductCategoryNames =
      async () => {
        try {
          const names =
            new Set<string>();

          const chunkSize =
            1000;

          let offset =
            0;

          while (true) {
            const {
              data,
              error,
            } =
              await supabase
                .from(
                  "products",
                )
                .select(
                  "category",
                )
                .eq(
                  "active",
                  true,
                )
                .range(
                  offset,
                  offset +
                    chunkSize -
                    1,
                );

            if (error) {
              throw error;
            }

            const rows =
              data ?? [];

            rows.forEach(
              (row) => {
                const categoryName =
                  typeof row.category ===
                  "string"
                    ? row.category
                        .trim()
                        .toLowerCase()
                    : "";

                if (categoryName) {
                  names.add(
                    categoryName,
                  );
                }
              },
            );

            if (
              rows.length <
              chunkSize
            ) {
              break;
            }

            offset +=
              chunkSize;
          }

          if (cancelled) {
            return;
          }

          setActiveProductCategoryNames(
            names,
          );
        } catch (error) {
          console.error(
            "Unable to load active product category names",
            error,
          );

          /*
           * Agar ye query fail ho jaye
           * to menu completely disappear nahi hoga.
           */

          if (!cancelled) {
            setActiveProductCategoryNames(
              null,
            );
          }
        }
      };

    void loadActiveProductCategoryNames();

    return () => {
      cancelled =
        true;
    };
  }, []);

  /* ========================================================
     VISIBLE CATEGORY IDS

     Rule:
     - Category ke khud active products hon -> show
     - Ya uske kisi child ke active products hon -> parent show
     - Warna storefront se hide
  ======================================================== */

  const visibleCategoryIds =
    useMemo(() => {
      /*
       * Product query abhi load nahi hui
       * ya fail hui ho to safe fallback.
       */

      if (
        activeProductCategoryNames ===
        null
      ) {
        return new Set(
          categories.map(
            (item) =>
              item.id,
          ),
        );
      }

      const visibleIds =
        new Set<string>();

      categories.forEach(
        (item) => {
          const namesInTree =
            getDescendantNames(
              item.id,
              categories,
            );

          const hasActiveProduct =
            namesInTree.some(
              (name) =>
                activeProductCategoryNames.has(
                  name
                    .trim()
                    .toLowerCase(),
                ),
            );

          if (hasActiveProduct) {
            visibleIds.add(
              item.id,
            );
          }
        },
      );

      return visibleIds;
    }, [
      categories,
      activeProductCategoryNames,
    ]);

  /* ========================================================
     ROOT CATEGORIES
  ======================================================== */

  const rootCategories =
    useMemo(
      () =>
        categories.filter(
          (item) =>
            item.parent_id ===
              null &&
            visibleCategoryIds.has(
              item.id,
            ),
        ),
      [
        categories,
        visibleCategoryIds,
      ],
    );

  /*
   * Agar URL ya purani selection kisi aisi category par ho
   * jahan ab koi active product nahi, to safe reset.
   */

  useEffect(() => {
    if (
      cat === "all" ||
      activeProductCategoryNames ===
        null
    ) {
      return;
    }

    const current =
      categories.find(
        (item) =>
          item.name ===
          cat,
      );

    if (
      current &&
      !visibleCategoryIds.has(
        current.id,
      )
    ) {
      setCat(
        "all",
      );

      setActiveRootId(
        null,
      );
    }
  }, [
    cat,
    categories,
    visibleCategoryIds,
    activeProductCategoryNames,
  ]);

  /* ========================================================
     SELECTED CATEGORY
  ======================================================== */

  const selectedCategory =
    useMemo(() => {
      if (
        cat === "all"
      ) {
        return null;
      }

      return (
        categories.find(
          (item) =>
            item.name ===
            cat,
        ) ??
        null
      );
    }, [
      cat,
      categories,
    ]);

  /* ========================================================
     SELECTED ROOT
  ======================================================== */

  const selectedRootId =
    useMemo(() => {
      if (
        !selectedCategory
      ) {
        return null;
      }

      return getRootCategoryId(
        selectedCategory.id,
        categories,
      );
    }, [
      selectedCategory,
      categories,
    ]);

  /* ========================================================
     ACTIVE ROOT
  ======================================================== */

  const activeRoot =
    useMemo(() => {
      if (
        !activeRootId
      ) {
        return null;
      }

      return (
        rootCategories.find(
          (item) =>
            item.id ===
            activeRootId,
        ) ??
        null
      );
    }, [
      activeRootId,
      rootCategories,
    ]);

  /* ========================================================
     CHILDREN
  ======================================================== */

  const activeChildren =
    useMemo(() => {
      if (
        !activeRoot
      ) {
        return [];
      }

      return categories.filter(
        (item) =>
          item.parent_id ===
            activeRoot.id &&
          visibleCategoryIds.has(
            item.id,
          ),
      );
    }, [
      categories,
      activeRoot,
      visibleCategoryIds,
    ]);

  /* ========================================================
     PRODUCT FILTER VALUES
  ======================================================== */

  const categoryFilterValues =
    useMemo(() => {
      if (
        cat === "all"
      ) {
        return [];
      }

      /*
       * Categories load hone se pehle fallback.
       */

      if (
        !selectedCategory
      ) {
        return [
          cat,
        ];
      }

      /*
       * Temporary compatibility:
       * child + ancestors + descendants.
       */

      return getCategoryFilterNames(
        selectedCategory.id,
        categories,
      );
    }, [
      cat,
      selectedCategory,
      categories,
    ]);

  /* ========================================================
     CLICK OUTSIDE
  ======================================================== */

  useEffect(() => {
    if (
      !categoryMenuOpen
    ) {
      return;
    }

    const handleMouseDown =
      (
        event: MouseEvent,
      ) => {
        if (
          categoryMenuRef.current &&
          !categoryMenuRef.current.contains(
            event.target as Node,
          )
        ) {
          setCategoryMenuOpen(
            false,
          );

          setActiveRootId(
            null,
          );
        }
      };

    const handleKeyDown =
      (
        event: KeyboardEvent,
      ) => {
        if (
          event.key ===
          "Escape"
        ) {
          setCategoryMenuOpen(
            false,
          );

          setActiveRootId(
            null,
          );
        }
      };

    document.addEventListener(
      "mousedown",
      handleMouseDown,
    );

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleMouseDown,
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    categoryMenuOpen,
  ]);

  /* ========================================================
     MENU TOGGLE
  ======================================================== */

  const toggleCategoryMenu =
    () => {
      if (
        categoryMenuOpen
      ) {
        setCategoryMenuOpen(
          false,
        );

        setActiveRootId(
          null,
        );

        return;
      }

      /*
       * Fresh open:
       * Explore hidden.
       */

      setActiveRootId(
        null,
      );

      setCategoryMenuOpen(
        true,
      );
    };

  /* ========================================================
     SELECT CATEGORY
  ======================================================== */

  const selectProductCategory =
    (
      categoryName: string,
    ) => {
      setCat(
        categoryName,
      );

      setCategoryMenuOpen(
        false,
      );

      setActiveRootId(
        null,
      );
    };

  /* ========================================================
     FETCH PRODUCTS
  ======================================================== */

  const fetchPage =
    useCallback(
      async (
        pageNum: number,
        replace: boolean,
      ) => {
        const requestId =
          ++requestIdRef.current;

        try {
          const result =
            await getProductPage(
              {
                pageNum,

                categoryValues:
                  categoryFilterValues,

                search:
                  debouncedQ,

                sort,
              },
            );

          if (
            requestId !==
            requestIdRef.current
          ) {
            return;
          }

          setProducts(
            (
              previous,
            ) => {
              if (
                replace
              ) {
                return result.products;
              }

              const merged =
                [
                  ...previous,
                  ...result.products,
                ];

              return Array.from(
                new Map(
                  merged.map(
                    (
                      product,
                    ) => [
                      product.id,
                      product,
                    ],
                  ),
                ).values(),
              );
            },
          );

          setHasMore(
            result.hasMore,
          );

          setPage(
            pageNum,
          );
        } catch (
          error
        ) {
          if (
            requestId !==
            requestIdRef.current
          ) {
            return;
          }

          console.error(
            "Unable to load products",
            error,
          );

          if (
            replace
          ) {
            setProducts(
              [],
            );
          }

          setHasMore(
            false,
          );
        }
      },
      [
        categoryFilterValues,
        debouncedQ,
        sort,
      ],
    );

  /* ========================================================
     FILTER CHANGE
  ======================================================== */

  useEffect(() => {
    let active =
      true;

    setLoading(
      true,
    );

    setLoadingMore(
      false,
    );

    setPage(
      0,
    );

    void fetchPage(
      0,
      true,
    ).finally(() => {
      if (
        active
      ) {
        setLoading(
          false,
        );
      }
    });

    return () => {
      active =
        false;
    };
  }, [
    fetchPage,
  ]);

  /* ========================================================
     LOAD MORE
  ======================================================== */

  const loadMore =
    async () => {
      if (
        loadingMore ||
        !hasMore
      ) {
        return;
      }

      setLoadingMore(
        true,
      );

      try {
        await fetchPage(
          page + 1,
          false,
        );
      } finally {
        setLoadingMore(
          false,
        );
      }
    };

  /* ========================================================
     UI
  ======================================================== */

  return (
    <ShopLayout>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9a7927]">
          Islamic Marketplace
        </p>

        <h1 className="mt-1 text-2xl font-extrabold text-[#102d24] sm:text-3xl">
          {cat === "all"
            ? "All Products"
            : cat}
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          {loading
            ? "Products load ho rahe hain..."
            : `${products.length}${
                hasMore
                  ? "+"
                  : ""
              } products shown with Cash on Delivery`}
        </p>

        {/* =================================================
            FILTER BAR
        ================================================= */}

        <div className="mt-6 grid gap-3 rounded-2xl border border-[#d8cdae]/70 bg-[#fffdf7] p-4 shadow-[0_4px_16px_rgba(8,43,33,0.05)] sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          {/* Search */}

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={q}
              onChange={(
                event,
              ) =>
                setQ(
                  event.target
                    .value,
                )
              }
              placeholder="Search products..."
              aria-label="Search products"
              className="h-10 rounded-xl border-[#d8cdae] bg-white pl-9 focus-visible:ring-[#c9a24b]"
            />
          </div>

          {/* =================================================
              CATEGORY MENU
          ================================================= */}

          <div
            ref={
              categoryMenuRef
            }
            className="relative"
          >
            <button
              type="button"
              aria-label="Filter by category"
              aria-expanded={
                categoryMenuOpen
              }
              onClick={
                toggleCategoryMenu
              }
              className="flex h-10 w-full items-center justify-between gap-3 rounded-xl border border-[#d8cdae] bg-white px-3 text-left text-sm text-[#243b32] shadow-sm transition hover:border-[#c9a24b] focus:outline-none focus:ring-2 focus:ring-[#c9a24b]/30 sm:w-52"
            >
              <span className="min-w-0 truncate">
                {cat ===
                "all"
                  ? "All Categories"
                  : cat}
              </span>

              <ChevronDown
                className={`h-4 w-4 shrink-0 text-[#66736c] transition-transform ${
                  categoryMenuOpen
                    ? "rotate-180"
                    : ""
                }`}
              />
            </button>

            {categoryMenuOpen && (
              <div
                className={`absolute right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-[#ddd5c2] bg-white shadow-[0_18px_50px_rgba(8,43,33,0.22)] sm:left-0 sm:right-auto ${
                  activeRoot
                    ? "w-[min(620px,calc(100vw-32px))]"
                    : "w-[min(260px,calc(100vw-32px))]"
                }`}
              >
                <div
                  className={
                    activeRoot
                      ? "grid min-h-[360px] max-h-[440px] grid-cols-[minmax(210px,0.9fr)_minmax(260px,1.1fr)]"
                      : "block max-h-[440px]"
                  }
                >
                  {/* LEFT */}

                  <div
                    className={`overflow-y-auto bg-[#fffdf7] py-2 ${
                      activeRoot
                        ? "max-h-[440px] border-r border-[#e7e0d1]"
                        : "max-h-[440px]"
                    }`}
                  >
                    <button
                      type="button"
                      onMouseEnter={() =>
                        setActiveRootId(
                          null,
                        )
                      }
                      onClick={() =>
                        selectProductCategory(
                          "all",
                        )
                      }
                      className={`flex min-h-10 w-full items-center justify-between gap-2 px-4 py-2 text-left text-sm ${
                        cat ===
                        "all"
                          ? "bg-[#edf4ef] font-semibold text-[#0b513b]"
                          : "text-[#59655f] hover:bg-[#f3efe5] hover:text-[#0b513b]"
                      }`}
                    >
                      All Categories

                      {cat ===
                        "all" && (
                        <Check className="h-4 w-4" />
                      )}
                    </button>

                    {rootCategories.map(
                      (
                        root,
                      ) => {
                        const children =
                          categories.filter(
                            (
                              item,
                            ) =>
                              item.parent_id ===
                                root.id &&
                              visibleCategoryIds.has(
                                item.id,
                              ),
                          );

                        const isActive =
                          activeRootId ===
                          root.id;

                        const selectedInside =
                          selectedRootId ===
                          root.id;

                        return (
                          <button
                            key={
                              root.id
                            }
                            type="button"
                            onMouseEnter={() =>
                              setActiveRootId(
                                root.id,
                              )
                            }
                            onFocus={() =>
                              setActiveRootId(
                                root.id,
                              )
                            }
                            onClick={() =>
                              setActiveRootId(
                                root.id,
                              )
                            }
                            className={`flex min-h-10 w-full items-center justify-between gap-2 px-4 py-2 text-left text-sm ${
                              isActive
                                ? "bg-[#edf4ef] font-semibold text-[#0b513b]"
                                : selectedInside
                                  ? "font-semibold text-[#0b513b]"
                                  : "text-[#59655f] hover:bg-[#f3efe5] hover:text-[#0b513b]"
                            }`}
                          >
                            <span className="truncate">
                              {
                                root.name
                              }
                            </span>

                            {children.length >
                            0 && (
                              <ChevronRight className="h-4 w-4 shrink-0 text-[#c09435]" />
                            )}
                          </button>
                        );
                      },
                    )}
                  </div>

                  {/* RIGHT */}

                  {activeRoot && (
                    <div className="max-h-[440px] overflow-y-auto bg-white p-4">
                      <div className="border-b border-[#eee7d8] pb-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9a7927]">
                          Explore
                        </p>

                        <h3 className="mt-1 text-lg font-extrabold text-[#102d24]">
                          {
                            activeRoot.name
                          }
                        </h3>
                      </div>

                      {/* Root */}

                      <button
                        type="button"
                        onClick={() =>
                          selectProductCategory(
                            activeRoot.name,
                          )
                        }
                        className={`mt-2 flex min-h-10 w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold ${
                          cat ===
                          activeRoot.name
                            ? "bg-[#edf4ef] text-[#0b513b]"
                            : "text-[#0b513b] hover:bg-[#f7f1e4]"
                        }`}
                      >
                        <span>
                          View all{" "}
                          {
                            activeRoot.name
                          }
                        </span>

                        {cat ===
                          activeRoot.name && (
                          <Check className="h-4 w-4" />
                        )}
                      </button>

                      {/* Children */}

                      {activeChildren.length >
                      0 ? (
                        <div className="mt-1 space-y-0.5">
                          {activeChildren.map(
                            (
                              child,
                            ) => (
                              <button
                                key={
                                  child.id
                                }
                                type="button"
                                onClick={() =>
                                  selectProductCategory(
                                    child.name,
                                  )
                                }
                                className={`flex min-h-10 w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                                  cat ===
                                  child.name
                                    ? "bg-[#edf4ef] font-semibold text-[#0b513b]"
                                    : "text-[#647069] hover:bg-[#f7f1e4] hover:text-[#0b513b]"
                                }`}
                              >
                                <span>
                                  {
                                    child.name
                                  }
                                </span>

                                {cat ===
                                  child.name && (
                                  <Check className="h-4 w-4" />
                                )}
                              </button>
                            ),
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            selectProductCategory(
                              activeRoot.name,
                            )
                          }
                          className="mt-4 text-sm font-semibold text-[#0b513b]"
                        >
                          View products
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sort */}

          <Select
            value={sort}
            onValueChange={
              setSort
            }
          >
            <SelectTrigger
              aria-label="Sort products"
              className="h-10 w-full rounded-xl border-[#d8cdae] bg-white sm:w-44"
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />

              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="popular">
                Most Popular
              </SelectItem>

              <SelectItem value="low">
                Price: Low to High
              </SelectItem>

              <SelectItem value="high">
                Price: High to Low
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* LOADING */}

        {loading ? (
          <div className="flex min-h-64 items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#0b513b]" />

              <p className="mt-3 text-sm text-muted-foreground">
                Products load ho rahe hain...
              </p>
            </div>
          </div>
        ) : products.length ===
          0 ? (
          <div className="mt-6">
            <EmptyState
              icon={
                PackageSearch
              }
              title="Koi product nahi mila"
              description="Filter change karein ya doosra keyword try karein."
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setQ("");
                    setDebouncedQ("");
                    setCat("all");
                    setActiveRootId(null);
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
              {products.map(
                (
                  product,
                ) => (
                  <ProductCard
                    key={
                      product.id
                    }
                    product={
                      product
                    }
                  />
                ),
              )}
            </div>

            {hasMore && (
              <div className="mt-8 flex justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  disabled={
                    loadingMore
                  }
                  onClick={() =>
                    void loadMore()
                  }
                >
                  {loadingMore && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}

                  {loadingMore
                    ? "Loading..."
                    : "Load more products"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </ShopLayout>
  );
}