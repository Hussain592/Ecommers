import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ProductForm } from "@/components/dashboard/ProductForm";
import { partnerNav } from "@/components/dashboard/nav-config";
import { useAccountName } from "@/lib/use-account-name";

export const Route = createFileRoute("/partner/add-product")({
  head: () => ({
    meta: [
      { title: "azadari.store" },
      {
        name: "description",
        content: "Submit a new product listing for review on azadari.store.",
      },
      { property: "og:title", content: "Add Product — Partner | azadari.store" },
      { property: "og:description", content: "Partner product submission form." },
    ],
  }),
  component: PartnerAddProduct,
});

function PartnerAddProduct() {
  const partnerName = useAccountName("Partner");

  return (
    <DashboardShell
      brand={partnerName}
      role="Partner Account"
      title="Add Product"
      subtitle="The admin reviews every new product before it goes live"
      nav={partnerNav}
    >
      <ProductForm mode="create" showStatus={false} actorType="partner" />
    </DashboardShell>
  );
}
