import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowRight, Loader2, Mail, MailCheck } from "lucide-react";
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

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "azadari.store" },
      { name: "description", content: "Reset the password of your azadari.store account." },
      { property: "og:title", content: "Forgot Password — azadari.store" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    const email = String(new FormData(event.currentTarget).get("email") ?? "")
      .trim()
      .toLowerCase();

    if (!email) {
      toast.error("Enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      // Same message whether or not the email exists, so accounts cannot be guessed.
      setSentTo(email);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Couldn't send the reset email. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (sentTo) {
    return (
      <AuthCard
        eyebrow="Email Sent"
        title="Check your email"
        description={`If ${sentTo} has an azadari.store account, we've sent a link to reset your password. Check your spam folder too.`}
        footer={
          <Link to="/login" className={authLinkClass}>
            Back to sign in
          </Link>
        }
      >
        <div className="flex items-center gap-3 rounded-2xl border border-[#c9a24b]/20 bg-[#f7efd9]/55 p-4 text-sm text-[#102d24]">
          <MailCheck aria-hidden="true" className="h-5 w-5 shrink-0 text-[#0b513b]" />
          The link expires after a short time.
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      eyebrow="Forgot Password"
      title="Forgot your password?"
      description="Enter your account email and we'll send you a link to set a new password."
      footer={
        <Link to="/login" className={authLinkClass}>
          Back to sign in
        </Link>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-semibold text-[#102d24]">
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
              className={authInputClass}
            />
          </div>
        </div>

        <Button type="submit" size="lg" className={authButtonClass} disabled={loading}>
          {loading ? (
            <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight aria-hidden="true" className="mr-2 h-4 w-4" />
          )}
          {loading ? "Sending..." : "Send reset link"}
        </Button>
      </form>
    </AuthCard>
  );
}
