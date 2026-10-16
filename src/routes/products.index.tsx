import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
  PackageSearch,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { ShopLayout } from "@/components/shop/ShopLayout";
import { ProductCard } from "@/components/shop/ProductCard";
import { EmptyState } from "@/components/dashboard/EmptyState";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { supabase } from "@/lib/supabase";
import type { Product, ProductRow } from "@/data/mock";

/* ============================================================
   CONFIG
============================================================ */

const PAGE_SIZE = 16;

const PRODUCT_LIST_SELECT =
  "id, name, image, images, price, compare_price, stock, category, vendor_id";

const CACHE_TTL = 30_000;

/* ============================================================
   TYPES
============================================================ */

function productCountText(shown: number, total: number | null) {
  const count = total ?? shown;
  if (count === 0) return "No products found";
  const noun = count === 1 ? "product" : "products";
  return shown < count
    ? `Showing ${shown.toLocaleString("en-PK")} of ${count.toLocaleString("en-PK")} ${noun}, all with Cash on Delivery`
    : `${count.toLocaleString("en-PK")} ${noun}, all with Cash on Delivery`;
}

type ProductPageResult = {
  products: Product[];
  hasMore: boolean;
  /** Total matching products; only counted for the first page. */
  total: number | null;
};

type CategoryRow = {
  id: string;
  name: string;
  parent_id: string | null;
  sort_order: number | null;
};

type ProductCategoryRow = {
  category?: string | null;
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

const pendingPages = new Map<string, Promise<ProductPageResult>>();

/* ============================================================
   ROUTE
============================================================ */

/** A whole, positive rupee amount from the URL or an input, or null. */
function toPrice(value: unknown): number | null {
  const amount = Math.floor(Number(value));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

const PRICE_PRESETS: Array<{ label: string; min: number | null; max: number | null }> = [
  { label: "Under Rs. 1,000", min: null, max: 1000 },
  { label: "Rs. 1,000 – 3,000", min: 1000, max: 3000 },
  { label: "Rs. 3,000 – 10,000", min: 3000, max: 10000 },
  { label: "Over Rs. 10,000", min: 10000, max: null },
];

function priceLabel(min: number | null, max: number | null) {
  const fmt = (n: number) => n.toLocaleString("en-PK");
  if (min !== null && max !== null) return `Rs. ${fmt(min)} – ${fmt(max)}`;
  if (min !== null) return `Over Rs. ${fmt(min)}`;
  if (max !== null) return `Under Rs. ${fmt(max)}`;
  return "Any price";
}

export const Route = createFileRoute("/products/")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { category?: string; q?: string; sort?: "popular" | "high"; min?: number; max?: number } => ({
    ...(typeof search["category"] === "string" ? { category: search["category"] } : {}),
    ...(typeof search["q"] === "string" && search["q"].trim() ? { q: search["q"].trim() } : {}),
    // Lowest price first is the default, so only the other choices appear in the URL.
    ...(search["sort"] === "popular" || search["sort"] === "high" ? { sort: search["sort"] } : {}),
    ...(toPrice(search["min"]) !== null ? { min: toPrice(search["min"]) as number } : {}),
    ...(toPrice(search["max"]) !== null ? { max: toPrice(search["max"]) as number } : {}),
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

function mapListProduct(item: ProductRow): Product {
  return {
    id: item.id,

    name: item.name ?? "",

    slug: String(item.name ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, ""),

    category: item.category ?? "Uncategorized",

    price: Number(item.price ?? 0),

    oldPrice:
      item.compare_price !== null && item.compare_price !== undefined
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

    images: Array.isArray(item.images)
      ? item.images.filter(
          (image: unknown): image is string => typeof image === "string" && image.length > 0,
        )
      : item.image
        ? [item.image]
        : [],

    description: "",
  };
}

/* ============================================================
   CATEGORY HELPERS
============================================================ */

/*
 * Selected category ke children / grandchildren.
 */

function getDescendantNames(categoryId: string, categories: CategoryRow[]) {
  const names: string[] = [];

  const visited = new Set<string>();

  const visit = (id: string) => {
    if (visited.has(id)) {
      return;
    }

    visited.add(id);

    const current = categories.find((item) => item.id === id);

    if (!current) {
      return;
    }

    names.push(current.name);

    const children = categories.filter((item) => item.parent_id === current.id);

    children.forEach((child) => visit(child.id));
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

function getAncestorNames(categoryId: string, categories: CategoryRow[]) {
  const names: string[] = [];

  let current = categories.find((item) => item.id === categoryId);

  const visited = new Set<string>();

  while (current) {
    if (visited.has(current.id)) {
      break;
    }

    visited.add(current.id);

    names.push(current.name);

    if (!current.parent_id) {
      break;
    }

    current = categories.find((item) => item.id === current?.parent_id);
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

function getCategoryFilterNames(categoryId: string, categories: CategoryRow[]) {
  const descendants = getDescendantNames(categoryId, categories);

  const ancestors = getAncestorNames(categoryId, categories);

  return Array.from(new Set([...descendants, ...ancestors]));
}

/*
 * Child category ka root/main category.
 */

function getRootCategoryId(categoryId: string, categories: CategoryRow[]) {
  let current = categories.find((item) => item.id === categoryId);

  const visited = new Set<string>();

  while (current?.parent_id) {
    if (visited.has(current.id)) {
      break;
    }

    visited.add(current.id);

    const parent = categories.find((item) => item.id === current?.parent_id);

    if (!parent) {
      break;
    }

    current = parent;
  }

  return current?.id ?? categoryId;
}

/* ============================================================
   GET PRODUCTS
============================================================ */

async function getProductPage({
  pageNum,
  categoryValues,
  search,
  sort,
  minPrice,
  maxPrice,
}: {
  pageNum: number;
  categoryValues: string[];
  search: string;
  sort: string;
  minPrice: number | null;
  maxPrice: number | null;
}): Promise<ProductPageResult> {
  const normalizedSearch = search.trim();

  const normalizedCategories = [...categoryValues].sort((a, b) => a.localeCompare(b));

  const cacheKey = JSON.stringify({
    pageNum,

    categories: normalizedCategories,

    search: normalizedSearch.toLowerCase(),

    sort,

    minPrice,

    maxPrice,
  });

  const now = Date.now();

  const cached = pageCache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    return cached.result;
  }

  const existingPending = pendingPages.get(cacheKey);

  if (existingPending) {
    return existingPending;
  }

  const request = (async () => {
    let query = (
      pageNum === 0
        ? supabase.from("products").select(PRODUCT_LIST_SELECT, { count: "exact" })
        : supabase.from("products").select(PRODUCT_LIST_SELECT)
    ).eq("active", true);

    /*
     * Multiple category names support.
     */

    if (normalizedCategories.length > 0) {
      query = query.in("category", normalizedCategories);
    }

    /*
     * Search.
     */

    if (normalizedSearch) {
      query = query.ilike("name", `%${normalizedSearch}%`);
    }

    /*
     * Price range.
     */

    if (minPrice !== null) {
      query = query.gte("price", minPrice);
    }

    if (maxPrice !== null) {
      query = query.lte("price", maxPrice);
    }

    /*
     * Sort.
     */

    if (sort === "high") {
      query = query.order("price", {
        ascending: false,
      });
    } else if (sort === "popular") {
      query = query
        .order("sales_count", {
          ascending: false,
        })
        .order("created_at", {
          ascending: false,
        });
    } else {
      // Default: cheapest products first.
      query = query.order("price", {
        ascending: true,
      });
    }

    // Tie-breaker so products with the same price always keep the same order.
    // Without it, "Load more" can repeat or skip products between pages.
    query = query.order("id", { ascending: true });

    const start = pageNum * PAGE_SIZE;

    const end = start + PAGE_SIZE;

    const { data, error, count } = await query.range(start, end);

    if (error) {
      throw error;
    }

    const rows = data ?? [];

    const visibleRows = rows.slice(0, PAGE_SIZE);

    const result: ProductPageResult = {
      products: visibleRows.map(mapListProduct),

      hasMore: rows.length > PAGE_SIZE,

      total: count ?? null,
    };

    pageCache.set(cacheKey, {
      expiresAt: Date.now() + CACHE_TTL,

      result,
    });

    return result;
  })();

  pendingPages.set(cacheKey, request);

  try {
    return await request;
  } finally {
    pendingPages.delete(cacheKey);
  }
}

/* ============================================================
   PRODUCTS PAGE
============================================================ */

function ProductsPage() {
  const {
    category,
    q: searchFromUrl,
    sort: sortFromUrl,
    min: minFromUrl,
    max: maxFromUrl,
  } = Route.useSearch();

  const minPrice = minFromUrl ?? null;

  const maxPrice = maxFromUrl ?? null;

  const priceActive = minPrice !== null || maxPrice !== null;

  const [priceOpen, setPriceOpen] = useState(false);

  const [minDraft, setMinDraft] = useState(minPrice?.toString() ?? "");

  const [maxDraft, setMaxDraft] = useState(maxPrice?.toString() ?? "");

  const [priceError, setPriceError] = useState("");

  const navigate = useNavigate({ from: "/products/" });

  /* Search */

  const [q, setQ] = useState(searchFromUrl ?? "");

  const [debouncedQ, setDebouncedQ] = useState(searchFromUrl ?? "");

  /*
   * The header search box sends people here with ?q=...
   * Follow it, even when they search again while already on this page.
   */
  useEffect(() => {
    setQ(searchFromUrl ?? "");
    setDebouncedQ(searchFromUrl ?? "");
  }, [searchFromUrl]);

  /* Selected category */

  const [cat, setCat] = useState(category ?? "all");

  /* Sort */

  const [sort, setSortState] = useState<string>(sortFromUrl ?? "low");

  // Keep the chosen order in the URL, so it survives a refresh or a shared link.
  const setSort = (value: string) => {
    setSortState(value);
    void navigate({
      search: (previous) => {
        const next = { ...previous };
        if (value === "popular" || value === "high") next.sort = value;
        else delete next.sort;
        return next;
      },
      replace: true,
    });
  };

  useEffect(() => {
    setSortState(sortFromUrl ?? "low");
  }, [sortFromUrl]);

  // Keep the inputs in step with the URL (presets, chip removal, back button).
  useEffect(() => {
    setMinDraft(minPrice?.toString() ?? "");
    setMaxDraft(maxPrice?.toString() ?? "");
    setPriceError("");
  }, [minPrice, maxPrice]);

  const setPriceRange = (min: number | null, max: number | null) => {
    void navigate({
      search: (previous) => {
        const next = { ...previous };
        if (min !== null) next.min = min;
        else delete next.min;
        if (max !== null) next.max = max;
        else delete next.max;
        return next;
      },
      replace: true,
    });
  };

  const applyCustomPrice = () => {
    const min = minDraft.trim() ? toPrice(minDraft) : null;
    const max = maxDraft.trim() ? toPrice(maxDraft) : null;
    if ((minDraft.trim() && min === null) || (maxDraft.trim() && max === null)) {
      setPriceError("Enter whole rupee amounts, like 500.");
      return;
    }
    if (min !== null && max !== null && min > max) {
      setPriceError("The minimum can't be more than the maximum.");
      return;
    }
    setPriceError("");
    setPriceRange(min, max);
    setPriceOpen(false);
  };

  /* Category tree */

  const [categories, setCategories] = useState<CategoryRow[]>([]);

  /*
   * Active products mein jo category names
   * actually use ho rahe hain.
   *
   * null = abhi load nahi huay / load fail hua.
   */

  const [activeProductCategoryNames, setActiveProductCategoryNames] = useState<Set<string> | null>(
    null,
  );

  /* Menu */

  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);

  const [activeRootId, setActiveRootId] = useState<string | null>(null);

  const categoryMenuRef = useRef<HTMLDivElement | null>(null);

  /* Products */

  const [products, setProducts] = useState<Product[]>([]);

  const [page, setPage] = useState(0);

  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);

  const [loadingMore, setLoadingMore] = useState(false);

  const requestIdRef = useRef(0);

  /* ========================================================
     URL CATEGORY
  ======================================================== */

  useEffect(() => {
    if (category) {
      setCat(category);
    }
  }, [category]);

  /* ========================================================
     SEARCH DEBOUNCE
  ======================================================== */

  useEffect(() => {
    const timer = window.setTimeout(
      () => {
        setDebouncedQ(q.trim());
      },

      350,
    );

    return () => {
      window.clearTimeout(timer);
    };
  }, [q]);

  /* ========================================================
     LOAD CATEGORY TREE
  ======================================================== */

  useEffect(() => {
    let cancelled = false;

    const loadCategories = async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, parent_id, sort_order")
        .eq("active", true)
        .order("sort_order", {
          ascending: true,
        })
        .order("name", {
          ascending: true,
        });

      if (cancelled) {
        return;
      }

      if (error) {
        console.error("Unable to load category tree", error);

        return;
      }

      setCategories((data ?? []) as CategoryRow[]);
    };

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ========================================================
     LOAD ACTIVE PRODUCT CATEGORY NAMES

     Customer-facing menu mein sirf woh category/subcategory
     show hogi jahan kam az kam 1 ACTIVE product ho.
  ======================================================== */

  useEffect(() => {
    let cancelled = false;

    const loadActiveProductCategoryNames = async () => {
      try {
        const names = new Set<string>();

        const chunkSize = 1000;

        let offset = 0;

        while (true) {
          const { data, error } = await supabase
            .from("products")
            .select("category")
            .eq("active", true)
            .range(offset, offset + chunkSize - 1);

          if (error) {
            throw error;
          }

          const rows: ProductCategoryRow[] = (data ?? []) as ProductCategoryRow[];

          rows.forEach((row) => {
            const categoryName =
              typeof row.category === "string" ? row.category.trim().toLowerCase() : "";

            if (categoryName) {
              names.add(categoryName);
            }
          });

          if (rows.length < chunkSize) {
            break;
          }

          offset += chunkSize;
        }

        if (cancelled) {
          return;
        }

        setActiveProductCategoryNames(names);
      } catch (error) {
        console.error("Unable to load active product category names", error);

        /*
         * Agar ye query fail ho jaye
         * to menu completely disappear nahi hoga.
         */

        if (!cancelled) {
          setActiveProductCategoryNames(null);
        }
      }
    };

    void loadActiveProductCategoryNames();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ========================================================
     VISIBLE CATEGORY IDS

     Rule:
     - Category ke khud active products hon -> show
     - Ya uske kisi child ke active products hon -> parent show
     - Warna storefront se hide
  ======================================================== */

  const visibleCategoryIds = useMemo(() => {
    /*
     * Product query abhi load nahi hui
     * ya fail hui ho to safe fallback.
     */

    if (activeProductCategoryNames === null) {
      return new Set(categories.map((item) => item.id));
    }

    const visibleIds = new Set<string>();

    categories.forEach((item) => {
      const namesInTree = getDescendantNames(item.id, categories);

      const hasActiveProduct = namesInTree.some((name) =>
        activeProductCategoryNames.has(name.trim().toLowerCase()),
      );

      if (hasActiveProduct) {
        visibleIds.add(item.id);
      }
    });

    return visibleIds;
  }, [categories, activeProductCategoryNames]);

  /* ========================================================
     ROOT CATEGORIES
  ======================================================== */

  const rootCategories = useMemo(
    () => categories.filter((item) => item.parent_id === null && visibleCategoryIds.has(item.id)),
    [categories, visibleCategoryIds],
  );

  /*
   * Agar URL ya purani selection kisi aisi category par ho
   * jahan ab koi active product nahi, to safe reset.
   */

  useEffect(() => {
    if (cat === "all" || activeProductCategoryNames === null) {
      return;
    }

    const current = categories.find((item) => item.name === cat);

    if (current && !visibleCategoryIds.has(current.id)) {
      setCat("all");

      setActiveRootId(null);
    }
  }, [cat, categories, visibleCategoryIds, activeProductCategoryNames]);

  /* ========================================================
     SELECTED CATEGORY
  ======================================================== */

  const selectedCategory = useMemo(() => {
    if (cat === "all") {
      return null;
    }

    return categories.find((item) => item.name === cat) ?? null;
  }, [cat, categories]);

  /* ========================================================
     SELECTED ROOT
  ======================================================== */

  const selectedRootId = useMemo(() => {
    if (!selectedCategory) {
      return null;
    }

    return getRootCategoryId(selectedCategory.id, categories);
  }, [selectedCategory, categories]);

  /* ========================================================
     ACTIVE ROOT
  ======================================================== */

  const activeRoot = useMemo(() => {
    if (!activeRootId) {
      return null;
    }

    return rootCategories.find((item) => item.id === activeRootId) ?? null;
  }, [activeRootId, rootCategories]);

  /* ========================================================
     CHILDREN
  ======================================================== */

  const activeChildren = useMemo(() => {
    if (!activeRoot) {
      return [];
    }

    return categories.filter(
      (item) => item.parent_id === activeRoot.id && visibleCategoryIds.has(item.id),
    );
  }, [categories, activeRoot, visibleCategoryIds]);

  /* ========================================================
     PRODUCT FILTER VALUES
  ======================================================== */

  const categoryFilterValues = useMemo(() => {
    if (cat === "all") {
      return [];
    }

    /*
     * Categories load hone se pehle fallback.
     */

    if (!selectedCategory) {
      return [cat];
    }

    /*
     * Temporary compatibility:
     * child + ancestors + descendants.
     */

    return getCategoryFilterNames(selectedCategory.id, categories);
  }, [cat, selectedCategory, categories]);

  /* ========================================================
     CLICK OUTSIDE
  ======================================================== */

  useEffect(() => {
    if (!categoryMenuOpen) {
      return;
    }

    const handleMouseDown = (event: MouseEvent) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setCategoryMenuOpen(false);

        setActiveRootId(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCategoryMenuOpen(false);

        setActiveRootId(null);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);

      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [categoryMenuOpen]);

  /* ========================================================
     MENU TOGGLE
  ======================================================== */

  const toggleCategoryMenu = () => {
    if (categoryMenuOpen) {
      setCategoryMenuOpen(false);

      setActiveRootId(null);

      return;
    }

    /*
     * Fresh open:
     * Explore hidden.
     */

    setActiveRootId(null);

    setCategoryMenuOpen(true);
  };

  /* ========================================================
     SELECT CATEGORY
  ======================================================== */

  const selectProductCategory = (categoryName: string) => {
    setCat(categoryName);

    setCategoryMenuOpen(false);

    setActiveRootId(null);
  };

  /* ========================================================
     FETCH PRODUCTS
  ======================================================== */

  const fetchPage = useCallback(
    async (pageNum: number, replace: boolean) => {
      const requestId = ++requestIdRef.current;

      try {
        const result = await getProductPage({
          pageNum,

          categoryValues: categoryFilterValues,

          search: debouncedQ,

          sort,

          minPrice,

          maxPrice,
        });

        if (requestId !== requestIdRef.current) {
          return;
        }

        setProducts((previous) => {
          if (replace) {
            return result.products;
          }

          const merged = [...previous, ...result.products];

          return Array.from(new Map(merged.map((product) => [product.id, product])).values());
        });

        setHasMore(result.hasMore);

        if (replace) setTotalCount(result.total);

        setPage(pageNum);
      } catch (error) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        console.error("Unable to load products", error);

        if (replace) {
          setProducts([]);
          setTotalCount(null);
        }

        setHasMore(false);
      }
    },
    [categoryFilterValues, debouncedQ, sort, minPrice, maxPrice],
  );

  /* ========================================================
     FILTER CHANGE
  ======================================================== */

  useEffect(() => {
    let active = true;

    setLoading(true);

    setLoadingMore(false);

    setPage(0);

    void fetchPage(0, true).finally(() => {
      if (active) {
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [fetchPage]);

  /* ========================================================
     LOAD MORE
  ======================================================== */

  const loadMore = async () => {
    if (loadingMore || !hasMore) {
      return;
    }

    setLoadingMore(true);

    try {
      await fetchPage(page + 1, false);
    } finally {
      setLoadingMore(false);
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
          {cat === "all" ? "All Products" : cat}
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          {loading ? "Loading products..." : productCountText(products.length, totalCount)}
        </p>

        {/* =================================================
            FILTER BAR
        ================================================= */}

        <div className="mt-6 grid gap-3 rounded-2xl border border-[#d8cdae]/70 bg-[#fffdf7] p-4 shadow-[0_4px_16px_rgba(8,43,33,0.05)] sm:grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
          {/* Search */}

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Search products..."
              aria-label="Search products"
              className="h-10 rounded-xl border-[#d8cdae] bg-white pl-9 focus-visible:ring-[#c9a24b]"
            />
          </div>

          {/* =================================================
              CATEGORY MENU
          ================================================= */}

          <div
            ref={categoryMenuRef}
            className="relative"
            onMouseLeave={() => {
              setCategoryMenuOpen(false);
              setActiveRootId(null);
            }}
          >
            <button
              type="button"
              aria-label="Filter by category"
              aria-expanded={categoryMenuOpen}
              onClick={toggleCategoryMenu}
              className="flex h-10 w-full items-center justify-between gap-3 rounded-xl border border-[#d8cdae] bg-white px-3 text-left text-sm text-[#243b32] shadow-sm transition hover:border-[#c9a24b] focus:outline-none focus:ring-2 focus:ring-[#c9a24b]/30 sm:w-52"
            >
              <span className="min-w-0 truncate">{cat === "all" ? "All Categories" : cat}</span>

              <ChevronDown
                className={`h-4 w-4 shrink-0 text-[#66736c] transition-transform ${
                  categoryMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {categoryMenuOpen && (
              <div
                className={`absolute right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-[#ddd5c2] bg-white shadow-[0_18px_50px_rgba(8,43,33,0.22)] ${
                  activeRoot ? "w-[min(620px,calc(100vw-32px))]" : "w-[min(260px,calc(100vw-32px))]"
                }`}
              >
                <div
                  className={
                    activeRoot
                      ? "grid max-h-110 grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] sm:min-h-90 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] sm:grid-rows-1"
                      : "block max-h-110"
                  }
                >
                  {/* LEFT */}

                  <div
                    className={`overflow-y-auto bg-[#fffdf7] py-2 ${
                      activeRoot
                        ? "min-h-0 border-b border-[#e7e0d1] sm:border-b-0 sm:border-r"
                        : "max-h-110"
                    }`}
                  >
                    <button
                      type="button"
                      onMouseEnter={() => setActiveRootId(null)}
                      onClick={() => selectProductCategory("all")}
                      className={`flex min-h-10 w-full items-center justify-between gap-2 px-4 py-2 text-left text-sm ${
                        cat === "all"
                          ? "bg-[#edf4ef] font-semibold text-[#0b513b]"
                          : "text-[#59655f] hover:bg-[#f3efe5] hover:text-[#0b513b]"
                      }`}
                    >
                      All Categories
                      {cat === "all" && <Check className="h-4 w-4" />}
                    </button>

                    {rootCategories.map((root) => {
                      const children = categories.filter(
                        (item) => item.parent_id === root.id && visibleCategoryIds.has(item.id),
                      );

                      const isActive = activeRootId === root.id;

                      const selectedInside = selectedRootId === root.id;

                      return (
                        <button
                          key={root.id}
                          type="button"
                          onMouseEnter={() => setActiveRootId(root.id)}
                          onFocus={() => setActiveRootId(root.id)}
                          onClick={() => setActiveRootId(root.id)}
                          className={`flex min-h-10 w-full items-center justify-between gap-2 px-4 py-2 text-left text-sm ${
                            isActive
                              ? "bg-[#edf4ef] font-semibold text-[#0b513b]"
                              : selectedInside
                                ? "font-semibold text-[#0b513b]"
                                : "text-[#59655f] hover:bg-[#f3efe5] hover:text-[#0b513b]"
                          }`}
                        >
                          <span className="truncate">{root.name}</span>

                          {children.length > 0 && (
                            <ChevronRight className="h-4 w-4 shrink-0 text-[#c09435]" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* RIGHT */}

                  {activeRoot && (
                    <div className="min-h-0 overflow-y-auto bg-white p-4">
                      <div className="border-b border-[#eee7d8] pb-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9a7927]">
                          Explore
                        </p>

                        <h3 className="mt-1 text-lg font-extrabold text-[#102d24]">
                          {activeRoot.name}
                        </h3>
                      </div>

                      {/* Root */}

                      <button
                        type="button"
                        onClick={() => selectProductCategory(activeRoot.name)}
                        className={`mt-2 flex min-h-10 w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold ${
                          cat === activeRoot.name
                            ? "bg-[#edf4ef] text-[#0b513b]"
                            : "text-[#0b513b] hover:bg-[#f7f1e4]"
                        }`}
                      >
                        <span>View all {activeRoot.name}</span>

                        {cat === activeRoot.name && <Check className="h-4 w-4" />}
                      </button>

                      {/* Children */}

                      {activeChildren.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {activeChildren.map((child) => (
                            <button
                              key={child.id}
                              type="button"
                              onClick={() => selectProductCategory(child.name)}
                              className={`flex min-h-10 w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                                cat === child.name
                                  ? "bg-[#edf4ef] font-semibold text-[#0b513b]"
                                  : "text-[#647069] hover:bg-[#f7f1e4] hover:text-[#0b513b]"
                              }`}
                            >
                              <span>{child.name}</span>

                              {cat === child.name && <Check className="h-4 w-4" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Price */}

          <Popover open={priceOpen} onOpenChange={setPriceOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                aria-label={`Filter by price: ${priceLabel(minPrice, maxPrice)}`}
                className={`h-10 w-full justify-between rounded-xl border-[#d8cdae] bg-white font-normal sm:w-48 ${
                  priceActive ? "border-[#0b513b] text-[#0b513b]" : "text-[#102d24]"
                }`}
              >
                <span className="truncate">{priceLabel(minPrice, maxPrice)}</span>
                <ChevronDown aria-hidden="true" className="ml-2 h-4 w-4 shrink-0 opacity-60" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-4">
              <p className="text-sm font-semibold text-[#102d24]">Price range</p>

              <div className="mt-3 grid grid-cols-2 gap-2">
                {PRICE_PRESETS.map((preset) => {
                  const selected = preset.min === minPrice && preset.max === maxPrice;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        setPriceRange(preset.min, preset.max);
                        setPriceOpen(false);
                      }}
                      className={`rounded-xl border px-3 py-2 text-left text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b] ${
                        selected
                          ? "border-[#0b513b] bg-[#e8f1eb] text-[#0b513b]"
                          : "border-[#e2d8bf] hover:bg-[#f7f1e4]"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              <form
                className="mt-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  applyCustomPrice();
                }}
              >
                <p className="text-xs font-semibold text-[#5f6d65]">Or set your own (Rs.)</p>
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    inputMode="numeric"
                    aria-label="Minimum price in rupees"
                    placeholder="Min"
                    value={minDraft}
                    onChange={(event) => {
                      setMinDraft(event.target.value.replace(/[^0-9]/g, ""));
                      setPriceError("");
                    }}
                    className="h-9 rounded-lg"
                  />
                  <span aria-hidden="true" className="text-[#89938e]">
                    –
                  </span>
                  <Input
                    inputMode="numeric"
                    aria-label="Maximum price in rupees"
                    placeholder="Max"
                    value={maxDraft}
                    onChange={(event) => {
                      setMaxDraft(event.target.value.replace(/[^0-9]/g, ""));
                      setPriceError("");
                    }}
                    className="h-9 rounded-lg"
                  />
                </div>
                {priceError && (
                  <p className="mt-2 text-xs text-destructive" role="alert">
                    {priceError}
                  </p>
                )}
                <div className="mt-3 flex justify-between gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={!priceActive && !minDraft && !maxDraft}
                    onClick={() => {
                      setMinDraft("");
                      setMaxDraft("");
                      setPriceRange(null, null);
                      setPriceOpen(false);
                    }}
                  >
                    Clear
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="rounded-lg bg-[#082b21] text-[#fffaf0] hover:bg-[#0d3d2f]"
                  >
                    Apply
                  </Button>
                </div>
              </form>
            </PopoverContent>
          </Popover>

          {/* Sort */}

          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger
              aria-label="Sort products"
              className="h-10 w-full rounded-xl border-[#d8cdae] bg-white sm:w-52"
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />

              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="low">Lowest price first</SelectItem>

              <SelectItem value="high">Highest price first</SelectItem>

              <SelectItem value="popular">Most popular</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active price filter: always visible, removable in one click */}

        {priceActive && (
          <div className="mt-3 flex flex-wrap items-center gap-2" aria-live="polite">
            <span className="text-xs text-[#6f7d75]">Filtered by price:</span>
            <button
              type="button"
              onClick={() => setPriceRange(null, null)}
              aria-label={`Remove price filter ${priceLabel(minPrice, maxPrice)}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#0b513b]/30 bg-[#e8f1eb] px-3 py-1 text-xs font-semibold text-[#0b513b] hover:bg-[#d8e8dc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b]"
            >
              {priceLabel(minPrice, maxPrice)}
              <X aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* LOADING */}

        {loading ? (
          <div className="flex min-h-64 items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#0b513b]" />

              <p className="mt-3 text-sm text-muted-foreground">Loading products...</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={PackageSearch}
              title="No products found"
              description="Try changing the filters or searching for something else."
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setQ("");
                    setDebouncedQ("");
                    setCat("all");
                    setActiveRootId(null);
                    // Also clears the price range, search and sort kept in the URL.
                    void navigate({ search: {}, replace: true });
                  }}
                >
                  Reset all filters
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {hasMore && (
              <div className="mt-8 flex justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  disabled={loadingMore}
                  onClick={() => void loadMore()}
                >
                  {loadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}

                  {loadingMore ? "Loading..." : "Load more products"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </ShopLayout>
  );
}
