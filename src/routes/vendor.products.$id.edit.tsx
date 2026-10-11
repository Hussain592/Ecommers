import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ProductForm } from "@/components/dashboard/ProductForm";
import { vendorNav } from "@/components/dashboard/nav-config";
import { Button } from "@/components/ui/button";
import { type Product } from "@/data/mock";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/vendor/products/$id/edit")({
  head: () => ({
    meta: [
      { title: "azadari.store" },
      { name: "description", content: "Update product details, price, stock and availability." },
      { property: "og:title", content: "Edit Product â€” Dukaan.pk" },
      { property: "og:description", content: "Edit your Dukaan.pk product listing." },
    ],
  }),
  component: EditProduct,
});

function EditProduct() {
  const { id } = Route.useParams();
  const [product, setProduct] = useState<Product>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadProduct = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, image, images, price, compare_price, stock, category, brand, active")
        .eq("id", id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error("Unable to load product for editing", error);
        setProduct(undefined);
      } else if (data) {
        setProduct({
          id: data.id,
          name: data.name,
          slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
          category: data.category ?? "Uncategorized",
          price: Number(data.price),
          oldPrice: data.compare_price ? Number(data.compare_price) : undefined,
          stock: data.stock,
          active: data.active ?? true,
          vendor: data.brand ?? "Your Store",
          city: "",
          rating: 0,
          reviews: 0,
          image: data.image || "/favicon.ico",
          images: Array.isArray(data.images)
            ? data.images.filter(
                (image): image is string =>
                  typeof image === "string" && image.length > 0,
              )
            : data.image
              ? [data.image]
              : [],
          description: data.description ?? "",
        });
      } else {
        setProduct(undefined);
      }

      setLoading(false);
    };

    void loadProduct();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <DashboardShell
      brand="Al-Madina Traders"
      role="Vendor Account"
      title="Edit Product"
      subtitle={loading ? "Product load ho raha hai..." : product ? product.name : "Product not found"}
      nav={vendorNav}
    >
      {loading ? (
        <div className="surface-card p-10 text-center text-sm text-muted-foreground">Product load ho raha hai...</div>
      ) : product ? (
        <ProductForm mode="edit" product={product} />
      ) : (
        <div className="surface-card p-10 text-center">
          <p className="text-sm text-muted-foreground">Ye product mojood nahi hai.</p>
          <Button asChild className="mt-4 rounded-xl">
            <Link to="/vendor/products">Back to products</Link>
          </Button>
        </div>
      )}
    </DashboardShell>
  );
}
