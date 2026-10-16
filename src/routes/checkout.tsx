import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { BadgeCheck, Loader2, LogIn, Wallet } from "lucide-react";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { formatPKR } from "@/data/mock";
import { useCart } from "@/lib/cart";
import { variantLabel } from "@/lib/variants";
import { deliveryFeeFor, useDeliverySettings } from "@/lib/delivery";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { isPakistaniMobile, normalizePakistaniMobile } from "@/lib/phone";
import { useStoreSettings } from "@/lib/store-info";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "azadari.store" },
      {
        name: "description",
        content: "Guest checkout with Cash on Delivery. No account or online payment needed.",
      },
      { property: "og:title", content: "COD Checkout — azadari.store" },
      {
        property: "og:description",
        content: "Order as guest and pay cash when your parcel arrives.",
      },
    ],
  }),
  component: CheckoutPage,
});

// Suggestions only: customers can type any city or town in Pakistan.
const cities = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Hyderabad",
  "Gujranwala",
  "Sialkot",
  "Sargodha",
  "Bahawalpur",
  "Sukkur",
  "Larkana",
  "Abbottabad",
  "Mardan",
  "Sahiwal",
  "Jhang",
  "Sheikhupura",
  "Rahim Yar Khan",
  "Dera Ghazi Khan",
  "Dera Ismail Khan",
  "Gujrat",
  "Kasur",
  "Okara",
  "Mirpur Khas",
  "Muzaffarabad",
  "Mirpur",
  "Gilgit",
  "Skardu",
  "Chiniot",
  "Jhelum",
  "Kohat",
  "Nawabshah",
  "Parachinar",
];

function CheckoutPage() {
  const { detailed, subtotal, clear } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { guestCheckout } = useStoreSettings();
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [altPhoneError, setAltPhoneError] = useState<string | null>(null);
  const mustSignIn = !guestCheckout && !user;

  const checkPhone = (value: string, optional: boolean) => {
    if (!value.trim()) return optional ? null : "Enter your mobile number.";
    return isPakistaniMobile(value)
      ? null
      : "Enter a Pakistani mobile number with 11 digits, e.g. 0300-1234567.";
  };
  const delivery = deliveryFeeFor(subtotal, useDeliverySettings());

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (detailed.length === 0) {
      toast.error("Your cart is empty. Add products before checking out.");
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);
    const phone = String(formData.get("phone") ?? "");
    const altPhone = String(formData.get("alternatePhone") ?? "");
    const phoneProblem = checkPhone(phone, false);
    const altProblem = checkPhone(altPhone, true);
    setPhoneError(phoneProblem);
    setAltPhoneError(altProblem);
    if (phoneProblem || altProblem) {
      form.querySelector<HTMLInputElement>(phoneProblem ? "#phone" : "#alt")?.focus();
      return;
    }

    setLoading(true);
    try {
      const { data: orderIds, error } = await supabase.rpc("place_cod_orders", {
        p_customer_name: String(formData.get("name") ?? "").trim(),
        p_customer_email: String(formData.get("email") ?? "")
          .trim()
          .toLowerCase(),
        p_phone: normalizePakistaniMobile(phone),
        p_city: String(formData.get("city") ?? "").trim(),
        p_alternate_phone: altPhone.trim() ? normalizePakistaniMobile(altPhone) : null,
        p_address: String(formData.get("address") ?? "").trim(),
        p_notes: String(formData.get("notes") ?? "").trim() || null,
        p_items: detailed.map(({ product, qty, variant }) => ({
          id: product.id,
          quantity: qty,
          ...(variant ? { variant_id: variant.id } : {}),
        })),
      });
      if (error) throw error;
      if (!orderIds?.length) {
        throw new Error("We didn't receive an order number. Please try again.");
      }
      sessionStorage.setItem("dukaan_last_order_ids", JSON.stringify(orderIds));

      // Each seller gets an email about their new order. The order is already
      // placed, so a failed alert must never block the customer.
      for (const orderId of orderIds as string[]) {
        void supabase.functions
          .invoke("send-confirmation-email", { body: { type: "new_order", id: orderId } })
          .then(({ error: alertError }) => {
            if (alertError) console.warn("New order alert not sent", orderId, alertError);
          });
      }

      clear();
      await navigate({ to: "/order-confirmation" });
    } catch (error) {
      console.error("Unable to place order", error);
      // Database errors are plain objects, not Error instances. Show their message
      // (e.g. "Not enough stock for: ...") so the customer knows what to fix.
      const message =
        error &&
        typeof error === "object" &&
        "message" in error &&
        typeof error.message === "string"
          ? error.message
          : "";
      toast.error(message || "Couldn't place your order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ShopLayout>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-extrabold sm:text-3xl">COD Checkout</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {user
            ? "Pay in cash when your parcel arrives."
            : guestCheckout
              ? "No account needed. Pay in cash when your parcel arrives."
              : "Please sign in to place your order."}
        </p>

        {mustSignIn && (
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary-soft p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">
              <span className="font-semibold">Sign in to continue.</span> Your cart is saved and
              will be here when you come back.
            </p>
            <Button asChild className="rounded-xl">
              <Link to="/login" search={{ redirect: "/checkout" }}>
                <LogIn className="mr-2 h-4 w-4" />
                Sign in
              </Link>
            </Button>
          </div>
        )}

        <form onSubmit={submit} className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <section className="surface-card p-5">
              <h2 className="font-bold">Delivery Details</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    autoComplete="name"
                    defaultValue={profile?.name ?? ""}
                    placeholder="Ahmed Raza"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email for order updates *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    defaultValue={user?.email ?? ""}
                    required
                    maxLength={254}
                    placeholder="you@example.com"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Mobile Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    maxLength={16}
                    placeholder="0300-1234567"
                    aria-invalid={phoneError ? true : undefined}
                    aria-describedby={phoneError ? "phone-error" : undefined}
                    onBlur={(event) => setPhoneError(checkPhone(event.currentTarget.value, false))}
                    onChange={() => phoneError && setPhoneError(null)}
                    className="rounded-xl"
                  />
                  {phoneError && (
                    <p id="phone-error" role="alert" className="text-xs text-destructive">
                      {phoneError}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    name="city"
                    list="city-options"
                    required
                    minLength={2}
                    maxLength={100}
                    autoComplete="address-level2"
                    placeholder="Start typing your city"
                    className="rounded-xl"
                  />
                  <datalist id="city-options">
                    {cities.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="alt">Alternate Number</Label>
                  <Input
                    id="alt"
                    name="alternatePhone"
                    type="tel"
                    inputMode="tel"
                    maxLength={16}
                    placeholder="Optional"
                    aria-invalid={altPhoneError ? true : undefined}
                    aria-describedby={altPhoneError ? "alt-error" : undefined}
                    onBlur={(event) =>
                      setAltPhoneError(checkPhone(event.currentTarget.value, true))
                    }
                    onChange={() => altPhoneError && setAltPhoneError(null)}
                    className="rounded-xl"
                  />
                  {altPhoneError && (
                    <p id="alt-error" role="alert" className="text-xs text-destructive">
                      {altPhoneError}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="address">Complete Address *</Label>
                  <Textarea
                    id="address"
                    name="address"
                    required
                    autoComplete="street-address"
                    placeholder="House #, street, area, landmark"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="notes">Order Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Any delivery instructions? (optional)"
                    className="rounded-xl"
                  />
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
                    Pay the courier in cash when your parcel arrives. No online payment needed.
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
                  Your cart is empty.{" "}
                  <Link to="/products" className="text-primary underline">
                    Browse products
                  </Link>
                </p>
              )}
              {detailed.map(({ key, product, qty, variant }) => (
                <div key={key} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate">
                    {product.name}
                    {variant && variantLabel(variant) && (
                      <span className="text-muted-foreground"> ({variantLabel(variant)})</span>
                    )}{" "}
                    <span className="text-muted-foreground">× {qty}</span>
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
                <span className="font-display font-extrabold text-primary">
                  {formatPKR(subtotal + delivery)}
                </span>
              </div>
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={loading || detailed.length === 0 || mustSignIn}
              className="mt-5 w-full rounded-xl"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Placing order..." : "Place COD Order"}
            </Button>
          </aside>
        </form>
      </div>
    </ShopLayout>
  );
}
