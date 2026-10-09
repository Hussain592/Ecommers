import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  Truck,
} from "lucide-react";

import { ShopLayout } from "@/components/shop/ShopLayout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  formatPKR,
  productImageFallback,
} from "@/data/mock";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      {
        title: "azadari.store",
      },
      {
        name: "description",
        content:
          "Review your azadari.store cart and place a Cash on Delivery order.",
      },
      {
        property: "og:title",
        content: "Your Cart — azadari.store",
      },
      {
        property: "og:description",
        content:
          "Review your cart and continue to Cash on Delivery checkout.",
      },
    ],
  }),

  component: CartPage,
});

function CartPage() {
  const {
    detailed,
    setQty,
    remove,
    subtotal,
  } = useCart();

  const itemCount =
    detailed.reduce(
      (total, item) =>
        total + item.qty,
      0,
    );

  /*
   * Rs. 3,000 ya us se zyada par free delivery.
   */
  const delivery =
    subtotal >= 3000 ||
    subtotal === 0
      ? 0
      : 250;

  const total =
    subtotal + delivery;

  const amountForFreeDelivery =
    Math.max(
      0,
      3000 - subtotal,
    );

  return (
    <ShopLayout>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
        {/* =====================================
            PAGE HEADER
        ===================================== */}
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9a7927]">
              Your Cart
            </p>

            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#102d24] sm:text-3xl">
              Shopping Cart
            </h1>

            {detailed.length > 0 && (
              <p className="mt-1 text-sm text-[#6f7d75]">
                {itemCount}{" "}
                {itemCount === 1
                  ? "item"
                  : "items"}{" "}
                in your cart
              </p>
            )}
          </div>

          {detailed.length > 0 && (
            <Button
              asChild
              variant="ghost"
              className="rounded-xl text-[#0b513b] hover:bg-[#f7efd9]"
            >
              <Link to="/products">
                Continue Shopping
              </Link>
            </Button>
          )}
        </header>

        {/* =====================================
            EMPTY CART
        ===================================== */}
        {detailed.length === 0 ? (
          <section className="mt-6 rounded-3xl border border-[#ded5bd] bg-[#fffdf7] px-6 py-12 text-center shadow-[0_8px_24px_rgba(8,43,33,0.05)]">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-[#c9a24b]/30 bg-[#f7efd9] text-[#0b513b]">
              <ShoppingCart
                aria-hidden="true"
                className="h-7 w-7"
              />
            </div>

            <h2 className="mt-5 text-xl font-extrabold text-[#102d24]">
              Aapka cart khali hai
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6f7d75]">
              Islamic aur Azadari products browse karein aur Cash on Delivery
              par order place karein.
            </p>

            <Button
              asChild
              size="lg"
              className="mt-5 h-11 rounded-xl border border-[#c9a24b]/35 bg-[#082b21] px-6 font-bold text-[#fffaf0] hover:bg-[#0d3d2f] focus-visible:ring-[#c9a24b]"
            >
              <Link to="/products">
                <ShoppingBag
                  aria-hidden="true"
                  className="mr-2 h-4 w-4"
                />
                Start Shopping
              </Link>
            </Button>
          </section>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            {/* =====================================
                CART ITEMS
            ===================================== */}
            <section
              aria-label="Cart items"
              className="space-y-4"
            >
              {detailed.map(
                ({
                  product,
                  qty,
                }) => {
                  const lineTotal =
                    product.price *
                    qty;

                  const maxStock =
                    Math.max(
                      1,
                      Number(
                        product.stock ??
                          1,
                      ),
                    );

                  return (
                    <article
                      key={
                        product.id
                      }
                      className="overflow-hidden rounded-3xl border border-[#ded5bd] bg-[#fffdf7] shadow-[0_5px_18px_rgba(8,43,33,0.05)] transition-all hover:border-[#c9a24b]/60 hover:shadow-[0_10px_26px_rgba(8,43,33,0.08)]"
                    >
                      <div className="grid gap-4 p-4 sm:grid-cols-[120px_minmax(0,1fr)_auto] sm:p-5">
                        {/* Product image */}
                        <Link
                          to="/products/$id"
                          params={{
                            id: product.id,
                          }}
                          aria-label={`View ${product.name}`}
                          className="group/image relative block overflow-hidden rounded-2xl border border-[#e8dfca] bg-[#f8f4e9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b]"
                        >
                          <div className="aspect-square w-full">
                            <img
                              src={
                                product.image
                              }
                              alt={
                                product.name
                              }
                              width={
                                320
                              }
                              height={
                                320
                              }
                              loading="lazy"
                              decoding="async"
                              onError={(
                                event,
                              ) => {
                                const image =
                                  event.currentTarget;

                                /*
                                 * First failure:
                                 * project fallback try karo.
                                 *
                                 * Second failure:
                                 * favicon use karo taa-ke broken-image icon
                                 * kabhi show na ho.
                                 */
                                if (
                                  image
                                    .dataset
                                    .fallbackTried ===
                                  "1"
                                ) {
                                  image.onerror =
                                    null;

                                  image.src =
                                    "/favicon.ico";

                                  return;
                                }

                                image.dataset.fallbackTried =
                                  "1";

                                image.src =
                                  productImageFallback(
                                    product.name,
                                    product.image,
                                  );
                              }}
                              className="h-full w-full object-contain p-2.5 transition-transform duration-300 group-hover/image:scale-[1.03]"
                            />
                          </div>
                        </Link>

                        {/* Product information */}
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9a7927]">
                            {
                              product.category
                            }
                          </p>

                          <Link
                            to="/products/$id"
                            params={{
                              id: product.id,
                            }}
                            className="mt-1 block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b]"
                          >
                            <h2 className="line-clamp-2 text-sm font-extrabold leading-5 text-[#102d24] transition-colors hover:text-[#0b513b] sm:text-base">
                              {
                                product.name
                              }
                            </h2>
                          </Link>

                          <p className="mt-1 text-xs text-[#748078]">
                            Sold by{" "}
                            <span className="font-medium text-[#52635b]">
                              {
                                product.vendor
                              }
                            </span>
                          </p>

                          <p className="mt-2 font-display text-lg font-extrabold text-[#0b513b]">
                            {formatPKR(
                              product.price,
                            )}
                          </p>

                          {/* Quantity + remove */}
                          <div className="mt-4 flex flex-wrap items-center gap-3">
                            <div
                              className="inline-flex items-center rounded-xl border border-[#d8cdae] bg-white"
                              aria-label={`Quantity for ${product.name}`}
                            >
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-l-xl rounded-r-none text-[#52635b] hover:bg-[#f7efd9] hover:text-[#0b513b]"
                                onClick={() =>
                                  setQty(
                                    product.id,
                                    qty -
                                      1,
                                  )
                                }
                                aria-label={`Decrease quantity of ${product.name}`}
                              >
                                <Minus
                                  aria-hidden="true"
                                  className="h-3.5 w-3.5"
                                />
                              </Button>

                              <span
                                className="min-w-10 px-2 text-center text-sm font-bold text-[#102d24]"
                                aria-live="polite"
                              >
                                {qty}
                              </span>

                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                disabled={
                                  qty >=
                                  maxStock
                                }
                                className="h-9 w-9 rounded-l-none rounded-r-xl text-[#52635b] hover:bg-[#f7efd9] hover:text-[#0b513b] disabled:opacity-35"
                                onClick={() =>
                                  setQty(
                                    product.id,
                                    Math.min(
                                      qty +
                                        1,
                                      maxStock,
                                    ),
                                  )
                                }
                                aria-label={`Increase quantity of ${product.name}`}
                              >
                                <Plus
                                  aria-hidden="true"
                                  className="h-3.5 w-3.5"
                                />
                              </Button>
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-9 rounded-xl px-3 text-[#a61f2b] hover:bg-[#fae7e9] hover:text-[#8c1822]"
                              onClick={() =>
                                remove(
                                  product.id,
                                )
                              }
                              aria-label={`Remove ${product.name} from cart`}
                            >
                              <Trash2
                                aria-hidden="true"
                                className="mr-1.5 h-4 w-4"
                              />
                              Remove
                            </Button>
                          </div>
                        </div>

                        {/* Line total */}
                        <div className="border-t border-[#eee6d2] pt-3 sm:border-0 sm:pt-0 sm:text-right">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#89938e]">
                            Subtotal
                          </p>

                          <p className="mt-1 font-display text-lg font-extrabold text-[#102d24]">
                            {formatPKR(
                              lineTotal,
                            )}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                },
              )}
            </section>

            {/* =====================================
                ORDER SUMMARY
            ===================================== */}
            <aside className="h-fit rounded-3xl border border-[#ded5bd] bg-[#fffdf7] p-5 shadow-[0_10px_28px_rgba(8,43,33,0.07)] lg:sticky lg:top-24">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-[#c9a24b]/25 bg-[#f7efd9] text-[#0b513b]">
                  <PackageCheck
                    aria-hidden="true"
                    className="h-5 w-5"
                  />
                </span>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#9a7927]">
                    Checkout
                  </p>

                  <h2 className="text-lg font-extrabold text-[#102d24]">
                    Order Summary
                  </h2>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-[#6f7d75]">
                    Subtotal
                  </span>

                  <span className="font-semibold text-[#102d24]">
                    {formatPKR(
                      subtotal,
                    )}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-[#6f7d75]">
                    Delivery
                  </span>

                  <span className="font-semibold text-[#102d24]">
                    {delivery ===
                    0
                      ? "Free"
                      : formatPKR(
                          delivery,
                        )}
                  </span>
                </div>

                {amountForFreeDelivery >
                  0 && (
                  <div className="rounded-xl border border-[#c9a24b]/20 bg-[#f7efd9]/60 p-3">
                    <div className="flex items-start gap-2">
                      <Truck
                        aria-hidden="true"
                        className="mt-0.5 h-4 w-4 shrink-0 text-[#0b6b4c]"
                      />

                      <p className="text-xs leading-5 text-[#5f6d65]">
                        Free delivery
                        ke liye{" "}
                        <strong className="text-[#0b513b]">
                          {formatPKR(
                            amountForFreeDelivery,
                          )}
                        </strong>{" "}
                        aur add karein.
                      </p>
                    </div>
                  </div>
                )}

                <Separator className="my-3 bg-[#eee6d2]" />

                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="font-semibold text-[#102d24]">
                      Total
                    </p>

                    <p className="mt-0.5 text-[11px] text-[#89938e]">
                      Cash on Delivery
                    </p>
                  </div>

                  <span className="font-display text-2xl font-extrabold text-[#0b513b]">
                    {formatPKR(
                      total,
                    )}
                  </span>
                </div>
              </div>

              <Button
                asChild
                size="lg"
                className="mt-6 h-11 w-full rounded-xl border border-[#c9a24b]/35 bg-[#082b21] font-bold text-[#fffaf0] hover:bg-[#0d3d2f] focus-visible:ring-[#c9a24b]"
              >
                <Link to="/checkout">
                  Proceed to COD Checkout
                </Link>
              </Button>

              <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#b9decf] bg-[#eef7f3] p-3">
                <ShieldCheck
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#0b6b4c]"
                />

                <p className="text-xs leading-5 text-[#517066]">
                  Koi online payment nahi. Payment parcel receive karte waqt
                  Cash on Delivery par hogi.
                </p>
              </div>
            </aside>
          </div>
        )}
      </main>
    </ShopLayout>
  );
}
