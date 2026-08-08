import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatPKR } from "@/data/mock";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — Dukaan.pk" },
      { name: "description", content: "Review your Dukaan.pk cart and place a Cash on Delivery order." },
      { property: "og:title", content: "Your Cart — Dukaan.pk" },
      { property: "og:description", content: "Cash on Delivery checkout, no advance payment needed." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { detailed, setQty, remove, subtotal } = useCart();
  const delivery = subtotal > 3000 || subtotal === 0 ? 0 : 250;

  return (
    <ShopLayout>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Shopping Cart</h1>

        {detailed.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={ShoppingCart}
              title="Aapka cart khali hai"
              description="Products browse karein aur COD par order karein."
              action={
                <Button asChild className="rounded-xl">
                  <Link to="/products">Start Shopping</Link>
                </Button>
              }
            />
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-4">
              {detailed.map(({ product, qty }) => (
                <div key={product.id} className="surface-card grid grid-cols-[80px_minmax(0,1fr)] gap-4 p-4 sm:grid-cols-[100px_minmax(0,1fr)_auto]">
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    width={800}
                    height={800}
                    className="aspect-square w-full rounded-xl object-cover"
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{product.category}</p>
                    <h3 className="truncate text-sm font-semibold">{product.name}</h3>
                    <p className="text-xs text-muted-foreground">Sold by {product.vendor}</p>
                    <p className="mt-1 font-display font-bold text-primary">{formatPKR(product.price)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center rounded-lg border border-border">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQty(product.id, qty - 1)}>
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="w-8 text-center text-sm font-semibold">{qty}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQty(product.id, qty + 1)}>
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(product.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-xs text-muted-foreground">Subtotal</p>
                    <p className="font-display font-bold">{formatPKR(product.price * qty)}</p>
                  </div>
                </div>
              ))}
            </div>

            <aside className="surface-card h-fit p-5 lg:sticky lg:top-24">
              <h2 className="font-bold">Order Summary</h2>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatPKR(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="font-medium">{delivery === 0 ? "Free" : formatPKR(delivery)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-base">
                  <span className="font-semibold">Total (COD)</span>
                  <span className="font-display font-extrabold text-primary">{formatPKR(subtotal + delivery)}</span>
                </div>
              </div>
              <Button asChild size="lg" className="mt-5 w-full rounded-xl">
                <Link to="/checkout">Proceed to COD Checkout</Link>
              </Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Sirf Cash on Delivery — koi online payment nahi.
              </p>
            </aside>
          </div>
        )}
      </div>
    </ShopLayout>
  );
}