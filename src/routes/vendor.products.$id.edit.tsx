import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ProductForm } from "@/components/dashboard/ProductForm";
import { vendorNav } from "@/components/dashboard/nav-config";
import { Button } from "@/components/ui/button";
import { products } from "@/data/mock";

export const Route = createFileRoute("/vendor/products/$id/edit")({
  head: () => ({
    meta: [
      { title: "Edit Product — Vendor Dashboard | Dukaan.pk" },
      { name: "description", content: "Update product details, price, stock and availability." },
      { property: "og:title", content: "Edit Product — Dukaan.pk" },
      { property: "og:description", content: "Edit your Dukaan.pk product listing." },
    ],
  }),
  component: EditProduct,
});

function EditProduct() {
  const { id } = Route.useParams();
  const product = products.find((p) => p.id === id);

  return (
    <DashboardShell
      brand="Al-Madina Traders"
      role="Vendor Account"
      title="Edit Product"
      subtitle={product ? product.name : "Product not found"}
      nav={vendorNav}
    >
      {product ? (
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