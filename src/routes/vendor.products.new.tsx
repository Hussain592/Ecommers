import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ProductForm } from "@/components/dashboard/ProductForm";
import { vendorNav } from "@/components/dashboard/nav-config";

export const Route = createFileRoute("/vendor/products/new")({
  head: () => ({
    meta: [
      { title: "Add Product — Vendor Dashboard | Dukaan.pk" },
      { name: "description", content: "Add a new product to your Dukaan.pk store catalog." },
      { property: "og:title", content: "Add Product — Dukaan.pk" },
      { property: "og:description", content: "List a new product for Cash on Delivery orders." },
    ],
  }),
  component: AddProduct,
});

function AddProduct() {
  return (
    <DashboardShell
      brand="Al-Madina Traders"
      role="Vendor Account"
      title="Add Product"
      subtitle="Naya product apne catalog mein shamil karein"
      nav={vendorNav}
    >
      <ProductForm mode="create" />
    </DashboardShell>
  );
}