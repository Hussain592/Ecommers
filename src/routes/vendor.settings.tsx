import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { vendorNav } from "@/components/dashboard/nav-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";

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
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [vendor, setVendor] = useState({ name: "", contact: "", email: "", address: "", description: "" });
  const [ownerName, setOwnerName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadVendor = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;
      const { data: profile } = await supabase.from("users").select("name").eq("auth_id", authData.user.id).maybeSingle();
      setOwnerName(profile?.name ?? "");
      const { data } = await supabase.from("vendors").select("id, name, contact, email, address, description").eq("owner_id", authData.user.id).maybeSingle();
      if (!data) return;
      setVendorId(data.id);
      setVendor({ name: data.name ?? "", contact: data.contact ?? "", email: data.email ?? "", address: data.address ?? "", description: data.description ?? "" });
    };
    void loadVendor();
  }, []);

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
        onSubmit={async (e) => {
          e.preventDefault();
          if (!vendorId) { toast.error("Vendor profile load nahi hua."); return; }
          setSaving(true);
          const { data: authData } = await supabase.auth.getUser();
          const { error } = await supabase.from("vendors").update(vendor).eq("id", vendorId);
          if (!error && authData.user) await supabase.from("users").update({ name: ownerName }).eq("auth_id", authData.user.id);
          setSaving(false);
          if (error) toast.error(error.message); else toast.success("Settings Supabase mein save ho gayi.");
        }}
      >
        <section className="surface-card p-5">
          <h2 className="font-bold">Store Profile</h2>
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="sn">Store Name</Label>
              <Input id="sn" value={vendor.name} onChange={(e) => setVendor((v) => ({ ...v, name: e.target.value }))} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="so">Owner Name</Label>
              <Input id="so" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sd">Store Description</Label>
              <Textarea id="sd" rows={4} value={vendor.description} onChange={(e) => setVendor((v) => ({ ...v, description: e.target.value }))} className="rounded-xl" />
            </div>
          </div>
        </section>

        <section className="surface-card p-5">
          <h2 className="font-bold">Contact & Pickup</h2>
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="sp">Phone</Label>
              <Input id="sp" value={vendor.contact} onChange={(e) => setVendor((v) => ({ ...v, contact: e.target.value }))} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="se">Email</Label>
              <Input id="se" type="email" value={vendor.email} onChange={(e) => setVendor((v) => ({ ...v, email: e.target.value }))} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sa">Pickup Address</Label>
              <Textarea id="sa" rows={3} value={vendor.address} onChange={(e) => setVendor((v) => ({ ...v, address: e.target.value }))} className="rounded-xl" />
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
          <Button type="submit" disabled={saving} className="mt-6 rounded-xl">{saving ? "Saving..." : "Save Changes"}</Button>
        </section>
      </form>
    </DashboardShell>
  );
}
