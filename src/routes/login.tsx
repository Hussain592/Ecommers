import {
  createFileRoute,
  Link,
  useNavigate,
} from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  MoonStar,
  ShieldCheck,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      {
        title: "azadari.store",
      },
      {
        name: "description",
        content:
          "Sign in to your azadari.store account or create a customer account.",
      },
      {
        property: "og:title",
        content: "Sign In — azadari.store",
      },
      {
        property: "og:description",
        content:
          "Access your azadari.store account, vendor dashboard or partner dashboard.",
      },
    ],
  }),

  component: LoginPage,
});

function LoginPage() {
  const [loading, setLoading] =
    useState(false);

  const [
    creatingAccount,
    setCreatingAccount,
  ] = useState(false);

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);

    try {
      const formData =
        new FormData(event.currentTarget);

      const email = String(
        formData.get("email") ?? "",
      )
        .trim()
        .toLowerCase();

      const password = String(
        formData.get("password") ?? "",
      );

      if (
        !email ||
        !password
      ) {
        toast.error(
          "Email aur password enter karein.",
        );
        return;
      }

      if (password.length < 6) {
        toast.error(
          "Password kam az kam 6 characters ka hona chahiye.",
        );
        return;
      }

      /*
       * =====================================
       * CREATE CUSTOMER ACCOUNT
       * =====================================
       */
      if (creatingAccount) {
        const name = String(
          formData.get("name") ?? "",
        ).trim();

        if (!name) {
          toast.error(
            "Full name enter karein.",
          );
          return;
        }

        const {
          data,
          error,
        } =
          await supabase.auth.signUp({
            email,
            password,

            options: {
              data: {
                name,
                role: "customer",
              },
            },
          });

        if (error) {
          throw error;
        }

        if (!data.user) {
          throw new Error(
            "Account create nahi ho saka.",
          );
        }

        if (!data.session) {
          toast.success(
            "Account ban gaya. Email confirm karke phir sign in karein.",
          );

          setCreatingAccount(false);
        } else {
          toast.success(
            "Account ban gaya!",
          );

          await navigate({
            to: "/",
          });
        }

        return;
      }

      /*
       * =====================================
       * SIGN IN
       * =====================================
       */
      const {
        data,
        error,
      } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        throw error;
      }

      const {
        data: profile,
      } = await supabase
        .from("users")
        .select(
          "role, status",
        )
        .eq(
          "auth_id",
          data.user.id,
        )
        .maybeSingle();

      let target = "/";

      if (
        profile?.role ===
        "admin"
      ) {
        target = "/admin";
      } else if (
        profile?.role ===
        "vendor"
      ) {
        const {
          data: vendorRow,
        } = await supabase
          .from("vendors")
          .select("status")
          .eq(
            "owner_id",
            data.user.id,
          )
          .maybeSingle();

        if (
          vendorRow?.status !==
          "Active"
        ) {
          toast.error(
            "Aapka vendor account abhi active nahi hai. Admin se rabta karein.",
          );

          await supabase.auth.signOut();
          return;
        }

        target = "/vendor";
      } else if (
        profile?.role ===
        "partner"
      ) {
        if (
          profile?.status !==
          "Active"
        ) {
          toast.error(
            "Aapka partner account abhi active nahi hai. Admin se rabta karein.",
          );

          await supabase.auth.signOut();
          return;
        }

        target = "/partner";
      }

      toast.success(
        "Welcome back!",
      );

      /*
       * Full navigation intentionally preserve ki gayi hai
       * taa-ke auth/provider state fresh load ho.
       */
      window.location.href =
        target;
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Login complete nahi ho saka.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f8f5] lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(520px,1.1fr)]">
      {/* =====================================
          LEFT BRAND PANEL
      ===================================== */}
      <section className="relative hidden overflow-hidden bg-[#061f18] p-10 text-[#fffaf0] lg:flex lg:flex-col lg:justify-between xl:p-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#c9a24b]/10 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-[#c9a24b]/10 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(45deg, #fff 25%, transparent 25%), linear-gradient(-45deg, #fff 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #fff 75%), linear-gradient(-45deg, transparent 75%, #fff 75%)",
            backgroundSize:
              "28px 28px",
            backgroundPosition:
              "0 0, 0 14px, 14px -14px, -14px 0px",
          }}
        />

        <Link
          to="/"
          aria-label="azadari.store home"
          className="relative inline-flex w-fit items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b]"
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl border border-[#c9a24b]/40 bg-white/5 text-[#e2c56c]">
            <MoonStar
              aria-hidden="true"
              className="h-5 w-5"
            />
          </span>

          <div>
            <p className="font-display text-lg font-extrabold">
              azadari.store
            </p>

            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#c9a24b]">
              Islamic Marketplace
            </p>
          </div>
        </Link>

        <div className="relative max-w-md">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d8b85c]">
            Welcome
          </p>

          <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight">
            Your marketplace account,
            <span className="text-[#e2c56c]">
              {" "}
              one simple sign in.
            </span>
          </h1>

          <p className="mt-4 text-sm leading-7 text-[#d8d1bf]">
            Customer orders, vendor dashboard aur partner tools —
            account role ke mutabiq aapko automatically sahi jagah
            bheja jayega.
          </p>

          <div className="mt-7 grid gap-3">
            <div className="flex items-start gap-3 rounded-2xl border border-[#c9a24b]/15 bg-white/5 p-4">
              <ShieldCheck
                aria-hidden="true"
                className="mt-0.5 h-5 w-5 shrink-0 text-[#d8b85c]"
              />

              <div>
                <p className="text-sm font-bold">
                  Secure account access
                </p>

                <p className="mt-1 text-xs leading-5 text-[#cfc7b5]">
                  Vendor aur partner access sirf active approved accounts ko milta hai.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-[#c9a24b]/15 bg-white/5 p-4">
              <ShoppingBag
                aria-hidden="true"
                className="mt-0.5 h-5 w-5 shrink-0 text-[#d8b85c]"
              />

              <div>
                <p className="text-sm font-bold">
                  Guest shopping available
                </p>

                <p className="mt-1 text-xs leading-5 text-[#cfc7b5]">
                  Customer account zaroori nahi — guest checkout se bhi order ho sakta hai.
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="relative text-xs text-[#a9a294]">
          © 2026 azadari.store
        </p>
      </section>

      {/* =====================================
          RIGHT AUTH AREA
      ===================================== */}
      <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link
            to="/"
            aria-label="azadari.store home"
            className="mb-8 inline-flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b] lg:hidden"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-[#c9a24b]/35 bg-[#082b21] text-[#e2c56c]">
              <MoonStar
                aria-hidden="true"
                className="h-5 w-5"
              />
            </span>

            <div>
              <p className="font-display text-lg font-extrabold text-[#102d24]">
                azadari.store
              </p>

              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#9a7927]">
                Islamic Marketplace
              </p>
            </div>
          </Link>

          {/* Auth card */}
          <section className="rounded-3xl border border-[#ded5bd] bg-[#fffdf7] p-5 shadow-[0_12px_32px_rgba(8,43,33,0.07)] sm:p-7">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9a7927]">
                {creatingAccount
                  ? "Create Account"
                  : "Account Access"}
              </p>

              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#102d24] sm:text-3xl">
                {creatingAccount
                  ? "Create your account"
                  : "Welcome back"}
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#6f7d75]">
                {creatingAccount
                  ? "Customer account banayein. Shopping guest checkout se bhi available hai."
                  : "Apne account mein sign in karein."}
              </p>
            </div>

            <form
              className="mt-6 space-y-4"
              onSubmit={
                handleSubmit
              }
            >
              {creatingAccount && (
                <div className="space-y-1.5">
                  <Label
                    htmlFor="name"
                    className="text-sm font-semibold text-[#102d24]"
                  >
                    Full Name
                  </Label>

                  <div className="relative">
                    <UserRound
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b968f]"
                    />

                    <Input
                      id="name"
                      name="name"
                      required
                      autoComplete="name"
                      placeholder="Ahmed Raza"
                      className="h-11 rounded-xl border-[#d8cdae] bg-white pl-10 focus-visible:ring-[#c9a24b]"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label
                  htmlFor="email"
                  className="text-sm font-semibold text-[#102d24]"
                >
                  Email
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

              <div className="space-y-1.5">
                <Label
                  htmlFor="password"
                  className="text-sm font-semibold text-[#102d24]"
                >
                  Password
                </Label>

                <div className="relative">
                  <LockKeyhole
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b968f]"
                  />

                  <Input
                    id="password"
                    name="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    minLength={6}
                    required
                    autoComplete={
                      creatingAccount
                        ? "new-password"
                        : "current-password"
                    }
                    placeholder="At least 6 characters"
                    className="h-11 rounded-xl border-[#d8cdae] bg-white pl-10 pr-11 focus-visible:ring-[#c9a24b]"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (value) =>
                          !value,
                      )
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    aria-pressed={
                      showPassword
                    }
                    className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-[#718078] transition-colors hover:bg-[#f7efd9] hover:text-[#0b513b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b]"
                  >
                    {showPassword ? (
                      <EyeOff
                        aria-hidden="true"
                        className="h-4 w-4"
                      />
                    ) : (
                      <Eye
                        aria-hidden="true"
                        className="h-4 w-4"
                      />
                    )}
                  </button>
                </div>

                {creatingAccount && (
                  <p className="text-[11px] text-[#89938e]">
                    Kam az kam 6 characters.
                  </p>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                className="h-11 w-full rounded-xl border border-[#c9a24b]/35 bg-[#082b21] font-bold text-[#fffaf0] shadow-none hover:bg-[#0d3d2f] focus-visible:ring-2 focus-visible:ring-[#c9a24b] focus-visible:ring-offset-2 disabled:opacity-60"
                disabled={
                  loading
                }
              >
                {loading ? (
                  <Loader2
                    aria-hidden="true"
                    className="mr-2 h-4 w-4 animate-spin"
                  />
                ) : (
                  <ArrowRight
                    aria-hidden="true"
                    className="mr-2 h-4 w-4"
                  />
                )}

                {loading
                  ? creatingAccount
                    ? "Creating Account..."
                    : "Signing In..."
                  : creatingAccount
                    ? "Create Account"
                    : "Sign In"}
              </Button>
            </form>

            {/* Mode switch */}
            <div className="mt-5 border-t border-[#eee6d2] pt-5 text-center">
              <p className="text-sm text-[#6f7d75]">
                {creatingAccount
                  ? "Already have an account?"
                  : "New here?"}
              </p>

              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setCreatingAccount(
                    (value) =>
                      !value,
                  );

                  setShowPassword(
                    false,
                  );
                }}
                className="mt-1 rounded-md font-semibold text-[#0b513b] underline decoration-[#c9a24b] underline-offset-4 transition-colors hover:text-[#082b21] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b] disabled:opacity-50"
              >
                {creatingAccount
                  ? "Sign in instead"
                  : "Create an account"}
              </button>
            </div>
          </section>

          {/* Guest checkout */}
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#c9a24b]/20 bg-[#f7efd9]/55 p-4">
            <ShoppingBag
              aria-hidden="true"
              className="mt-0.5 h-5 w-5 shrink-0 text-[#0b513b]"
            />

            <div>
              <p className="text-sm font-bold text-[#102d24]">
                Sirf shopping karni hai?
              </p>

              <p className="mt-1 text-xs leading-5 text-[#6f7d75]">
                Customer account ki zaroorat nahi.{" "}
                <Link
                  to="/products"
                  className="font-bold text-[#0b513b] underline decoration-[#c9a24b] underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b]"
                >
                  Guest checkout se shop karein
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
