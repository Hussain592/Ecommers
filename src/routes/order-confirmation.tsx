import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Package, Phone } from "lucide-react";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/order-confirmation")({
  head: () => ({
    meta: [
      { title: "Order Confirmed — Dukaan.pk" },
      { name: "description", content: "Your Cash on Delivery order has been placed on Dukaan.pk." },
      { property: "og:title", content: "Order Confirmed — Dukaan.pk" },
      { property: "og:description", content: "Order placed successfully with Cash on Delivery." },
    ],
  }),
  component: OrderConfirmation,
});

function OrderConfirmation() {
  return (
    <ShopLayout>
      <div className="mx-auto max-w-2xl px-4 py-14">
        <div className="surface-card p-8 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="h-8 w-8" />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold">Order Confirm Ho Gaya!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Shukriya! Aapka order receive ho gaya hai. Confirmation ke liye hamari team jald call karegi.
          </p>

          <div className="mt-6 rounded-2xl bg-muted p-5 text-left">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Order ID</span>
              <span className="font-display font-bold">DKN-90232</span>
            </div>
            <Separator className="my-3" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Payment</span>
              <span className="font-medium">Cash on Delivery</span>
            </div>
            <Separator className="my-3" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Expected Delivery</span>
              <span className="font-medium">2 - 4 working days</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild className="rounded-xl">
              <Link to="/track-order">
                <Package className="mr-2 h-4 w-4" /> Track Order
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/products">Continue Shopping</Link>
            </Button>
          </div>

          <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Phone className="h-3.5 w-3.5" /> Helpline: 0311-DUKAAN
          </p>
        </div>
      </div>
    </ShopLayout>
  );
}