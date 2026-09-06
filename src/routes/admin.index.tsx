import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Login — Dukaan.pk Control Panel" },
      { name: "description", content: "Restricted admin access for Dukaan.pk platform owners." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin Login — Dukaan.pk" },
      { property: "og:description", content: "Restricted area for platform administrators." },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="grid min-h-screen place-items-center bg-foreground/95 px-4">
      <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-card">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl gradient-primary text-primary-foreground">
          <Lock className="h-6 w-6" />
        </span>
        <h1 className="mt-5 text-center text-2xl font-extrabold">Admin Control Panel</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Dukaan.pk owner access — sirf authorized staff ke liye.
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

              const { data, error } = await supabase.auth.signInWithPassword({ email, password });
              if (error) throw error;

              const { data: profile } = await supabase
                .from("users")
                .select("role")
                .eq("auth_id", data.user.id)
                .maybeSingle();

              if (profile?.role !== "admin") {
                await supabase.auth.signOut();
                toast.error("Ye account Admin nahi hai. Sirf Admin yahan se login kar sakta hai.");
                setLoading(false);
                return;
              }

              toast.success("Welcome back, Admin!");
              window.location.href = "/admin/overview";
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Login complete nahi ho saka.");
              setLoading(false);
            }
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="ae">Admin Email</Label>
            <Input id="ae" name="email" type="email" required placeholder="owner@dukaan.pk" className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ap">Password</Label>
            <Input id="ap" name="password" type="password" required placeholder="Aapka password" className="h-11 rounded-xl" />
          </div>
          <Button type="submit" size="lg" className="w-full rounded-xl" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign in to Admin
          </Button>
        </form>

        <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" /> Secure admin-only access.
        </p>
      </div>
    </div>
  );
}