import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl gradient-primary text-sm font-bold text-primary-foreground">
              D
            </span>

            <span className="font-display text-lg font-extrabold">
              Dukaan
              <span className="text-primary">
                .pk
              </span>
            </span>
          </div>

          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Pakistan ka multivendor marketplace —
            products aur services, sab Cash on Delivery par.
          </p>
        </div>

        {/* Shop */}
        <div>
          <h4 className="text-sm font-semibold">
            Shop
          </h4>

          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link
                to="/products"
                className="hover:text-primary"
              >
                All Products
              </Link>
            </li>

            <li>
              <Link
                to="/services"
                className="hover:text-primary"
              >
                Services
              </Link>
            </li>

            <li>
              <Link
                to="/cart"
                className="hover:text-primary"
              >
                Cart
              </Link>
            </li>

            <li>
              <Link
                to="/track-order"
                className="hover:text-primary"
              >
                Track Order
              </Link>
            </li>
          </ul>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-sm font-semibold">
            Quick Links
          </h4>

          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link
                to="/"
                className="hover:text-primary"
              >
                Home
              </Link>
            </li>

            <li>
              <Link
                to="/products"
                className="hover:text-primary"
              >
                Browse Products
              </Link>
            </li>

            <li>
              <Link
                to="/services"
                className="hover:text-primary"
              >
                Browse Services
              </Link>
            </li>

            <li>
              <Link
                to="/track-order"
                className="hover:text-primary"
              >
                Track Your Order
              </Link>
            </li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="text-sm font-semibold">
            Support
          </h4>

          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              Helpline: 0311-DUKAAN
            </li>

            <li>
              support@dukaan.pk
            </li>

            <li>
              Karachi, Pakistan
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © 2026 Dukaan.pk — All rights reserved.
        COD only, no online payment required.
      </div>
    </footer>
  );
}