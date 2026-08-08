import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Minus, Plus, ShieldCheck, Star, Truck, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { ProductCard } from "@/components/shop/ProductCard";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatPKR, products } from "@/data/mock";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/products/$id")({
  head: () => ({
    meta: [
      { title: "Product Detail — Dukaan.pk" },
      { name: "description", content: "Product details, price and Cash on Delivery ordering on Dukaan.pk." },
      { property: "og:title", content: "Product Detail — Dukaan.pk" },
      { property: "og:description", content: "Order with Cash on Delivery from verified Pakistani sellers." },
    ],
  }),
  component: ProductDetail,
});

function ProductDetail() {
  const { id } = Route.useParams();
  const product = products.find((p) => p.id === id);
  const { add } = useCart();
  const [qty, setQty] = useState(1);

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

  const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);

  return (
    <ShopLayout>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <nav className="text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">Home</Link> /{" "}
          <Link to="/products" className="hover:text-primary">Products</Link> /{" "}
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div className="surface-card overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              width={800}
              height={800}
              className="aspect-square w-full object-cover"
            />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">{product.category}</p>
            <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">{product.name}</h1>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="h-4 w-4 fill-warning text-warning" />
              {product.rating.toFixed(1)} ({product.reviews} reviews) · Sold by{" "}
              <span className="font-medium text-foreground">{product.vendor}</span>
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
            </div>
            <p className="mt-1 text-sm">
              {product.stock > 0 ? (
                <span className="font-medium text-success">In stock ({product.stock} available)</span>
              ) : (
                <span className="font-medium text-destructive">Out of stock</span>
              )}
            </p>

            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{product.description}</p>

            <Separator className="my-6" />

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-xl border border-border">
                <Button variant="ghost" size="icon" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-10 text-center text-sm font-semibold">{qty}</span>
                <Button variant="ghost" size="icon" onClick={() => setQty((q) => q + 1)}>
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
                Add to Cart
              </Button>
              <Button asChild size="lg" variant="outline" className="flex-1 rounded-xl">
                <Link to="/checkout" onClick={() => add(product.id, qty)}>
                  Order with COD
                </Link>
              </Button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { icon: Truck, text: "Delivery 2-4 days" },
                { icon: ShieldCheck, text: "Verified seller" },
                { icon: Undo2, text: "7-day return" },
              ].map((f) => (
                <div key={f.text} className="surface-card flex items-center gap-2 p-3 text-xs font-medium">
                  <f.icon className="h-4 w-4 text-primary" />
                  {f.text}
                </div>
              ))}
            </div>
          </div>
        </div>

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