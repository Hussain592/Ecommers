import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { vendorNav } from "@/components/dashboard/nav-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/vendor/settings")({
  head: () => ({
    meta: [
      { title: "Store Settings — Vendor Dashboard | Dukaan.pk" },
      { name: "description", content: "Update your store profile, contact details and order preferences." },
      { property: "og:title", content: "Vendor Settings — Dukaan.pk" },
      { property: "og:description", content: "Configure your Dukaan.pk store." },
    ],
  }),
  component: VendorSettings,
});

function VendorSettings() {
  return (
    <DashboardShell
      brand="Al-Madina Traders"
      role="Vendor Account"
      title="Settings"
      subtitle="Store profile aur preferences"
      nav={vendorNav}
    >
      <form
        className="grid gap-6 lg:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          toast.success("Settings save ho gayi (demo)");
        }}
      >
        <section className="surface-card p-5">
          <h2 className="font-bold">Store Profile</h2>
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="sn">Store Name</Label>
              <Input id="sn" defaultValue="Al-Madina Traders" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="so">Owner Name</Label>
              <Input id="so" defaultValue="Kamran Sheikh" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sd">Store Description</Label>
              <Textarea id="sd" rows={4} defaultValue="Karachi based wholesale & retail seller. COD orders nationwide." className="rounded-xl" />
            </div>
          </div>
        </section>

        <section className="surface-card p-5">
          <h2 className="font-bold">Contact & Pickup</h2>
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="sp">Phone</Label>
              <Input id="sp" defaultValue="0300-1234567" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="se">Email</Label>
              <Input id="se" type="email" defaultValue="store@almadina.pk" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sa">Pickup Address</Label>
              <Textarea id="sa" rows={3} defaultValue="Shop 14, Bolton Market, Karachi" className="rounded-xl" />
            </div>
          </div>
        </section>

        <section className="surface-card p-5 lg:col-span-2">
          <h2 className="font-bold">Order Preferences</h2>
          <div className="mt-4 space-y-4">
            {[
              ["Auto-accept COD orders", "Naye orders khud-ba-khud confirm hon"],
              ["Low stock alerts", "Stock 10 se kam hone par notify karein"],
              ["Allow partner listings", "Partners aapke store par products add kar sakein"],
            ].map(([t, d], i) => (
              <div key={t}>
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{t}</p>
                    <p className="text-xs text-muted-foreground">{d}</p>
                  </div>
                  <Switch defaultChecked={i !== 0} />
                </div>
                {i < 2 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
          <Button type="submit" className="mt-6 rounded-xl">Save Changes</Button>
        </section>
      </form>
    </DashboardShell>
  );
}