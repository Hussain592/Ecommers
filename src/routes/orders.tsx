import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, PackageSearch, ShoppingBag, Truck } from "lucide-react";

import { ShopLayout } from "@/components/shop/ShopLayout";
import { Button } from "@/components/ui/button";
import { formatPKR } from "@/data/mock";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { CancelOrderDialog } from "@/components/shop/CancelOrderDialog";
import { CUSTOMER_CANCELLABLE } from "@/lib/orders";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "azadari.store" },
      {
        name: "description",
        content: "View your azadari.store Cash on Delivery orders.",
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
  cancel_reason: string | null;
  cancelled_by: string | null;
  items: Array<{
    name: string;
    quantity: number;
    size?: string | null;
    color?: string | null;
  }> | null;
};

const STATUS_STYLE: Record<string, string> = {
  Pending: "border-[#e9cf8f] bg-[#fdf3dc] text-[#7a5a12]",
  Confirmed: "border-[#b9d6c6] bg-[#e8f1eb] text-[#0b513b]",
  Dispatched: "border-[#b9cbe0] bg-[#eaf1f8] text-[#264a6e]",
  Delivered: "border-[#a9d3bd] bg-[#e3f3ea] text-[#106b45]",
  Cancelled: "border-[#efc9cc] bg-[#fff1f2] text-[#a61f2b]",
};

const STATUS_HELP: Record<string, string> = {
  Pending: "The seller will call you soon to confirm.",
  Confirmed: "The seller is packing your order.",
  Dispatched: "On the way. Keep cash ready for the courier.",
  Delivered: "Delivered. We hope you like it.",
  Cancelled: "This order was cancelled.",
};

const itemLabel = (item: {
  name: string;
  quantity: number;
  size?: string | null;
  color?: string | null;
}) =>
  `${item.name}${[item.size, item.color].filter(Boolean).length ? ` (${[item.size, item.color].filter(Boolean).join(", ")})` : ""} × ${item.quantity}`;

function OrdersPage() {
  const { user, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadOrders = async () => {
      // Includes guest orders placed with the customer's confirmed email.
      let { data, error } = await supabase.rpc("my_orders");

      // Before the database update that adds my_orders(), fall back to account orders only.
      if (error) {
        const fallback = await supabase
          .from("orders")
          .select("id, customer_name, city, total, status, created_at, items")
          .eq("customer_id", user.id)
          .order("created_at", { ascending: false });
        data = (fallback.data ?? []).map((order) => ({
          ...order,
          cancel_reason: null,
          cancelled_by: null,
        }));
        error = fallback.error;
      }

      if (error) {
        console.error("Unable to load orders", error);

        setOrders([]);
        setLoading(false);
        return;
      }

      setOrders(
        ((data ?? []) as Order[]).map((order) => ({
          ...order,
          total: Number(order.total),
          items: Array.isArray(order.items) ? order.items : null,
        })),
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
  if (authLoading || loading) {
    return (
      <ShopLayout>
        <main className="mx-auto max-w-4xl px-4 py-16">
          <div className="flex min-h-[220px] items-center justify-center" aria-live="polite">
            <div className="text-center">
              <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#0b513b]" />

              <p className="mt-3 text-sm text-[#6f7d75]">Loading orders...</p>
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
                No account? You can still track your order
              </h1>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6f7d75]">
                Track a guest order with its Order ID and mobile number.
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
                    <Truck aria-hidden="true" className="mr-2 h-4 w-4" />
                    Track Order
                  </Link>
                </Button>

                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-11 rounded-xl border-[#d8cdae] bg-white px-6 font-semibold text-[#0b513b] hover:border-[#c9a24b]/60 hover:bg-[#f7efd9] focus-visible:ring-2 focus-visible:ring-[#c9a24b]"
                >
                  <Link to="/products">Start Shopping</Link>
                </Button>
              </div>

              <p className="mt-5 text-[11px] leading-5 text-[#89938e]">
                Use the mobile number you entered at checkout.
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

          <h1 className="mt-1 text-2xl font-extrabold text-[#102d24] sm:text-3xl">My Orders</h1>

          <p className="mt-1 text-sm text-[#6f7d75]">
            Check the status of your Cash on Delivery orders.
          </p>
        </div>

        {orders.length === 0 ? (
          <section className="mt-6 rounded-3xl border border-[#ded5bd] bg-[#fffdf7] px-5 py-12 text-center shadow-[0_4px_16px_rgba(8,43,33,0.04)]">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[#c9a24b]/25 bg-[#f7efd9] text-[#0b513b]">
              <PackageSearch className="h-6 w-6" />
            </div>

            <h2 className="mt-4 text-lg font-extrabold text-[#102d24]">No orders yet</h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6f7d75]">
              Browse products and place your first order.
            </p>

            <Button
              asChild
              className="mt-5 h-10 rounded-xl bg-[#082b21] px-5 font-bold text-[#fffaf0] hover:bg-[#0d3d2f] focus-visible:ring-[#c9a24b]"
            >
              <Link to="/products">Start Shopping</Link>
            </Button>
          </section>
        ) : (
          <section className="mt-6 space-y-4">
            {orders.map((order) => (
              <article
                key={order.id}
                className="overflow-hidden rounded-2xl border border-[#ded5bd] bg-[#fffdf7] shadow-[0_4px_16px_rgba(8,43,33,0.05)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 p-5">
                  <div>
                    <p className="font-display font-bold text-[#102d24]">{order.id}</p>

                    <p className="mt-1 text-xs text-[#748078]">
                      {new Date(order.created_at).toLocaleDateString("en-PK")}

                      {order.city && ` · ${order.city}`}
                    </p>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_STYLE[order.status] ?? "border-[#c9a24b]/30 bg-[#f7efd9] text-[#70591f]"}`}
                    >
                      {order.status}
                    </span>
                    <p className="mt-1 text-[11px] text-[#748078]">
                      {order.status === "Cancelled" && order.cancelled_by === "customer"
                        ? "You cancelled this order."
                        : (STATUS_HELP[order.status] ?? "")}
                    </p>
                  </div>
                </div>

                <div className="border-t border-[#eee6d2] px-5 py-4">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-[#89938e]">Items</p>

                      <p className="mt-1 line-clamp-2 text-sm text-[#44564d]">
                        {order.items?.map(itemLabel).join(", ") ?? "Order items"}
                      </p>
                    </div>

                    <p className="font-display text-lg font-extrabold text-[#0b513b]">
                      {formatPKR(order.total)}
                    </p>
                  </div>

                  {order.status === "Cancelled" && order.cancel_reason && (
                    <p className="mt-3 rounded-xl bg-[#fff5f6] px-3 py-2 text-xs text-[#86545a]">
                      Reason: {order.cancel_reason}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="rounded-xl border-[#d8cdae] bg-white text-[#0b513b] hover:bg-[#f7efd9] focus-visible:ring-[#c9a24b]"
                    >
                      <Link to="/track-order">
                        <Truck aria-hidden="true" className="mr-2 h-4 w-4" />
                        Track order
                      </Link>
                    </Button>

                    {CUSTOMER_CANCELLABLE.has(order.status) && (
                      <CancelOrderDialog
                        orderId={order.id}
                        onCancelled={(reason) =>
                          setOrders((current) =>
                            current.map((item) =>
                              item.id === order.id
                                ? {
                                    ...item,
                                    status: "Cancelled",
                                    cancel_reason: reason,
                                    cancelled_by: "customer",
                                  }
                                : item,
                            ),
                          )
                        }
                      />
                    )}
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </ShopLayout>
  );
}
