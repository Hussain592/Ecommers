import { useId, useState, type KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { COLOR_SWATCHES, SIZE_PRESETS } from "@/lib/variants";
import { comboKey, draftCombos, draftTotalStock, type VariantDraft } from "@/lib/variant-draft";

const MAX_OPTIONS = 12;

function ChipInput({
  label,
  values,
  onChange,
  placeholder,
  swatches,
}: {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  swatches?: boolean;
}) {
  const id = useId();
  const [text, setText] = useState("");

  const addValues = (raw: string[]) => {
    const next = [...values];
    for (const item of raw.map((value) => value.trim()).filter(Boolean)) {
      if (next.length >= MAX_OPTIONS) break;
      if (!next.some((existing) => existing.toLowerCase() === item.toLowerCase())) next.push(item);
    }
    onChange(next);
  };

  const commit = () => {
    if (!text.trim()) return;
    addValues(text.split(","));
    setText("");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commit();
    } else if (event.key === "Backspace" && !text && values.length) {
      onChange(values.slice(0, -1));
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>

      {values.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label={`Chosen ${label.toLowerCase()}`}>
          {values.map((value) => (
            <li
              key={value}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card py-1 pl-3 pr-1 text-sm"
            >
              {swatches && COLOR_SWATCHES[value] && (
                <span
                  aria-hidden="true"
                  className="h-3.5 w-3.5 rounded-full border border-black/15"
                  style={{ backgroundColor: COLOR_SWATCHES[value] }}
                />
              )}
              {value}
              <button
                type="button"
                onClick={() => onChange(values.filter((item) => item !== value))}
                aria-label={`Remove ${value}`}
                className="grid h-6 w-6 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <Input
          id={id}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={commit}
          placeholder={placeholder}
          disabled={values.length >= MAX_OPTIONS}
          className="h-9 rounded-xl"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={commit}
          disabled={!text.trim()}
          className="h-9 rounded-xl"
        >
          <Plus aria-hidden="true" className="mr-1 h-4 w-4" />
          Add
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-muted-foreground">Quick add:</span>
        {swatches
          ? Object.entries(COLOR_SWATCHES).map(([name, hex]) => (
              <button
                key={name}
                type="button"
                onClick={() => addValues([name])}
                disabled={values.includes(name)}
                className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 hover:bg-muted disabled:opacity-40"
              >
                <span
                  aria-hidden="true"
                  className="h-3 w-3 rounded-full border border-black/15"
                  style={{ backgroundColor: hex }}
                />
                {name}
              </button>
            ))
          : SIZE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => addValues(preset.values)}
                className="rounded-full border border-border px-2 py-0.5 hover:bg-muted"
                title={preset.values.join(", ")}
              >
                {preset.label} ({preset.values[0]}
                {preset.values.length > 1 ? `–${preset.values[preset.values.length - 1]}` : ""})
              </button>
            ))}
      </div>
    </div>
  );
}

export function VariantEditor({
  value,
  onChange,
  error,
}: {
  value: VariantDraft;
  onChange: (next: VariantDraft) => void;
  error?: string | undefined;
}) {
  const switchId = useId();
  const combos = draftCombos(value);
  const total = draftTotalStock(value);

  const setStock = (size: string | null, color: string | null, raw: string) =>
    onChange({
      ...value,
      stock: { ...value.stock, [comboKey(size, color)]: raw.replace(/[^0-9]/g, "").slice(0, 6) },
    });

  const stockInput = (size: string | null, color: string | null) => (
    <Input
      inputMode="numeric"
      aria-label={`Stock for ${[size, color].filter(Boolean).join(", ")}`}
      value={value.stock[comboKey(size, color)] ?? ""}
      onChange={(event) => setStock(size, color, event.target.value)}
      placeholder="0"
      className="h-9 w-20 rounded-lg text-center"
    />
  );

  return (
    <section className="surface-card p-5" aria-labelledby={`${switchId}-title`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id={`${switchId}-title`} className="font-bold">
            Sizes and colours
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Turn this on if customers need to choose a size or colour.
          </p>
        </div>
        <Switch
          id={switchId}
          checked={value.enabled}
          onCheckedChange={(enabled) => onChange({ ...value, enabled })}
          aria-label="This product comes in different sizes or colours"
        />
      </div>

      {value.enabled && (
        <div className="mt-5 space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <ChipInput
              label="Sizes"
              values={value.sizes}
              onChange={(sizes) => onChange({ ...value, sizes })}
              placeholder="Type a size, e.g. M, then Enter"
            />
            <ChipInput
              label="Colours"
              values={value.colors}
              onChange={(colors) => onChange({ ...value, colors })}
              placeholder="Type a colour, e.g. Black, then Enter"
              swatches
            />
          </div>

          {combos.length > 0 && (
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold">Stock for each option</p>
                <p className="text-xs text-muted-foreground">
                  Total: <strong className="text-foreground">{total}</strong>
                </p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Leave 0 for options you don't have. Customers will see them as out of stock.
              </p>

              <div className="mt-3 overflow-x-auto rounded-xl border border-border">
                {value.sizes.length > 0 && value.colors.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead className="bg-muted/60 text-xs text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">Size / Colour</th>
                        {value.colors.map((color) => (
                          <th key={color} className="px-3 py-2 text-center font-semibold">
                            {color}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {value.sizes.map((size) => (
                        <tr key={size}>
                          <th scope="row" className="px-3 py-2 text-left font-semibold">
                            {size}
                          </th>
                          {value.colors.map((color) => (
                            <td key={color} className="px-3 py-2 text-center">
                              <div className="flex justify-center">{stockInput(size, color)}</div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <ul className="divide-y divide-border">
                    {combos.map((combo) => (
                      <li
                        key={comboKey(combo.size, combo.color)}
                        className={cn("flex items-center justify-between gap-3 px-3 py-2")}
                      >
                        <span className="text-sm font-semibold">{combo.size ?? combo.color}</span>
                        {stockInput(combo.size, combo.color)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
