import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, ShoppingBag, Store, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — Dukaan.pk Vendor & Partner Portal" },
      { name: "description", content: "Sign in to your Dukaan.pk customer, vendor or partner account." },
      { property: "og:title", content: "Login — Dukaan.pk" },
      { property: "og:description", content: "Access your Dukaan.pk dashboard as customer, vendor or partner." },
    ],
  }),
  component: LoginPage,
});

const roles = [
  { key: "customer", label: "Customer", icon: ShoppingBag, to: "/", hint: "Shop & track orders" },
  { key: "vendor", label: "Vendor", icon: Store, to: "/vendor", hint: "Manage store & orders" },
  { key: "partner", label: "Partner", icon: Users, to: "/partner", hint: "Add products & stock" },
] as const;

function LoginPage() {
  const [role, setRole] = useState<(typeof roles)[number]["key"]>("customer");
  const [loading, setLoading] = useState(false);
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
          <p className="mt-1 text-sm text-muted-foreground">Demo login — koi real authentication nahi hai.</p>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {roles.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRole(r.key)}
                className={cn(
                  "rounded-xl border p-3 text-center transition-colors",
                  role === r.key
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40",
                )}
              >
                <r.icon className="mx-auto h-5 w-5" />
                <span className="mt-1.5 block text-xs font-semibold">{r.label}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {roles.find((r) => r.key === role)?.hint}
          </p>

          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setLoading(true);
              const target = roles.find((r) => r.key === role)!.to;
              setTimeout(() => navigate({ to: target }), 800);
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="email">Email or Phone</Label>
              <Input id="email" required defaultValue="demo@dukaan.pk" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required defaultValue="demo1234" className="h-11 rounded-xl" />
            </div>
            <Button type="submit" size="lg" className="w-full rounded-xl" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in as {roles.find((r) => r.key === role)?.label}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Customer ho? <Link to="/products" className="text-primary underline">Guest checkout</Link> se bina account
            order karein.
          </p>
        </div>
      </div>
    </div>
  );
}