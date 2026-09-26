import {

  useEffect,

  useRef,

  useState,

  type FormEvent,

} from "react";



import {

  Loader2,

  Plus,

  Upload,

  X,

} from "lucide-react";



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



import { type Product } from "@/data/mock";



import { supabase } from "@/lib/supabase";

import { randomUuidLike } from "@/lib/id";



type CategoryOption = {

  id: string;

  name: string;

  active: boolean;

  status: "pending" | "approved" | "rejected";

  created_by: string | null;

};



export function ProductForm({

  product,

  mode,

  showStatus = true,

  actorType = "vendor",

}: {

  product?: Product;

  mode: "create" | "edit";

  showStatus?: boolean;

  actorType?: "vendor" | "partner";

}) {

  const [saving, setSaving] =

    useState(false);



  const [

    imageFile,

    setImageFile,

  ] = useState<File | null>(

    null,

  );



  const [

    imagePreview,

    setImagePreview,

  ] = useState(

    product?.image ?? "",

  );



  const [

    active,

    setActive,

  ] = useState(

    product?.active ?? false,

  );



  /*

   * CATEGORY STATES

   */

  const [

    categoryOptions,

    setCategoryOptions,

  ] = useState<CategoryOption[]>(

    [],

  );



  const [

    selectedCategory,

    setSelectedCategory,

  ] = useState(

    product?.category ?? "",

  );



  const [

    categoriesLoading,

    setCategoriesLoading,

  ] = useState(true);



  const [

    showNewCategory,

    setShowNewCategory,

  ] = useState(false);



  const [

    newCategory,

    setNewCategory,

  ] = useState("");



  const [

    categorySaving,

    setCategorySaving,

  ] = useState(false);



  const fileInputRef =

    useRef<HTMLInputElement>(

      null,

    );



  const navigate =

    useNavigate();



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



    const loadCategories =

      async () => {

        setCategoriesLoading(

          true,

        );



        const {

          data: authData,

        } =

          await supabase.auth.getUser();



        const userId =

          authData.user?.id ??

          null;



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

            created_by

            `,

          )

          .order("name");



        if (cancelled) {

          return;

        }



        if (error) {

          console.error(

            "Unable to load categories",

            error,

          );



          toast.error(

            "Categories load nahi ho sakein.",

          );



          setCategoriesLoading(

            false,

          );



          return;

        }



        /*

         * RLS already access restrict karti hai,

         * lekin frontend par bhi filter rakh rahe hain.

         */

        const visibleCategories =

          (

            data ?? []

          )

            .filter(

              (

                category,

              ) =>

                category.active ===

                  true ||

                category.created_by ===

                  userId,

            )

            .filter(

              (

                category,

              ) =>

                category.status !==

                "rejected",

            )

            .map(

              (

                category,

              ): CategoryOption => ({

                id:

                  category.id,



                name:

                  category.name,



                active:

                  Boolean(

                    category.active,

                  ),



                status:

                  category.status as CategoryOption["status"],



                created_by:

                  category.created_by,

              }),

            );



        /*

         * Edit mode mein agar old product ki

         * category ab active nahi hai,

         * phir bhi current value lose na ho.

         */

        if (

          product?.category &&

          !visibleCategories.some(

            (

              category,

            ) =>

              category.name.toLowerCase() ===

              product.category.toLowerCase(),

          )

        ) {

          visibleCategories.unshift(

            {

              id: `current-${product.category}`,



              name:

                product.category,



              active:

                true,



              status:

                "approved",



              created_by:

                null,

            },

          );

        }



        setCategoryOptions(

          visibleCategories,

        );



        setSelectedCategory(

          (

            current,

          ) =>

            current ||

            product?.category ||

            visibleCategories[0]

              ?.name ||

            "",

        );



        setCategoriesLoading(

          false,

        );

      };



    void loadCategories();



    return () => {

      cancelled = true;

    };

  }, [

    product?.category,

  ]);



  /*

   * ------------------------------------------------

   * ADD NEW VENDOR CATEGORY

   * ------------------------------------------------

   */

  const handleAddCategory =

    async () => {

      const name =

        newCategory

          .trim()

          .replace(

            /\s+/g,

            " ",

          );



      if (

        name.length < 2

      ) {

        toast.error(

          "Category ka valid naam likhein.",

        );



        return;

      }



      /*

       * Existing visible category check.

       */

      const existing =

        categoryOptions.find(

          (

            category,

          ) =>

            category.name

              .trim()

              .toLowerCase() ===

            name.toLowerCase(),

        );



      if (existing) {

        setSelectedCategory(

          existing.name,

        );



        setNewCategory("");

        setShowNewCategory(

          false,

        );



        toast.info(

          "Ye category pehle se mojood hai. Select kar di gayi hai.",

        );



        return;

      }



      setCategorySaving(

        true,

      );



      try {

        /*

         * Logged-in user

         */

        const {

          data: authData,

          error:

            authError,

        } =

          await supabase.auth.getUser();



        if (

          authError ||

          !authData.user

        ) {

          throw new Error(

            "Category add karne ke liye login zaroori hai.",

          );

        }



        /*

         * Current vendor find karo

         */

        const {

          data: vendor,

          error:

            vendorError,

        } = await supabase

          .from("vendors")

          .select("id")

          .eq(

            "owner_id",

            authData.user.id,

          )

          .maybeSingle();



        if (vendorError) {

          throw vendorError;

        }



        if (!vendor) {

          throw new Error(

            "Aapka vendor account nahi mila.",

          );

        }



        /*

         * Vendor category automatically:

         *

         * pending

         * inactive

         *

         * hogi.

         */

        const {

          data:

            createdCategory,

          error:

            categoryError,

        } = await supabase

          .from("categories")

          .insert({

            name,



            created_by:

              authData.user.id,



            vendor_id:

              vendor.id,



            status:

              "pending",



            active:

              false,

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



        const option: CategoryOption =

          {

            id:

              createdCategory.id,



            name:

              createdCategory.name,



            active:

              Boolean(

                createdCategory.active,

              ),



            status:

              createdCategory.status as CategoryOption["status"],



            created_by:

              createdCategory.created_by,

          };



        /*

         * New category dropdown mein add.

         */

        setCategoryOptions(

          (

            current,

          ) =>

            [

              ...current,

              option,

            ].sort(

              (

                first,

                second,

              ) =>

                first.name.localeCompare(

                  second.name,

                ),

            ),

        );



        /*

         * Automatically select new category.

         */

        setSelectedCategory(

          option.name,

        );



        setNewCategory("");



        setShowNewCategory(

          false,

        );



        toast.success(

          "Category request submit ho gayi. Admin approval pending hai.",

        );

      } catch (error) {

        console.error(

          "Unable to add category",

          error,

        );



        toast.error(

          error instanceof Error

            ? error.message

            : "Category add nahi ho saki.",

        );

      } finally {

        setCategorySaving(

          false,

        );

      }

    };



  /*

   * ------------------------------------------------

   * IMAGE

   * ------------------------------------------------

   */

  const handleImageChange = (

    file:

      | File

      | undefined,

  ) => {

    if (!file) {

      return;

    }



    if (

      !file.type.startsWith(

        "image/",

      )

    ) {

      toast.error(

        "Sirf image file upload karein.",

      );



      return;

    }



    if (

      file.size >

      5 * 1024 * 1024

    ) {

      toast.error(

        "Image 5 MB se chhoti honi chahiye.",

      );



      return;

    }



    setImageFile(file);



    setImagePreview(

      URL.createObjectURL(

        file,

      ),

    );

  };



  /*

   * ------------------------------------------------

   * IMAGE UPLOAD

   * ------------------------------------------------

   */

  const uploadImage =

    async (

      userId: string,

    ) => {

      if (!imageFile) {

        return (

          product?.image ??

          null

        );

      }



      const extension =

        imageFile.name

          .split(".")

          .pop()

          ?.toLowerCase() ||

        "jpg";



      const filePath =

        `${userId}/${randomUuidLike()}.${extension}`;



      const {

        error,

      } =

        await supabase.storage

          .from(

            "product-images",

          )

          .upload(

            filePath,

            imageFile,

            {

              cacheControl:

                "3600",



              contentType:

                imageFile.type,



              upsert:

                false,

            },

          );



      if (error) {

        throw error;

      }



      return supabase.storage

        .from(

          "product-images",

        )

        .getPublicUrl(

          filePath,

        ).data.publicUrl;

    };



  /*

   * ------------------------------------------------

   * SAVE PRODUCT

   * ------------------------------------------------

   */

  const handleSubmit =

    async (

      event: FormEvent<HTMLFormElement>,

    ) => {

      event.preventDefault();



      if (

        !selectedCategory

      ) {

        toast.error(

          "Product category select karein.",

        );



        return;

      }



      setSaving(true);



      try {

        const formData =

          new FormData(

            event.currentTarget,

          );



        /*

         * Logged user

         */

        const {

          data: authData,

          error:

            authError,

        } =

          await supabase.auth.getUser();



        if (

          authError ||

          !authData.user

        ) {

          throw new Error(

            "Product save karne ke liye login zaroori hai.",

          );

        }



        /*

         * Vendor / Partner store resolve karo

         */

        let vendorId: string;



        if (actorType === "partner") {

          const {

            data: profile,

            error: profileError,

          } = await supabase

            .from("users")

            .select("role, status, vendor_id")

            .eq("auth_id", authData.user.id)

            .maybeSingle();



          if (profileError) {

            throw profileError;

          }



          if (

            !profile ||

            profile.role !== "partner" ||

            profile.status !== "Active"

          ) {

            throw new Error(

              "Aapka partner account active nahi hai.",

            );

          }



          if (!profile.vendor_id) {

            throw new Error(

              "Aapko abhi kisi Vendor ke saath assign nahi kiya gaya.",

            );

          }



          vendorId = profile.vendor_id;

        } else {

          const {

            data: vendor,

            error: vendorError,

          } = await supabase

            .from("vendors")

            .select("id")

            .eq("owner_id", authData.user.id)

            .maybeSingle();



          if (vendorError) {

            throw vendorError;

          }



          if (!vendor) {

            throw new Error(

              "Aapka vendor account nahi mila.",

            );

          }



          vendorId = vendor.id;

        }



        /*

         * Image upload

         */

        const image =

          await uploadImage(

            authData.user.id,

          );



        const comparePriceValue =

          String(

            formData.get(

              "comparePrice",

            ) ?? "",

          ).trim();



        /*

         * Product payload

         */

        const payload = {

          name:

            String(

              formData.get(

                "name",

              ) ?? "",

            ).trim(),



          category:

            selectedCategory,



          brand:

            String(

              formData.get(

                "brand",

              ) ?? "",

            ).trim() ||

            null,



          description:

            String(

              formData.get(

                "description",

              ) ?? "",

            ).trim() ||

            null,



          price:

            Number(

              formData.get(

                "price",

              ),

            ),



          compare_price:

            comparePriceValue

              ? Number(

                  comparePriceValue,

                )

              : null,



          stock:

            Number(

              formData.get(

                "stock",

              ),

            ),



          active:

            mode ===

            "create"

              ? false

              : active,



          image,

        };



        /*

         * EDIT PRODUCT

         */

        if (

          mode === "edit" &&

          product

        ) {

          const {

            data:

              updatedProduct,

            error,

          } = await supabase

            .from(

              "products",

            )

            .update(

              payload,

            )

            .eq(

              "id",

              product.id,

            )

            .eq(

              "vendor_id",

              vendorId,

            )

            .select("id")

            .maybeSingle();



          if (error) {

            throw error;

          }



          if (

            !updatedProduct

          ) {

            throw new Error(

              "Product update nahi ho saka ya aapko is product ki permission nahi hai.",

            );

          }



          toast.success(

            "Product update ho gaya.",

          );

        } else {

          /*

           * CREATE PRODUCT

           */

          const {

            error,

          } = await supabase

            .from(

              "products",

            )

            .insert({

              id: `PRD-${randomUuidLike()}`,



              vendor_id:

                vendorId,



              created_by:

                authData.user.id,



              ...payload,

            });



          if (error) {

            throw error;

          }



          toast.success(

            "Product submit ho gaya. Admin approval ke baad website par show hoga.",

          );

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

        console.error(

          "Unable to save product",

          error,

        );



        toast.error(

          error instanceof Error

            ? error.message

            : "Product save nahi ho saka. Please dobara try karein.",

        );

      } finally {

        setSaving(false);

      }

    };



  return (

    <form

      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"

      onSubmit={

        handleSubmit

      }

    >

      <div className="space-y-6">

        {/* Basic Information */}



        <section className="surface-card p-5">

          <h2 className="font-bold">

            Basic Information

          </h2>



          <div className="mt-4 grid gap-4 sm:grid-cols-2">

            {/* Product Name */}



            <div className="space-y-1.5 sm:col-span-2">

              <Label htmlFor="pname">

                Product Name *

              </Label>



              <Input

                id="pname"

                name="name"

                required

                defaultValue={

                  product?.name

                }

                placeholder="e.g. TWS Bluetooth Earbuds"

                className="rounded-xl"

              />

            </div>



            {/* CATEGORY */}



            <div className="space-y-2">

              <Label htmlFor="pcat">

                Category *

              </Label>



              <Select

                value={

                  selectedCategory

                }

                onValueChange={

                  setSelectedCategory

                }

                disabled={

                  categoriesLoading

                }

              >

                <SelectTrigger

                  id="pcat"

                  className="rounded-xl"

                >

                  <SelectValue

                    placeholder={

                      categoriesLoading

                        ? "Loading categories..."

                        : "Select category"

                    }

                  />

                </SelectTrigger>



                <SelectContent>

                  {categoryOptions.map(

                    (

                      category,

                    ) => (

                      <SelectItem

                        key={

                          category.id

                        }

                        value={

                          category.name

                        }

                      >

                        {

                          category.name

                        }



                        {category.status ===

                          "pending" &&

                          " — Pending"}

                      </SelectItem>

                    ),

                  )}

                </SelectContent>

              </Select>



              {/* ADD NEW CATEGORY BUTTON */}



              {actorType === "vendor" && !showNewCategory && (

                <Button

                  type="button"

                  variant="outline"

                  size="sm"

                  className="w-full rounded-xl"

                  onClick={() =>

                    setShowNewCategory(

                      true,

                    )

                  }

                >

                  <Plus className="mr-2 h-4 w-4" />



                  Add New Category

                </Button>

              )}



              {/* NEW CATEGORY BOX */}



              {actorType === "vendor" && showNewCategory && (

                <div className="rounded-xl border border-border bg-muted/30 p-3">

                  <div className="flex items-center justify-between gap-2">

                    <p className="text-sm font-semibold">

                      New Category

                    </p>



                    <Button

                      type="button"

                      variant="ghost"

                      size="icon"

                      className="h-7 w-7"

                      onClick={() => {

                        setShowNewCategory(

                          false,

                        );



                        setNewCategory(

                          "",

                        );

                      }}

                    >

                      <X className="h-4 w-4" />

                    </Button>

                  </div>



                  <Input

                    className="mt-3 rounded-xl"

                    placeholder="e.g. Pet Supplies"

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

                  />



                  <p className="mt-2 text-xs text-muted-foreground">

                    New category admin approval ke liye submit hogi.

                    Aap is category ko apne pending product ke liye use kar sakte hain.

                  </p>



                  <Button

                    type="button"

                    size="sm"

                    className="mt-3 w-full rounded-xl"

                    disabled={

                      categorySaving

                    }

                    onClick={() =>

                      void handleAddCategory()

                    }

                  >

                    {categorySaving && (

                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />

                    )}



                    {categorySaving

                      ? "Adding..."

                      : "Add Category"}

                  </Button>

                </div>

              )}

            </div>



            {/* Brand */}



            <div className="space-y-1.5">

              <Label htmlFor="pbrand">

                Brand

              </Label>



              <Input

                id="pbrand"

                name="brand"

                placeholder="Optional"

                className="rounded-xl"

              />

            </div>



            {/* Description */}



            <div className="space-y-1.5 sm:col-span-2">

              <Label htmlFor="pdesc">

                Description

              </Label>



              <Textarea

                id="pdesc"

                name="description"

                rows={5}

                defaultValue={

                  product?.description

                }

                className="rounded-xl"

              />

            </div>

          </div>

        </section>



        {/* Pricing & Stock */}



        <section className="surface-card p-5">

          <h2 className="font-bold">

            Pricing & Stock

          </h2>



          <div className="mt-4 grid gap-4 sm:grid-cols-3">

            <div className="space-y-1.5">

              <Label htmlFor="pprice">

                Price (PKR) *

              </Label>



              <Input

                id="pprice"

                name="price"

                type="number"

                min="0"

                required

                defaultValue={

                  product?.price

                }

                className="rounded-xl"

              />

            </div>



            <div className="space-y-1.5">

              <Label htmlFor="pold">

                Compare Price

              </Label>



              <Input

                id="pold"

                name="comparePrice"

                type="number"

                min="0"

                defaultValue={

                  product?.oldPrice

                }

                className="rounded-xl"

              />

            </div>



            <div className="space-y-1.5">

              <Label htmlFor="pstock">

                Stock Qty *

              </Label>



              <Input

                id="pstock"

                name="stock"

                type="number"

                min="0"

                required

                defaultValue={

                  product?.stock

                }

                className="rounded-xl"

              />

            </div>

          </div>

        </section>

      </div>



      {/* Sidebar */}



      <aside className="space-y-6">

        {/* Image */}



        <section className="surface-card p-5">

          <h2 className="font-bold">

            Product Image

          </h2>



          <div className="mt-4 grid aspect-square place-items-center rounded-2xl border-2 border-dashed border-border bg-muted/50 text-center">

            {imagePreview ? (

              <img

                src={

                  imagePreview

                }

                alt="Product preview"

                width={800}

                height={800}

                className="h-full w-full rounded-2xl object-cover"

              />

            ) : (

              <div className="p-6">

                <Upload className="mx-auto h-6 w-6 text-muted-foreground" />



                <p className="mt-2 text-xs text-muted-foreground">

                  Drag & drop ya click karke image upload karein

                </p>

              </div>

            )}

          </div>



          <input

            ref={

              fileInputRef

            }

            type="file"

            accept="image/*"

            className="sr-only"

            onChange={(

              event,

            ) =>

              handleImageChange(

                event.target

                  .files?.[0],

              )

            }

          />



          <Button

            type="button"

            variant="outline"

            className="mt-3 w-full rounded-xl"

            onClick={() =>

              fileInputRef.current?.click()

            }

          >

            Choose Image

          </Button>

        </section>



        {/* Status */}



        {showStatus &&

          mode ===

            "edit" && (

            <section className="surface-card p-5">

              <h2 className="font-bold">

                Status

              </h2>



              <div className="mt-4 flex items-center justify-between">

                <div>

                  <p className="text-sm font-medium">

                    Active

                  </p>



                  <p className="text-xs text-muted-foreground">

                    Website par visible

                  </p>

                </div>



                <Switch

                  checked={

                    active

                  }

                  onCheckedChange={

                    setActive

                  }

                />

              </div>

            </section>

          )}



        {/* Approval Warning */}



        {mode ===

          "create" && (

          <section className="surface-card border-warning/40 bg-warning/10 p-4">

            <p className="text-sm font-semibold">

              Admin approval required

            </p>



            <p className="mt-1 text-xs text-muted-foreground">

              Product pehle review ke liye submit hoga.

              Agar aapne new category banayi hai to wo bhi admin approval ke liye jayegi.

            </p>

          </section>

        )}



        {/* Submit */}



        <div className="flex gap-3">

          <Button

            type="submit"

            className="flex-1 rounded-xl"

            disabled={

              saving ||

              categorySaving

            }

          >

            {saving && (

              <Loader2 className="mr-2 h-4 w-4 animate-spin" />

            )}



            {mode ===

            "create"

              ? "Add Product"

              : "Save Changes"}

          </Button>

        </div>

      </aside>

    </form>

  );

}