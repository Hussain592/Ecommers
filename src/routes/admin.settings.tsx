import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { adminNav } from "@/components/dashboard/nav-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

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

function AdminSettings() {
  return (
    <DashboardShell brand="Dukaan.pk" role="Owner / Admin" title="Settings" subtitle="Platform configuration" nav={adminNav}>
      <form
        className="grid gap-6 lg:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          toast.success("Settings save ho gayi (demo)");
        }}
      >
        <section className="surface-card p-5">
          <h2 className="font-bold">Marketplace</h2>
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pn">Platform Name</Label>
              <Input id="pn" defaultValue="Dukaan.pk" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sh">Support Helpline</Label>
              <Input id="sh" defaultValue="0311-DUKAAN" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="an">Announcement Bar</Label>
              <Textarea id="an" rows={3} defaultValue="Cash on Delivery all over Pakistan · Free delivery above Rs. 3,000" className="rounded-xl" />
            </div>
          </div>
        </section>

        <section className="surface-card p-5">
          <h2 className="font-bold">Delivery & Orders</h2>
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="dc">Delivery Charges (PKR)</Label>
              <Input id="dc" type="number" defaultValue={250} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ft">Free Delivery Threshold (PKR)</Label>
              <Input id="ft" type="number" defaultValue={3000} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rw">Return Window (days)</Label>
              <Input id="rw" type="number" defaultValue={7} className="rounded-xl" />
            </div>
          </div>
        </section>

        <section className="surface-card p-5 lg:col-span-2">
          <h2 className="font-bold">Platform Controls</h2>
          <div className="mt-4 space-y-4">
            {[
              ["Cash on Delivery only", "Online payments disabled rakhein"],
              ["Guest checkout", "Bina account order allow karein"],
              ["Auto-approve new vendors", "Naye vendors ko manual review ke baghair activate karein"],
            ].map(([t, d], i) => (
              <div key={t}>
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{t}</p>
                    <p className="text-xs text-muted-foreground">{d}</p>
                  </div>
                  <Switch defaultChecked={i < 2} />
                </div>
                {i < 2 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
          <Button type="submit" className="mt-6 rounded-xl">Save Settings</Button>
        </section>
      </form>
    </DashboardShell>
  );
}