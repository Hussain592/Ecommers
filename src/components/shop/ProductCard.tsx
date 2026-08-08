import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPKR, type Product } from "@/data/mock";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const out = product.stock === 0;

  return (
    <div className="group surface-card overflow-hidden transition-shadow hover:shadow-card">
      <Link to="/products/$id" params={{ id: product.id }} className="block">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            width={800}
            height={800}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {product.oldPrice && (
            <span className="absolute left-2 top-2 rounded-lg bg-destructive px-2 py-1 text-[11px] font-bold text-destructive-foreground">
              -{Math.round((1 - product.price / product.oldPrice) * 100)}%
            </span>
          )}
          {out && (
            <span className="absolute right-2 top-2 rounded-lg bg-foreground/80 px-2 py-1 text-[11px] font-semibold text-background">
              Out of stock
            </span>
          )}
        </div>
      </Link>
      <div className="space-y-2 p-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {product.category}
        </p>
        <Link to="/products/$id" params={{ id: product.id }}>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug hover:text-primary">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="h-3.5 w-3.5 fill-warning text-warning" />
          {product.rating.toFixed(1)} <span>({product.reviews})</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-base font-bold text-primary">{formatPKR(product.price)}</span>
          {product.oldPrice && (
            <span className="text-xs text-muted-foreground line-through">{formatPKR(product.oldPrice)}</span>
          )}
        </div>
        <Button
          size="sm"
          className="w-full rounded-lg"
          disabled={out}
          onClick={() => {
            add(product.id);
            toast.success("Cart mein add ho gaya", { description: product.name });
          }}
        >
          {out ? "Unavailable" : "Add to Cart"}
        </Button>
      </div>
    </div>
  );
}