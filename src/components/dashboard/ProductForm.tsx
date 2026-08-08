import { useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categories, type Product } from "@/data/mock";

export function ProductForm({
  product,
  mode,
  showStatus = true,
}: {
  product?: Product;
  mode: "create" | "edit";
  showStatus?: boolean;
}) {
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
      onSubmit={(e) => {
        e.preventDefault();
        setSaving(true);
        setTimeout(() => {
          setSaving(false);
          toast.success(mode === "create" ? "Product add ho gaya (demo)" : "Product update ho gaya (demo)");
        }, 900);
      }}
    >
      <div className="space-y-6">
        <section className="surface-card p-5">
          <h2 className="font-bold">Basic Information</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="pname">Product Name *</Label>
              <Input id="pname" required defaultValue={product?.name} placeholder="e.g. TWS Bluetooth Earbuds" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pcat">Category *</Label>
              <Select defaultValue={product?.category ?? categories[0]!}>
                <SelectTrigger id="pcat" className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pbrand">Brand</Label>
              <Input id="pbrand" placeholder="Optional" className="rounded-xl" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="pdesc">Description</Label>
              <Textarea id="pdesc" rows={5} defaultValue={product?.description} className="rounded-xl" />
            </div>
          </div>
        </section>

        <section className="surface-card p-5">
          <h2 className="font-bold">Pricing & Stock</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="pprice">Price (PKR) *</Label>
              <Input id="pprice" type="number" required defaultValue={product?.price} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pold">Compare Price</Label>
              <Input id="pold" type="number" defaultValue={product?.oldPrice} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pstock">Stock Qty *</Label>
              <Input id="pstock" type="number" required defaultValue={product?.stock} className="rounded-xl" />
            </div>
          </div>
        </section>
      </div>

      <aside className="space-y-6">
        <section className="surface-card p-5">
          <h2 className="font-bold">Product Image</h2>
          <div className="mt-4 grid aspect-square place-items-center rounded-2xl border-2 border-dashed border-border bg-muted/50 text-center">
            {product ? (
              <img src={product.image} alt={product.name} width={800} height={800} className="h-full w-full rounded-2xl object-cover" />
            ) : (
              <div className="p-6">
                <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
                <p className="mt-2 text-xs text-muted-foreground">Drag & drop ya click karke image upload karein</p>
              </div>
            )}
          </div>
          <Button type="button" variant="outline" className="mt-3 w-full rounded-xl">
            Choose Image
          </Button>
        </section>

        {showStatus && (
          <section className="surface-card p-5">
            <h2 className="font-bold">Status</h2>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">Website par visible</p>
              </div>
              <Switch defaultChecked={product?.active ?? true} />
            </div>
          </section>
        )}

        <div className="flex gap-3">
          <Button type="submit" className="flex-1 rounded-xl" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Add Product" : "Save Changes"}
          </Button>
        </div>
      </aside>
    </form>
  );
}