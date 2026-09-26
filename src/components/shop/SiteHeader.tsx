import { Link } from "@tanstack/react-router";
import {
  Menu,
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

  const [open, setOpen] =
    useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
      {/* Top Announcement */}
      <div className="hidden bg-primary py-1.5 text-center text-xs font-medium text-primary-foreground sm:block">
        Cash on Delivery all over Pakistan · Free delivery on orders above Rs. 3,000
      </div>

      {/* Main Header */}
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:flex sm:justify-between">
        {/* Logo - icon only */}
        <Link
          to="/"
          aria-label="Dukaan.pk Home"
          title="Dukaan.pk"
          className="flex shrink-0 items-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl gradient-primary text-sm font-bold text-primary-foreground">
            D
          </span>
        </Link>

        {/* Search */}
        <div className="order-3 col-span-2 w-full sm:order-0 sm:max-w-md">
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />

            <Input
              aria-label="Search products, services and brands"
              placeholder="Search products, services, brands..."
              className="h-10 rounded-xl pl-9"
            />
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="Main navigation"
        >
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{
                exact:
                  item.to === "/",
              }}
              activeProps={{
                className:
                  "bg-primary-soft text-primary",
              }}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex shrink-0 items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden whitespace-nowrap sm:inline-flex"
          >
            <Link to="/orders">
              My Orders
            </Link>
          </Button>

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
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
            className="relative shrink-0 rounded-xl"
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
                  className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground"
                >
                  {count}
                </span>
              )}
            </Link>
          </Button>

          {/* Mobile Menu Button */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 rounded-xl lg:hidden"
            onClick={() =>
              setOpen(
                (value) =>
                  !value,
              )
            }
            aria-label={
              open
                ? "Close navigation menu"
                : "Open navigation menu"
            }
            aria-expanded={open}
          >
            {open ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {open && (
        <nav
          className="border-t border-border bg-card px-4 py-2 lg:hidden"
          aria-label="Mobile navigation"
        >
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() =>
                setOpen(false)
              }
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {item.label}
            </Link>
          ))}

          <Link
            to="/orders"
            onClick={() =>
              setOpen(false)
            }
            className="block rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            My Orders
          </Link>

          <Link
            to="/login"
            onClick={() =>
              setOpen(false)
            }
            className="block rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            Login
          </Link>

          <p className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
            <Truck
              aria-hidden="true"
              className="h-3.5 w-3.5"
            />

            COD available nationwide
          </p>
        </nav>
      )}
    </header>
  );
}