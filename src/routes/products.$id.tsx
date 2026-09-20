import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Heart,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { formatPKR, getVendorProfile, type VendorProfile } from "@/data/mock";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/products/$id")({
  head: () => ({
    meta: [
      { title: "Product Detail — Dukaan.pk" },
      {
        name: "description",
        content: "Product details, price and Cash on Delivery ordering on Dukaan.pk.",
      },
      { property: "og:title", content: "Product Detail — Dukaan.pk" },
      {
        property: "og:description",
        content: "Order with Cash on Delivery from verified Pakistani sellers.",
      },
    ],
  }),
  component: ProductDetail,
});

type ProductReview = {
  id: string;
  reviewer_name: string;
  rating: number;
  title: string | null;
  body: string;
  created_at: string;
  user_id: string;
};

function ProductDetail() {
  const { id } = Route.useParams();
  const { add, catalog } = useCart();
  const { user, profile } = useAuth();
  const product = catalog.find((p) => p.id === id);
  const [qty, setQty] = useState(1);
  const [liked, setLiked] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "reviews" | "seller">("details");
  const [backendVendor, setBackendVendor] = useState<Partial<VendorProfile> | null>(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewBody, setReviewBody] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);
  const [realFollowerCount, setRealFollowerCount] = useState(0);

  useEffect(() => {
    if (!product?.vendorId) return;
    const loadVendor = async () => {
      const { data } = await supabase
        .from("vendors")
        .select("name, address, description, created_at")
        .eq("id", product.vendorId)
        .maybeSingle();
      if (data) {
        setBackendVendor({
          name: data.name,
          city: data.address ?? "Pakistan",
          description: data.description ?? undefined,
          joined: data.created_at
            ? new Date(data.created_at).toLocaleDateString("en-PK", {
                month: "long",
                year: "numeric",
              })
            : undefined,
        });
      }

      const { data: count } = await supabase.rpc("vendor_follower_count", { target_vendor_id: product.vendorId });
      setRealFollowerCount(Number(count ?? 0));
    };
    void loadVendor();
  }, [product?.vendorId]);

  useEffect(() => {
    if (!product) return;
    setSelectedImage(product.image);

    const loadReviews = async () => {
      setReviewsLoading(true);
      const { data, error } = await supabase
        .from("product_reviews")
        .select("id, reviewer_name, rating, title, body, created_at, user_id")
        .eq("product_id", product.id)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Unable to load product reviews", error);
        setReviews([]);
      } else {
        setReviews((data ?? []).map((review) => ({ ...review, rating: Number(review.rating) })));
      }
      setReviewsLoading(false);
    };

    void loadReviews();
  }, [product]);

  if (!product) {
    return (
      <ShopLayout>
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Product not found</h1>
          <Button asChild className="mt-4 rounded-xl">
            <Link to="/products">Back to products</Link>
          </Button>
        </div>
      </ShopLayout>
    );
  }

  const related = catalog
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);
  const galleryImages = [product.image];
  const reviewCount = reviews.length;
  const rating =
    reviewCount === 0 ? 0 : reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount;
  const vendor = {
    ...getVendorProfile(product.vendor, product.city || "Pakistan"),
    ...backendVendor,
  };
  const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;

  const submitReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      toast.error("Review dene ke liye login karein.");
      return;
    }
    if (reviewBody.trim().length < 3) {
      toast.error("Review kam az kam 3 characters ka likhein.");
      return;
    }

    setReviewSaving(true);
    const { data, error } = await supabase
      .from("product_reviews")
      .upsert(
        {
          product_id: product.id,
          user_id: user.id,
          reviewer_name: profile?.name || user.email?.split("@")[0] || "Customer",
          rating: reviewRating,
          title: reviewTitle.trim() || null,
          body: reviewBody.trim(),
        },
        { onConflict: "product_id,user_id" },
      )
      .select("id, reviewer_name, rating, title, body, created_at, user_id")
      .single();
    setReviewSaving(false);

    if (error || !data) {
      toast.error(error?.message || "Review save nahi ho saka.");
      return;
    }

    setReviews((current) => [
      { ...data, rating: Number(data.rating) },
      ...current.filter((review) => review.id !== data.id && review.user_id !== user.id),
    ]);
    setReviewTitle("");
    setReviewBody("");
    toast.success("Aapka review save ho gaya.");
  };

  return (
    <ShopLayout>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <nav className="text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">
            Home
          </Link>{" "}
          /{" "}
          <Link to="/products" className="hover:text-primary">
            Products
          </Link>{" "}
          / <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(380px,0.92fr)]">
          <div className="space-y-3">
            <div className="surface-card overflow-hidden bg-white">
              <img
                src={selectedImage || product.image}
                alt={product.name}
                width={800}
                height={800}
                className="aspect-square w-full object-cover"
              />
            </div>
            <div className="grid max-w-sm grid-cols-3 gap-3">
              {galleryImages.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setSelectedImage(image)}
                  className={`overflow-hidden rounded-xl border-2 bg-card transition-colors ${selectedImage === image ? "border-primary" : "border-border hover:border-primary/50"}`}
                  aria-label={`Show product image ${index + 1}`}
                >
                  <img
                    src={image}
                    alt=""
                    width={160}
                    height={160}
                    className="aspect-square w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {product.category}
              </p>
              <Button
                variant="outline"
                size="icon"
                className={`rounded-full ${liked ? "text-destructive" : ""}`}
                aria-label="Save product"
                onClick={() => setLiked((value) => !value)}
              >
                <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
              </Button>
            </div>
            <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">{product.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                <Star className={`h-4 w-4 text-warning ${rating > 0 ? "fill-warning" : ""}`} />{" "}
                {rating > 0 ? rating.toFixed(1) : "No ratings"}
              </span>
              <a href="#reviews" className="text-primary underline-offset-4 hover:underline">
                {reviewCount} ratings
              </a>
            </div>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="font-display text-3xl font-extrabold text-primary">
                {formatPKR(product.price)}
              </span>
              {product.oldPrice && (
                <span className="text-base text-muted-foreground line-through">
                  {formatPKR(product.oldPrice)}
                </span>
              )}
              {discount > 0 && (
                <span className="rounded-md bg-destructive/10 px-2 py-1 text-xs font-bold text-destructive">
                  -{discount}%
                </span>
              )}
            </div>
            <div className="mt-3 rounded-xl border border-success/20 bg-success/5 p-3 text-sm">
              <p className="font-semibold text-success">Flash deal price</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Limited stock offer. Price checkout par lock ho jayegi.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="h-2 w-2 rounded-full bg-success" />
              {product.stock > 0 ? (
                <span>
                  <strong>{product.stock} pieces</strong> available
                </span>
              ) : (
                <span className="font-medium text-destructive">Out of stock</span>
              )}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>

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

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-xl border border-border">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-10 text-center text-sm font-semibold">{qty}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQty((q) => Math.min(product.stock || 1, q + 1))}
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
                  add(product.id, qty);
                  toast.success("Cart mein add ho gaya", { description: product.name });
                }}
              >
                <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
              </Button>
              <Button asChild size="lg" variant="outline" className="flex-1 rounded-xl">
                <Link to="/checkout" onClick={() => add(product.id, qty)}>
                  <Zap className="mr-2 h-4 w-4" /> Buy Now
                </Link>
              </Button>
            </div>

            <div className="mt-5 rounded-2xl border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-primary-soft text-primary">
                  <Store className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Sold by</p>
                  <Link
                    to="/store/$vendorId"
                    params={{ vendorId: product.vendorId ?? product.vendor }}
                    className="font-bold text-primary hover:underline"
                  >
                    {vendor.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {vendor.city} · Joined {vendor.joined}
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="rounded-lg">
                  <Link
                    to="/store/$vendorId"
                    params={{ vendorId: product.vendorId ?? product.vendor }}
                  >
                    View Store
                  </Link>
                </Button>
              </div>
              <div className="mt-4 grid grid-cols-3 divide-x border-t pt-3 text-center">
                <div>
                  <p className="text-sm font-bold">{vendor.rating}</p>
                  <p className="text-[11px] text-muted-foreground">Seller rating</p>
                </div>
                <div>
                  <p className="text-sm font-bold">{vendor.responseRate}</p>
                  <p className="text-[11px] text-muted-foreground">Chat response</p>
                </div>
                <div>
                  <p className="text-sm font-bold">{vendor.responseTime}</p>
                  <p className="text-[11px] text-muted-foreground">Response time</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section id="reviews" className="mt-12">
          <div className="flex flex-wrap gap-2 border-b border-border">
            {[
              { id: "details", label: "Product Details" },
              { id: "reviews", label: `Ratings & Reviews (${reviewCount})` },
              { id: "seller", label: "Seller Information" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`border-b-2 px-3 py-3 text-sm font-semibold ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "details" && (
            <div className="grid gap-4 py-6 md:grid-cols-2">
              <div>
                <h2 className="text-lg font-bold">About this product</h2>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {product.description} Yeh item carefully selected hai taa-ke aapko quality, value
                  aur reliable delivery ek hi order mein mil sake.
                </p>
              </div>
              <div className="rounded-2xl bg-muted/60 p-4">
                <h3 className="font-bold">Why buy from Dukaan.pk?</h3>
                <div className="mt-3 space-y-3 text-sm">
                  <p className="flex gap-2">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-success" /> Verified sellers aur
                    transparent ratings
                  </p>
                  <p className="flex gap-2">
                    <Undo2 className="h-4 w-4 shrink-0 text-success" /> 7-day return policy
                  </p>
                  <p className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" /> Secure COD delivery
                    across Pakistan
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="grid gap-6 py-6 lg:grid-cols-[260px_1fr]">
              <div className="rounded-2xl bg-muted/60 p-5 text-center">
                <p className="font-display text-5xl font-extrabold">
                  {rating > 0 ? rating.toFixed(1) : "—"}
                </p>
                <div className="mt-2 flex justify-center text-warning">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${star <= Math.round(rating) ? "fill-current" : "text-border"}`}
                    />
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Based on {reviewCount} verified ratings
                </p>
              </div>
              <div className="space-y-6">
                {/* Review likhne ka form */}
                <form onSubmit={submitReview} className="rounded-2xl border border-border p-4">
                  <h3 className="text-sm font-bold">Apna review likhein</h3>
                  <div className="mt-3 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        aria-label={`Rate ${star} stars`}
                      >
                        <Star
                          className={`h-6 w-6 ${star <= reviewRating ? "fill-warning text-warning" : "text-border"}`}
                        />
                      </button>
                    ))}
                  </div>
                  <Input
                    className="mt-3 rounded-xl"
                    placeholder="Title (optional)"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                  />
                  <Textarea
                    className="mt-3 rounded-xl"
                    rows={3}
                    placeholder="Aapka review likhein..."
                    value={reviewBody}
                    onChange={(e) => setReviewBody(e.target.value)}
                  />
                  <Button type="submit" className="mt-3 rounded-xl" disabled={reviewSaving}>
                    {reviewSaving ? "Save ho raha hai..." : "Review Submit karein"}
                  </Button>
                </form>

                {/* Real reviews ki list */}
                {reviewsLoading ? (
                  <p className="text-sm text-muted-foreground">Reviews load ho rahe hain...</p>
                ) : reviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Abhi koi review nahi hai. Pehla review aap likh sakte hain!
                  </p>
                ) : (
                  reviews.map((review) => (
                    <article key={review.id} className="border-b border-border pb-4">
                      <div>
                        <p className="font-semibold">{review.reviewer_name}</p>
                        <div className="flex items-center gap-2 text-warning">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3.5 w-3.5 ${star <= review.rating ? "fill-current" : "text-border"}`}
                            />
                          ))}
                          <span className="text-xs text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString("en-PK")}
                          </span>
                        </div>
                      </div>
                      {review.title && <h3 className="mt-3 text-sm font-bold">{review.title}</h3>}
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{review.body}</p>
                    </article>
                  ))
                )}
              </div>
            </div>
          )}

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

        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="text-xl font-bold">Related Products</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </ShopLayout>
  );
}