import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";

import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";

import { toast } from "sonner";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { adminNav } from "@/components/dashboard/nav-config";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/categories")({
  head: () => ({
    meta: [
      {
        title: "Categories — Dukaan.pk Admin",
      },
      {
        name: "description",
        content:
          "Create, approve and manage marketplace product categories.",
      },
      {
        name: "robots",
        content: "noindex",
      },
      {
        property: "og:title",
        content: "Categories — Dukaan.pk Admin",
      },
      {
        property: "og:description",
        content:
          "Category management for the marketplace.",
      },
    ],
  }),

  component: AdminCategories,
});

type CategoryStatus =
  | "pending"
  | "approved"
  | "rejected";

type Category = {
  id: string;
  name: string;

  active: boolean;

  status: CategoryStatus;

  created_by: string | null;
  vendor_id: string | null;
  created_at: string;

  vendor_name: string | null;
};

type CategoryProduct = {
  id: string;
  name: string;
  image: string | null;
  price: number;
  stock: number;
  active: boolean;
};

function AdminCategories() {
  /*
   * ------------------------------------------------
   * CATEGORY STATE
   * ------------------------------------------------
   */

  const [
    categoryList,
    setCategoryList,
  ] = useState<Category[]>([]);

  const [
    productCounts,
    setProductCounts,
  ] = useState<Record<string, number>>({});

  const [
    loading,
    setLoading,
  ] = useState(true);

  /*
   * ------------------------------------------------
   * ADD CATEGORY
   * ------------------------------------------------
   */

  const [
    addOpen,
    setAddOpen,
  ] = useState(false);

  const [
    newCategory,
    setNewCategory,
  ] = useState("");

  const [
    saving,
    setSaving,
  ] = useState(false);

  /*
   * ------------------------------------------------
   * EDIT CATEGORY
   * ------------------------------------------------
   */

  const [
    editTarget,
    setEditTarget,
  ] = useState<Category | null>(null);

  const [
    editName,
    setEditName,
  ] = useState("");

  const [
    editSaving,
    setEditSaving,
  ] = useState(false);

  /*
   * ------------------------------------------------
   * CATEGORY ACTIONS
   * ------------------------------------------------
   */

  const [
    actionBusyId,
    setActionBusyId,
  ] = useState<string | null>(null);

  const [
    deletingId,
    setDeletingId,
  ] = useState<string | null>(null);

  /*
   * ------------------------------------------------
   * CATEGORY PRODUCTS
   * ------------------------------------------------
   */

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState<string | null>(null);

  const [
    categoryProducts,
    setCategoryProducts,
  ] = useState<CategoryProduct[]>([]);

  const [
    productsLoading,
    setProductsLoading,
  ] = useState(false);

  const [
    productBusyId,
    setProductBusyId,
  ] = useState<string | null>(null);

  /*
   * ------------------------------------------------
   * LOAD CATEGORIES
   * ------------------------------------------------
   */

  const loadCategories = async () => {
    setLoading(true);

    /*
     * IMPORTANT:
     *
     * Yahan active = true filter nahi hai.
     *
     * Admin ko:
     *
     * approved
     * pending
     * rejected
     *
     * sab categories dekhni hain.
     */
    const {
      data,
      error,
    } = await supabase
      .from("categories")
      .select(
        `
        id,
        name,
        active,
        status,
        created_by,
        vendor_id,
        created_at
        `,
      )
      .order(
        "created_at",
        {
          ascending: false,
        },
      );

    if (error) {
      console.error(
        "Unable to load categories",
        error,
      );

      toast.error(
        "Categories load nahi ho sakein.",
      );

      setLoading(false);

      return;
    }

    const rows =
      data ?? [];

    /*
     * Vendor names separately load karte hain.
     */
    const vendorIds = Array.from(
      new Set(
        rows
          .map(
            (category) =>
              category.vendor_id,
          )
          .filter(
            (
              id,
            ): id is string =>
              Boolean(id),
          ),
      ),
    );

    const vendorNameMap =
      new Map<string, string>();

    if (
      vendorIds.length > 0
    ) {
      const {
        data:
          vendorRows,
        error:
          vendorError,
      } = await supabase
        .from("vendors")
        .select("id, name")
        .in(
          "id",
          vendorIds,
        );

      if (vendorError) {
        console.error(
          "Unable to load category vendors",
          vendorError,
        );
      }

      for (
        const vendor of
        vendorRows ?? []
      ) {
        vendorNameMap.set(
          vendor.id,
          vendor.name,
        );
      }
    }

    const mappedCategories: Category[] =
      rows.map(
        (category) => ({
          id:
            category.id,

          name:
            category.name,

          active:
            Boolean(
              category.active,
            ),

          status:
            (
              category.status ??
              "approved"
            ) as CategoryStatus,

          created_by:
            category.created_by,

          vendor_id:
            category.vendor_id,

          created_at:
            category.created_at,

          vendor_name:
            category.vendor_id
              ? vendorNameMap.get(
                  category.vendor_id,
                ) ?? null
              : null,
        }),
      );

    /*
     * Pending first.
     * Approved second.
     * Rejected last.
     */
    const priority: Record<
      CategoryStatus,
      number
    > = {
      pending: 0,
      approved: 1,
      rejected: 2,
    };

    mappedCategories.sort(
      (
        first,
        second,
      ) => {
        const statusDifference =
          priority[
            first.status
          ] -
          priority[
            second.status
          ];

        if (
          statusDifference !==
          0
        ) {
          return statusDifference;
        }

        return first.name.localeCompare(
          second.name,
        );
      },
    );

    setCategoryList(
      mappedCategories,
    );

    /*
     * Product counts
     *
     * Products abhi category name
     * text store karte hain.
     */
    const counts =
      await Promise.all(
        mappedCategories.map(
          async (
            category,
          ) => {
            const {
              count,
            } =
              await supabase
                .from(
                  "products",
                )
                .select(
                  "id",
                  {
                    count:
                      "exact",

                    head:
                      true,
                  },
                )
                .eq(
                  "category",
                  category.name,
                );

            return [
              category.name,
              count ?? 0,
            ] as const;
          },
        ),
      );

    setProductCounts(
      Object.fromEntries(
        counts,
      ),
    );

    setLoading(false);
  };

  useEffect(() => {
    void loadCategories();
  }, []);

  /*
   * ------------------------------------------------
   * ADD ADMIN CATEGORY
   * ------------------------------------------------
   */

  const addCategory =
    async (
      event: FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      const name =
        newCategory
          .trim()
          .replace(
            /\s+/g,
            " ",
          );

      if (!name) {
        return;
      }

      /*
       * Duplicate check
       */
      const duplicate =
        categoryList.some(
          (
            category,
          ) =>
            category.name
              .toLowerCase() ===
            name.toLowerCase(),
        );

      if (duplicate) {
        toast.error(
          "Ye category pehle se mojood hai.",
        );

        return;
      }

      setSaving(true);

      /*
       * Admin-created categories directly
       * approved + active hongi.
       */
      const {
        error,
      } = await supabase
        .from(
          "categories",
        )
        .insert({
          name,
          active: true,
          status:
            "approved",
        });

      setSaving(false);

      if (error) {
        toast.error(
          error.message,
        );

        return;
      }

      setNewCategory("");
      setAddOpen(false);

      toast.success(
        "Category add aur approve ho gayi.",
      );

      await loadCategories();
    };

  /*
   * ------------------------------------------------
   * APPROVE CATEGORY
   * ------------------------------------------------
   */

  const approveCategory =
    async (
      category: Category,
    ) => {
      setActionBusyId(
        category.id,
      );

      const {
        error,
      } = await supabase
        .from(
          "categories",
        )
        .update({
          status:
            "approved",

          active:
            true,
        })
        .eq(
          "id",
          category.id,
        );

      setActionBusyId(
        null,
      );

      if (error) {
        toast.error(
          error.message,
        );

        return;
      }

      setCategoryList(
        (
          current,
        ) =>
          current.map(
            (item) =>
              item.id ===
              category.id
                ? {
                    ...item,

                    status:
                      "approved",

                    active:
                      true,
                  }
                : item,
          ),
      );

      toast.success(
        `"${category.name}" approve ho gayi.`,
      );
    };

  /*
   * ------------------------------------------------
   * REJECT CATEGORY
   * ------------------------------------------------
   */

  const rejectCategory =
    async (
      category: Category,
    ) => {
      const confirmed =
        window.confirm(
          `Kya aap "${category.name}" category reject karna chahte hain?`,
        );

      if (!confirmed) {
        return;
      }

      setActionBusyId(
        category.id,
      );

      const {
        error,
      } = await supabase
        .from(
          "categories",
        )
        .update({
          status:
            "rejected",

          active:
            false,
        })
        .eq(
          "id",
          category.id,
        );

      if (error) {
        setActionBusyId(
          null,
        );

        toast.error(
          error.message,
        );

        return;
      }

      /*
       * Agar category mein koi product
       * already active ho to usko bhi hide.
       */
      const {
        error:
          productError,
      } = await supabase
        .from(
          "products",
        )
        .update({
          active:
            false,
        })
        .eq(
          "category",
          category.name,
        );

      setActionBusyId(
        null,
      );

      if (
        productError
      ) {
        console.error(
          "Unable to hide rejected category products",
          productError,
        );
      }

      setCategoryList(
        (
          current,
        ) =>
          current.map(
            (item) =>
              item.id ===
              category.id
                ? {
                    ...item,

                    status:
                      "rejected",

                    active:
                      false,
                  }
                : item,
          ),
      );

      toast.success(
        `"${category.name}" reject ho gayi.`,
      );
    };

  /*
   * ------------------------------------------------
   * EDIT CATEGORY
   * ------------------------------------------------
   */

  const openEdit = (
    category: Category,
  ) => {
    setEditTarget(
      category,
    );

    setEditName(
      category.name,
    );
  };

  const saveEdit =
    async (
      event: FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      if (
        !editTarget
      ) {
        return;
      }

      const name =
        editName
          .trim()
          .replace(
            /\s+/g,
            " ",
          );

      if (!name) {
        return;
      }

      /*
       * Duplicate category check.
       */
      const duplicate =
        categoryList.some(
          (
            category,
          ) =>
            category.id !==
              editTarget.id &&
            category.name
              .toLowerCase() ===
              name.toLowerCase(),
        );

      if (duplicate) {
        toast.error(
          "Is naam ki category pehle se mojood hai.",
        );

        return;
      }

      setEditSaving(
        true,
      );

      const oldName =
        editTarget.name;

      /*
       * Category rename.
       */
      const {
        error,
      } = await supabase
        .from(
          "categories",
        )
        .update({
          name,
        })
        .eq(
          "id",
          editTarget.id,
        );

      if (error) {
        setEditSaving(
          false,
        );

        toast.error(
          error.message,
        );

        return;
      }

      /*
       * IMPORTANT:
       *
       * Products table abhi category name
       * store karti hai.
       *
       * Isliye category rename ho to
       * products bhi rename karne hain.
       */
      if (
        oldName !== name
      ) {
        const {
          error:
            productError,
        } = await supabase
          .from(
            "products",
          )
          .update({
            category:
              name,
          })
          .eq(
            "category",
            oldName,
          );

        if (
          productError
        ) {
          console.error(
            "Unable to update product category names",
            productError,
          );

          toast.error(
            "Category rename ho gayi lekin kuch products update nahi ho sake.",
          );
        }
      }

      setEditSaving(
        false,
      );

      setEditTarget(
        null,
      );

      toast.success(
        "Category update ho gayi.",
      );

      await loadCategories();
    };

  /*
   * ------------------------------------------------
   * DELETE CATEGORY
   * ------------------------------------------------
   */

  const handleDelete =
    async (
      category: Category,
    ) => {
      const count =
        productCounts[
          category.name
        ] ?? 0;

      /*
       * Products hon to category
       * hard-delete nahi karenge.
       */
      if (count > 0) {
        toast.error(
          `Is category mein ${count} product(s) hain. Pehle products ko doosri category mein move karein.`,
        );

        return;
      }

      const confirmed =
        window.confirm(
          `Kya aap "${category.name}" ko permanently delete karna chahte hain?`,
        );

      if (!confirmed) {
        return;
      }

      setDeletingId(
        category.id,
      );

      const {
        error,
      } = await supabase
        .from(
          "categories",
        )
        .delete()
        .eq(
          "id",
          category.id,
        );

      setDeletingId(
        null,
      );

      if (error) {
        toast.error(
          error.message,
        );

        return;
      }

      toast.success(
        "Category delete ho gayi.",
      );

      setCategoryList(
        (
          current,
        ) =>
          current.filter(
            (
              item,
            ) =>
              item.id !==
              category.id,
          ),
      );
    };

  /*
   * ------------------------------------------------
   * OPEN CATEGORY PRODUCTS
   * ------------------------------------------------
   */

  const openCategoryProducts =
    async (
      categoryName: string,
    ) => {
      if (
        selectedCategory ===
        categoryName
      ) {
        setSelectedCategory(
          null,
        );

        setCategoryProducts(
          [],
        );

        return;
      }

      setSelectedCategory(
        categoryName,
      );

      setProductsLoading(
        true,
      );

      const {
        data,
        error,
      } = await supabase
        .from("products")
        .select(
          `
          id,
          name,
          image,
          price,
          stock,
          active
          `,
        )
        .eq(
          "category",
          categoryName,
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          },
        );

      if (error) {
        toast.error(
          "Category products load nahi ho sake.",
        );

        setCategoryProducts(
          [],
        );

        setProductsLoading(
          false,
        );

        return;
      }

      setCategoryProducts(
        (
          data ?? []
        ).map(
          (
            product,
          ) => ({
            ...product,

            price:
              Number(
                product.price,
              ),
          }),
        ),
      );

      setProductsLoading(
        false,
      );
    };

  /*
   * ------------------------------------------------
   * PRODUCT VISIBILITY
   * ------------------------------------------------
   */

  const toggleProduct =
    async (
      product: CategoryProduct,
    ) => {
      setProductBusyId(
        product.id,
      );

      const {
        error,
      } = await supabase
        .from(
          "products",
        )
        .update({
          active:
            !product.active,
        })
        .eq(
          "id",
          product.id,
        );

      setProductBusyId(
        null,
      );

      if (error) {
        toast.error(
          "Product visibility update nahi ho saki.",
        );

        return;
      }

      setCategoryProducts(
        (
          current,
        ) =>
          current.map(
            (
              item,
            ) =>
              item.id ===
              product.id
                ? {
                    ...item,

                    active:
                      !item.active,
                  }
                : item,
          ),
      );

      toast.success(
        product.active
          ? "Product website se hide ho gaya."
          : "Product website par show ho gaya.",
      );
    };

  /*
   * ------------------------------------------------
   * COUNTS
   * ------------------------------------------------
   */

  const pendingCategories =
    categoryList.filter(
      (
        category,
      ) =>
        category.status ===
        "pending",
    );

  const approvedCategories =
    categoryList.filter(
      (
        category,
      ) =>
        category.status ===
        "approved",
    );

  const rejectedCategories =
    categoryList.filter(
      (
        category,
      ) =>
        category.status ===
        "rejected",
    );

  /*
   * ------------------------------------------------
   * STATUS BADGE
   * ------------------------------------------------
   */

  const renderStatusBadge = (
    category: Category,
  ) => {
    if (
      category.status ===
      "pending"
    ) {
      return (
        <span className="rounded-full bg-warning/10 px-2.5 py-1 text-[11px] font-semibold text-warning">
          Pending
        </span>
      );
    }

    if (
      category.status ===
      "rejected"
    ) {
      return (
        <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-[11px] font-semibold text-destructive">
          Rejected
        </span>
      );
    }

    return (
      <span className="rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
        Approved
      </span>
    );
  };

  /*
   * ------------------------------------------------
   * CATEGORY CARD
   * ------------------------------------------------
   */

  const renderCategoryCard = (
    category: Category,
  ) => {
    const busy =
      actionBusyId ===
        category.id ||
      deletingId ===
        category.id;

    return (
      <div
        key={
          category.id
        }
        className={`surface-card p-5 ${
          selectedCategory ===
          category.name
            ? "border-primary"
            : ""
        }`}
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <button
            type="button"
            className="min-w-0 text-left"
            onClick={() =>
              void openCategoryProducts(
                category.name,
              )
            }
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-semibold">
                {
                  category.name
                }
              </p>

              {renderStatusBadge(
                category,
              )}
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              {productCounts[
                category.name
              ] ?? 0}{" "}
              products
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {category.vendor_name
                ? `Created by ${category.vendor_name}`
                : "Created by Admin"}
            </p>

            <p className="mt-2 text-xs font-semibold text-primary">
              {selectedCategory ===
              category.name
                ? "Close products"
                : "View products"}
            </p>
          </button>

          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={
                busy
              }
              onClick={() =>
                openEdit(
                  category,
                )
              }
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              disabled={
                busy
              }
              onClick={() =>
                void handleDelete(
                  category,
                )
              }
            >
              {deletingId ===
              category.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>

        {/* Approval Actions */}

        {category.status !==
          "approved" && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
            <Button
              type="button"
              size="sm"
              className="rounded-lg"
              disabled={
                busy
              }
              onClick={() =>
                void approveCategory(
                  category,
                )
              }
            >
              {actionBusyId ===
              category.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}

              Approve
            </Button>

            {category.status ===
              "pending" && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-lg text-destructive"
                disabled={
                  busy
                }
                onClick={() =>
                  void rejectCategory(
                    category,
                  )
                }
              >
                <XCircle className="mr-2 h-4 w-4" />

                Reject
              </Button>
            )}
          </div>
        )}

        {category.status ===
          "approved" &&
          category.vendor_id && (
            <div className="mt-4 border-t border-border pt-4">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-lg text-destructive"
                disabled={
                  busy
                }
                onClick={() =>
                  void rejectCategory(
                    category,
                  )
                }
              >
                <XCircle className="mr-2 h-4 w-4" />

                Reject Category
              </Button>
            </div>
          )}

        {/* Products */}

        {selectedCategory ===
          category.name && (
          <div className="mt-4 border-t border-border pt-4">
            {productsLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : categoryProducts.length ===
              0 ? (
              <p className="text-sm text-muted-foreground">
                Is category mein koi product nahi.
              </p>
            ) : (
              <div className="space-y-2">
                {categoryProducts
                  .slice(
                    0,
                    20,
                  )
                  .map(
                    (
                      product,
                    ) => (
                      <div
                        key={
                          product.id
                        }
                        className="flex items-center gap-3 rounded-xl bg-muted/60 p-2"
                      >
                        <img
                          src={
                            product.image ||
                            "/favicon.ico"
                          }
                          alt=""
                          width={
                            40
                          }
                          height={
                            40
                          }
                          className="h-10 w-10 rounded-lg object-cover"
                        />

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">
                            {
                              product.name
                            }
                          </p>

                          <p className="text-xs text-muted-foreground">
                            Rs.{" "}
                            {product.price.toLocaleString(
                              "en-PK",
                            )}{" "}
                            · Stock{" "}
                            {
                              product.stock
                            }
                          </p>
                        </div>

                        <Button
                          type="button"
                          variant={
                            product.active
                              ? "outline"
                              : "default"
                          }
                          size="sm"
                          className="rounded-lg"
                          disabled={
                            productBusyId ===
                            product.id
                          }
                          onClick={() =>
                            void toggleProduct(
                              product,
                            )
                          }
                        >
                          {product.active ? (
                            <>
                              <EyeOff className="mr-1 h-3.5 w-3.5" />

                              Hide
                            </>
                          ) : (
                            <>
                              <Eye className="mr-1 h-3.5 w-3.5" />

                              Show
                            </>
                          )}
                        </Button>
                      </div>
                    ),
                  )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <DashboardShell
      brand="Dukaan.pk"
      role="Owner / Admin"
      title="Categories"
      subtitle={`${approvedCategories.length} approved · ${pendingCategories.length} pending · ${rejectedCategories.length} rejected`}
      nav={adminNav}
      actions={
        <Dialog
          open={
            addOpen
          }
          onOpenChange={
            setAddOpen
          }
        >
          <DialogTrigger
            asChild
          >
            <Button
              size="sm"
              className="rounded-xl"
            >
              <Plus className="mr-2 h-4 w-4" />

              New Category
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Add Category
              </DialogTitle>

              <DialogDescription>
                Admin-created category directly marketplace mein approve hogi.
              </DialogDescription>
            </DialogHeader>

            <form
              className="space-y-4"
              onSubmit={
                addCategory
              }
            >
              <div className="space-y-1.5">
                <Label htmlFor="cn">
                  Category Name
                </Label>

                <Input
                  id="cn"
                  value={
                    newCategory
                  }
                  onChange={(
                    event,
                  ) =>
                    setNewCategory(
                      event
                        .target
                        .value,
                    )
                  }
                  required
                  placeholder="e.g. Sports"
                  className="rounded-xl"
                />
              </div>

              <Button
                type="submit"
                disabled={
                  saving
                }
                className="w-full rounded-xl"
              >
                {saving && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}

                {saving
                  ? "Saving..."
                  : "Add Category"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      {/* Loading */}

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-10">
          {/* Pending Requests */}

          <section>
            <div className="mb-4">
              <h2 className="text-lg font-bold">
                Pending Category Requests
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Vendor ki new categories ko approve, edit ya reject karein.
              </p>
            </div>

            {pendingCategories.length ===
            0 ? (
              <div className="surface-card p-6 text-sm text-muted-foreground">
                Abhi koi pending category request nahi hai.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {pendingCategories.map(
                  (
                    category,
                  ) =>
                    renderCategoryCard(
                      category,
                    ),
                )}
              </div>
            )}
          </section>

          {/* Approved */}

          <section>
            <div className="mb-4">
              <h2 className="text-lg font-bold">
                Approved Categories
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Marketplace ki active approved categories.
              </p>
            </div>

            {approvedCategories.length ===
            0 ? (
              <div className="surface-card p-6 text-sm text-muted-foreground">
                Koi approved category nahi hai.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {approvedCategories.map(
                  (
                    category,
                  ) =>
                    renderCategoryCard(
                      category,
                    ),
                )}
              </div>
            )}
          </section>

          {/* Rejected */}

          {rejectedCategories.length >
            0 && (
            <section>
              <div className="mb-4">
                <h2 className="text-lg font-bold">
                  Rejected Categories
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Rejected requests ko review ya dobara approve kar sakte hain.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {rejectedCategories.map(
                  (
                    category,
                  ) =>
                    renderCategoryCard(
                      category,
                    ),
                )}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Edit Dialog */}

      <Dialog
        open={
          Boolean(
            editTarget,
          )
        }
        onOpenChange={(
          open,
        ) => {
          if (!open) {
            setEditTarget(
              null,
            );
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit Category
            </DialogTitle>

            <DialogDescription>
              Category ka naam update karein. Is category ke products bhi naye naam par move ho jayenge.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={
              saveEdit
            }
          >
            <div className="space-y-1.5">
              <Label htmlFor="ecn">
                Category Name
              </Label>

              <Input
                id="ecn"
                value={
                  editName
                }
                onChange={(
                  event,
                ) =>
                  setEditName(
                    event
                      .target
                      .value,
                  )
                }
                required
                className="rounded-xl"
              />
            </div>

            <Button
              type="submit"
              disabled={
                editSaving
              }
              className="w-full rounded-xl"
            >
              {editSaving && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              {editSaving
                ? "Saving..."
                : "Save Changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}