import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { partnerNav } from "@/components/dashboard/nav-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/partner/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Partner | Dukaan.pk" },
      { name: "description", content: "Manage your partner profile details on Dukaan.pk." },
      { property: "og:title", content: "Partner Profile — Dukaan.pk" },
      { property: "og:description", content: "Update your contact and personal details." },
    ],
  }),
  component: PartnerProfile,
});

function PartnerProfile() {
  return (
    <DashboardShell
      brand="Zeeshan Ali"
      role="Partner Account"
      title="Profile"
      subtitle="Apni maloomat update karein"
      nav={partnerNav}
    >
      <form
        className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]"
        onSubmit={(e) => {
          e.preventDefault();
          toast.success("Profile save ho gaya (demo)");
        }}
      >
        <section className="surface-card p-5 text-center">
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary-soft font-display text-2xl font-extrabold text-primary">
            Z
          </span>
          <p className="mt-3 font-bold">Zeeshan Ali</p>
          <p className="text-xs text-muted-foreground">Partner · Al-Madina Traders</p>
          <Button type="button" variant="outline" className="mt-4 w-full rounded-xl">Change Photo</Button>
        </section>

        <section className="surface-card p-5">
          <h2 className="font-bold">Personal Details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fn">Full Name</Label>
              <Input id="fn" defaultValue="Zeeshan Ali" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ph">Phone</Label>
              <Input id="ph" defaultValue="0300-7654321" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="em">Email</Label>
              <Input id="em" type="email" defaultValue="zeeshan@dukaan.pk" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ct">City</Label>
              <Input id="ct" defaultValue="Karachi" className="rounded-xl" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="ad">Address</Label>
              <Textarea id="ad" rows={3} defaultValue="Gulshan-e-Iqbal, Block 13, Karachi" className="rounded-xl" />
            </div>
          </div>
          <Button type="submit" className="mt-6 rounded-xl">Save Profile</Button>
        </section>
      </form>
    </DashboardShell>
  );
}