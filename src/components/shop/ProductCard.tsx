import { Link } from "@tanstack/react-router";
import {
  ShoppingCart,
  Star,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  formatPKR,
  productImageFallback,
  type Product,
} from "@/data/mock";
import { useCart } from "@/lib/cart";

export function ProductCard({
  product,
}: {
  product: Product;
}) {
  const { add } = useCart();

  const out = product.stock === 0;

  const hasDiscount =
    Boolean(product.oldPrice) &&
    Number(product.oldPrice) >
      Number(product.price);

  const discount = hasDiscount
    ? Math.round(
        (1 -
          Number(product.price) /
            Number(product.oldPrice)) *
          100,
      )
    : 0;

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-[#d8cdae]/70 bg-[#fffdf7] shadow-[0_4px_18px_rgba(8,43,33,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#c9a24b]/60 hover:shadow-[0_12px_28px_rgba(8,43,33,0.12)]">
      {/* Gold accent */}
      <div
        aria-hidden="true"
        className="h-1 w-full bg-gradient-to-r from-[#082b21] via-[#c9a24b] to-[#082b21]"
      />

      {/* ==========================================
          PRODUCT IMAGE
      ========================================== */}
      <Link
        to="/products/$id"
        params={{
          id: product.id,
        }}
        aria-label={`View ${product.name}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c9a24b]"
      >
        <div className="relative aspect-square overflow-hidden bg-[#f8f4e9]">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            width={800}
            height={800}
            onError={(event) => {
              event.currentTarget.src =
                productImageFallback(
                  product.name,
                  product.image,
                );
            }}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />

          {/* Soft image overlay */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#082b21]/10 to-transparent"
          />

          {/* Discount */}
          {hasDiscount && (
            <span className="absolute left-3 top-3 rounded-full border border-[#f4d98d]/40 bg-[#a61f2b] px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
              -{discount}%
            </span>
          )}

          {/* Out of stock */}
          {out && (
            <span className="absolute right-3 top-3 rounded-full bg-[#082b21]/90 px-2.5 py-1 text-[11px] font-semibold text-[#fffaf0] shadow-sm backdrop-blur">
              Out of stock
            </span>
          )}
        </div>
      </Link>

      {/* ==========================================
          PRODUCT INFORMATION
      ========================================== */}
      <div className="p-4">
        {/* Category */}
        <p className="mb-2 inline-flex rounded-full border border-[#c9a24b]/30 bg-[#f7efd9] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#6d5720]">
          {product.category}
        </p>

        {/* Name */}
        <Link
          to="/products/$id"
          params={{
            id: product.id,
          }}
          className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b]"
        >
          <h3 className="line-clamp-2 min-h-[40px] text-sm font-bold leading-5 text-[#102d24] transition-colors group-hover:text-[#0b513b]">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div
          className="mt-2 flex items-center gap-1.5 text-xs text-[#68766f]"
          aria-label={`${product.rating.toFixed(
            1,
          )} out of 5 stars, ${
            product.reviews
          } reviews`}
        >
          <Star
            aria-hidden="true"
            className="h-3.5 w-3.5 fill-[#c99722] text-[#c99722]"
          />

          <span className="font-semibold text-[#42554d]">
            {product.rating.toFixed(1)}
          </span>

          <span>
            ({product.reviews})
          </span>
        </div>

        {/* Divider */}
        <div className="my-3 h-px bg-gradient-to-r from-transparent via-[#d8cdae] to-transparent" />

        {/* Price */}
        <div className="flex min-h-[28px] flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="font-display text-lg font-extrabold text-[#0b513b]">
            {formatPKR(
              product.price,
            )}
          </span>

          {hasDiscount && (
            <span className="text-xs text-[#8b928d] line-through">
              {formatPKR(
                Number(
                  product.oldPrice,
                ),
              )}
            </span>
          )}
        </div>

        {/* Stock hint */}
        <p
          className={`mt-1 text-[11px] font-medium ${
            out
              ? "text-[#a61f2b]"
              : "text-[#6f7e77]"
          }`}
        >
          {out
            ? "Currently unavailable"
            : product.stock <= 5
              ? `Only ${product.stock} left`
              : "Available for delivery"}
        </p>

        {/* ==========================================
            ADD TO CART
        ========================================== */}
        <Button
          type="button"
          size="sm"
          disabled={out}
          aria-label={
            out
              ? `${product.name} is unavailable`
              : `Add ${product.name} to cart`
          }
          className="mt-4 h-10 w-full rounded-xl border border-[#c9a24b]/40 bg-[#082b21] font-semibold text-[#fffaf0] shadow-sm transition-all hover:bg-[#0d4937] hover:text-white focus-visible:ring-2 focus-visible:ring-[#c9a24b] focus-visible:ring-offset-2 disabled:border-[#d8d8d0] disabled:bg-[#dddcd4] disabled:text-[#777] disabled:opacity-100"
          onClick={() => {
            add(product.id);

            toast.success(
              "Cart mein add ho gaya",
              {
                description:
                  product.name,
              },
            );
          }}
        >
          {!out && (
            <ShoppingCart
              aria-hidden="true"
              className="mr-2 h-4 w-4"
            />
          )}

          {out
            ? "Unavailable"
            : "Add to Cart"}
        </Button>
      </div>
    </article>
  );
}