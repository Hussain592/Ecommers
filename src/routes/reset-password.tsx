import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Loader2, LockKeyhole } from "lucide-react";
import { toast } from "sonner";

import {
  AuthCard,
  authButtonClass,
  authInputClass,
  authLinkClass,
} from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "azadari.store" },
      { name: "description", content: "Set a new password for your azadari.store account." },
      { property: "og:title", content: "Reset Password — azadari.store" },
    ],
  }),
  component: ResetPasswordPage,
});

type LinkState = "checking" | "ready" | "invalid";

function ResetPasswordPage() {
  const [linkState, setLinkState] = useState<LinkState>("checking");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let settled = false;

    const markReady = () => {
      settled = true;
      setLinkState("ready");
    };

    // Supabase reads the recovery token from the link and fires PASSWORD_RECOVERY.
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        markReady();
      }
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) markReady();
    });

    // If no recovery session shows up, the link is missing, used or expired.
    const timeout = window.setTimeout(() => {
      if (!settled) setLinkState("invalid");
    }, 4000);

    return () => {
      window.clearTimeout(timeout);
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirm = String(formData.get("confirm") ?? "");

    if (password.length < 6) {
      toast.error("Password kam az kam 6 characters ka hona chahiye.");
      return;
    }

    if (password !== confirm) {
      toast.error("Dono passwords ek jaise nahi hain.");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      await supabase.auth.signOut();
      toast.success("Password badal gaya. Ab naye password se sign in karein.");

      // Full navigation so the auth provider starts fresh.
      window.location.href = "/login";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Password update nahi ho saka.");
      setSaving(false);
    }
  };

  const footer = (
    <Link to="/login" className={authLinkClass}>
      Sign in page par wapas jayein
    </Link>
  );

  if (linkState === "checking") {
    return (
      <AuthCard
        eyebrow="Reset Password"
        title="Link check ho raha hai"
        description="Thora intezar karein."
        footer={footer}
      >
        <div className="flex justify-center py-4">
          <Loader2 aria-hidden="true" className="h-6 w-6 animate-spin text-[#0b513b]" />
        </div>
      </AuthCard>
    );
  }

  if (linkState === "invalid") {
    return (
      <AuthCard
        eyebrow="Reset Password"
        title="Link valid nahi hai"
        description="Yeh reset link expire ho chuka hai ya pehle use ho chuka hai. Naya link mangwa lein."
        footer={footer}
      >
        <Link
          to="/forgot-password"
          className={`${authButtonClass} inline-flex items-center justify-center`}
        >
          <ArrowRight aria-hidden="true" className="mr-2 h-4 w-4" />
          Naya reset link mangwayein
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      eyebrow="Reset Password"
      title="Naya password set karein"
      description="Apna naya password do dafa likhein."
      footer={footer}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {(
          [
            ["password", "Naya Password"],
            ["confirm", "Password dobara likhein"],
          ] as const
        ).map(([name, label]) => (
          <div key={name} className="space-y-1.5">
            <Label htmlFor={name} className="text-sm font-semibold text-[#102d24]">
              {label}
            </Label>

            <div className="relative">
              <LockKeyhole
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b968f]"
              />
              <Input
                id={name}
                name={name}
                type="password"
                minLength={6}
                required
                autoComplete="new-password"
                placeholder="At least 6 characters"
                className={authInputClass}
              />
            </div>
          </div>
        ))}

        <Button type="submit" size="lg" className={authButtonClass} disabled={saving}>
          {saving ? (
            <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight aria-hidden="true" className="mr-2 h-4 w-4" />
          )}
          {saving ? "Save ho raha hai..." : "Password save karein"}
        </Button>
      </form>
    </AuthCard>
  );
}
