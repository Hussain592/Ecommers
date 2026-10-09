import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  LogIn,
  PackagePlus,
  ShieldCheck,
  Store,
  Users,
} from "lucide-react";

import { ShopLayout } from "@/components/shop/ShopLayout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/sell")({
  head: () => ({
    meta: [
      {
        title: "azadari.store",
      },
      {
        name: "description",
        content:
          "Apply to become a vendor on azadari.store and sell Islamic and Azadari products across Pakistan.",
      },
      {
        property: "og:title",
        content: "Sell on azadari.store",
      },
      {
        property: "og:description",
        content:
          "Join azadari.store as a vendor, submit your application and start listing products after approval.",
      },
    ],
  }),

  component: SellOnAzadariPage,
});

const steps = [
  {
    number: "01",
    title: "Register",
    text: "Vendor registration form complete karein.",
  },
  {
    number: "02",
    title: "Verification",
    text: "Application admin review ke liye jayegi.",
  },
  {
    number: "03",
    title: "Approval",
    text: "Approval ke baad Vendor Dashboard access milega.",
  },
  {
    number: "04",
    title: "Start Selling",
    text: "Products add karein aur orders receive karna start karein.",
  },
];

function SellOnAzadariPage() {
  return (
    <ShopLayout>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        {/* =====================================
            INTRO
        ===================================== */}
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9a7927]">
              Vendor Marketplace
            </p>

            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#102d24] sm:text-4xl">
              Sell on azadari.store
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-[#6f7d75] sm:text-base">
              Apne Islamic aur Azadari products ko online list karein aur
              Pakistan bhar ke customers tak pohanchein.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="h-11 rounded-xl border border-[#c9a24b]/35 bg-[#082b21] px-6 font-bold text-[#fffaf0] hover:bg-[#0d3d2f] focus-visible:ring-[#c9a24b]"
              >
                <Link to="/become-vendor">
                  Start Vendor Registration
                  <ArrowRight
                    aria-hidden="true"
                    className="ml-2 h-4 w-4"
                  />
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-11 rounded-xl border-[#d8cdae] bg-[#fffdf7] px-5 text-[#0b513b] hover:bg-[#f7efd9] focus-visible:ring-[#c9a24b]"
              >
                <Link to="/login">
                  <LogIn
                    aria-hidden="true"
                    className="mr-2 h-4 w-4"
                  />
                  Vendor Sign In
                </Link>
              </Button>
            </div>
          </div>

          {/* Trust card */}
          <aside className="rounded-3xl border border-[#ded5bd] bg-[#fffdf7] p-5 shadow-[0_8px_24px_rgba(8,43,33,0.06)]">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#c9a24b]/25 bg-[#f7efd9] text-[#0b513b]">
                <ShieldCheck
                  aria-hidden="true"
                  className="h-5 w-5"
                />
              </span>

              <div>
                <p className="text-sm font-extrabold text-[#102d24]">
                  Vendor approval required
                </p>

                <p className="mt-1 text-xs leading-5 text-[#6f7d75]">
                  Har vendor application review hoti hai. Approval ke baad hi
                  selling access activate hota hai.
                </p>
              </div>
            </div>
          </aside>
        </section>

        {/* =====================================
            BENEFITS
        ===================================== */}
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <article className="rounded-2xl border border-[#ded5bd] bg-[#fffdf7] p-5 shadow-[0_4px_16px_rgba(8,43,33,0.04)]">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f7efd9] text-[#0b513b]">
              <PackagePlus
                aria-hidden="true"
                className="h-5 w-5"
              />
            </span>

            <h2 className="mt-4 text-sm font-extrabold text-[#102d24]">
              Manage Your Products
            </h2>

            <p className="mt-1 text-xs leading-5 text-[#6f7d75]">
              Products, stock aur listing status vendor dashboard se manage
              karein.
            </p>
          </article>

          <article className="rounded-2xl border border-[#ded5bd] bg-[#fffdf7] p-5 shadow-[0_4px_16px_rgba(8,43,33,0.04)]">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f7efd9] text-[#0b513b]">
              <Users
                aria-hidden="true"
                className="h-5 w-5"
              />
            </span>

            <h2 className="mt-4 text-sm font-extrabold text-[#102d24]">
              Reach More Customers
            </h2>

            <p className="mt-1 text-xs leading-5 text-[#6f7d75]">
              Marketplace par apne products ko relevant buyers ke samne
              dikhayein.
            </p>
          </article>

          <article className="rounded-2xl border border-[#ded5bd] bg-[#fffdf7] p-5 shadow-[0_4px_16px_rgba(8,43,33,0.04)]">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f7efd9] text-[#0b513b]">
              <Store
                aria-hidden="true"
                className="h-5 w-5"
              />
            </span>

            <h2 className="mt-4 text-sm font-extrabold text-[#102d24]">
              Your Vendor Dashboard
            </h2>

            <p className="mt-1 text-xs leading-5 text-[#6f7d75]">
              Approval ke baad products aur orders ke liye dedicated dashboard
              access milega.
            </p>
          </article>
        </section>

        {/* =====================================
            PROCESS
        ===================================== */}
        <section className="mt-8 rounded-3xl border border-[#ded5bd] bg-[#fffdf7] p-5 shadow-[0_6px_22px_rgba(8,43,33,0.05)] sm:p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9a7927]">
              Simple Process
            </p>

            <h2 className="mt-1 text-xl font-extrabold text-[#102d24]">
              Vendor banne ka process
            </h2>

            <p className="mt-1 text-sm text-[#6f7d75]">
              Sirf 4 clear steps — registration se selling tak.
            </p>
          </div>

          <ol className="mt-6 grid gap-3 md:grid-cols-4">
            {steps.map((step, index) => (
              <li
                key={step.number}
                className="relative rounded-2xl border border-[#e4dcc8] bg-white p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-extrabold tracking-[0.12em] text-[#9a7927]">
                    {step.number}
                  </span>

                  <span className="grid h-7 w-7 place-items-center rounded-full bg-[#e8f3ed] text-[#0b6b4c]">
                    <Check
                      aria-hidden="true"
                      className="h-3.5 w-3.5"
                    />
                  </span>
                </div>

                <h3 className="mt-4 text-sm font-extrabold text-[#102d24]">
                  {step.title}
                </h3>

                <p className="mt-1 text-xs leading-5 text-[#6f7d75]">
                  {step.text}
                </p>

                {index < steps.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute -right-2 top-1/2 hidden h-px w-4 bg-[#d8cdae] md:block"
                  />
                )}
              </li>
            ))}
          </ol>
        </section>

        {/* =====================================
            PRIMARY ACTION
        ===================================== */}
        <section className="mt-8 overflow-hidden rounded-3xl border border-[#c9a24b]/25 bg-[#082b21] p-6 text-[#fffaf0] shadow-[0_12px_30px_rgba(8,43,33,0.10)] sm:p-7">
          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div>
              <div className="flex items-center gap-2 text-[#d8b85c]">
                <CheckCircle2
                  aria-hidden="true"
                  className="h-4 w-4"
                />

                <p className="text-xs font-bold uppercase tracking-[0.14em]">
                  Ready to apply?
                </p>
              </div>

              <h2 className="mt-2 text-xl font-extrabold sm:text-2xl">
                Start your vendor application
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-[#d8d1bf]">
                Registration complete karein. Submit hone ke baad application
                Pending Review mein jayegi.
              </p>
            </div>

            <Button
              asChild
              size="lg"
              className="h-11 rounded-xl border border-[#d8b85c]/50 bg-[#c9a24b] px-6 font-bold text-[#082b21] hover:bg-[#ddbd61] focus-visible:ring-[#f1d77e]"
            >
              <Link to="/become-vendor">
                Vendor Registration
                <ArrowRight
                  aria-hidden="true"
                  className="ml-2 h-4 w-4"
                />
              </Link>
            </Button>
          </div>
        </section>

        {/* =====================================
            EXISTING VENDOR + CUSTOMER NOTE
        ===================================== */}
        <section className="mt-6 rounded-2xl border border-[#ded5bd] bg-[#fffdf7] p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-extrabold text-[#102d24]">
                Already an approved vendor?
              </p>

              <p className="mt-1 text-xs leading-5 text-[#6f7d75]">
                Apne existing account se sign in karke vendor dashboard open
                karein.
              </p>
            </div>

            <Button
              asChild
              variant="outline"
              className="h-10 rounded-xl border-[#d8cdae] text-[#0b513b] hover:bg-[#f7efd9] focus-visible:ring-[#c9a24b]"
            >
              <Link to="/login">
                <LogIn
                  aria-hidden="true"
                  className="mr-2 h-4 w-4"
                />
                Vendor Sign In
              </Link>
            </Button>
          </div>
        </section>

        <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-5 text-[#89938e]">
          Sirf shopping karni hai? Customer account ki zarurat nahi — products
          browse karke guest checkout se order place kiya ja sakta hai.
        </p>
      </main>
    </ShopLayout>
  );
}
