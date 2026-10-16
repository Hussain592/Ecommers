import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { adminNav } from "@/components/dashboard/nav-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPKR } from "@/data/mock";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "azadari.store" },
      {
        name: "description",
        content: "Configure marketplace-wide settings, delivery charges and policies.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Platform Settings — azadari.store Admin" },
      { property: "og:description", content: "Marketplace configuration." },
    ],
  }),
  component: AdminSettings,
});

const DEFAULTS = {
  platform_name: "azadari.store",
  support_helpline: "",
  announcement_bar: "",
  delivery_charges: 250,
  free_delivery_threshold: 3000,
  return_window: 7,
  guest_checkout: true,
  commission_rate: 8,
  partner_commission_rate: 5,
};

type SettingsShape = typeof DEFAULTS;

function AdminSettings() {
  const [settings, setSettings] = useState<SettingsShape>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [guestCheckout, setGuestCheckout] = useState(DEFAULTS.guest_checkout);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.from("platform_settings").select("key, value");
      if (error) {
        console.error(error);
        toast.error("Couldn't load settings. Showing the defaults.");
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
      setGuestCheckout(loaded.guest_checkout);
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
      guest_checkout: guestCheckout,
      commission_rate: Number(formData.get("commission_rate") ?? 0),
      partner_commission_rate: Number(formData.get("partner_commission_rate") ?? 0),
    };

    for (const [label, rate] of [
      ["Platform commission", updated.commission_rate],
      ["Partner commission", updated.partner_commission_rate],
    ] as const) {
      if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
        setSaving(false);
        toast.error(`${label} must be between 0 and 100%.`);
        return;
      }
    }

    const rows = Object.entries(updated).map(([key, value]) => ({ key, value }));
    const { error } = await supabase.from("platform_settings").upsert(rows, { onConflict: "key" });

    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setSettings(updated);
    toast.success("Settings saved.");
  };

  if (loading) {
    return (
      <DashboardShell
        brand="azadari.store"
        role="Owner / Admin"
        title="Settings"
        subtitle="Platform configuration"
        nav={adminNav}
      >
        <div className="flex justify-center p-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      brand="azadari.store"
      role="Owner / Admin"
      title="Settings"
      subtitle="Platform configuration"
      nav={adminNav}
    >
      <form className="grid gap-6 lg:grid-cols-2" onSubmit={handleSubmit}>
        <section className="surface-card p-5">
          <h2 className="font-bold">Marketplace</h2>
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pn">Platform Name</Label>
              <Input
                id="pn"
                name="platform_name"
                defaultValue={settings.platform_name}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sh">Support Helpline</Label>
              <Input
                id="sh"
                name="support_helpline"
                defaultValue={settings.support_helpline}
                placeholder="0300-1234567"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="an">Announcement Bar</Label>
              <Textarea
                id="an"
                name="announcement_bar"
                rows={3}
                maxLength={160}
                defaultValue={settings.announcement_bar}
                placeholder="Leave empty to show COD and free delivery info automatically"
                aria-describedby="an-help"
                className="rounded-xl"
              />
              <p id="an-help" className="text-xs text-muted-foreground">
                Shown in the thin bar at the top of every store page.
              </p>
            </div>
          </div>
        </section>

        <section className="surface-card p-5">
          <h2 className="font-bold">Delivery & Orders</h2>
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="dc">Delivery Charges (PKR)</Label>
              <Input
                id="dc"
                name="delivery_charges"
                type="number"
                defaultValue={settings.delivery_charges}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ft">Free Delivery Threshold (PKR)</Label>
              <Input
                id="ft"
                name="free_delivery_threshold"
                type="number"
                defaultValue={settings.free_delivery_threshold}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rw">Return Window (days)</Label>
              <Input
                id="rw"
                name="return_window"
                type="number"
                defaultValue={settings.return_window}
                className="rounded-xl"
              />
            </div>
          </div>
        </section>

        <section className="surface-card p-5 lg:col-span-2">
          <h2 className="font-bold">Commissions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Applied when an order is marked Delivered. A change affects new deliveries only.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cr">Platform commission (%)</Label>
              <Input
                id="cr"
                name="commission_rate"
                type="number"
                min={0}
                max={100}
                step="0.5"
                required
                defaultValue={settings.commission_rate}
                aria-describedby="cr-help"
                className="rounded-xl"
              />
              <p id="cr-help" className="text-xs text-muted-foreground">
                azadari.store keeps this share of each order (delivery fee excluded).
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pcr">Partner commission (%)</Label>
              <Input
                id="pcr"
                name="partner_commission_rate"
                type="number"
                min={0}
                max={100}
                step="0.5"
                required
                defaultValue={settings.partner_commission_rate}
                aria-describedby="pcr-help"
                className="rounded-xl"
              />
              <p id="pcr-help" className="text-xs text-muted-foreground">
                A partner earns this share of each product they added. It is deducted from the
                vendor&apos;s payout. Set 0 to turn partner commission off.
              </p>
            </div>
          </div>
          <p className="mt-4 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
            Example: a Rs. 1,000 partner-added product is delivered. azadari.store keeps{" "}
            {formatPKR((1000 * settings.commission_rate) / 100)}, the partner earns{" "}
            {formatPKR((1000 * settings.partner_commission_rate) / 100)} and the vendor receives{" "}
            {formatPKR(
              1000 -
                (1000 * settings.commission_rate) / 100 -
                (1000 * settings.partner_commission_rate) / 100,
            )}
            .
          </p>
        </section>

        <section className="surface-card p-5 lg:col-span-2">
          <h2 className="font-bold">Platform Controls</h2>
          <div className="mt-4 space-y-4">
            {[
              [
                "guest_checkout",
                "Guest checkout",
                "Let customers order without an account. When off, customers must sign in at checkout.",
                guestCheckout,
                setGuestCheckout,
              ] as const,
            ].map(([name, t, d, checked, setChecked], i, arr) => (
              <div key={name}>
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{t}</p>
                    <p className="text-xs text-muted-foreground">{d}</p>
                  </div>
                  <Switch checked={checked} onCheckedChange={setChecked} aria-label={t} />
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
