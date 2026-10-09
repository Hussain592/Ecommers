import { Link } from "@tanstack/react-router";
import {
  Menu,
  MoonStar,
  Search,
  ShoppingCart,
  Truck,
  X,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/lib/cart";

const nav = [
  {
    to: "/",
    label: "Home",
  },
  {
    to: "/products",
    label: "Products",
  },
  {
    to: "/services",
    label: "Services",
  },
  {
    to: "/track-order",
    label: "Track Order",
  },
  {
    to: "/sell",
    label: "Sell on Dukaan",
  },
];

export function SiteHeader() {
  const { count } = useCart();

  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#c9a24b]/30 bg-[#082b21]/95 shadow-sm backdrop-blur-xl">
      {/* =====================================================
          TOP ANNOUNCEMENT
      ===================================================== */}
      <div className="hidden border-b border-[#c9a24b]/20 bg-[#041c15] py-1.5 text-center text-xs font-medium tracking-wide text-[#f8f1df] sm:block">
        Cash on Delivery all over Pakistan

        <span className="mx-2 text-[#c9a24b]">
          •
        </span>

        Free delivery on orders above Rs. 3,000
      </div>

      {/* =====================================================
          MAIN HEADER
      ===================================================== */}
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:flex sm:justify-between sm:gap-4">
        {/* =================================================
            BRAND / LOGO
        ================================================= */}
        <Link
          to="/"
          aria-label="azadari.store home"
          title="azadari.store"
          className="group flex shrink-0 items-center gap-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8b85c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#082b21]"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-[#d8b85c]/70 bg-[#0d4031] text-[#f2d883] shadow-sm transition-transform group-hover:scale-[1.03]">
            <MoonStar
              aria-hidden="true"
              className="h-5 w-5"
            />
          </span>

          <div className="hidden xl:block">
            <p className="text-sm font-extrabold tracking-tight text-[#fffaf0]">
              azadari.store
            </p>

            <p className="text-[10px] font-medium tracking-wide text-[#d8cdae]">
              Islamic Marketplace
            </p>
          </div>
        </Link>

        {/* =================================================
            SEARCH
        ================================================= */}
        <div className="order-3 col-span-2 w-full sm:order-0 sm:max-w-md">
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b746e]"
            />

            <Input
              aria-label="Search Islamic products, services and brands"
              placeholder="Search Islamic products, books, brands..."
              className="h-10 rounded-xl border-[#d8cdae] bg-[#fffdf7] pl-9 text-[#173229] shadow-sm placeholder:text-[#7d867f] focus-visible:border-[#d8b85c] focus-visible:ring-[#d8b85c]/30"
            />
          </div>
        </div>

        {/* =================================================
            DESKTOP NAVIGATION
        ================================================= */}
        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="Main navigation"
        >
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{
                exact: item.to === "/",
              }}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-[#eee8d8] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8b85c]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* =================================================
            RIGHT ACTIONS
        ================================================= */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* My Orders */}
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden whitespace-nowrap rounded-lg text-[#f7f0df] hover:bg-white/10 hover:text-white focus-visible:ring-[#d8b85c] sm:inline-flex"
          >
            <Link to="/orders">
              My Orders
            </Link>
          </Button>

          {/* Login */}
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden rounded-lg text-[#f7f0df] hover:bg-white/10 hover:text-white focus-visible:ring-[#d8b85c] sm:inline-flex"
          >
            <Link to="/login">
              Login
            </Link>
          </Button>

          {/* Cart */}
          <Button
            asChild
            variant="outline"
            size="icon"
            className="relative shrink-0 rounded-xl border-[#d8b85c]/60 bg-[#fffaf0] text-[#16392d] shadow-sm hover:border-[#d8b85c] hover:bg-[#f5ead0] hover:text-[#082b21]"
          >
            <Link
              to="/cart"
              aria-label={
                count > 0
                  ? `Cart, ${count} items`
                  : "Cart"
              }
            >
              <ShoppingCart className="h-4 w-4" />

              {count > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#a61f2b] px-1 text-[11px] font-bold text-white shadow-sm"
                >
                  {count}
                </span>
              )}
            </Link>
          </Button>

          {/* Mobile Menu */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 rounded-xl border-[#d8b85c]/60 bg-[#fffaf0] text-[#16392d] hover:bg-[#f5ead0] lg:hidden"
            onClick={() =>
              setOpen((value) => !value)
            }
            aria-label={
              open
                ? "Close navigation menu"
                : "Open navigation menu"
            }
            aria-expanded={open}
            aria-controls="mobile-navigation"
          >
            {open ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* =====================================================
          MOBILE NAVIGATION
      ===================================================== */}
      {open && (
        <nav
          id="mobile-navigation"
          className="border-t border-[#d8b85c]/25 bg-[#061f18] px-4 py-3 shadow-lg lg:hidden"
          aria-label="Mobile navigation"
        >
          <div className="space-y-1">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{
                  exact: item.to === "/",
                }}
                onClick={() =>
                  setOpen(false)
                }
                className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-[#f2ecdc] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8b85c]"
              >
                {item.label}
              </Link>
            ))}

            <div className="my-2 border-t border-[#d8b85c]/20" />

            <Link
              to="/orders"
              onClick={() =>
                setOpen(false)
              }
              className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-[#f2ecdc] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8b85c]"
            >
              My Orders
            </Link>

            <Link
              to="/login"
              onClick={() =>
                setOpen(false)
              }
              className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-[#f2ecdc] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8b85c]"
            >
              Login
            </Link>
          </div>

          {/* Mobile Trust Message */}
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#d8b85c]/20 bg-white/5 px-3 py-2.5 text-xs text-[#d9d1bd]">
            <Truck
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-[#d8b85c]"
            />

            <span>
              Cash on Delivery available nationwide
            </span>
          </div>
        </nav>
      )}
    </header>
  );
}