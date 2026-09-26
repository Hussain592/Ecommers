import { createFileRoute, Link } from "@tanstack/react-router";

import {
  ArrowRight,
  CheckCircle2,
  LogIn,
  PackagePlus,
  ShieldCheck,
  Store,
} from "lucide-react";

import { ShopLayout } from "@/components/shop/ShopLayout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/sell")({
  head: () => ({
    meta: [
      {
        title: "Sell on Dukaan — Dukaan.pk",
      },
      {
        name: "description",
        content:
          "Apply to become a vendor and start selling your products on Dukaan.pk.",
      },
      {
        property: "og:title",
        content: "Sell on Dukaan — Dukaan.pk",
      },
      {
        property: "og:description",
        content:
          "Join Dukaan.pk as a vendor and grow your business online.",
      },
    ],
  }),

  component: SellOnDukaanPage,
});

function SellOnDukaanPage() {
  return (
    <ShopLayout>
      <main className="mx-auto max-w-6xl px-4 py-12">
        {/* Hero */}
        <section className="mx-auto max-w-3xl text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary">
            <Store className="h-7 w-7" />
          </div>

          <h1 className="mt-5 font-display text-3xl font-extrabold sm:text-4xl">
            Sell on Dukaan.pk
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Apna business Dukaan.pk par laayein, products list karein
            aur Pakistan bhar ke customers tak pohanchein.
          </p>
        </section>

        {/* Main Card */}
        <section className="mx-auto mt-10 max-w-3xl">
          <div className="surface-card overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                  <Store className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="text-xl font-bold">
                    Become a Vendor
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Apna store create karein aur Dukaan.pk par products
                    sell karna start karein.
                  </p>
                </div>
              </div>

              {/* Benefits */}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-4">
                  <PackagePlus className="mt-0.5 h-5 w-5 shrink-0 text-primary" />

                  <div>
                    <p className="text-sm font-semibold">
                      List Your Products
                    </p>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Apne products aur stock ko vendor dashboard se manage karein.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-4">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />

                  <div>
                    <p className="text-sm font-semibold">
                      Admin Verification
                    </p>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Vendor application review aur approval ke baad account active hoga.
                    </p>
                  </div>
                </div>
              </div>

              {/* Process */}
              <div className="mt-7 border-t border-border pt-6">
                <p className="text-sm font-semibold">
                  Kaise kaam karta hai?
                </p>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />

                    <p className="text-sm text-muted-foreground">
                      Vendor registration form complete karein
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />

                    <p className="text-sm text-muted-foreground">
                      Application admin review ke liye jayegi
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />

                    <p className="text-sm text-muted-foreground">
                      Approval ke baad Vendor Dashboard access milega
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />

                    <p className="text-sm text-muted-foreground">
                      Products add karein aur selling start karein
                    </p>
                  </div>
                </div>
              </div>

              {/* Vendor Registration */}
              <div className="mt-7 rounded-2xl border border-primary/20 bg-primary-soft/40 p-5">
                <h3 className="font-bold">
                  Ready to become a vendor?
                </h3>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Vendor registration form complete karke apni application
                  submit karein. Application submit hone ke baad status
                  Pending Review hoga.
                </p>

                <Button
                  asChild
                  className="mt-4 w-full rounded-xl sm:w-auto"
                >
                  <a href="/become-vendor">
                    Vendor Registration
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>

            {/* Existing Vendor */}
            <div className="border-t border-border bg-muted/30 px-6 py-5 sm:px-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">
                    Already an approved vendor?
                  </p>

                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Apne existing account se sign in karein.
                  </p>
                </div>

                <Button
                  asChild
                  variant="outline"
                  className="rounded-xl"
                >
                  <Link to="/login">
                    <LogIn className="mr-2 h-4 w-4" />
                    Vendor Sign In
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Customer clarification */}
        <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-5 text-muted-foreground">
          Sirf shopping karni hai? Customer account ki zarurat nahi.
          Aap products browse karke guest checkout se directly order kar sakte hain.
        </p>
      </main>
    </ShopLayout>
  );
}