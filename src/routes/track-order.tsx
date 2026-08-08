import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Loader2, Search, Truck } from "lucide-react";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { trackingSteps } from "@/data/mock";

export const Route = createFileRoute("/track-order")({
  head: () => ({
    meta: [
      { title: "Track Your Order — Dukaan.pk" },
      { name: "description", content: "Enter your order ID and mobile number to track your Dukaan.pk COD parcel." },
      { property: "og:title", content: "Track Your Order — Dukaan.pk" },
      { property: "og:description", content: "Real-time delivery status for your Dukaan.pk order." },
    ],
  }),
  component: TrackOrder,
});

function TrackOrder() {
  const [state, setState] = useState<"idle" | "loading" | "found">("idle");

  return (
    <ShopLayout>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Track Your Order</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Order ID aur mobile number daal kar apne parcel ka status dekhein.
        </p>

        <form
          className="surface-card mt-6 grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            setState("loading");
            setTimeout(() => setState("found"), 900);
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="oid">Order ID</Label>
            <Input id="oid" required defaultValue="DKN-90232" className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ophone">Mobile Number</Label>
            <Input id="ophone" required placeholder="03XX-XXXXXXX" className="rounded-xl" />
          </div>
          <Button type="submit" className="rounded-xl" disabled={state === "loading"}>
            {state === "loading" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Track
          </Button>
        </form>

        {state === "idle" && (
          <div className="mt-6">
            <EmptyState
              icon={Truck}
              title="Abhi koi order track nahi kiya"
              description="Upar apna Order ID daalein aur Track button dabaen."
            />
          </div>
        )}

        {state === "loading" && (
          <div className="surface-card mt-6 space-y-4 p-6">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        )}

        {state === "found" && (
          <div className="surface-card mt-6 p-6">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Order ID</p>
                <p className="font-display text-lg font-bold">DKN-90232</p>
              </div>
              <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                Dispatched
              </span>
            </div>

            <ol className="mt-6 space-y-0">
              {trackingSteps.map((s, i) => (
                <li key={s.label} className="grid grid-cols-[36px_minmax(0,1fr)] gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "grid h-9 w-9 place-items-center rounded-full border-2 text-xs font-bold",
                        s.done
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-muted-foreground",
                      )}
                    >
                      {s.done ? <Check className="h-4 w-4" /> : i + 1}
                    </span>
                    {i < trackingSteps.length - 1 && (
                      <span className={cn("min-h-10 w-0.5 flex-1", s.done ? "bg-primary" : "bg-border")} />
                    )}
                  </div>
                  <div className="pb-6">
                    <p className={cn("text-sm font-semibold", !s.done && "text-muted-foreground")}>{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.time}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </ShopLayout>
  );
}