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
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirm) {
      toast.error("The passwords don't match.");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      await supabase.auth.signOut();
      toast.success("Password changed. Sign in with your new password.");

      // Full navigation so the auth provider starts fresh.
      window.location.href = "/login";
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Couldn't update your password. Please try again.",
      );
      setSaving(false);
    }
  };

  const footer = (
    <Link to="/login" className={authLinkClass}>
      Back to sign in
    </Link>
  );

  if (linkState === "checking") {
    return (
      <AuthCard
        eyebrow="Reset Password"
        title="Checking your link"
        description="This will only take a moment."
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
        title="This link is no longer valid"
        description="The reset link has expired or was already used. Request a new one."
        footer={footer}
      >
        <Link
          to="/forgot-password"
          className={`${authButtonClass} inline-flex items-center justify-center`}
        >
          <ArrowRight aria-hidden="true" className="mr-2 h-4 w-4" />
          Request a new link
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      eyebrow="Reset Password"
      title="Set a new password"
      description="Enter your new password twice."
      footer={footer}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {(
          [
            ["password", "New password"],
            ["confirm", "Confirm new password"],
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
          {saving ? "Saving..." : "Save password"}
        </Button>
      </form>
    </AuthCard>
  );
}
