import { createFileRoute } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { vendorNav } from "@/components/dashboard/nav-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { partnersList } from "@/data/mock";

export const Route = createFileRoute("/vendor/partners")({
  head: () => ({
    meta: [
      { title: "Partners — Vendor Dashboard | Dukaan.pk" },
      { name: "description", content: "Invite and manage the partners who list products for your store." },
      { property: "og:title", content: "Vendor Partners — Dukaan.pk" },
      { property: "og:description", content: "Manage partner access to your store catalog." },
    ],
  }),
  component: VendorPartners,
});

function VendorPartners() {
  return (
    <DashboardShell
      brand="Al-Madina Traders"
      role="Vendor Account"
      title="Partners"
      subtitle="Aapke store se juray hue partners"
      nav={vendorNav}
      actions={
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl">
              <UserPlus className="mr-2 h-4 w-4" /> Invite Partner
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite a Partner</DialogTitle>
              <DialogDescription>Partner ko product listing ka limited access milega.</DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                toast.success("Invite bhej diya gaya (demo)");
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="pn">Partner Name</Label>
                <Input id="pn" required placeholder="Zeeshan Ali" className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pp">Phone</Label>
                <Input id="pp" required placeholder="03XX-XXXXXXX" className="rounded-xl" />
              </div>
              <Button type="submit" className="w-full rounded-xl">Send Invite</Button>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {partnersList.map((p) => (
          <div key={p.id} className="surface-card p-5">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">{p.name}</p>
                <p className="truncate text-xs text-muted-foreground">{p.phone} · {p.city}</p>
              </div>
              <StatusBadge status={p.status} />
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-muted/60 p-3 text-sm">
              <span className="text-muted-foreground">Products listed</span>
              <span className="font-display font-bold">{p.products}</span>
            </div>
            <Button variant="outline" className="mt-4 w-full rounded-xl" onClick={() => toast("Partner profile (demo)")}>
              View Profile
            </Button>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}