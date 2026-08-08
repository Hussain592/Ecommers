import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { BadgeCheck, Loader2, Wallet } from "lucide-react";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPKR } from "@/data/mock";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Cash on Delivery Checkout — Dukaan.pk" },
      { name: "description", content: "Guest checkout with Cash on Delivery. No account or online payment needed." },
      { property: "og:title", content: "COD Checkout — Dukaan.pk" },
      { property: "og:description", content: "Order as guest and pay cash when your parcel arrives." },
    ],
  }),
  component: CheckoutPage,
});

const cities = ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta"];

function CheckoutPage() {
  const { detailed, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const delivery = subtotal > 3000 || subtotal === 0 ? 0 : 250;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      clear();
      navigate({ to: "/order-confirmation" });
    }, 1200);
  };

  return (
    <ShopLayout>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-extrabold sm:text-3xl">COD Checkout</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Guest checkout — account banane ki zaroorat nahi.
        </p>

        <form onSubmit={submit} className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <section className="surface-card p-5">
              <h2 className="font-bold">Delivery Details</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input id="name" required placeholder="Ahmed Raza" className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Mobile Number *</Label>
                  <Input id="phone" required placeholder="03XX-XXXXXXX" className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city">City *</Label>
                  <Select defaultValue="Karachi">
                    <SelectTrigger id="city" className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="alt">Alternate Number</Label>
                  <Input id="alt" placeholder="Optional" className="rounded-xl" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="address">Complete Address *</Label>
                  <Textarea id="address" required placeholder="House #, street, area, landmark" className="rounded-xl" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="notes">Order Notes</Label>
                  <Textarea id="notes" placeholder="Delivery ke liye koi hidayat?" className="rounded-xl" />
                </div>
              </div>
            </section>

            <section className="surface-card p-5">
              <h2 className="font-bold">Payment Method</h2>
              <div className="mt-4 flex items-start gap-3 rounded-xl border-2 border-primary bg-primary-soft p-4">
                <Wallet className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Cash on Delivery (COD)</p>
                  <p className="text-xs text-muted-foreground">
                    Parcel milne par courier ko cash pay karein. Koi online payment nahi.
                  </p>
                </div>
                <BadgeCheck className="ml-auto h-5 w-5 text-primary" />
              </div>
            </section>
          </div>

          <aside className="surface-card h-fit p-5 lg:sticky lg:top-24">
            <h2 className="font-bold">Your Order</h2>
            <div className="mt-4 space-y-3">
              {detailed.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Cart khali hai.{" "}
                  <Link to="/products" className="text-primary underline">Products dekhein</Link>
                </p>
              )}
              {detailed.map(({ product, qty }) => (
                <div key={product.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate">
                    {product.name} <span className="text-muted-foreground">× {qty}</span>
                  </span>
                  <span className="shrink-0 font-medium">{formatPKR(product.price * qty)}</span>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPKR(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span>{delivery === 0 ? "Free" : formatPKR(delivery)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-base">
                <span className="font-semibold">Total Payable</span>
                <span className="font-display font-extrabold text-primary">{formatPKR(subtotal + delivery)}</span>
              </div>
            </div>
            <Button type="submit" size="lg" disabled={loading || detailed.length === 0} className="mt-5 w-full rounded-xl">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Placing order..." : "Place COD Order"}
            </Button>
          </aside>
        </form>
      </div>
    </ShopLayout>
  );
}