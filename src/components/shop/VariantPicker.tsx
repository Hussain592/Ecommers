import { cn } from "@/lib/utils";
import { COLOR_SWATCHES, variantChoices, type ProductVariant } from "@/lib/variants";

export type VariantSelection = { size: string | null; color: string | null };

/**
 * Size and colour chooser. Options that can't be bought with the current
 * choice are crossed out and disabled, so customers can't pick something
 * that isn't in stock.
 */
export function VariantPicker({
  variants,
  value,
  onChange,
  missing,
}: {
  variants: ProductVariant[];
  value: VariantSelection;
  onChange: (next: VariantSelection) => void;
  /** Which group the customer still has to choose; shows an inline message. */
  missing: "size" | "color" | null;
}) {
  const { sizes, colors } = variantChoices(variants);

  const inStock = (size: string | null, color: string | null) =>
    variants.some(
      (variant) =>
        variant.stock > 0 &&
        (size === null || variant.size === size) &&
        (color === null || variant.color === color),
    );

  return (
    <div className="space-y-4">
      {sizes.length > 0 && (
        <fieldset>
          <legend className="text-sm font-semibold">
            Size
            {value.size ? (
              <span className="font-normal text-muted-foreground">: {value.size}</span>
            ) : (
              <span className="text-destructive"> *</span>
            )}
          </legend>
          <div
            id="variant-size"
            role="radiogroup"
            aria-label="Size"
            aria-invalid={missing === "size"}
            className="mt-2 flex flex-wrap gap-2"
          >
            {sizes.map((size) => {
              const available = inStock(size, value.color);
              const selected = value.size === size;
              return (
                <button
                  key={size}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={available ? size : `${size}, out of stock`}
                  disabled={!available}
                  onClick={() => onChange({ ...value, size: selected ? null : size })}
                  className={cn(
                    "min-w-12 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:border-primary",
                    !available &&
                      "cursor-not-allowed text-muted-foreground line-through opacity-50",
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>
          {missing === "size" && (
            <p className="mt-1.5 text-xs font-medium text-destructive" role="alert">
              Select a size.
            </p>
          )}
        </fieldset>
      )}

      {colors.length > 0 && (
        <fieldset>
          <legend className="text-sm font-semibold">
            Colour
            {value.color ? (
              <span className="font-normal text-muted-foreground">: {value.color}</span>
            ) : (
              <span className="text-destructive"> *</span>
            )}
          </legend>
          <div
            id="variant-color"
            role="radiogroup"
            aria-label="Colour"
            aria-invalid={missing === "color"}
            className="mt-2 flex flex-wrap gap-2"
          >
            {colors.map((color) => {
              const available = inStock(value.size, color);
              const selected = value.color === color;
              const swatch = COLOR_SWATCHES[color];
              return (
                <button
                  key={color}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={available ? color : `${color}, out of stock`}
                  disabled={!available}
                  onClick={() => onChange({ ...value, color: selected ? null : color })}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected
                      ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                      : "border-border bg-card hover:border-primary",
                    !available &&
                      "cursor-not-allowed text-muted-foreground line-through opacity-50",
                  )}
                >
                  {swatch && (
                    <span
                      aria-hidden="true"
                      className="h-4 w-4 rounded-full border border-black/15"
                      style={{ backgroundColor: swatch }}
                    />
                  )}
                  {color}
                </button>
              );
            })}
          </div>
          {missing === "color" && (
            <p className="mt-1.5 text-xs font-medium text-destructive" role="alert">
              Select a colour.
            </p>
          )}
        </fieldset>
      )}
    </div>
  );
}
