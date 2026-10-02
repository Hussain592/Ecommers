import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ProductForm } from "@/components/dashboard/ProductForm";
import { partnerNav } from "@/components/dashboard/nav-config";

export const Route = createFileRoute("/partner/add-product")({
  head: () => ({
    meta: [
      { title: "azadari.store" },
      { name: "description", content: "Submit a new product listing for vendor approval on Dukaan.pk." },
      { property: "og:title", content: "Add Product â€” Partner | Dukaan.pk" },
      { property: "og:description", content: "Partner product submission form." },
    ],
  }),
  component: PartnerAddProduct,
});

function PartnerAddProduct() {
  return (
    <DashboardShell
      brand="Zeeshan Ali"
      role="Partner Account"
      title="Add Product"
      subtitle="Product submit karein â€” vendor approve karega"
      nav={partnerNav}
    >
      <ProductForm
        mode="create"
        showStatus={false}
        actorType="partner"
      />
    </DashboardShell>
  );
}

