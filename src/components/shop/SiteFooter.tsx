import { Link } from "@tanstack/react-router";
import {
  Mail,
  MapPin,
  MoonStar,
  ShieldCheck,
  Truck,
} from "lucide-react";

export function SiteFooter() {
  const linkClass =
    "rounded-sm text-[#d8d1bf] transition-colors hover:text-[#e3c76b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#061f18]";

  return (
    <footer className="mt-16 border-t border-[#c9a24b]/25 bg-[#061f18] text-[#fffaf0]">
      {/* Gold Accent Line */}
      <div
        aria-hidden="true"
        className="h-px bg-gradient-to-r from-transparent via-[#c9a24b]/80 to-transparent"
      />

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {/* =====================================
            BRAND
        ===================================== */}
        <div>
          <Link
            to="/"
            aria-label="azadari.store home"
            className="inline-flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b]"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-[#c9a24b]/60 bg-[#0b382b] text-[#e2c56c] shadow-sm">
              <MoonStar
                aria-hidden="true"
                className="h-5 w-5"
              />
            </span>

            <div>
              <p className="font-display text-lg font-extrabold text-[#fffaf0]">
                azadari.store
              </p>

              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#c9a24b]">
                Islamic Marketplace
              </p>
            </div>
          </Link>

          <p className="mt-4 max-w-xs text-sm leading-6 text-[#cfc7b5]">
            Islamic books, Majlis items, prayer essentials,
            clothing aur accessories — trusted sellers se
            Pakistan bhar mein.
          </p>

          {/* Trust points */}
          <div className="mt-5 space-y-2.5">
            <p className="flex items-center gap-2 text-xs text-[#d8d1bf]">
              <ShieldCheck
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-[#c9a24b]"
              />
              Trusted marketplace experience
            </p>

            <p className="flex items-center gap-2 text-xs text-[#d8d1bf]">
              <Truck
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-[#c9a24b]"
              />
              Cash on Delivery across Pakistan
            </p>
          </div>
        </div>

        {/* =====================================
            SHOP
        ===================================== */}
        <div>
          <h4 className="text-sm font-bold text-[#e3c76b]">
            Shop
          </h4>

          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link
                to="/products"
                className={linkClass}
              >
                All Products
              </Link>
            </li>

            <li>
              <Link
                to="/services"
                className={linkClass}
              >
                Services
              </Link>
            </li>

            <li>
              <Link
                to="/cart"
                className={linkClass}
              >
                Cart
              </Link>
            </li>

            <li>
              <Link
                to="/track-order"
                className={linkClass}
              >
                Track Order
              </Link>
            </li>
          </ul>
        </div>

        {/* =====================================
            QUICK LINKS
        ===================================== */}
        <div>
          <h4 className="text-sm font-bold text-[#e3c76b]">
            Quick Links
          </h4>

          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link
                to="/"
                className={linkClass}
              >
                Home
              </Link>
            </li>

            <li>
              <Link
                to="/products"
                className={linkClass}
              >
                Browse Products
              </Link>
            </li>

            <li>
              <Link
                to="/sell"
                className={linkClass}
              >
                Sell on azadari.store
              </Link>
            </li>

            <li>
              <Link
                to="/orders"
                className={linkClass}
              >
                My Orders
              </Link>
            </li>
          </ul>
        </div>

        {/* =====================================
            SUPPORT
        ===================================== */}
        <div>
          <h4 className="text-sm font-bold text-[#e3c76b]">
            Support
          </h4>

          <div className="mt-4 space-y-3 text-sm text-[#d8d1bf]">
            <p className="flex items-start gap-2">
              <Mail
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a24b]"
              />

              <span>
                Customer support available through the platform
              </span>
            </p>

            <p className="flex items-center gap-2">
              <MapPin
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-[#c9a24b]"
              />

              Karachi, Pakistan
            </p>

            <p className="rounded-xl border border-[#c9a24b]/20 bg-white/5 p-3 text-xs leading-5 text-[#cfc7b5]">
              Order help ke liye apna Order ID aur mobile
              number ready rakhein.
            </p>
          </div>
        </div>
      </div>

      {/* =====================================
          BOTTOM FOOTER
      ===================================== */}
      <div className="border-t border-[#c9a24b]/20 bg-[#041913]">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-center text-xs text-[#aaa392] sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p>
            © 2026 azadari.store — All rights reserved.
          </p>

          <p>
            Cash on Delivery marketplace · Pakistan
          </p>
        </div>
      </div>
    </footer>
  );
}