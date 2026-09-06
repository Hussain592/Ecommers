import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — Dukaan.pk" },
      { name: "description", content: "Sign in to your Dukaan.pk account." },
      { property: "og:title", content: "Login — Dukaan.pk" },
      { property: "og:description", content: "Access your Dukaan.pk account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between gradient-primary p-12 text-primary-foreground lg:flex">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-foreground/20 text-sm font-bold">D</span>
          <span className="font-display text-lg font-extrabold">Dukaan.pk</span>
        </Link>
        <div>
          <h2 className="font-display text-3xl font-extrabold leading-tight">
            Pakistan ka apna multivendor marketplace
          </h2>
          <p className="mt-3 max-w-sm text-sm opacity-90">
            COD orders, vendor dashboards, partner tools aur commission tracking — sab ek jagah.
          </p>
        </div>
        <p className="text-xs opacity-70">© 2026 Dukaan.pk</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-xl gradient-primary text-sm font-bold text-primary-foreground">D</span>
            <span className="font-display text-lg font-extrabold">Dukaan.pk</span>
          </Link>

          <h1 className="text-2xl font-extrabold">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {creatingAccount ? "Naya account banayein." : "Apne account mein sign in karein."}
          </p>

          <form
            className="mt-6 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              try {
                const formData = new FormData(e.currentTarget);
                const email = String(formData.get("email") ?? "").trim();
                const password = String(formData.get("password") ?? "");

                if (creatingAccount) {
                  const name = String(formData.get("name") ?? "").trim();

                  const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { name, role: "customer" } },
                  });
                  if (error) throw error;
                  if (!data.user) throw new Error("Account create nahi ho saka.");

                  if (!data.session) {
                    toast.success("Account ban gaya. Email confirm karke phir sign in karein.");
                  } else {
                    toast.success("Account ban gaya!");
                    await navigate({ to: "/" });
                  }
                } else {
                  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                  if (error) throw error;

                  const { data: profile } = await supabase
                    .from("users")
                    .select("role, status")
                    .eq("auth_id", data.user.id)
                    .maybeSingle();

                  let target = "/";

                  if (profile?.role === "admin") {
                    target = "/admin";
                  } else if (profile?.role === "vendor") {
                    const { data: vendorRow } = await supabase
                      .from("vendors")
                      .select("status")
                      .eq("owner_id", data.user.id)
                      .maybeSingle();
                    if (vendorRow?.status !== "Active") {
                      toast.error("Aapka vendor account abhi active nahi hai. Admin se rabta karein.");
                      setLoading(false);
                      return;
                    }
                    target = "/vendor";
                  } else if (profile?.role === "partner") {
                    if (profile?.status !== "Active") {
                      toast.error("Aapka partner account abhi active nahi hai. Admin se rabta karein.");
                      setLoading(false);
                      return;
                    }
                    target = "/partner";
                  }

                  toast.success("Welcome back!");
                  window.location.href = target;
                }
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Login complete nahi ho saka.");
              } finally {
                setLoading(false);
              }
            }}
          >
            {creatingAccount && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" required placeholder="Ahmed Raza" className="h-11 rounded-xl" />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required placeholder="you@example.com" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" minLength={6} required placeholder="At least 6 characters" className="h-11 rounded-xl" />
            </div>
            <Button type="submit" size="lg" className="w-full rounded-xl" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {creatingAccount ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <button type="button" className="mt-4 w-full text-center text-sm text-primary underline" onClick={() => setCreatingAccount((value) => !value)}>
            {creatingAccount ? "Already have an account? Sign in" : "New here? Create an account"}
          </button>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Customer ho? <Link to="/products" className="text-primary underline">Guest checkout</Link> se bina account
            order karein.
          </p>
        </div>
      </div>
    </div>
  );
}