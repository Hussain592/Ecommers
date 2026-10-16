import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { ExternalLink, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPKR, productImageSource } from "@/data/mock";
import { supabase } from "@/lib/supabase";
import { useProductVariants, variantLabel } from "@/lib/variants";

type PreviewProduct = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  images: string[] | null;
  price: number;
  compare_price: number | null;
  stock: number;
  category: string | null;
  vendors: { name: string } | null;
};

async function fetchPreviewProduct(id: string): Promise<PreviewProduct | null> {
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, description, image, images, price, compare_price, stock, category, vendors(name)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as PreviewProduct | null;
}

/**
 * Shows everything a customer will see (photos, description, price, sizes and
 * colours) so the admin can check a product before approving it.
 */
export function ProductPreviewDialog({
  productId,
  onClose,
  actions,
}: {
  productId: string | null;
  onClose: () => void;
  /** Approve / Reject buttons for the product being previewed. */
  actions?: ReactNode;
}) {
  const {
    data: product,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["admin-product-preview", productId],
    queryFn: () => fetchPreviewProduct(productId ?? ""),
    enabled: Boolean(productId),
  });
  const { data: variants = [] } = useProductVariants(productId ?? undefined);
  const [imageIndex, setImageIndex] = useState(0);

  const gallery = product
    ? Array.from(new Set([product.image, ...(product.images ?? [])].filter(Boolean) as string[]))
    : [];
  const shownImage = gallery[Math.min(imageIndex, Math.max(gallery.length - 1, 0))] ?? null;

  return (
    <Dialog
      open={productId !== null}
      onOpenChange={(open) => {
        if (!open) {
          setImageIndex(0);
          onClose();
        }
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product?.name ?? "Product preview"}</DialogTitle>
          <DialogDescription>
            Check the photos, description and price before you approve.
          </DialogDescription>
        </DialogHeader>

        {isPending ? (
          <div className="flex justify-center p-10">
            <Loader2 aria-label="Loading product" className="h-6 w-6 animate-spin" />
          </div>
        ) : isError || !product ? (
          <p className="py-6 text-sm text-destructive">
            Couldn&apos;t load this product. Close the preview and try again.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-[220px_minmax(0,1fr)]">
            <div className="space-y-2">
              <div className="aspect-square overflow-hidden rounded-xl border bg-muted">
                <img
                  src={productImageSource(product.name, shownImage)}
                  alt={product.name}
                  className="h-full w-full object-contain"
                />
              </div>
              {gallery.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {gallery.map((src, index) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setImageIndex(index)}
                      aria-label={`Show photo ${index + 1} of ${gallery.length}`}
                      aria-pressed={index === imageIndex}
                      className={`h-12 w-12 overflow-hidden rounded-lg border-2 ${index === imageIndex ? "border-primary" : "border-transparent"}`}
                    >
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {gallery.length === 0
                  ? "No photo uploaded. A placeholder will be shown."
                  : `${gallery.length} ${gallery.length === 1 ? "photo" : "photos"}`}
              </p>
            </div>

            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase text-muted-foreground">Price</dt>
                <dd className="text-lg font-bold">
                  {formatPKR(Number(product.price))}
                  {product.compare_price !== null &&
                    Number(product.compare_price) > Number(product.price) && (
                      <span className="ml-2 text-sm font-normal text-muted-foreground line-through">
                        {formatPKR(Number(product.compare_price))}
                      </span>
                    )}
                </dd>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <dt className="text-xs font-semibold uppercase text-muted-foreground">Seller</dt>
                  <dd>{product.vendors?.name ?? "azadari.store"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-muted-foreground">
                    Category
                  </dt>
                  <dd>{product.category ?? "Uncategorized"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-muted-foreground">Stock</dt>
                  <dd>{product.stock}</dd>
                </div>
              </div>
              {variants.length > 0 && (
                <div>
                  <dt className="text-xs font-semibold uppercase text-muted-foreground">
                    Sizes and colours
                  </dt>
                  <dd className="mt-1 flex flex-wrap gap-1.5">
                    {variants.map((variant) => (
                      <span key={variant.id} className="rounded-full border px-2 py-0.5 text-xs">
                        {variantLabel(variant)} · {variant.stock} in stock
                      </span>
                    ))}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-semibold uppercase text-muted-foreground">
                  Description
                </dt>
                <dd className="mt-1 whitespace-pre-line text-muted-foreground">
                  {product.description?.trim() || "No description written."}
                </dd>
              </div>
              <a
                href={`/products/${product.id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary underline-offset-4 hover:underline"
              >
                Open the full product page
                <ExternalLink aria-hidden="true" className="h-3 w-3" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </dl>
          </div>
        )}

        {actions && product && <DialogFooter className="gap-2">{actions}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
