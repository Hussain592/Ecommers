/** Sizes/colours as the seller is editing them in the product form. */
export type VariantDraft = {
  enabled: boolean;
  sizes: string[];
  colors: string[];
  /** Stock typed by the seller, keyed by comboKey(size, colour). */
  stock: Record<string, string>;
};

export const EMPTY_VARIANT_DRAFT: VariantDraft = {
  enabled: false,
  sizes: [],
  colors: [],
  stock: {},
};

export function comboKey(size: string | null, color: string | null) {
  return `${size ?? ""}|${color ?? ""}`;
}

/** Every size × colour combination the seller has listed. */
export function draftCombos(
  draft: VariantDraft,
): Array<{ size: string | null; color: string | null }> {
  const sizes = draft.sizes.length ? draft.sizes : [null];
  const colors = draft.colors.length ? draft.colors : [null];
  return sizes
    .flatMap((size) => colors.map((color) => ({ size, color })))
    .filter((combo) => combo.size !== null || combo.color !== null);
}

export function draftTotalStock(draft: VariantDraft) {
  return draftCombos(draft).reduce(
    (sum, combo) => sum + (Number(draft.stock[comboKey(combo.size, combo.color)]) || 0),
    0,
  );
}
