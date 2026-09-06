import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { adminNav } from "@/components/dashboard/nav-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Platform Settings — Dukaan.pk Admin" },
      { name: "description", content: "Configure marketplace-wide settings, delivery charges and policies." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Platform Settings — Dukaan.pk Admin" },
      { property: "og:description", content: "Marketplace configuration." },
    ],
  }),
  component: AdminSettings,
});

const DEFAULTS = {
  platform_name: "Dukaan.pk",
  support_helpline: "0311-DUKAAN",
  announcement_bar: "Cash on Delivery all over Pakistan · Free delivery above Rs. 3,000",
  delivery_charges: 250,
  free_delivery_threshold: 3000,
  return_window: 7,
  cod_only: true,
  guest_checkout: true,
  auto_approve_vendors: false,
};

type SettingsShape = typeof DEFAULTS;

function AdminSettings() {
  const [settings, setSettings] = useState<SettingsShape>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [codOnly, setCodOnly] = useState(DEFAULTS.cod_only);
  const [guestCheckout, setGuestCheckout] = useState(DEFAULTS.guest_checkout);
  const [autoApproveVendors, setAutoApproveVendors] = useState(DEFAULTS.auto_approve_vendors);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.from("platform_settings").select("key, value");
      if (error) {
        console.error(error);
        toast.error("Settings load nahi ho sakin, defaults dikha rahe hain.");
        setLoading(false);
        return;
      }

      const loaded = { ...DEFAULTS };
      (data ?? []).forEach((row) => {
        if (row.key in loaded) {
          (loaded as Record<string, unknown>)[row.key] = row.value;
        }
      });
      setSettings(loaded);
      setCodOnly(loaded.cod_only);
      setGuestCheckout(loaded.guest_checkout);
      setAutoApproveVendors(loaded.auto_approve_vendors);
      setLoading(false);
    };
    void load();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    const updated: SettingsShape = {
      platform_name: String(formData.get("platform_name") ?? ""),
      support_helpline: String(formData.get("support_helpline") ?? ""),
      announcement_bar: String(formData.get("announcement_bar") ?? ""),
      delivery_charges: Number(formData.get("delivery_charges") ?? 0),
      free_delivery_threshold: Number(formData.get("free_delivery_threshold") ?? 0),
      return_window: Number(formData.get("return_window") ?? 0),
      cod_only: codOnly,
      guest_checkout: guestCheckout,
      auto_approve_vendors: autoApproveVendors,
    };

    const rows = Object.entries(updated).map(([key, value]) => ({ key, value }));
    const { error } = await supabase.from("platform_settings").upsert(rows, { onConflict: "key" });

    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setSettings(updated);
    toast.success("Settings save ho gayi.");
  };

  if (loading) {
    return (
      <DashboardShell brand="Dukaan.pk" role="Owner / Admin" title="Settings" subtitle="Platform configuration" nav={adminNav}>
        <div className="flex justify-center p-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell brand="Dukaan.pk" role="Owner / Admin" title="Settings" subtitle="Platform configuration" nav={adminNav}>
      <form className="grid gap-6 lg:grid-cols-2" onSubmit={handleSubmit}>
        <section className="surface-card p-5">
          <h2 className="font-bold">Marketplace</h2>
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pn">Platform Name</Label>
              <Input id="pn" name="platform_name" defaultValue={settings.platform_name} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sh">Support Helpline</Label>
              <Input id="sh" name="support_helpline" defaultValue={settings.support_helpline} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="an">Announcement Bar</Label>
              <Textarea id="an" name="announcement_bar" rows={3} defaultValue={settings.announcement_bar} className="rounded-xl" />
            </div>
          </div>
        </section>

        <section className="surface-card p-5">
          <h2 className="font-bold">Delivery & Orders</h2>
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="dc">Delivery Charges (PKR)</Label>
              <Input id="dc" name="delivery_charges" type="number" defaultValue={settings.delivery_charges} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ft">Free Delivery Threshold (PKR)</Label>
              <Input id="ft" name="free_delivery_threshold" type="number" defaultValue={settings.free_delivery_threshold} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rw">Return Window (days)</Label>
              <Input id="rw" name="return_window" type="number" defaultValue={settings.return_window} className="rounded-xl" />
            </div>
          </div>
        </section>

        <section className="surface-card p-5 lg:col-span-2">
          <h2 className="font-bold">Platform Controls</h2>
          <div className="mt-4 space-y-4">
            {(
              [
                ["cod_only", "Cash on Delivery only", "Online payments disabled rakhein", codOnly, setCodOnly] as const,
                ["guest_checkout", "Guest checkout", "Bina account order allow karein", guestCheckout, setGuestCheckout] as const,
                ["auto_approve_vendors", "Auto-approve new vendors", "Naye vendors ko manual review ke baghair activate karein", autoApproveVendors, setAutoApproveVendors] as const,
              ]
            ).map(([name, t, d, checked, setChecked], i, arr) => (
              <div key={name}>
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{t}</p>
                    <p className="text-xs text-muted-foreground">{d}</p>
                  </div>
                  <Switch checked={checked} onCheckedChange={setChecked} />
                </div>
                {i < arr.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
          <Button type="submit" className="mt-6 rounded-xl" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
        </section>
      </form>
    </DashboardShell>
  );
}