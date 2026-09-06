import { useEffect, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
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
import { supabase } from "@/lib/supabase";
import { randomUuidLike } from "@/lib/id";

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(product?.image ?? "");
  const [active, setActive] = useState(product?.active ?? false);
  const [categoryOptions, setCategoryOptions] = useState(categories);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadCategories = async () => {
      const { data, error } = await supabase.from("categories").select("name").eq("active", true).order("name");
      if (!error && data.length > 0) setCategoryOptions(data.map((category) => category.name));
    };
    void loadCategories();
  }, []);

  const handleImageChange = (file: File | undefined) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Sirf image file upload karein.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image 5 MB se chhoti honi chahiye.");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async () => {
    if (!imageFile) return product?.image ?? null;

    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) throw new Error("Product add karne ke liye login zaroori hai.");

    const extension = imageFile.name.split(".").pop()?.toLowerCase() || "jpg";
    const filePath = `${authData.user.id}/${randomUuidLike()}.${extension}`;
    const { error } = await supabase.storage.from("product-images").upload(filePath, imageFile, {
      cacheControl: "3600",
      contentType: imageFile.type,
      upsert: false,
    });

    if (error) throw error;
    return supabase.storage.from("product-images").getPublicUrl(filePath).data.publicUrl;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData(event.currentTarget);
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) throw new Error("Product save karne ke liye login zaroori hai.");
      const image = await uploadImage();
      const comparePriceValue = String(formData.get("comparePrice") ?? "").trim();
      const payload = {
        name: String(formData.get("name") ?? "").trim(),
        category: String(formData.get("category") ?? "").trim(),
        brand: String(formData.get("brand") ?? "").trim() || null,
        description: String(formData.get("description") ?? "").trim() || null,
        price: Number(formData.get("price")),
        compare_price: comparePriceValue ? Number(comparePriceValue) : null,
        stock: Number(formData.get("stock")),
        active: mode === "create" ? false : active,
        image,
      };

      if (mode === "edit" && product) {
        const { error } = await supabase.from("products").update(payload).eq("id", product.id);
        if (error) throw error;
        toast.success("Product update ho gaya.");
      } else {
        const { data: vendor, error: vendorError } = await supabase
          .from("vendors")
          .select("id")
          .eq("owner_id", authData.user.id)
          .maybeSingle();
        if (vendorError) throw vendorError;
        const { error } = await supabase.from("products").insert({
          id: `PRD-${randomUuidLike()}`,
          vendor_id: vendor?.id ?? null,
          created_by: authData.user.id,
          ...payload,
        });
        if (error) throw error;
        toast.success("Product submit ho gaya. Admin approval ke baad website par show hoga.");
      }

      await navigate({ to: "/vendor/products" });
    } catch (error) {
      console.error("Unable to save product", error);
      toast.error(error instanceof Error ? error.message : "Product save nahi ho saka. Please dobara try karein.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
      onSubmit={handleSubmit}
    >
      <div className="space-y-6">
        <section className="surface-card p-5">
          <h2 className="font-bold">Basic Information</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="pname">Product Name *</Label>
              <Input id="pname" name="name" required defaultValue={product?.name} placeholder="e.g. TWS Bluetooth Earbuds" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pcat">Category *</Label>
              <Select name="category" defaultValue={product?.category ?? categoryOptions[0]!}>
                <SelectTrigger id="pcat" className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pbrand">Brand</Label>
              <Input id="pbrand" name="brand" placeholder="Optional" className="rounded-xl" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="pdesc">Description</Label>
              <Textarea id="pdesc" name="description" rows={5} defaultValue={product?.description} className="rounded-xl" />
            </div>
          </div>
        </section>

        <section className="surface-card p-5">
          <h2 className="font-bold">Pricing & Stock</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="pprice">Price (PKR) *</Label>
              <Input id="pprice" name="price" type="number" min="0" required defaultValue={product?.price} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pold">Compare Price</Label>
              <Input id="pold" name="comparePrice" type="number" min="0" defaultValue={product?.oldPrice} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pstock">Stock Qty *</Label>
              <Input id="pstock" name="stock" type="number" min="0" required defaultValue={product?.stock} className="rounded-xl" />
            </div>
          </div>
        </section>
      </div>

      <aside className="space-y-6">
        <section className="surface-card p-5">
          <h2 className="font-bold">Product Image</h2>
          <div className="mt-4 grid aspect-square place-items-center rounded-2xl border-2 border-dashed border-border bg-muted/50 text-center">
            {imagePreview ? (
              <img src={imagePreview} alt="Product preview" width={800} height={800} className="h-full w-full rounded-2xl object-cover" />
            ) : (
              <div className="p-6">
                <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
                <p className="mt-2 text-xs text-muted-foreground">Drag & drop ya click karke image upload karein</p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => handleImageChange(event.target.files?.[0])}
          />
          <Button type="button" variant="outline" className="mt-3 w-full rounded-xl" onClick={() => fileInputRef.current?.click()}>
            Choose Image
          </Button>
        </section>

        {showStatus && mode === "edit" && (
          <section className="surface-card p-5">
            <h2 className="font-bold">Status</h2>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">Website par visible</p>
              </div>
              <Switch checked={active} onCheckedChange={setActive} />
            </div>
          </section>
        )}

        {mode === "create" && (
          <section className="surface-card border-warning/40 bg-warning/10 p-4">
            <p className="text-sm font-semibold">Admin approval required</p>
            <p className="mt-1 text-xs text-muted-foreground">Product pehle review ke liye submit hoga. Admin approve karega to website par visible ho jayega.</p>
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