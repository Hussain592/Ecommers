import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { adminNav } from "@/components/dashboard/nav-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/profile")({
  head: () => ({ meta: [{ title: "My Profile - Dukaan.pk Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminProfile,
});

type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  address: string | null;
};

function AdminProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("id, name, email, phone, city, address")
        .eq("auth_id", authData.user.id)
        .maybeSingle();

      if (error) toast.error("Profile load nahi ho saka.");
      setProfile(data);
      setLoading(false);
    };

    void loadProfile();
  }, []);

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile) return;

    const formData = new FormData(event.currentTarget);
    const updated = {
      name: String(formData.get("name") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      city: String(formData.get("city") ?? "").trim(),
      address: String(formData.get("address") ?? "").trim(),
    };

    setSaving(true);
    const { data, error } = await supabase.from("users").update(updated).eq("id", profile.id).select().maybeSingle();
    setSaving(false);

    if (error || !data) {
      toast.error("Profile save nahi ho saka.");
      return;
    }

    setProfile(data);
    toast.success("Profile save ho gaya.");
  };

  if (loading) {
    return <DashboardShell brand="Dukaan.pk" role="Owner / Admin" title="My Profile" nav={adminNav}><div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div></DashboardShell>;
  }

  if (!profile) {
    return <DashboardShell brand="Dukaan.pk" role="Owner / Admin" title="My Profile" nav={adminNav}><p className="text-sm text-muted-foreground">Profile nahi mila.</p></DashboardShell>;
  }

  const initial = profile.name?.charAt(0).toUpperCase() || "A";

  return (
    <DashboardShell brand="Dukaan.pk" role="Owner / Admin" title="My Profile" subtitle="Apni personal details update karein" nav={adminNav}>
      <form className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]" onSubmit={saveProfile}>
        <section className="surface-card p-5 text-center">
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary-soft font-display text-2xl font-extrabold text-primary">
            {initial}
          </span>
          <UserCircle className="mx-auto mt-4 h-5 w-5 text-muted-foreground" />
          <p className="mt-2 font-bold">{profile.name || "Admin"}</p>
          <p className="text-xs text-muted-foreground">Administrator</p>
        </section>

        <section className="surface-card p-5">
          <h2 className="font-bold">Personal Details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="name">Full Name</Label><Input id="name" name="name" defaultValue={profile.name ?? ""} className="rounded-xl" /></div>
            <div className="space-y-1.5"><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" defaultValue={profile.phone ?? ""} className="rounded-xl" /></div>
            <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={profile.email ?? ""} disabled className="rounded-xl" /></div>
            <div className="space-y-1.5"><Label htmlFor="city">City</Label><Input id="city" name="city" defaultValue={profile.city ?? ""} className="rounded-xl" /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="address">Address</Label><Textarea id="address" name="address" rows={3} defaultValue={profile.address ?? ""} className="rounded-xl" /></div>
          </div>
          <Button type="submit" className="mt-6 rounded-xl" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Profile</Button>
        </section>
      </form>
    </DashboardShell>
  );
}
