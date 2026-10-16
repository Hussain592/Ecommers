import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

/** One size/colour combination of a product and how many are in stock. */
export type ProductVariant = {
  id: string;
  size: string | null;
  color: string | null;
  stock: number;
};

export const variantKeys = {
  forProduct: (productId: string) => ["product-variants", productId] as const,
  productIds: ["products-with-variants"] as const,
};

/** "L · Black", "L" or "Black". */
export function variantLabel(variant: { size?: string | null; color?: string | null }) {
  return [variant.size, variant.color].filter(Boolean).join(" · ");
}

function unique(values: Array<string | null>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

/** The sizes and colours a product is offered in, in the order the seller added them. */
export function variantChoices(variants: ProductVariant[]) {
  return {
    sizes: unique(variants.map((variant) => variant.size)),
    colors: unique(variants.map((variant) => variant.color)),
  };
}

export async function fetchProductVariants(productId: string): Promise<ProductVariant[]> {
  const { data, error } = await supabase
    .from("product_variants")
    .select("id, size, color, stock")
    .eq("product_id", productId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  // Before the sizes/colours migration runs the table doesn't exist yet:
  // treat that as "no variants" so the store keeps working.
  if (error) {
    console.warn("Product variants unavailable", error.message);
    return [];
  }
  return (data ?? []).map((row) => ({ ...row, stock: Number(row.stock ?? 0) }));
}

export function useProductVariants(productId: string | undefined) {
  return useQuery({
    queryKey: variantKeys.forProduct(productId ?? ""),
    queryFn: () => fetchProductVariants(productId ?? ""),
    enabled: Boolean(productId),
    staleTime: 30 * 1000,
  });
}

/** Ids of products that must be opened to pick a size or colour before buying. */
export function useProductsWithVariants(): Set<string> {
  const { data } = useQuery({
    queryKey: variantKeys.productIds,
    queryFn: async () => {
      const { data: rows, error } = await supabase.rpc("products_with_variants");
      if (error) return new Set<string>();
      return new Set(((rows ?? []) as unknown[]).map((row) => String(row)));
    },
    staleTime: 5 * 60 * 1000,
  });
  return data ?? new Set<string>();
}

export const SIZE_PRESETS: Array<{ label: string; values: string[] }> = [
  { label: "Clothing", values: ["S", "M", "L", "XL", "XXL"] },
  { label: "Kids", values: ["2-3Y", "4-5Y", "6-7Y", "8-9Y", "10-12Y"] },
  { label: "Numbers", values: ["36", "38", "40", "42", "44"] },
  { label: "One size", values: ["Free size"] },
];

/** Common colours with a swatch, so customers see the colour, not just its name. */
export const COLOR_SWATCHES: Record<string, string> = {
  Black: "#111111",
  White: "#ffffff",
  Green: "#0b6b4c",
  Red: "#b3202e",
  Maroon: "#6b1d2a",
  Blue: "#1f4e8c",
  Grey: "#8a8f8c",
  Brown: "#6b4a2b",
  Beige: "#d9c7a3",
  Gold: "#c9a24b",
  Silver: "#c0c4c8",
};
