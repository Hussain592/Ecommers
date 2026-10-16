import { useEffect, useRef, useState, type FormEvent } from "react";

import { Loader2, Plus, Upload, X } from "lucide-react";

import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { type Product } from "@/data/mock";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { PRODUCT_STATE_HELP, PRODUCT_STATE_LABEL, productState } from "@/lib/product-status";
import { VariantEditor } from "@/components/dashboard/VariantEditor";
import {
  comboKey,
  draftCombos,
  draftTotalStock,
  EMPTY_VARIANT_DRAFT,
  type VariantDraft,
} from "@/lib/variant-draft";
import { fetchProductVariants, variantChoices } from "@/lib/variants";

import { supabase } from "@/lib/supabase";
import { randomUuidLike } from "@/lib/id";
import { errorMessage } from "@/lib/errors";

type CategoryOption = {
  id: string;
  name: string;
  active: boolean;
  status: "pending" | "approved" | "rejected";
  created_by: string | null;
};

/**
 * Make product_variants match what the seller entered: update kept options,
 * add new ones, delete removed ones. With sizes/colours off, all are removed
 * and the single stock number is written back.
 */
async function syncVariants(productId: string, draft: VariantDraft, plainStock: number) {
  const desired = draft.enabled
    ? draftCombos(draft).map((combo) => ({
        ...combo,
        stock: Number(draft.stock[comboKey(combo.size, combo.color)]) || 0,
      }))
    : [];

  const { data: existing, error } = await supabase
    .from("product_variants")
    .select("id, size, color")
    .eq("product_id", productId);

  if (error) {
    // Table missing (database not updated yet): only a problem if the seller used sizes/colours.
    if (desired.length > 0) {
      throw new Error(
        "Sizes and colours aren't switched on for the store yet. Save without them, or ask the admin to run the latest database update.",
      );
    }
    return;
  }

  const wanted = new Map(desired.map((item) => [comboKey(item.size, item.color), item]));
  const stale = (existing ?? []).filter((row) => !wanted.has(comboKey(row.size, row.color)));

  if (stale.length > 0) {
    const { error: deleteError } = await supabase
      .from("product_variants")
      .delete()
      .in(
        "id",
        stale.map((row) => row.id),
      );
    if (deleteError) throw deleteError;
  }

  for (const item of desired) {
    const match = (existing ?? []).find(
      (row) => comboKey(row.size, row.color) === comboKey(item.size, item.color),
    );
    const { error: saveError } = match
      ? await supabase.from("product_variants").update({ stock: item.stock }).eq("id", match.id)
      : await supabase.from("product_variants").insert({ product_id: productId, ...item });
    if (saveError) throw saveError;
  }

  if (!draft.enabled && (existing ?? []).length > 0) {
    // Removing variants can leave the old total behind; write the plain stock back.
    await supabase.from("products").update({ stock: plainStock }).eq("id", productId);
  }
}

export function ProductForm({
  product,
  mode,
  status,
  actorType = "vendor",
}: {
  product?: Product;
  mode: "create" | "edit";
  /** Approval state of an existing product. Set by the admin; vendors and partners only see it. */
  status?: { active: boolean; approval_status: string | null; rejection_reason: string | null };
  /** @deprecated Vendors and partners can no longer change visibility. Kept so old callers compile. */
  showStatus?: boolean;
  actorType?: "vendor" | "partner";
}) {
  const [saving, setSaving] = useState(false);

  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const [imagePreviews, setImagePreviews] = useState<string[]>(
    product?.images?.length ? product.images : product?.image ? [product.image] : [],
  );

  const remainingImageCount = Math.max(0, 3 - imagePreviews.length);

  const [variantDraft, setVariantDraft] = useState<VariantDraft>(EMPTY_VARIANT_DRAFT);

  const [variantError, setVariantError] = useState<string>();

  useEffect(() => {
    if (mode !== "edit" || !product?.id) return;
    let cancelled = false;
    void fetchProductVariants(product.id).then((rows) => {
      if (cancelled || rows.length === 0) return;
      const { sizes, colors } = variantChoices(rows);
      setVariantDraft({
        enabled: true,
        sizes,
        colors,
        stock: Object.fromEntries(
          rows.map((row) => [comboKey(row.size, row.color), String(row.stock)]),
        ),
      });
    });
    return () => {
      cancelled = true;
    };
  }, [mode, product?.id]);

  const variantTotal = draftTotalStock(variantDraft);

  /*
   * CATEGORY STATES
   */
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);

  const [selectedCategory, setSelectedCategory] = useState(product?.category ?? "");

  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [showNewCategory, setShowNewCategory] = useState(false);

  const [newCategory, setNewCategory] = useState("");

  const [categorySaving, setCategorySaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();

  /*
   * ------------------------------------------------
   * LOAD CATEGORIES
   * ------------------------------------------------
   *
   * Vendor ko:
   *
   * 1. Public/approved categories
   * 2. Apni pending categories
   *
   * dono dikhengi.
   */
  useEffect(() => {
    let cancelled = false;

    const loadCategories = async () => {
      setCategoriesLoading(true);

      const { data: authData } = await supabase.auth.getUser();

      const userId = authData.user?.id ?? null;

      const { data, error } = await supabase
        .from("categories")
        .select(
          `
            id,
            name,
            active,
            status,
            created_by
            `,
        )
        .order("name");

      if (cancelled) {
        return;
      }

      if (error) {
        console.error("Unable to load categories", error);

        toast.error("Couldn't load categories. Refresh the page to try again.");

        setCategoriesLoading(false);

        return;
      }

      /*
       * RLS already access restrict karti hai,
       * lekin frontend par bhi filter rakh rahe hain.
       */
      const visibleCategories = (data ?? [])
        .filter((category) => category.active === true || category.created_by === userId)
        .filter((category) => category.status !== "rejected")
        .map((category): CategoryOption => ({
          id: category.id,

          name: category.name,

          active: Boolean(category.active),

          status: category.status as CategoryOption["status"],

          created_by: category.created_by,
        }));

      /*
       * Edit mode mein agar old product ki
       * category ab active nahi hai,
       * phir bhi current value lose na ho.
       */
      if (
        product?.category &&
        !visibleCategories.some(
          (category) => category.name.toLowerCase() === product.category.toLowerCase(),
        )
      ) {
        visibleCategories.unshift({
          id: `current-${product.category}`,

          name: product.category,

          active: true,

          status: "approved",

          created_by: null,
        });
      }

      setCategoryOptions(visibleCategories);

      setSelectedCategory(
        (current) => current || product?.category || visibleCategories[0]?.name || "",
      );

      setCategoriesLoading(false);
    };

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, [product?.category]);

  /*
   * ------------------------------------------------
   * ADD NEW VENDOR CATEGORY
   * ------------------------------------------------
   */
  const handleAddCategory = async () => {
    const name = newCategory.trim().replace(/\s+/g, " ");

    if (name.length < 2) {
      toast.error("Enter a category name (at least 2 characters).");

      return;
    }

    /*
     * Existing visible category check.
     */
    const existing = categoryOptions.find(
      (category) => category.name.trim().toLowerCase() === name.toLowerCase(),
    );

    if (existing) {
      setSelectedCategory(existing.name);

      setNewCategory("");
      setShowNewCategory(false);

      toast.info("This category already exists, so we selected it for you.");

      return;
    }

    setCategorySaving(true);

    try {
      /*
       * Logged-in user
       */
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError || !authData.user) {
        throw new Error("Sign in to add a category.");
      }

      /*
       * Current vendor find karo
       */
      const { data: vendor, error: vendorError } = await supabase
        .from("vendors")
        .select("id")
        .eq("owner_id", authData.user.id)
        .maybeSingle();

      if (vendorError) {
        throw vendorError;
      }

      if (!vendor) {
        throw new Error("We couldn't find your vendor account.");
      }

      /*
       * Vendor category automatically:
       *
       * pending
       * inactive
       *
       * hogi.
       */
      const { data: createdCategory, error: categoryError } = await supabase
        .from("categories")
        .insert({
          name,

          created_by: authData.user.id,

          vendor_id: vendor.id,

          status: "pending",

          active: false,
        })
        .select(
          `
            id,
            name,
            active,
            status,
            created_by
            `,
        )
        .single();

      if (categoryError) {
        throw categoryError;
      }

      const option: CategoryOption = {
        id: createdCategory.id,

        name: createdCategory.name,

        active: Boolean(createdCategory.active),

        status: createdCategory.status as CategoryOption["status"],

        created_by: createdCategory.created_by,
      };

      /*
       * New category dropdown mein add.
       */
      setCategoryOptions((current) =>
        [...current, option].sort((first, second) => first.name.localeCompare(second.name)),
      );

      /*
       * Automatically select new category.
       */
      setSelectedCategory(option.name);

      setNewCategory("");

      setShowNewCategory(false);

      toast.success("Category submitted. It will appear once an admin approves it.");
    } catch (error) {
      console.error("Unable to add category", error);

      toast.error(errorMessage(error, "Couldn't add the category. Please try again."));
    } finally {
      setCategorySaving(false);
    }
  };

  /*
   * ------------------------------------------------
   * IMAGE
   * ------------------------------------------------
   */
  const handleImageChange = (fileList: FileList | null) => {
    if (!fileList?.length) {
      return;
    }

    const files = Array.from(fileList);
    const availableSlots = 3 - imagePreviews.length;

    if (files.length > availableSlots) {
      toast.error(`You can add ${availableSlots} more image${availableSlots === 1 ? "" : "s"}.`);
      return;
    }

    if (files.some((file) => !file.type.startsWith("image/"))) {
      toast.error("Only image files can be uploaded.");

      return;
    }

    if (files.some((file) => file.size > 5 * 1024 * 1024)) {
      toast.error("Each image must be smaller than 5 MB.");

      return;
    }

    setImageFiles((previous) => [...previous, ...files]);
    setImagePreviews((previous) => [
      ...previous,
      ...files.map((file) => URL.createObjectURL(file)),
    ]);
  };

  /*
   * ------------------------------------------------
   * IMAGE UPLOAD
   * ------------------------------------------------
   */
  const uploadImages = async (userId: string) => {
    const existingImages = product?.images?.length
      ? product.images
      : product?.image
        ? [product.image]
        : [];

    if (!imageFiles.length) {
      return existingImages;
    }
    const imageUrls: string[] = [];
    for (const file of imageFiles) {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `${userId}/${randomUuidLike()}.${extension}`;
      const { error } = await supabase.storage.from("product-images").upload(filePath, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });

      if (error) {
        throw error;
      }

      imageUrls.push(supabase.storage.from("product-images").getPublicUrl(filePath).data.publicUrl);
    }

    return [...existingImages, ...imageUrls];
  };

  /*
   * ------------------------------------------------
   * SAVE PRODUCT
   * ------------------------------------------------
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Catch obvious mistakes before they reach customers, and point at the field to fix.
    const draft = new FormData(event.currentTarget);
    const draftName = String(draft.get("name") ?? "").trim();
    const draftPrice = Number(draft.get("price"));
    const draftCompare = String(draft.get("comparePrice") ?? "").trim();
    const draftStock = Number(draft.get("stock"));
    const problem =
      draftName.length < 3
        ? { field: "name", message: "Enter a product name of at least 3 characters." }
        : !Number.isFinite(draftPrice) || draftPrice <= 0
          ? { field: "price", message: "Enter a price greater than Rs. 0." }
          : draftCompare && Number(draftCompare) <= draftPrice
            ? {
                field: "comparePrice",
                message:
                  "Compare price must be higher than the price, or leave it empty. It shows customers the old price.",
              }
            : !Number.isInteger(draftStock) || draftStock < 0
              ? { field: "stock", message: "Enter the stock as a whole number (0 or more)." }
              : null;

    if (problem && !(variantDraft.enabled && problem.field === "stock")) {
      toast.error(problem.message);
      event.currentTarget.querySelector<HTMLElement>(`[name="${problem.field}"]`)?.focus();
      return;
    }

    if (variantDraft.enabled && draftCombos(variantDraft).length === 0) {
      const message = "Add at least one size or colour, or turn off Sizes and colours.";
      setVariantError(message);
      toast.error(message);
      return;
    }
    setVariantError(undefined);

    if (!selectedCategory) {
      toast.error("Select a category for the product.");

      return;
    }

    if (imagePreviews.length !== 3) {
      toast.error(`A product needs 3 images. Add ${remainingImageCount} more.`);

      return;
    }
    setSaving(true);

    try {
      const formData = new FormData(event.currentTarget);

      /*
       * Logged user
       */
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError || !authData.user) {
        throw new Error("Sign in to save the product.");
      }

      /*
       * Vendor / Partner store resolve karo
       */
      let vendorId: string;

      if (actorType === "partner") {
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("role, status, vendor_id")
          .eq("auth_id", authData.user.id)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        if (!profile || profile.role !== "partner" || profile.status !== "Active") {
          throw new Error("Your partner account isn't active yet.");
        }

        if (!profile.vendor_id) {
          throw new Error("You haven't been assigned to a vendor yet. Contact the admin.");
        }

        vendorId = profile.vendor_id;
      } else {
        const { data: vendor, error: vendorError } = await supabase
          .from("vendors")
          .select("id")
          .eq("owner_id", authData.user.id)
          .maybeSingle();

        if (vendorError) {
          throw vendorError;
        }

        if (!vendor) {
          throw new Error("We couldn't find your vendor account.");
        }

        vendorId = vendor.id;
      }

      /*
       * Image upload
       */
      const images = await uploadImages(authData.user.id);

      const comparePriceValue = String(formData.get("comparePrice") ?? "").trim();

      /*
       * Product payload
       */
      const payload = {
        name: String(formData.get("name") ?? "").trim(),

        category: selectedCategory,

        brand: String(formData.get("brand") ?? "").trim() || null,

        description: String(formData.get("description") ?? "").trim() || null,

        price: Number(formData.get("price")),

        compare_price: comparePriceValue ? Number(comparePriceValue) : null,

        stock: variantDraft.enabled ? variantTotal : Number(formData.get("stock")),

        image: images[0] ?? null,
        images,
      };

      /*
       * EDIT PRODUCT
       */
      if (mode === "edit" && product) {
        const { data: updatedProduct, error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", product.id)
          .eq("vendor_id", vendorId)
          .select("id")
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!updatedProduct) {
          throw new Error("Couldn't update the product. You may not have permission to edit it.");
        }

        await syncVariants(product.id, variantDraft, payload.stock);

        toast.success("Product updated.");
      } else {
        /*
         * CREATE PRODUCT
         */
        const newId = `PRD-${randomUuidLike()}`;

        const { error } = await supabase.from("products").insert({
          id: newId,

          vendor_id: vendorId,

          created_by: authData.user.id,

          ...payload,
        });

        if (error) {
          throw error;
        }

        await syncVariants(newId, variantDraft, payload.stock);

        toast.success("Product submitted. It will go live after admin approval.");
      }

      if (actorType === "partner") {
        await navigate({
          to: "/partner/products",
        });
      } else {
        await navigate({
          to: "/vendor/products",
        });
      }
    } catch (error) {
      console.error("Unable to save product", error);

      toast.error(errorMessage(error, "Couldn't save the product. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]" onSubmit={handleSubmit}>
      <div className="space-y-6">
        {/* Basic Information */}

        <section className="surface-card p-5">
          <h2 className="font-bold">Basic Information</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {/* Product Name */}

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="pname">Product Name *</Label>

              <Input
                id="pname"
                name="name"
                required
                defaultValue={product?.name}
                placeholder="e.g. TWS Bluetooth Earbuds"
                className="rounded-xl"
              />
            </div>

            {/* CATEGORY */}

            <div className="space-y-2">
              <Label htmlFor="pcat">Category *</Label>

              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
                disabled={categoriesLoading}
              >
                <SelectTrigger id="pcat" className="rounded-xl">
                  <SelectValue
                    placeholder={categoriesLoading ? "Loading categories..." : "Select category"}
                  />
                </SelectTrigger>

                <SelectContent>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}

                      {category.status === "pending" && " — Pending"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* ADD NEW CATEGORY BUTTON */}

              {actorType === "vendor" && !showNewCategory && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full rounded-xl"
                  onClick={() => setShowNewCategory(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Category
                </Button>
              )}

              {/* NEW CATEGORY BOX */}

              {actorType === "vendor" && showNewCategory && (
                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">New Category</p>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setShowNewCategory(false);

                        setNewCategory("");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <Input
                    className="mt-3 rounded-xl"
                    placeholder="e.g. Pet Supplies"
                    value={newCategory}
                    onChange={(event) => setNewCategory(event.target.value)}
                  />

                  <p className="mt-2 text-xs text-muted-foreground">
                    New categories need admin approval. You can still use this one on your pending
                    product.
                  </p>

                  <Button
                    type="button"
                    size="sm"
                    className="mt-3 w-full rounded-xl"
                    disabled={categorySaving}
                    onClick={() => void handleAddCategory()}
                  >
                    {categorySaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}

                    {categorySaving ? "Adding..." : "Add Category"}
                  </Button>
                </div>
              )}
            </div>

            {/* Brand */}

            <div className="space-y-1.5">
              <Label htmlFor="pbrand">Brand</Label>

              <Input id="pbrand" name="brand" placeholder="Optional" className="rounded-xl" />
            </div>

            {/* Description */}

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="pdesc">Description</Label>

              <Textarea
                id="pdesc"
                name="description"
                rows={5}
                defaultValue={product?.description}
                className="rounded-xl"
              />
            </div>
          </div>
        </section>

        {/* Pricing & Stock */}

        <section className="surface-card p-5">
          <h2 className="font-bold">Pricing & Stock</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="pprice">Price (PKR) *</Label>

              <Input
                id="pprice"
                name="price"
                type="number"
                min="0"
                required
                defaultValue={product?.price}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pold">Compare Price</Label>

              <Input
                id="pold"
                name="comparePrice"
                type="number"
                min="0"
                defaultValue={product?.oldPrice}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pstock">Stock Qty *</Label>

              {variantDraft.enabled ? (
                <>
                  <Input
                    id="pstock"
                    value={variantTotal}
                    readOnly
                    tabIndex={-1}
                    aria-describedby="pstock-help"
                    className="rounded-xl bg-muted"
                  />
                  <p id="pstock-help" className="text-[11px] text-muted-foreground">
                    Added up from sizes and colours.
                  </p>
                </>
              ) : (
                <Input
                  id="pstock"
                  name="stock"
                  type="number"
                  min="0"
                  required
                  defaultValue={product?.stock}
                  className="rounded-xl"
                />
              )}
            </div>
          </div>
        </section>
        <VariantEditor
          value={variantDraft}
          onChange={(next) => {
            setVariantDraft(next);
            setVariantError(undefined);
          }}
          error={variantError}
        />
      </div>

      {/* Sidebar */}

      <aside className="space-y-6">
        {/* Image */}

        <section className="surface-card p-5">
          <h2 className="font-bold">Product Images ({imagePreviews.length}/3)</h2>

          <div className="mt-4 grid aspect-square place-items-center rounded-2xl border-2 border-dashed border-border bg-muted/50 text-center">
            {imagePreviews[0] ? (
              <img
                src={imagePreviews[0]}
                alt="Product preview"
                width={800}
                height={800}
                className="h-full w-full rounded-2xl object-cover"
              />
            ) : (
              <div className="p-6">
                <Upload className="mx-auto h-6 w-6 text-muted-foreground" />

                <p className="mt-2 text-xs text-muted-foreground">
                  Drag and drop images here, or click to choose
                </p>
              </div>
            )}
          </div>

          {imagePreviews.length > 1 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {imagePreviews.map((preview, index) => (
                <img
                  key={`${preview}-${index}`}
                  src={preview}
                  alt={`Product image ${index + 1} preview`}
                  className="aspect-square w-full rounded-lg object-cover"
                />
              ))}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(event) => {
              handleImageChange(event.target.files);
              event.target.value = "";
            }}
          />

          <Button
            type="button"
            variant="outline"
            disabled={remainingImageCount === 0}
            onClick={() => fileInputRef.current?.click()}
          >
            {remainingImageCount === 3
              ? "Choose 3 Images"
              : remainingImageCount > 0
                ? `Add ${remainingImageCount} More Image${remainingImageCount === 1 ? "" : "s"}`
                : "3 Images Added"}
          </Button>

          <p className="mt-2 text-xs text-muted-foreground">
            The first image stays as the cover. Add the remaining images; each must be under 5 MB.
          </p>
        </section>

        {/* Status */}

        {mode === "edit" && status && (
          <section className="surface-card p-5" aria-live="polite">
            <h2 className="font-bold">Status</h2>
            <div className="mt-3 flex flex-col items-start gap-2">
              <StatusBadge status={PRODUCT_STATE_LABEL[productState(status)]} />
              <p className="text-xs leading-5 text-muted-foreground">
                {PRODUCT_STATE_HELP[productState(status)]}
              </p>
              {productState(status) === "rejected" && status.rejection_reason && (
                <p className="rounded-xl bg-destructive/10 p-3 text-xs leading-5 text-destructive">
                  <span className="font-semibold">Reason from the admin:</span>{" "}
                  {status.rejection_reason}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground">
                Only the admin can publish or hide products.
              </p>
            </div>
          </section>
        )}

        {/* Approval Warning */}

        {mode === "create" && (
          <section className="surface-card border-warning/40 bg-warning/10 p-4">
            <p className="text-sm font-semibold">Admin approval required</p>

            <p className="mt-1 text-xs text-muted-foreground">
              Your product will be reviewed before it goes live. Any new category you created also
              needs admin approval.
            </p>
          </section>
        )}

        {/* Submit */}

        <div className="flex gap-3">
          <Button type="submit" className="flex-1 rounded-xl" disabled={saving || categorySaving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}

            {mode === "create"
              ? "Submit for approval"
              : status && productState(status) === "rejected"
                ? "Save and send for review"
                : "Save changes"}
          </Button>
        </div>
      </aside>
    </form>
  );
}
