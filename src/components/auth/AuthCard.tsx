import { Link } from "@tanstack/react-router";
import { MoonStar } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Centered card layout shared by the small auth pages
 * (forgot password, reset password). Matches the login page styling.
 */
export function AuthCard({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8f5] px-4 py-8 sm:px-6">
      <div className="w-full max-w-md">
        <Link
          to="/"
          aria-label="azadari.store home"
          className="mb-8 inline-flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b]"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-[#c9a24b]/35 bg-[#082b21] text-[#e2c56c]">
            <MoonStar aria-hidden="true" className="h-5 w-5" />
          </span>

          <div>
            <p className="font-display text-lg font-extrabold text-[#102d24]">azadari.store</p>

            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#9a7927]">
              Islamic Marketplace
            </p>
          </div>
        </Link>

        <section className="rounded-3xl border border-[#ded5bd] bg-[#fffdf7] p-5 shadow-[0_12px_32px_rgba(8,43,33,0.07)] sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9a7927]">{eyebrow}</p>

          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#102d24] sm:text-3xl">
            {title}
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#6f7d75]">{description}</p>

          <div className="mt-6">{children}</div>

          {footer && (
            <div className="mt-5 border-t border-[#eee6d2] pt-5 text-center">{footer}</div>
          )}
        </section>
      </div>
    </main>
  );
}

export const authInputClass =
  "h-11 rounded-xl border-[#d8cdae] bg-white pl-10 focus-visible:ring-[#c9a24b]";

export const authButtonClass =
  "h-11 w-full rounded-xl border border-[#c9a24b]/35 bg-[#082b21] font-bold text-[#fffaf0] shadow-none hover:bg-[#0d3d2f] focus-visible:ring-2 focus-visible:ring-[#c9a24b] focus-visible:ring-offset-2 disabled:opacity-60";

export const authLinkClass =
  "rounded-md font-semibold text-[#0b513b] underline decoration-[#c9a24b] underline-offset-4 transition-colors hover:text-[#082b21] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b]";
