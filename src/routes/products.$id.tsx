import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import {
  CheckCircle2,
  Share2,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Star,
  Store,
  Truck,
  Undo2,
  Wallet,
  Zap,
} from "lucide-react";

import { toast } from "sonner";

import { ShopLayout } from "@/components/shop/ShopLayout";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductReviews } from "@/components/shop/ProductReviews";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import {
  formatPKR,
  getVendorProfile,
  productImageFallback,
  productImageSource,
  type Product,
  type VendorProfile,
} from "@/data/mock";

import { useCart } from "@/lib/cart";
import { useStoreSettings } from "@/lib/store-info";
import { summarize, useProductReviews } from "@/lib/reviews";
import { useProductVariants, variantChoices, variantLabel } from "@/lib/variants";
import { VariantPicker, type VariantSelection } from "@/components/shop/VariantPicker";
import { supabase } from "@/lib/supabase";

/** Opens the phone's share sheet (WhatsApp etc.); on desktop, copies the link. */
async function shareProduct(name: string) {
  const url = window.location.href;
  try {
    if (navigator.share) {
      await navigator.share({ title: name, text: `${name} on azadari.store`, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success("Link copied. Paste it anywhere to share this product.");
  } catch (error) {
    // Closing the share sheet is not an error.
    if (error instanceof DOMException && error.name === "AbortError") return;
    toast.error("Couldn't share. Copy the link from the address bar instead.");
  }
}

export const Route = createFileRoute("/products/$id")({
  head: () => ({
    meta: [
      {
        title: "Product Detail — azadari.store",
      },
      {
        name: "description",
        content: "Product details, price and Cash on Delivery ordering on azadari.store.",
      },
      {
        property: "og:title",
        content: "Product Detail — azadari.store",
      },
      {
        property: "og:description",
        content: "Order with Cash on Delivery from verified Pakistani sellers.",
      },
    ],
  }),

  component: ProductDetail,
});

type DatabaseProductRow = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  images: string[] | null;

  price: number | string;
  compare_price: number | string | null;

  stock: number | null;
  category: string | null;

  vendor_id: string | null;

  active: boolean | null;
  featured: boolean | null;
  sales_count: number | null;
};

/*
 * Supabase product ko app ke Product
 * format mein convert karta hai.
 */
function mapDatabaseProduct(data: DatabaseProductRow): Product {
  return {
    id: data.id,

    name: data.name,

    slug: data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, ""),

    category: data.category ?? "Uncategorized",

    price: Number(data.price),

    oldPrice:
      data.compare_price !== null && data.compare_price !== undefined
        ? Number(data.compare_price)
        : undefined,

    stock: Number(data.stock ?? 0),

    active: Boolean(data.active),

    featured: Boolean(data.featured),

    salesCount: Number(data.sales_count ?? 0),

    /*
     * Actual vendor details neeche
     * vendors table se separately load hongi.
     */
    vendor: "azadari.store Seller",

    vendorId: data.vendor_id ?? undefined,

    city: "",

    rating: 0,

    reviews: 0,

    image: data.image || data.images?.[0] || "/favicon.ico",

    images: Array.isArray(data.images)
      ? data.images.filter(
          (image): image is string => typeof image === "string" && image.length > 0,
        )
      : data.image
        ? [data.image]
        : [],
    description: data.description ?? "",
  };
}

function ProductDetail() {
  const { returnWindowDays } = useStoreSettings();
  const { id } = Route.useParams();

  const { add, catalog } = useCart();

  /*
   * ------------------------------------------------
   * PRODUCT LOADING
   * ------------------------------------------------
   *
   * Pehle current catalog mein check karenge.
   *
   * Agar product current 24/48/etc products
   * mein nahi hai to Supabase se directly
   * product ID ke through fetch karenge.
   */

  const cachedProduct = catalog.find((item) => item.id === id);

  const [product, setProduct] = useState<Product | null>(cachedProduct ?? null);

  const [productLoading, setProductLoading] = useState(!cachedProduct);

  const [qty, setQty] = useState(1);

  const [activeTab, setActiveTab] = useState<"details" | "reviews" | "seller">("details");

  const [backendVendor, setBackendVendor] = useState<Partial<VendorProfile> | null>(null);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const [realFollowerCount, setRealFollowerCount] = useState(0);

  /*
   * ------------------------------------------------
   * LOAD PRODUCT
   * ------------------------------------------------
   */
  useEffect(() => {
    let cancelled = false;

    const loadProduct = async () => {
      /*
       * Product already current
       * catalog mein available hai.
       */
      if (cachedProduct) {
        if (!cancelled) {
          setProduct(cachedProduct);

          setProductLoading(false);
        }

        return;
      }

      /*
       * Current catalog mein nahi mila.
       *
       * Direct Supabase se fetch.
       */
      setProduct(null);
      setProductLoading(true);

      const { data, error } = await supabase
        .from("products")
        .select(
          `
            id,
            name,
            description,
            image,
            images,
            price,
            compare_price,
            stock,
            category,
            vendor_id,
            active,
            featured,
            sales_count
            `,
        )
        .eq("id", id)

        /*
         * Customer ko sirf approved/live
         * products open karne dein.
         */
        .eq("active", true)
        .maybeSingle();

      if (cancelled) {
        return;
      }

      if (error) {
        console.error("Unable to load product", error);

        setProduct(null);
        setProductLoading(false);

        return;
      }

      if (!data) {
        setProduct(null);
        setProductLoading(false);

        return;
      }

      const loadedProduct = mapDatabaseProduct(data as DatabaseProductRow);

      setProduct(loadedProduct);

      setProductLoading(false);
    };

    void loadProduct();

    return () => {
      cancelled = true;
    };
  }, [id, cachedProduct]);

  /*
   * ------------------------------------------------
   * LOAD VENDOR
   * ------------------------------------------------
   */
  useEffect(() => {
    let cancelled = false;

    setBackendVendor(null);
    setRealFollowerCount(0);

    if (!product?.vendorId) {
      return;
    }

    const loadVendor = async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select(
          `
            name,
            address,
            description,
            created_at
            `,
        )
        .eq("id", product.vendorId)
        .maybeSingle();

      if (!cancelled && !error && data) {
        setBackendVendor({
          name: data.name,

          city: data.address ?? "Pakistan",

          description: data.description ?? undefined,

          ...(data.created_at
            ? {
                joined: new Date(data.created_at).toLocaleDateString("en-PK", {
                  month: "long",

                  year: "numeric",
                }),
              }
            : {}),
        });
      }

      /*
       * Vendor follower count
       */
      const { data: count, error: followerError } = await supabase.rpc("vendor_follower_count", {
        target_vendor_id: product.vendorId,
      });

      if (followerError) {
        console.error("Unable to load vendor followers", followerError);
      }

      if (!cancelled) {
        setRealFollowerCount(Number(count ?? 0));
      }
    };

    void loadVendor();

    return () => {
      cancelled = true;
    };
  }, [product?.vendorId]);

  const productId = product?.id;

  const { data: variants = [] } = useProductVariants(productId);

  const [selection, setSelection] = useState<VariantSelection>({ size: null, color: null });

  const [missingOption, setMissingOption] = useState<"size" | "color" | null>(null);

  useEffect(() => {
    setSelection({ size: null, color: null });
    setMissingOption(null);
  }, [productId]);

  const { data: productReviews = [] } = useProductReviews(productId);

  const { rating, count: reviewCount } = summarize(productReviews);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [productId]);

  /*
   * ------------------------------------------------
   * PRODUCT LOADING SCREEN
   * ------------------------------------------------
   */
  if (productLoading) {
    return (
      <ShopLayout>
        <div className="mx-auto flex min-h-[420px] max-w-3xl items-center justify-center px-4 py-20">
          <div className="text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-muted border-t-primary" />

            <p className="mt-4 text-sm text-muted-foreground">Loading product...</p>
          </div>
        </div>
      </ShopLayout>
    );
  }

  /*
   * ------------------------------------------------
   * PRODUCT NOT FOUND
   * ------------------------------------------------
   */
  if (!product) {
    return (
      <ShopLayout>
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Product not found</h1>

          <p className="mt-2 text-sm text-muted-foreground">
            This product is no longer available or has been removed.
          </p>

          <Button asChild className="mt-4 rounded-xl">
            <Link to="/products">Back to products</Link>
          </Button>
        </div>
      </ShopLayout>
    );
  }

  /*
   * ------------------------------------------------
   * RELATED PRODUCTS
   * ------------------------------------------------
   */
  const related = catalog
    .filter((item) => item.category === product.category && item.id !== product.id)
    .slice(0, 4);

  const savedGalleryImages = Array.from(
    new Set([product.image, ...(product.images ?? [])].filter(Boolean)),
  );
  // Show each real photo once. Repeating one photo three times looks like a gallery but adds nothing.
  const galleryImages = savedGalleryImages.map((image) => productImageSource(product.name, image));
  const activeImage = galleryImages[selectedImageIndex] ?? product.image;

  /*
   * ------------------------------------------------
   * VENDOR
   * ------------------------------------------------
   */
  const vendor = {
    ...getVendorProfile(product.vendor, product.city || "Pakistan"),

    ...backendVendor,
  };

  /*
   * ------------------------------------------------
   * SIZE / COLOUR
   * ------------------------------------------------
   */
  const hasOptions = variants.length > 0;

  const choices = variantChoices(variants);

  const selectedVariant = hasOptions
    ? variants.find(
        (variant) =>
          (choices.sizes.length === 0 || variant.size === selection.size) &&
          (choices.colors.length === 0 || variant.color === selection.color),
      )
    : undefined;

  const availableStock = hasOptions ? (selectedVariant?.stock ?? 0) : product.stock;

  const cartVariant = selectedVariant
    ? { id: selectedVariant.id, size: selectedVariant.size, color: selectedVariant.color }
    : undefined;

  /** Stop and point at the missing choice instead of adding the wrong thing to the cart. */
  const readyToBuy = () => {
    if (!hasOptions) return true;
    const missing =
      choices.sizes.length > 0 && !selection.size
        ? "size"
        : choices.colors.length > 0 && !selection.color
          ? "color"
          : null;
    if (missing) {
      setMissingOption(missing);
      document
        .getElementById(missing === "size" ? "variant-size" : "variant-color")
        ?.querySelector<HTMLElement>("button:not(:disabled)")
        ?.focus();
      return false;
    }
    if (!selectedVariant || selectedVariant.stock === 0) {
      toast.error("This option is out of stock. Please choose another.");
      return false;
    }
    if (qty > selectedVariant.stock) {
      toast.error(`Only ${selectedVariant.stock} left in ${variantLabel(selectedVariant)}.`);
      return false;
    }
    return true;
  };

  /*
   * ------------------------------------------------
   * DISCOUNT
   * ------------------------------------------------
   */
  const discount =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round((1 - product.price / product.oldPrice) * 100)
      : 0;

  return (
    <ShopLayout>
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">
            Home
          </Link>

          {" / "}

          <Link to="/products" className="hover:text-primary">
            Products
          </Link>

          {" / "}

          <span className="text-foreground">{product.name}</span>
        </nav>

        {/* Main Product */}
        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(380px,0.92fr)]">
          {/* Images */}
          <div className="space-y-3">
            <div className="surface-card overflow-hidden bg-white">
              <img
                src={activeImage}
                alt={product.name}
                width={800}
                height={800}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = productImageFallback(product.name, activeImage);
                }}
                className="aspect-square w-full object-cover"
              />
            </div>

            {galleryImages.length > 1 && (
              <div className="grid max-w-sm grid-cols-3 gap-3">
                {galleryImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    className={`overflow-hidden rounded-xl border-2 bg-card transition-colors ${
                      selectedImageIndex === index
                        ? "border-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                    aria-label={`Show product image ${index + 1}`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} preview`}
                      width={160}
                      height={160}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = productImageFallback(product.name, image);
                      }}
                      className="aspect-square w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Information */}
          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {product.category}
              </p>

              <Button
                variant="outline"
                size="sm"
                className="shrink-0 rounded-full"
                onClick={() => void shareProduct(product.name)}
              >
                <Share2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Share
              </Button>
            </div>

            <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">{product.name}</h1>

            {/* Rating */}
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                <Star className={`h-4 w-4 text-warning ${rating > 0 ? "fill-warning" : ""}`} />

                {rating > 0 ? rating.toFixed(1) : "No ratings"}
              </span>

              <a
                href="#reviews"
                onClick={() => setActiveTab("reviews")}
                className="text-primary underline-offset-4 hover:underline"
              >
                {reviewCount > 0
                  ? `See ${reviewCount} ${reviewCount === 1 ? "rating" : "ratings"}`
                  : "Write a review"}
              </a>
            </div>

            {/* Price */}
            <div className="mt-4 flex items-baseline gap-3">
              <span className="font-display text-3xl font-extrabold text-primary">
                {formatPKR(product.price)}
              </span>

              {/* Only show a "was" price when it really was higher. */}
              {discount > 0 && product.oldPrice && (
                <span className="text-base text-muted-foreground line-through">
                  <span className="sr-only">Was </span>
                  {formatPKR(product.oldPrice)}
                </span>
              )}

              {discount > 0 && (
                <span className="rounded-md bg-destructive/10 px-2 py-1 text-xs font-bold text-destructive">
                  -{discount}%
                </span>
              )}
            </div>

            {/* Deal: only when there is a real saving */}
            {discount > 0 && product.oldPrice && (
              <div className="mt-3 rounded-xl border border-success/20 bg-success/5 p-3 text-sm">
                <p className="font-semibold text-success">
                  You save {formatPKR(product.oldPrice - product.price)}
                </p>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  The final price is confirmed when you place your order.
                </p>
              </div>
            )}

            {/* Stock */}
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span
                className={`h-2 w-2 rounded-full ${
                  product.stock > 0 ? "bg-success" : "bg-destructive"
                }`}
              />

              {product.stock === 0 ? (
                <span className="font-medium text-destructive">Out of stock</span>
              ) : hasOptions && selectedVariant ? (
                selectedVariant.stock > 0 ? (
                  <span>
                    {selectedVariant.stock <= 5 ? "Only " : ""}
                    <strong>{selectedVariant.stock}</strong> left in {variantLabel(selectedVariant)}
                  </span>
                ) : (
                  <span className="font-medium text-destructive">
                    {variantLabel(selectedVariant)} is out of stock
                  </span>
                )
              ) : hasOptions ? (
                <span>Choose your options to see stock</span>
              ) : (
                <span>
                  <strong>{product.stock} pieces</strong> available
                </span>
              )}
            </div>

            {/* Description */}
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>

            {/* Delivery */}
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-3">
                <Truck className="h-5 w-5 text-primary" />

                <div>
                  <p className="text-xs font-semibold">Delivery</p>

                  <p className="text-xs text-muted-foreground">2-4 days nationwide</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-3">
                <Wallet className="h-5 w-5 text-primary" />

                <div>
                  <p className="text-xs font-semibold">Payment</p>

                  <p className="text-xs text-muted-foreground">Cash on Delivery</p>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {hasOptions && (
              <div className="mb-5">
                <VariantPicker
                  variants={variants}
                  value={selection}
                  onChange={(next) => {
                    setSelection(next);
                    setMissingOption(null);
                    setQty(1);
                  }}
                  missing={missingOption}
                />
              </div>
            )}

            {/* Cart Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-xl border border-border">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQty((current) => Math.max(1, current - 1))}
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </Button>

                <span className="w-10 text-center text-sm font-semibold">{qty}</span>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setQty((current) =>
                      Math.min(
                        Math.max(1, availableStock),

                        current + 1,
                      ),
                    )
                  }
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <Button
                size="lg"
                className="flex-1 rounded-xl"
                disabled={product.stock === 0}
                onClick={() => {
                  if (!readyToBuy()) return;

                  add(product.id, qty, cartVariant);

                  toast.success("Added to cart", {
                    description: selectedVariant
                      ? `${product.name} (${variantLabel(selectedVariant)})`
                      : product.name,
                  });
                }}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Cart
              </Button>

              {product.stock > 0 ? (
                <Button asChild size="lg" variant="outline" className="flex-1 rounded-xl">
                  <Link
                    to="/checkout"
                    onClick={(event) => {
                      if (!readyToBuy()) {
                        event.preventDefault();
                        return;
                      }
                      add(product.id, qty, cartVariant);
                    }}
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    Buy Now
                  </Link>
                </Button>
              ) : (
                <Button size="lg" variant="outline" className="flex-1 rounded-xl" disabled>
                  <Zap className="mr-2 h-4 w-4" />
                  Buy Now
                </Button>
              )}
            </div>

            {/* Seller Card */}
            <div className="mt-5 rounded-2xl border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-primary-soft text-primary">
                  <Store className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Sold by</p>

                  <Link
                    to="/store/$vendorId"
                    params={{
                      vendorId: product.vendorId ?? product.vendor,
                    }}
                    className="font-bold text-primary hover:underline"
                  >
                    {vendor.name}
                  </Link>

                  <p className="text-xs text-muted-foreground">
                    {vendor.city}
                    {vendor.joined ? ` · Joined ${vendor.joined}` : ""}
                  </p>
                </div>

                <Button asChild variant="outline" size="sm" className="rounded-lg">
                  <Link
                    to="/store/$vendorId"
                    params={{
                      vendorId: product.vendorId ?? product.vendor,
                    }}
                  >
                    View Store
                  </Link>
                </Button>
              </div>

              <div className="mt-4 grid grid-cols-3 divide-x border-t pt-3 text-center">
                {/* Only real numbers here: no made-up seller ratings or response times. */}
                <div>
                  <p className="text-sm font-bold">{realFollowerCount.toLocaleString("en-PK")}</p>

                  <p className="text-[11px] text-muted-foreground">
                    {realFollowerCount === 1 ? "Follower" : "Followers"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-bold">{reviewCount > 0 ? rating.toFixed(1) : "New"}</p>

                  <p className="text-[11px] text-muted-foreground">
                    {reviewCount > 0 ? "Product rating" : "No ratings yet"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-bold">COD</p>

                  <p className="text-[11px] text-muted-foreground">Pay on delivery</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product tabs */}
        <section id="reviews" className="mt-12 scroll-mt-28">
          <div className="flex flex-wrap gap-2 border-b border-border">
            {[
              {
                id: "details",
                label: "Product Details",
              },

              {
                id: "reviews",
                label: `Ratings & Reviews (${reviewCount})`,
              },

              {
                id: "seller",
                label: "Seller Information",
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`border-b-2 px-3 py-3 text-sm font-semibold ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Details */}
          {activeTab === "details" && (
            <div className="grid gap-4 py-6 md:grid-cols-2">
              <div>
                <h2 className="text-lg font-bold">About this product</h2>

                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {product.description} Carefully selected so you get quality, value and reliable
                  delivery in one order.
                </p>
              </div>

              <div className="rounded-2xl bg-muted/60 p-4">
                <h3 className="font-bold">Why buy from azadari.store?</h3>

                <div className="mt-3 space-y-3 text-sm">
                  <p className="flex gap-2">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-success" />
                    Verified sellers and transparent ratings
                  </p>

                  <p className="flex gap-2">
                    <Undo2 className="h-4 w-4 shrink-0 text-success" />
                    {returnWindowDays > 0
                      ? `${returnWindowDays}-day return policy`
                      : "Returns only for damaged or wrong items"}
                  </p>

                  <p className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                    Secure COD delivery across Pakistan
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Reviews */}
          {activeTab === "reviews" && <ProductReviews productId={product.id} />}

          {/* Seller */}
          {activeTab === "seller" && (
            <div className="grid gap-6 py-6 md:grid-cols-[auto_1fr]">
              <div className="grid h-20 w-20 place-items-center rounded-full bg-primary-soft text-primary">
                <Store className="h-8 w-8" />
              </div>

              <div>
                <h2 className="text-xl font-bold">{vendor.name}</h2>

                <p className="mt-1 text-sm text-muted-foreground">{vendor.description}</p>

                <div className="mt-4 flex flex-wrap gap-3 text-xs">
                  <span className="rounded-full bg-success/10 px-3 py-1.5 font-semibold text-success">
                    Verified seller
                  </span>

                  <span className="rounded-full bg-muted px-3 py-1.5">
                    {realFollowerCount.toLocaleString("en-PK")} followers
                  </span>

                  <span className="rounded-full bg-muted px-3 py-1.5">{vendor.city}</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Related Products */}
        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="text-xl font-bold">Related Products</h2>

            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {related.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </section>
        )}
      </div>
    </ShopLayout>
  );
}
