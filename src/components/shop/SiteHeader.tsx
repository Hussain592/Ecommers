import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, MoonStar, Search, ShoppingCart, Truck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPKR } from "@/data/mock";
import { useCart } from "@/lib/cart";
import { useDeliverySettings } from "@/lib/delivery";
import { useStoreSettings } from "@/lib/store-info";

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
    label: "Sell on azadari.store",
  },
];

export function SiteHeader() {
  const { count } = useCart();

  const { freeDeliveryThreshold } = useDeliverySettings();
  const { announcement } = useStoreSettings();

  const [open, setOpen] = useState(false);

  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");

  const headerRef = useRef<HTMLElement>(null);

  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const closeTimer = useRef<number | undefined>(undefined);

  const cancelScheduledClose = () => window.clearTimeout(closeTimer.current);

  /*
   * The menu closes by itself as soon as the user leaves it, so nobody
   * has to hunt for an empty spot to tap:
   * - mouse: shortly after the pointer leaves the header (a short delay
   *   forgives an accidental wobble past the edge),
   * - touch/pen: on any touch outside the header, or when the page scrolls,
   * - keyboard: Escape closes it and returns focus to the menu button.
   */
  useEffect(() => {
    if (!open) return;

    const header = headerRef.current;
    const startScrollY = window.scrollY;

    const onPointerDownOutside = (event: PointerEvent) => {
      if (header && !header.contains(event.target as Node)) setOpen(false);
    };

    const onScroll = () => {
      if (Math.abs(window.scrollY - startScrollY) > 24) setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      menuButtonRef.current?.focus();
    };

    // The menu is only for small screens; close it if the window grows.
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onResize = () => {
      if (desktop.matches) setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDownOutside);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onResize);

    return () => {
      cancelScheduledClose();
      document.removeEventListener("pointerdown", onPointerDownOutside);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onResize);
    };
  }, [open]);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 border-b border-[#c9a24b]/30 bg-[#082b21]/95 shadow-sm backdrop-blur-xl"
      onPointerLeave={(event) => {
        if (!open || event.pointerType !== "mouse") return;
        cancelScheduledClose();
        closeTimer.current = window.setTimeout(() => setOpen(false), 250);
      }}
      onPointerEnter={cancelScheduledClose}
    >
      {/* =====================================================
          TOP ANNOUNCEMENT
      ===================================================== */}
      <div className="hidden border-b border-[#c9a24b]/20 bg-[#041c15] py-1.5 text-center text-xs font-medium tracking-wide text-[#f8f1df] sm:block">
        {announcement ?? (
          <>
            Cash on Delivery all over Pakistan
            <span className="mx-2 text-[#c9a24b]">•</span>
            Free delivery on orders above {formatPKR(freeDeliveryThreshold)}
          </>
        )}
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
            <MoonStar aria-hidden="true" className="h-5 w-5" />
          </span>

          <div className="hidden xl:block">
            <p className="text-sm font-extrabold tracking-tight text-[#fffaf0]">azadari.store</p>

            <p className="text-[10px] font-medium tracking-wide text-[#d8cdae]">
              Islamic Marketplace
            </p>
          </div>
        </Link>

        {/* =================================================
            SEARCH
        ================================================= */}
        <div className="order-3 col-span-2 w-full sm:order-0 sm:max-w-md">
          <form
            role="search"
            className="relative"
            onSubmit={(event) => {
              event.preventDefault();
              const term = searchTerm.trim();
              setOpen(false);
              void navigate({ to: "/products", search: term ? { q: term } : {} });
            }}
          >
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b746e]"
            />

            <Input
              type="search"
              enterKeyHint="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              aria-label="Search products"
              placeholder="Search Islamic products, books, brands..."
              className="h-10 rounded-xl border-[#d8cdae] bg-[#fffdf7] pl-9 text-[#173229] shadow-sm placeholder:text-[#7d867f] focus-visible:border-[#d8b85c] focus-visible:ring-[#d8b85c]/30"
            />
          </form>
        </div>

        {/* =================================================
            DESKTOP NAVIGATION
        ================================================= */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
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
            <Link to="/orders">My Orders</Link>
          </Button>

          {/* Login */}
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden rounded-lg text-[#f7f0df] hover:bg-white/10 hover:text-white focus-visible:ring-[#d8b85c] sm:inline-flex"
          >
            <Link to="/login">Sign in</Link>
          </Button>

          {/* Cart */}
          <Button
            asChild
            variant="outline"
            size="icon"
            className="relative shrink-0 rounded-xl border-[#d8b85c]/60 bg-[#fffaf0] text-[#16392d] shadow-sm hover:border-[#d8b85c] hover:bg-[#f5ead0] hover:text-[#082b21]"
          >
            <Link to="/cart" aria-label={count > 0 ? `Cart, ${count} items` : "Cart"}>
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
            ref={menuButtonRef}
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 rounded-xl border-[#d8b85c]/60 bg-[#fffaf0] text-[#16392d] hover:bg-[#f5ead0] lg:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
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
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-[#f2ecdc] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8b85c]"
              >
                {item.label}
              </Link>
            ))}

            <div className="my-2 border-t border-[#d8b85c]/20" />

            <Link
              to="/orders"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-[#f2ecdc] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8b85c]"
            >
              My Orders
            </Link>

            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-[#f2ecdc] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8b85c]"
            >
              Sign in
            </Link>
          </div>

          {/* Mobile Trust Message */}
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#d8b85c]/20 bg-white/5 px-3 py-2.5 text-xs text-[#d9d1bd]">
            <Truck aria-hidden="true" className="h-4 w-4 shrink-0 text-[#d8b85c]" />

            <span>Cash on Delivery available nationwide</span>
          </div>
        </nav>
      )}
    </header>
  );
}
