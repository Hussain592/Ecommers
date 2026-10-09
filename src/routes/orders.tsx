import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Loader2,
  PackageSearch,
  ShoppingBag,
  Truck,
} from "lucide-react";

import { ShopLayout } from "@/components/shop/ShopLayout";
import { Button } from "@/components/ui/button";
import { formatPKR } from "@/data/mock";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "azadari.store" },
      {
        name: "description",
        content:
          "View your azadari.store Cash on Delivery orders.",
      },
    ],
  }),
  component: OrdersPage,
});

type Order = {
  id: string;
  customer_name: string;
  city: string | null;
  total: number;
  status: string;
  created_at: string;
  items:
    | Array<{
        name: string;
        quantity: number;
      }>
    | null;
};

function OrdersPage() {
  const {
    user,
    loading: authLoading,
  } = useAuth();

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadOrders = async () => {
      const {
        data,
        error,
      } = await supabase
        .from("orders")
        .select(
          "id, customer_name, city, total, status, created_at, items",
        )
        .eq(
          "customer_id",
          user.id,
        )
        .order(
          "created_at",
          {
            ascending: false,
          },
        );

      if (error) {
        console.error(
          "Unable to load orders",
          error,
        );

        setOrders([]);
        setLoading(false);
        return;
      }

      setOrders(
        (data ?? []).map(
          (order) => ({
            ...order,
            total: Number(
              order.total,
            ),
            items:
              Array.isArray(
                order.items,
              )
                ? order.items
                : null,
          }),
        ),
      );

      setLoading(false);
    };

    void loadOrders();
  }, [user]);

  /*
   * =====================================
   * LOADING
   * =====================================
   */
  if (
    authLoading ||
    loading
  ) {
    return (
      <ShopLayout>
        <main className="mx-auto max-w-4xl px-4 py-16">
          <div
            className="flex min-h-[220px] items-center justify-center"
            aria-live="polite"
          >
            <div className="text-center">
              <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#0b513b]" />

              <p className="mt-3 text-sm text-[#6f7d75]">
                Orders load ho rahe hain...
              </p>
            </div>
          </div>
        </main>
      </ShopLayout>
    );
  }

  /*
   * =====================================
   * GUEST / NOT LOGGED IN
   * Same meaning rakha hai, sirf UI + HCI improve ki hai.
   * =====================================
   */
  if (!user) {
    return (
      <ShopLayout>
        <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
          <section className="relative overflow-hidden rounded-3xl border border-[#d8cdae] bg-[#fffdf7] px-6 py-10 text-center shadow-[0_12px_32px_rgba(8,43,33,0.07)] sm:px-10 sm:py-12">
            {/* Subtle Islamic accent */}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#c9a24b] to-transparent"
            />

            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#c9a24b]/7"
            />

            <div className="relative">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-[#c9a24b]/30 bg-[#f7efd9] text-[#0b513b] shadow-sm">
                <ShoppingBag className="h-7 w-7" />
              </div>

              <h1 className="mt-5 text-xl font-extrabold tracking-tight text-[#102d24] sm:text-2xl">
                Order history ke liye login zaroori nahi
              </h1>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6f7d75]">
                Guest order ko Order ID aur mobile number se track karein.
              </p>

              {/* HCI:
                  Primary action = Track Order
                  Secondary action = Start Shopping
              */}
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="h-11 rounded-xl border border-[#c9a24b]/35 bg-[#082b21] px-6 font-bold text-[#fffaf0] shadow-none hover:bg-[#0d3d2f] focus-visible:ring-2 focus-visible:ring-[#c9a24b] focus-visible:ring-offset-2"
                >
                  <Link to="/track-order">
                    <Truck
                      aria-hidden="true"
                      className="mr-2 h-4 w-4"
                    />
                    Track Order
                  </Link>
                </Button>

                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-11 rounded-xl border-[#d8cdae] bg-white px-6 font-semibold text-[#0b513b] hover:border-[#c9a24b]/60 hover:bg-[#f7efd9] focus-visible:ring-2 focus-visible:ring-[#c9a24b]"
                >
                  <Link to="/products">
                    Start Shopping
                  </Link>
                </Button>
              </div>

              <p className="mt-5 text-[11px] leading-5 text-[#89938e]">
                Order track karne ke liye checkout wala mobile number use karein.
              </p>
            </div>
          </section>
        </main>
      </ShopLayout>
    );
  }

  /*
   * =====================================
   * LOGGED-IN ORDERS
   * =====================================
   */
  return (
    <ShopLayout>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9a7927]">
            Order History
          </p>

          <h1 className="mt-1 text-2xl font-extrabold text-[#102d24] sm:text-3xl">
            My Orders
          </h1>

          <p className="mt-1 text-sm text-[#6f7d75]">
            Apne COD orders ka status yahan dekhein.
          </p>
        </div>

        {orders.length === 0 ? (
          <section className="mt-6 rounded-3xl border border-[#ded5bd] bg-[#fffdf7] px-5 py-12 text-center shadow-[0_4px_16px_rgba(8,43,33,0.04)]">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[#c9a24b]/25 bg-[#f7efd9] text-[#0b513b]">
              <PackageSearch className="h-6 w-6" />
            </div>

            <h2 className="mt-4 text-lg font-extrabold text-[#102d24]">
              Abhi koi order nahi
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6f7d75]">
              Products browse karke apna pehla order place karein.
            </p>

            <Button
              asChild
              className="mt-5 h-10 rounded-xl bg-[#082b21] px-5 font-bold text-[#fffaf0] hover:bg-[#0d3d2f] focus-visible:ring-[#c9a24b]"
            >
              <Link to="/products">
                Start Shopping
              </Link>
            </Button>
          </section>
        ) : (
          <section className="mt-6 space-y-4">
            {orders.map(
              (order) => (
                <article
                  key={order.id}
                  className="overflow-hidden rounded-2xl border border-[#ded5bd] bg-[#fffdf7] shadow-[0_4px_16px_rgba(8,43,33,0.05)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 p-5">
                    <div>
                      <p className="font-display font-bold text-[#102d24]">
                        {order.id}
                      </p>

                      <p className="mt-1 text-xs text-[#748078]">
                        {new Date(
                          order.created_at,
                        ).toLocaleDateString(
                          "en-PK",
                        )}

                        {order.city &&
                          ` · ${order.city}`}
                      </p>
                    </div>

                    <span className="rounded-full border border-[#c9a24b]/30 bg-[#f7efd9] px-3 py-1 text-xs font-semibold text-[#70591f]">
                      {order.status}
                    </span>
                  </div>

                  <div className="border-t border-[#eee6d2] px-5 py-4">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-[#89938e]">
                          Items
                        </p>

                        <p className="mt-1 line-clamp-2 text-sm text-[#44564d]">
                          {order.items
                            ?.map(
                              (
                                item,
                              ) =>
                                `${item.name} × ${item.quantity}`,
                            )
                            .join(", ") ??
                            "Order items"}
                        </p>
                      </div>

                      <p className="font-display text-lg font-extrabold text-[#0b513b]">
                        {formatPKR(
                          order.total,
                        )}
                      </p>
                    </div>

                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="mt-4 rounded-xl border-[#d8cdae] bg-white text-[#0b513b] hover:bg-[#f7efd9] focus-visible:ring-[#c9a24b]"
                    >
                      <Link to="/track-order">
                        <Truck
                          aria-hidden="true"
                          className="mr-2 h-4 w-4"
                        />
                        Track Order
                      </Link>
                    </Button>
                  </div>
                </article>
              ),
            )}
          </section>
        )}
      </main>
    </ShopLayout>
  );
}
