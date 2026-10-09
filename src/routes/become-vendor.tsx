import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Store,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { ShopLayout } from "@/components/shop/ShopLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/become-vendor")({
  head: () => ({
    meta: [
      { title: "azadari.store" },
      {
        name: "description",
        content:
          "Apply to become a vendor on azadari.store and start selling Islamic and Azadari products after approval.",
      },
      {
        property: "og:title",
        content: "Become a Vendor — azadari.store",
      },
      {
        property: "og:description",
        content: "Submit your vendor application to join azadari.store.",
      },
    ],
  }),
  component: BecomeVendorPage,
});

function BecomeVendorPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);

    try {
      const formData = new FormData(event.currentTarget);

      const fullName = String(formData.get("fullName") ?? "").trim();
      const email = String(formData.get("email") ?? "")
        .trim()
        .toLowerCase();
      const password = String(formData.get("password") ?? "");
      const storeName = String(formData.get("storeName") ?? "").trim();
      const phone = String(formData.get("phone") ?? "").trim();
      const city = String(formData.get("city") ?? "").trim();
      const address = String(formData.get("address") ?? "").trim();

      if (
        !fullName ||
        !email ||
        !password ||
        !storeName ||
        !phone ||
        !city ||
        !address
      ) {
        toast.error("Tamam required fields fill karein.");
        return;
      }

      if (password.length < 6) {
        toast.error("Password kam az kam 6 characters ka hona chahiye.");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: fullName,
            role: "customer",
            signup_type: "vendor",
            store_name: storeName,
            phone,
            city,
            address,
          },
        },
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error("Vendor account create nahi ho saka.");
      }

      if (data.session) {
        await supabase.auth.signOut();
      }

      setSubmittedEmail(email);
      setSubmitted(true);
      toast.success("Vendor application submit ho gayi!");
    } catch (error) {
      console.error("Unable to submit vendor application", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Vendor application submit nahi ho saki.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <ShopLayout>
        <main className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
          <section className="overflow-hidden rounded-3xl border border-[#c9a24b]/25 bg-[#fffdf7] shadow-[0_14px_34px_rgba(8,43,33,0.08)]">
            <div className="border-b border-[#eadfc4] bg-[linear-gradient(135deg,#eef7f2_0%,#fffdf7_65%,#f7efd9_100%)] px-6 py-8 text-center sm:px-9">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-[#b9decf] bg-[#e8f4ef] text-[#0b6b4c]">
                <CheckCircle2 aria-hidden="true" className="h-8 w-8" />
              </div>

              <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-[#9a7927]">
                Application received
              </p>

              <h1 className="mt-2 text-2xl font-extrabold text-[#102d24] sm:text-3xl">
                Vendor Application Submitted
              </h1>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#6f7d75]">
                Aapki application successfully submit ho gayi hai. Ab admin
                review ke baad account status update hoga.
              </p>
            </div>

            <div className="p-6 sm:p-8">
              <div className="rounded-2xl border border-[#ded5bd] bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-[#6f7d75]">Status</span>

                  <span className="rounded-full border border-[#e8d79d] bg-[#fff8dc] px-3 py-1 text-xs font-bold text-[#8a6a13]">
                    Pending Review
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#eee6d2] pt-4">
                  <span className="text-sm text-[#6f7d75]">Email</span>

                  <span className="max-w-[65%] truncate text-sm font-semibold text-[#102d24]">
                    {submittedEmail}
                  </span>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-[#c9a24b]/20 bg-[#f7efd9]/55 p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    aria-hidden="true"
                    className="mt-0.5 h-5 w-5 shrink-0 text-[#0b6b4c]"
                  />

                  <div>
                    <h2 className="text-sm font-extrabold text-[#102d24]">
                      Ab kya hoga?
                    </h2>

                    <ol className="mt-3 space-y-2.5 text-sm leading-5 text-[#5f6d65]">
                      <li>1. Admin aapki application review karega.</li>
                      <li>2. Approval ke baad vendor account active hoga.</li>
                      <li>
                        3. Phir aap sign in karke Vendor Dashboard access kar
                        sakenge.
                      </li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button
                  asChild
                  className="h-11 rounded-xl bg-[#082b21] px-6 font-bold text-[#fffaf0] hover:bg-[#0d3d2f] focus-visible:ring-[#c9a24b]"
                >
                  <Link to="/">Back to Home</Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="h-11 rounded-xl border-[#d8cdae] bg-white px-6 text-[#0b513b] hover:bg-[#f7efd9] focus-visible:ring-[#c9a24b]"
                >
                  <Link to="/login">Sign In</Link>
                </Button>
              </div>
            </div>
          </section>
        </main>
      </ShopLayout>
    );
  }

  return (
    <ShopLayout>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <Link
          to="/sell"
          className="inline-flex items-center gap-2 rounded-md text-sm font-semibold text-[#637168] transition-colors hover:text-[#0b513b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b]"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to Sell on azadari.store
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <section>
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9a7927]">
                Vendor Application
              </p>

              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#102d24] sm:text-4xl">
                Become a Vendor
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-[#6f7d75] sm:text-base">
                Apni account aur store details fill karein. Application review
                hone ke baad selling access activate hoga.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-7 overflow-hidden rounded-3xl border border-[#ded5bd] bg-[#fffdf7] shadow-[0_8px_24px_rgba(8,43,33,0.06)]"
            >
              <section className="p-5 sm:p-7">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#c9a24b]/25 bg-[#f7efd9] text-[#0b513b]">
                    <UserRound aria-hidden="true" className="h-5 w-5" />
                  </span>

                  <div>
                    <h2 className="text-lg font-extrabold text-[#102d24]">
                      Account Information
                    </h2>

                    <p className="mt-1 text-xs leading-5 text-[#6f7d75]">
                      Ye details aapke vendor login aur account ke liye use
                      hongi.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="fullName"
                      className="text-sm font-semibold text-[#102d24]"
                    >
                      Full Name *
                    </Label>

                    <div className="relative">
                      <UserRound
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b968f]"
                      />

                      <Input
                        id="fullName"
                        name="fullName"
                        required
                        autoComplete="name"
                        placeholder="Muhammad Ahmed"
                        className="h-11 rounded-xl border-[#d8cdae] bg-white pl-10 focus-visible:ring-[#c9a24b]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="email"
                      className="text-sm font-semibold text-[#102d24]"
                    >
                      Email *
                    </Label>

                    <div className="relative">
                      <Mail
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b968f]"
                      />

                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="you@example.com"
                        className="h-11 rounded-xl border-[#d8cdae] bg-white pl-10 focus-visible:ring-[#c9a24b]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label
                      htmlFor="password"
                      className="text-sm font-semibold text-[#102d24]"
                    >
                      Password *
                    </Label>

                    <div className="relative">
                      <LockKeyhole
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b968f]"
                      />

                      <Input
                        id="password"
                        name="password"
                        type="password"
                        minLength={6}
                        required
                        autoComplete="new-password"
                        placeholder="At least 6 characters"
                        className="h-11 rounded-xl border-[#d8cdae] bg-white pl-10 focus-visible:ring-[#c9a24b]"
                      />
                    </div>

                    <p className="text-[11px] text-[#89938e]">
                      Kam az kam 6 characters.
                    </p>
                  </div>
                </div>
              </section>

              <section className="border-t border-[#eee6d2] p-5 sm:p-7">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#c9a24b]/25 bg-[#f7efd9] text-[#0b513b]">
                    <Store aria-hidden="true" className="h-5 w-5" />
                  </span>

                  <div>
                    <h2 className="text-lg font-extrabold text-[#102d24]">
                      Store Information
                    </h2>

                    <p className="mt-1 text-xs leading-5 text-[#6f7d75]">
                      Customers ko aapka business isi store name se nazar
                      aayega.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label
                      htmlFor="storeName"
                      className="text-sm font-semibold text-[#102d24]"
                    >
                      Store Name *
                    </Label>

                    <div className="relative">
                      <Building2
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b968f]"
                      />

                      <Input
                        id="storeName"
                        name="storeName"
                        required
                        placeholder="e.g. Al-Madina Traders"
                        className="h-11 rounded-xl border-[#d8cdae] bg-white pl-10 focus-visible:ring-[#c9a24b]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="phone"
                      className="text-sm font-semibold text-[#102d24]"
                    >
                      Phone Number *
                    </Label>

                    <div className="relative">
                      <Phone
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b968f]"
                      />

                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        inputMode="tel"
                        required
                        autoComplete="tel"
                        placeholder="03XX-XXXXXXX"
                        className="h-11 rounded-xl border-[#d8cdae] bg-white pl-10 focus-visible:ring-[#c9a24b]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="city"
                      className="text-sm font-semibold text-[#102d24]"
                    >
                      City *
                    </Label>

                    <div className="relative">
                      <MapPin
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b968f]"
                      />

                      <Input
                        id="city"
                        name="city"
                        required
                        autoComplete="address-level2"
                        placeholder="Karachi"
                        className="h-11 rounded-xl border-[#d8cdae] bg-white pl-10 focus-visible:ring-[#c9a24b]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label
                      htmlFor="address"
                      className="text-sm font-semibold text-[#102d24]"
                    >
                      Business / Pickup Address *
                    </Label>

                    <Textarea
                      id="address"
                      name="address"
                      required
                      rows={3}
                      autoComplete="street-address"
                      placeholder="Complete business or pickup address"
                      className="rounded-xl border-[#d8cdae] bg-white focus-visible:ring-[#c9a24b]"
                    />
                  </div>
                </div>
              </section>

              <section className="border-t border-[#eee6d2] bg-[#fcfaf3] p-5 sm:p-7">
                <div className="flex items-start gap-3 rounded-2xl border border-[#c9a24b]/25 bg-[#f7efd9]/60 p-4">
                  <ShieldCheck
                    aria-hidden="true"
                    className="mt-0.5 h-5 w-5 shrink-0 text-[#0b6b4c]"
                  />

                  <div>
                    <p className="text-sm font-extrabold text-[#102d24]">
                      Admin approval required
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#5f6d65]">
                      Submit hone ke baad application Pending Review mein
                      rahegi. Approval ke baad Vendor Dashboard access milega.
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={loading}
                  className="mt-5 h-11 w-full rounded-xl border border-[#c9a24b]/35 bg-[#082b21] font-bold text-[#fffaf0] hover:bg-[#0d3d2f] focus-visible:ring-[#c9a24b] disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2
                        aria-hidden="true"
                        className="mr-2 h-4 w-4 animate-spin"
                      />
                      Submitting Application...
                    </>
                  ) : (
                    <>
                      Submit Vendor Application
                      <ArrowRight
                        aria-hidden="true"
                        className="ml-2 h-4 w-4"
                      />
                    </>
                  )}
                </Button>

                <p className="mt-4 text-center text-xs text-[#7c8881]">
                  Already an approved vendor?{" "}
                  <Link
                    to="/login"
                    className="font-bold text-[#0b513b] underline decoration-[#c9a24b] underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b]"
                  >
                    Sign in
                  </Link>
                </p>
              </section>
            </form>
          </section>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <section className="rounded-3xl border border-[#ded5bd] bg-[#fffdf7] p-5 shadow-[0_6px_20px_rgba(8,43,33,0.05)]">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#082b21] text-[#e2c56c]">
                  <Store aria-hidden="true" className="h-5 w-5" />
                </span>

                <div>
                  <p className="text-sm font-extrabold text-[#102d24]">
                    Simple vendor setup
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#6f7d75]">
                    Form complete karein, approval ka wait karein, phir selling
                    start karein.
                  </p>
                </div>
              </div>

              <ol className="mt-5 space-y-4">
                {[
                  "Application submit",
                  "Admin review",
                  "Vendor approval",
                  "Dashboard access",
                ].map((step, index) => (
                  <li key={step} className="flex items-center gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[#c9a24b]/30 bg-[#f7efd9] text-[11px] font-extrabold text-[#70591f]">
                      {index + 1}
                    </span>

                    <span className="text-sm font-medium text-[#44564d]">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </section>

            <section className="rounded-2xl border border-[#b9decf] bg-[#eef7f3] p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2
                  aria-hidden="true"
                  className="mt-0.5 h-5 w-5 shrink-0 text-[#0b6b4c]"
                />

                <div>
                  <p className="text-sm font-bold text-[#0b513b]">
                    No selling before approval
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#517066]">
                    Application approve hone tak vendor account selling ke liye
                    active nahi hoga.
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </ShopLayout>
  );
}
