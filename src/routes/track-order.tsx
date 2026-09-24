import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Check,
  Loader2,
  Search,
  Truck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { ShopLayout } from "@/components/shop/ShopLayout";
import { EmptyState } from "@/components/dashboard/EmptyState";
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
        title: "Track Your Order — Dukaan.pk",
      },
      {
        name: "description",
        content:
          "Enter your order ID and mobile number to track your Dukaan.pk COD parcel.",
      },
      {
        property: "og:title",
        content: "Track Your Order — Dukaan.pk",
      },
      {
        property: "og:description",
        content:
          "Real-time delivery status for your Dukaan.pk order.",
      },
    ],
  }),

  component: TrackOrder,
});

type TrackState =
  | "idle"
  | "loading"
  | "found"
  | "missing";

type TrackedOrder = {
  id: string;
  status: string;
};

function TrackOrder() {
  const [state, setState] =
    useState<TrackState>("idle");

  const [order, setOrder] =
    useState<TrackedOrder | null>(null);

  /*
   * Order progress
   *
   * Pending     = step 1
   * Confirmed   = step 2
   * Dispatched  = step 3
   * Delivered   = step 4
   */
  const statusIndex: Record<string, number> = {
    Pending: 0,
    Confirmed: 1,
    Dispatched: 2,
    Delivered: 3,
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const formData =
      new FormData(event.currentTarget);

    const orderId = String(
      formData.get("orderId") ?? "",
    ).trim();

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
      /*
       * IMPORTANT:
       *
       * Order tabhi milega jab:
       *
       * Order ID match kare
       * +
       * Mobile Number match kare
       *
       * Sirf Order ID se tracking nahi hogi.
       */
      const { data, error } = await supabase
        .from("orders")
        .select("id, status")
        .eq("id", orderId)
        .eq("phone", phone)
        .maybeSingle();

      if (error) {
        console.error(
          "Unable to track order:",
          error,
        );

        setState("missing");

        return;
      }

      if (!data) {
        setState("missing");

        return;
      }

      setOrder({
        id: data.id,
        status: data.status,
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

      setState("missing");
    }
  };

  return (
    <ShopLayout>
      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* Heading */}
        <h1 className="text-2xl font-extrabold sm:text-3xl">
          Track Your Order
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Order ID aur mobile number daal kar
          apne parcel ka status dekhein.
        </p>

        {/* Tracking Form */}
        <form
          className="surface-card mt-6 grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end"
          onSubmit={handleSubmit}
        >
          {/* Order ID */}
          <div className="space-y-1.5">
            <Label htmlFor="oid">
              Order ID
            </Label>

            <Input
              id="oid"
              name="orderId"
              placeholder="DKN-XXXXXXXXXX"
              autoComplete="off"
              required
              className="rounded-xl"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="ophone">
              Mobile Number
            </Label>

            <Input
              id="ophone"
              name="phone"
              type="tel"
              placeholder="03XX-XXXXXXX"
              autoComplete="tel"
              required
              className="rounded-xl"
            />
          </div>

          {/* Track Button */}
          <Button
            type="submit"
            className="rounded-xl"
            disabled={state === "loading"}
          >
            {state === "loading" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}

            {state === "loading"
              ? "Tracking..."
              : "Track"}
          </Button>
        </form>

        {/* Initial State */}
        {state === "idle" && (
          <div className="mt-6">
            <EmptyState
              icon={Truck}
              title="Abhi koi order track nahi kiya"
              description="Upar apna Order ID aur checkout wala mobile number daalein."
            />
          </div>
        )}

        {/* Loading */}
        {state === "loading" && (
          <div className="surface-card mt-6 space-y-4 p-6">
            {[0, 1, 2, 3].map(
              (index) => (
                <div
                  key={index}
                  className="flex items-center gap-4"
                >
                  <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />

                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />

                    <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ),
            )}
          </div>
        )}

        {/* Missing */}
        {state === "missing" && (
          <div className="mt-6">
            <EmptyState
              icon={Truck}
              title="Order nahi mila"
              description="Order ID aur wahi mobile number check karein jo checkout ke waqt diya tha."
            />
          </div>
        )}

        {/* Found */}
        {state === "found" && order && (
          <div className="surface-card mt-6 p-6">
            {/* Order Header */}
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  Order ID
                </p>

                <p className="font-display text-lg font-bold">
                  {order.id}
                </p>
              </div>

              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold",
                  order.status ===
                    "Cancelled"
                    ? "bg-red-100 text-red-700"
                    : "bg-primary-soft text-primary",
                )}
              >
                {order.status}
              </span>
            </div>

            {/* Cancelled Order */}
            {order.status ===
            "Cancelled" ? (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

                <div>
                  <p className="text-sm font-semibold text-red-700">
                    Order Cancelled
                  </p>

                  <p className="mt-1 text-xs text-red-600">
                    Ye order cancel ho chuka
                    hai aur delivery process
                    mein nahi hai.
                  </p>
                </div>
              </div>
            ) : (
              /* Tracking Timeline */
              <ol className="mt-6 space-y-0">
                {trackingSteps.map(
                  (step, index) => {
                    const currentIndex =
                      statusIndex[
                        order.status
                      ] ?? 0;

                    const done =
                      index <=
                      currentIndex;

                    return (
                      <li
                        key={
                          step.label
                        }
                        className="grid grid-cols-[36px_minmax(0,1fr)] gap-3"
                      >
                        <div className="flex flex-col items-center">
                          <span
                            className={cn(
                              "grid h-9 w-9 place-items-center rounded-full border-2 text-xs font-bold",
                              done
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-card text-muted-foreground",
                            )}
                          >
                            {done ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              index + 1
                            )}
                          </span>

                          {index <
                            trackingSteps.length -
                              1 && (
                            <span
                              className={cn(
                                "min-h-10 w-0.5 flex-1",
                                index <
                                  currentIndex
                                  ? "bg-primary"
                                  : "bg-border",
                              )}
                            />
                          )}
                        </div>

                        <div className="pb-6">
                          <p
                            className={cn(
                              "text-sm font-semibold",
                              !done &&
                                "text-muted-foreground",
                            )}
                          >
                            {
                              step.label
                            }
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {step.time}
                          </p>
                        </div>
                      </li>
                    );
                  },
                )}
              </ol>
            )}
          </div>
        )}
      </div>
    </ShopLayout>
  );
}