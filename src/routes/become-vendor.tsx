import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Store,
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
      {
        title: "Become a Vendor — Dukaan.pk",
      },
      {
        name: "description",
        content:
          "Apply to become a vendor and start selling products on Dukaan.pk.",
      },
      {
        property: "og:title",
        content: "Become a Vendor — Dukaan.pk",
      },
      {
        property: "og:description",
        content:
          "Submit your vendor application to start selling on Dukaan.pk.",
      },
    ],
  }),

  component: BecomeVendorPage,
});

function BecomeVendorPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setLoading(true);

    try {
      const formData = new FormData(event.currentTarget);

      const fullName = String(
        formData.get("fullName") ?? "",
      ).trim();

      const email = String(
        formData.get("email") ?? "",
      )
        .trim()
        .toLowerCase();

      const password = String(
        formData.get("password") ?? "",
      );

      const storeName = String(
        formData.get("storeName") ?? "",
      ).trim();

      const phone = String(
        formData.get("phone") ?? "",
      ).trim();

      const city = String(
        formData.get("city") ?? "",
      ).trim();

      const address = String(
        formData.get("address") ?? "",
      ).trim();

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
        toast.error(
          "Password kam az kam 6 characters ka hona chahiye.",
        );
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,

        options: {
          data: {
            name: fullName,

            // Admin approval se pehle normal customer role.
            role: "customer",

            // Is metadata se Supabase trigger
            // Pending vendor application banayega.
            signup_type: "vendor",

            store_name: storeName,
            phone,
            city,
            address,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error(
          "Vendor account create nahi ho saka.",
        );
      }

      // Pending applicant ko logged-in nahi rehna chahiye.
      if (data.session) {
        await supabase.auth.signOut();
      }

      setSubmittedEmail(email);
      setSubmitted(true);

      toast.success(
        "Vendor application submit ho gayi!",
      );
    } catch (error) {
      console.error(
        "Unable to submit vendor application",
        error,
      );

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
        <main className="mx-auto max-w-2xl px-4 py-16">
          <div className="surface-card p-6 text-center sm:p-10">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/10 text-success">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <h1 className="mt-5 text-2xl font-extrabold sm:text-3xl">
              Application Submitted
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              Aapki vendor application successfully submit
              ho gayi hai.
            </p>

            <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-5 text-left">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">
                  Status
                </span>

                <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                  Pending Review
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
                <span className="text-sm text-muted-foreground">
                  Email
                </span>

                <span className="truncate text-sm font-medium">
                  {submittedEmail}
                </span>
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-primary-soft/60 p-4 text-left">
              <p className="text-sm font-semibold">
                Ab kya hoga?
              </p>

              <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  1. Admin aapki application review karega.
                </li>

                <li>
                  2. Approval ke baad vendor account active hoga.
                </li>

                <li>
                  3. Phir aap login karke Vendor Dashboard
                  access kar sakenge.
                </li>
              </ol>
            </div>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild className="rounded-xl">
                <Link to="/">
                  Back to Home
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="rounded-xl"
              >
                <Link to="/login">
                  Sign In
                </Link>
              </Button>
            </div>
          </div>
        </main>
      </ShopLayout>
    );
  }

  return (
    <ShopLayout>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Link
          to="/sell"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sell on Dukaan
        </Link>

        <div className="mt-6">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary">
              <Store className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-extrabold sm:text-3xl">
                Become a Vendor
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Apna store Dukaan.pk par register karein.
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="surface-card mt-7 p-5 sm:p-7"
        >
          <section>
            <h2 className="font-bold">
              Account Information
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              Ye details aapke vendor account ke liye use hongi.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">
                  Full Name *
                </Label>

                <Input
                  id="fullName"
                  name="fullName"
                  required
                  autoComplete="name"
                  placeholder="Muhammad Ahmed"
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">
                  Email *
                </Label>

                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="password">
                  Password *
                </Label>

                <Input
                  id="password"
                  name="password"
                  type="password"
                  minLength={6}
                  required
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  className="h-11 rounded-xl"
                />

                <p className="text-xs text-muted-foreground">
                  Kam az kam 6 characters.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-7 border-t border-border pt-7">
            <h2 className="font-bold">
              Store Information
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              Customers ko aapka business isi store name se
              nazar aayega.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="storeName">
                  Store Name *
                </Label>

                <Input
                  id="storeName"
                  name="storeName"
                  required
                  placeholder="e.g. Al-Madina Traders"
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">
                  Phone Number *
                </Label>

                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  placeholder="03XX-XXXXXXX"
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="city">
                  City *
                </Label>

                <Input
                  id="city"
                  name="city"
                  required
                  autoComplete="address-level2"
                  placeholder="Karachi"
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="address">
                  Business / Pickup Address *
                </Label>

                <Textarea
                  id="address"
                  name="address"
                  required
                  rows={3}
                  autoComplete="street-address"
                  placeholder="Complete business or pickup address"
                  className="rounded-xl"
                />
              </div>
            </div>
          </section>

          <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm font-semibold">
              Admin approval required
            </p>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Application submit karne ke baad aapka vendor
              account Pending rahega. Admin approval ke baad
              Vendor Dashboard access milega.
            </p>
          </div>

          <Button
            type="submit"
            size="lg"
            className="mt-6 w-full rounded-xl"
            disabled={loading}
          >
            {loading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}

            {loading
              ? "Submitting Application..."
              : "Submit Vendor Application"}
          </Button>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Already an approved vendor?{" "}
            <Link
              to="/login"
              className="font-medium text-primary underline underline-offset-4"
            >
              Sign in
            </Link>
          </p>
        </form>
      </main>
    </ShopLayout>
  );
}