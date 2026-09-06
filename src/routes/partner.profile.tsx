import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { partnerNav } from "@/components/dashboard/nav-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";

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

type ProfileRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  address: string | null;
};

function PartnerProfile() {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("id, name, phone, email, city, address")
        .eq("auth_id", authData.user.id)
        .maybeSingle();

      if (error) {
        console.error(error);
        toast.error("Profile load nahi ho saka.");
        setLoading(false);
        return;
      }

      setProfile(data);
      setLoading(false);
    };
    void load();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) return;

    const formData = new FormData(e.currentTarget);
    const updated = {
      name: String(formData.get("name") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      city: String(formData.get("city") ?? "").trim(),
      address: String(formData.get("address") ?? "").trim(),
    };

    setSaving(true);
    const { data, error } = await supabase.from("users").update(updated).eq("id", profile.id).select();
    setSaving(false);

    if (error || !data || data.length === 0) {
      toast.error("Profile save nahi ho saka.");
      return;
    }

    toast.success("Profile save ho gaya.");
    setProfile((prev) => (prev ? { ...prev, ...updated } : prev));
  };

  if (loading) {
    return (
      <DashboardShell brand="Partner" role="Partner Account" title="Profile" subtitle="Apni maloomat update karein" nav={partnerNav}>
        <div className="flex justify-center p-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardShell>
    );
  }

  if (!profile) {
    return (
      <DashboardShell brand="Partner" role="Partner Account" title="Profile" subtitle="Apni maloomat update karein" nav={partnerNav}>
        <p className="text-sm text-muted-foreground">Profile nahi mila.</p>
      </DashboardShell>
    );
  }

  const initial = profile.name?.charAt(0).toUpperCase() || "P";

  return (
    <DashboardShell
      brand={profile.name}
      role="Partner Account"
      title="Profile"
      subtitle="Apni maloomat update karein"
      nav={partnerNav}
    >
      <form className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]" onSubmit={handleSubmit}>
        <section className="surface-card p-5 text-center">
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary-soft font-display text-2xl font-extrabold text-primary">
            {initial}
          </span>
          <p className="mt-3 font-bold">{profile.name}</p>
          <p className="text-xs text-muted-foreground">Partner</p>
          <Button type="button" variant="outline" className="mt-4 w-full rounded-xl" disabled>
            Change Photo
          </Button>
        </section>

        <section className="surface-card p-5">
          <h2 className="font-bold">Personal Details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fn">Full Name</Label>
              <Input id="fn" name="name" defaultValue={profile.name} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ph">Phone</Label>
              <Input id="ph" name="phone" defaultValue={profile.phone ?? ""} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="em">Email</Label>
              <Input id="em" type="email" defaultValue={profile.email ?? ""} className="rounded-xl" disabled />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ct">City</Label>
              <Input id="ct" name="city" defaultValue={profile.city ?? ""} className="rounded-xl" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="ad">Address</Label>
              <Textarea id="ad" name="address" rows={3} defaultValue={profile.address ?? ""} className="rounded-xl" />
            </div>
          </div>
          <Button type="submit" className="mt-6 rounded-xl" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Profile
          </Button>
        </section>
      </form>
    </DashboardShell>
  );
}