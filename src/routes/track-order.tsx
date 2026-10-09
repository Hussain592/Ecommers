import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import {
  Check,
  CheckCircle2,
  KeyRound,
  Loader2,
  PackageCheck,
  Phone,
  Search,
  ShieldCheck,
  Truck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { ShopLayout } from "@/components/shop/ShopLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { cn } from "@/lib/utils";
import { trackingSteps } from "@/data/mock";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/track-order")({
  head: () => ({
    meta: [
      {
        title: "azadari.store",
      },
      {
        name: "description",
        content:
          "Track your azadari.store order using your Order ID and checkout mobile number.",
      },
      {
        property: "og:title",
        content: "Track Your Order — azadari.store",
      },
      {
        property: "og:description",
        content:
          "Check the latest delivery status of your azadari.store order without signing in.",
      },
    ],
  }),

  component: TrackOrder,
});

type TrackState =
  | "idle"
  | "loading"
  | "found"
  | "missing"
  | "error";

type TrackedOrder = {
  id: string;
  status: string;
};

const statusIndex: Record<string, number> = {
  Pending: 0,
  Confirmed: 1,
  Dispatched: 2,
  Delivered: 3,
};

function TrackOrder() {
  const [state, setState] =
    useState<TrackState>("idle");

  const [order, setOrder] =
    useState<TrackedOrder | null>(null);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const formData =
      new FormData(event.currentTarget);

    const orderId = String(
      formData.get("orderId") ?? "",
    )
      .trim()
      .toUpperCase();

    const phone = String(
      formData.get("phone") ?? "",
    ).trim();

    if (!orderId || !phone) {
      toast.error(
        "Order ID aur Mobile Number dono daalein.",
      );

      return;
    }

    setState("loading");
    setOrder(null);

    try {
      const {
        data,
        error,
      } = await supabase.rpc(
        "track_order",
        {
          p_order_id: orderId,
          p_phone: phone,
        },
      );

      if (error) {
        console.error(
          "Unable to track order:",
          error,
        );

        toast.error(
          "Order track nahi ho saka. Dobara try karein.",
        );

        setState("error");
        return;
      }

      const trackedOrder =
        Array.isArray(data)
          ? data[0]
          : null;

      if (!trackedOrder) {
        setOrder(null);
        setState("missing");
        return;
      }

      setOrder({
        id: String(
          trackedOrder.id,
        ),

        status: String(
          trackedOrder.status,
        ),
      });

      setState("found");
    } catch (error) {
      console.error(
        "Unexpected tracking error:",
        error,
      );

      toast.error(
        "Order track nahi ho saka. Dobara try karein.",
      );

      setOrder(null);
      setState("error");
    }
  };

  const currentIndex =
    order && order.status !== "Cancelled"
      ? statusIndex[order.status] ?? 0
      : 0;

  return (
    <ShopLayout>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
        {/* =====================================
            TRACKING FORM
        ===================================== */}
        <section className="rounded-3xl border border-[#ded5bd] bg-[#fffdf7] p-5 shadow-[0_8px_24px_rgba(8,43,33,0.06)] sm:p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#9a7927]">
                Find your parcel
              </p>

              <h2 className="mt-1 text-xl font-extrabold text-[#102d24]">
                Enter order details
              </h2>

              <p className="mt-1 text-sm text-[#6f7d75]">
                Wahi mobile number use karein jo checkout ke waqt diya tha.
              </p>
            </div>

            <div className="hidden items-center gap-2 rounded-xl border border-[#c9a24b]/20 bg-[#f7efd9]/70 px-3 py-2 text-xs text-[#5f6d65] sm:flex">
              <ShieldCheck
                aria-hidden="true"
                className="h-4 w-4 text-[#0b6b4c]"
              />
              Secure lookup
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
           className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-start"
          >
            <div className="space-y-1.5">
              <Label
                htmlFor="oid"
                className="text-sm font-semibold text-[#102d24]"
              >
                Order ID
              </Label>

              <div className="relative">
                <KeyRound
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b968f]"
                />

                <Input
                  id="oid"
                  name="orderId"
                  placeholder="DKN-XXXXXXXXXX"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  required
                  className="h-11 rounded-xl border-[#d8cdae] bg-white pl-10 uppercase focus-visible:ring-[#c9a24b]"
                />
              </div>

              <p className="text-[11px] text-[#89938e]">
                Order confirmation mein diya gaya ID.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="ophone"
                className="text-sm font-semibold text-[#102d24]"
              >
                Mobile Number
              </Label>

              <div className="relative">
                <Phone
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b968f]"
                />

                <Input
                  id="ophone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="03XX-XXXXXXX"
                  autoComplete="tel"
                  required
                  className="h-11 rounded-xl border-[#d8cdae] bg-white pl-10 focus-visible:ring-[#c9a24b]"
                />
              </div>

              <p className="text-[11px] text-[#89938e]">
                Checkout wala mobile number.
              </p>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={state === "loading"}
             className="h-11 rounded-xl border border-[#c9a24b]/35 bg-[#082b21] px-6 font-bold text-[#fffaf0] shadow-none hover:bg-[#0d3d2f] focus-visible:ring-[#c9a24b] disabled:opacity-60 lg:mt-[26px]"
            >
              {state === "loading" ? (
                <Loader2
                  aria-hidden="true"
                  className="mr-2 h-4 w-4 animate-spin"
                />
              ) : (
                <Search
                  aria-hidden="true"
                  className="mr-2 h-4 w-4"
                />
              )}

              {state === "loading"
                ? "Tracking..."
                : "Track Order"}
            </Button>
          </form>

          <div className="mt-5 flex items-start gap-2 rounded-xl border border-[#c9a24b]/20 bg-[#f7efd9]/55 p-3">
            <ShieldCheck
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0 text-[#0b6b4c]"
            />

            <p className="text-xs leading-5 text-[#5f6d65]">
              Privacy ke liye order tabhi show hoga jab Order ID aur mobile
              number dono match karein.
            </p>
          </div>
        </section>

        {/* =====================================
            IDLE STATE
        ===================================== */}
        {state === "idle" && (
          <section className="mt-6 rounded-3xl border border-[#ded5bd] bg-[#fffdf7] px-5 py-10 text-center shadow-[0_4px_16px_rgba(8,43,33,0.04)]">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[#c9a24b]/30 bg-[#f7efd9] text-[#0b513b]">
              <Truck
                aria-hidden="true"
                className="h-6 w-6"
              />
            </div>

            <h2 className="mt-4 text-lg font-extrabold text-[#102d24]">
              Apna parcel track karein
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6f7d75]">
              Order details enter karne ke baad current delivery progress yahan
              nazar aayegi.
            </p>
          </section>
        )}

        {/* =====================================
            LOADING STATE
        ===================================== */}
        {state === "loading" && (
          <section
            aria-live="polite"
            className="mt-6 rounded-3xl border border-[#ded5bd] bg-[#fffdf7] p-6 shadow-[0_4px_16px_rgba(8,43,33,0.04)]"
          >
            <div className="mb-5">
              <div className="h-3 w-28 animate-pulse rounded-full bg-[#e9e4d7]" />
              <div className="mt-3 h-6 w-52 animate-pulse rounded-lg bg-[#e9e4d7]" />
            </div>

            <div className="space-y-0">
              {[0, 1, 2, 3].map(
                (index) => (
                  <div
                    key={index}
                    className="grid grid-cols-[40px_minmax(0,1fr)] gap-3"
                  >
                    <div className="flex flex-col items-center">
                      <div className="h-9 w-9 animate-pulse rounded-full bg-[#e9e4d7]" />

                      {index < 3 && (
                        <div className="min-h-10 w-0.5 flex-1 animate-pulse bg-[#e9e4d7]" />
                      )}
                    </div>

                    <div className="pb-6 pt-1">
                      <div className="h-3 w-32 animate-pulse rounded bg-[#e9e4d7]" />
                      <div className="mt-2 h-3 w-24 animate-pulse rounded bg-[#eee9dd]" />
                    </div>
                  </div>
                ),
              )}
            </div>
          </section>
        )}

        {/* =====================================
            NOT FOUND
        ===================================== */}
        {state === "missing" && (
          <section
            role="status"
            className="mt-6 rounded-3xl border border-[#e2d4b2] bg-[#fffdf7] px-5 py-10 text-center shadow-[0_4px_16px_rgba(8,43,33,0.04)]"
          >
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#f7efd9] text-[#9a7927]">
              <Search
                aria-hidden="true"
                className="h-6 w-6"
              />
            </div>

            <h2 className="mt-4 text-lg font-extrabold text-[#102d24]">
              Order nahi mila
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6f7d75]">
              Order ID aur wahi mobile number dobara check karein jo checkout
              ke waqt diya tha.
            </p>
          </section>
        )}

        {/* =====================================
            ERROR
        ===================================== */}
        {state === "error" && (
          <section
            role="alert"
            className="mt-6 rounded-3xl border border-[#efc9cc] bg-[#fffafa] px-5 py-10 text-center"
          >
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#fae7e9] text-[#a61f2b]">
              <XCircle
                aria-hidden="true"
                className="h-6 w-6"
              />
            </div>

            <h2 className="mt-4 text-lg font-extrabold text-[#7e1c27]">
              Tracking mein problem aa gayi
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#86545a]">
              Tracking service se connection nahi ho saka. Thori dair baad
              dobara try karein.
            </p>
          </section>
        )}

        {/* =====================================
            ORDER FOUND
        ===================================== */}
        {state === "found" && order && (
          <section
            aria-live="polite"
            className="mt-6 overflow-hidden rounded-3xl border border-[#ded5bd] bg-[#fffdf7] shadow-[0_10px_28px_rgba(8,43,33,0.08)]"
          >
            <div className="border-b border-[#eadfc4] bg-[linear-gradient(135deg,#f7efd9_0%,#fffdf7_60%,#eef5ee_100%)] px-5 py-5 sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#9a7927]">
                    Order found
                  </p>

                  <p className="mt-1 font-display text-xl font-extrabold text-[#102d24]">
                    {order.id}
                  </p>
                </div>

                <span
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-bold",
                    order.status === "Cancelled"
                      ? "border-[#efc9cc] bg-[#fae7e9] text-[#a61f2b]"
                      : order.status === "Delivered"
                        ? "border-[#b9decf] bg-[#e8f4ef] text-[#0b6b4c]"
                        : "border-[#c9a24b]/30 bg-[#f7efd9] text-[#70591f]",
                  )}
                >
                  {order.status}
                </span>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              {order.status === "Cancelled" ? (
                <div className="flex items-start gap-3 rounded-2xl border border-[#efc9cc] bg-[#fff5f6] p-4">
                  <XCircle
                    aria-hidden="true"
                    className="mt-0.5 h-5 w-5 shrink-0 text-[#a61f2b]"
                  />

                  <div>
                    <p className="text-sm font-bold text-[#7e1c27]">
                      Order Cancelled
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#86545a]">
                      Ye order cancel ho chuka hai aur delivery process mein
                      nahi hai.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-5">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#9a7927]">
                      Delivery progress
                    </p>

                    <h2 className="mt-1 text-lg font-extrabold text-[#102d24]">
                      Aapke order ka current status
                    </h2>
                  </div>

                  <ol className="space-y-0">
                    {trackingSteps.map(
                      (step, index) => {
                        const done =
                          index <= currentIndex;

                        const current =
                          index === currentIndex;

                        return (
                          <li
                            key={step.label}
                            className="grid grid-cols-[42px_minmax(0,1fr)] gap-3"
                          >
                            <div className="flex flex-col items-center">
                              <span
                                className={cn(
                                  "grid h-10 w-10 place-items-center rounded-full border-2 text-xs font-bold transition-colors",
                                  done
                                    ? "border-[#0b513b] bg-[#0b513b] text-white"
                                    : "border-[#d9d3c5] bg-white text-[#8b968f]",
                                  current &&
                                    "ring-4 ring-[#c9a24b]/15",
                                )}
                              >
                                {done ? (
                                  <Check
                                    aria-hidden="true"
                                    className="h-4 w-4"
                                  />
                                ) : (
                                  index + 1
                                )}
                              </span>

                              {index <
                                trackingSteps.length -
                                  1 && (
                                <span
                                  className={cn(
                                    "min-h-12 w-0.5 flex-1",
                                    index < currentIndex
                                      ? "bg-[#0b513b]"
                                      : "bg-[#ded8cb]",
                                  )}
                                />
                              )}
                            </div>

                            <div className="pb-7 pt-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p
                                  className={cn(
                                    "text-sm font-bold",
                                    done
                                      ? "text-[#102d24]"
                                      : "text-[#8b968f]",
                                  )}
                                >
                                  {step.label}
                                </p>

                                {current && (
                                  <span className="rounded-full bg-[#f7efd9] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#70591f]">
                                    Current
                                  </span>
                                )}
                              </div>

                              <p className="mt-1 text-xs text-[#7f8b84]">
                                {step.time}
                              </p>
                            </div>
                          </li>
                        );
                      },
                    )}
                  </ol>

                  {order.status ===
                    "Delivered" && (
                    <div className="mt-2 flex items-start gap-3 rounded-2xl border border-[#b9decf] bg-[#eef7f3] p-4">
                      <CheckCircle2
                        aria-hidden="true"
                        className="mt-0.5 h-5 w-5 shrink-0 text-[#0b6b4c]"
                      />

                      <div>
                        <p className="text-sm font-bold text-[#0b513b]">
                          Order Delivered
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[#517066]">
                          Delivery process complete ho chuka hai.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        )}
      </main>
    </ShopLayout>
  );
}
