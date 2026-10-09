import { Link } from "@tanstack/react-router";
import { ShoppingCart, Star } from "lucide-react";
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

  const outOfStock = product.stock === 0;

  const discount =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round(
          ((product.oldPrice - product.price) / product.oldPrice) * 100,
        )
      : 0;

  const hasRating =
    Number(product.reviews ?? 0) > 0 &&
    Number(product.rating ?? 0) > 0;

  const handleAddToCart = () => {
    if (outOfStock) return;

    add(product.id, 1);

    toast.success("Cart mein add ho gaya", {
      description: product.name,
    });
  };

  return (
    <article className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-[22px] border border-[#ded5bd] bg-[#fffdf7] shadow-[0_3px_14px_rgba(8,43,33,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-[#c9a24b]/70 hover:shadow-[0_16px_34px_rgba(8,43,33,0.12)]">
      {/* Product visual */}
      <Link
        to="/products/$id"
        params={{ id: product.id }}
        aria-label={`View ${product.name}`}
        className="relative block overflow-hidden bg-[#f7f3e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c9a24b]"
      >
        <div className="relative aspect-[4/5] w-full overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            width={800}
            height={800}
            onError={(event) => {
              event.currentTarget.onerror = null;

              event.currentTarget.src =
                productImageFallback(
                  product.name,
                  product.image,
                );
            }}
            className="h-full w-full object-contain p-3 transition-transform duration-500 ease-out group-hover:scale-[1.035]"
          />

          {/* Soft depth so white product photos don't disappear */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#082b21]/5 to-transparent"
          />

          {/* Category */}
          {product.category && (
            <span className="absolute left-3 top-3 max-w-[68%] truncate rounded-full border border-[#c9a24b]/35 bg-[#fffdf7]/95 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#70591f] shadow-sm backdrop-blur">
              {product.category}
            </span>
          )}

          {/* Discount */}
          {discount > 0 && (
            <span className="absolute right-3 top-3 rounded-full bg-[#a61f2b] px-2.5 py-1 text-[10px] font-extrabold text-white shadow-md">
              -{discount}%
            </span>
          )}

          {/* Out of stock */}
          {outOfStock && (
            <div className="absolute inset-0 grid place-items-center bg-[#061f18]/45 backdrop-blur-[1px]">
              <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-[#7e1c27] shadow">
                Out of stock
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Product information */}
      <div className="flex flex-1 flex-col px-4 pb-4 pt-3.5">
        <Link
          to="/products/$id"
          params={{ id: product.id }}
          className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b]"
        >
          <h3 className="line-clamp-2 min-h-[2.5rem] text-[14px] font-bold leading-5 text-[#102d24] transition-colors group-hover:text-[#0b513b]">
            {product.name}
          </h3>
        </Link>

        {/* Ratings */}
        {hasRating && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-[#6f746f]">
            <span className="inline-flex items-center gap-1 font-semibold text-[#102d24]">
              <Star
                aria-hidden="true"
                className="h-3.5 w-3.5 fill-[#c99a20] text-[#c99a20]"
              />

              {Number(product.rating).toFixed(1)}
            </span>

            <span aria-hidden="true">·</span>

            <span>
              {product.reviews}{" "}
              {Number(product.reviews) === 1
                ? "review"
                : "reviews"}
            </span>
          </div>
        )}

        {/* Price */}
        <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="font-display text-[19px] font-extrabold tracking-tight text-[#0b513b]">
            {formatPKR(product.price)}
          </span>

          {product.oldPrice &&
            product.oldPrice > product.price && (
              <span className="text-[11px] text-[#8b8b82] line-through">
                {formatPKR(product.oldPrice)}
              </span>
            )}
        </div>

        {/* COD */}
        {!outOfStock && (
          <div className="mt-1.5 flex items-center gap-2 text-[10px] font-medium text-[#748078]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#1b8b60]" />

            <span>
              Cash on Delivery available
            </span>
          </div>
        )}

        {/* Add to cart */}
        <div className="mt-auto pt-3.5">
          <Button
            type="button"
            disabled={outOfStock}
            onClick={handleAddToCart}
            aria-label={
              outOfStock
                ? `${product.name} is out of stock`
                : `Add ${product.name} to cart`
            }
            className="h-10 w-full rounded-xl border border-[#c9a24b]/35 bg-[#082b21] text-xs font-bold text-[#fffaf0] shadow-none transition-all hover:bg-[#0d3d2f] hover:shadow-[0_6px_16px_rgba(8,43,33,0.18)] focus-visible:ring-2 focus-visible:ring-[#c9a24b] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingCart
              aria-hidden="true"
              className="mr-2 h-4 w-4"
            />

            {outOfStock
              ? "Out of Stock"
              : "Add to Cart"}
          </Button>
        </div>
      </div>
    </article>
  );
}