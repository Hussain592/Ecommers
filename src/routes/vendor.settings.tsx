import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import { Bell, CheckCircle2, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { vendorNav } from "@/components/dashboard/nav-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/vendor/settings")({
  head: () => ({
    meta: [
      { title: "azadari.store" },
      {
        name: "description",
        content: "Update your store profile and contact details.",
      },
      { property: "og:title", content: "Vendor Settings — azadari.store" },
      { property: "og:description", content: "Configure your azadari.store store." },
    ],
  }),
  component: VendorSettings,
});

type VendorForm = {
  name: string;
  contact: string;
  email: string;
  address: string;
  description: string;
};

type FieldErrors = Partial<Record<keyof VendorForm | "ownerName", string | undefined>>;

const EMPTY: VendorForm = { name: "", contact: "", email: "", address: "", description: "" };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Field({
  id,
  label,
  hint,
  error,
  required,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string | undefined;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-msg`} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-msg`} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

function VendorSettings() {
  const ids = useId();
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [vendor, setVendor] = useState<VendorForm>(EMPTY);
  const [saved, setSaved] = useState<{ vendor: VendorForm; ownerName: string }>({
    vendor: EMPTY,
    ownerName: "",
  });
  const [ownerName, setOwnerName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    const loadVendor = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        setLoading(false);
        return;
      }
      const [{ data: profile }, { data }] = await Promise.all([
        supabase.from("users").select("name").eq("auth_id", authData.user.id).maybeSingle(),
        supabase
          .from("vendors")
          .select("id, name, contact, email, address, description")
          .eq("owner_id", authData.user.id)
          .maybeSingle(),
      ]);
      const owner = profile?.name ?? "";
      setOwnerName(owner);
      if (data) {
        const loaded = {
          name: data.name ?? "",
          contact: data.contact ?? "",
          email: data.email ?? "",
          address: data.address ?? "",
          description: data.description ?? "",
        };
        setVendorId(data.id);
        setVendor(loaded);
        setSaved({ vendor: loaded, ownerName: owner });
      }
      setLoading(false);
    };
    void loadVendor();
  }, []);

  const dirty =
    ownerName !== saved.ownerName ||
    (Object.keys(vendor) as Array<keyof VendorForm>).some(
      (key) => vendor[key] !== saved.vendor[key],
    );

  const update = (key: keyof VendorForm, value: string) => {
    setVendor((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setJustSaved(false);
  };

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (vendor.name.trim().length < 2) next.name = "Enter a store name (at least 2 characters).";
    if (ownerName.trim().length < 2) next.ownerName = "Enter the owner's name.";
    if (vendor.contact.trim().length < 7) next.contact = "Enter a phone number customers can call.";
    if (vendor.email.trim() && !EMAIL_PATTERN.test(vendor.email.trim()))
      next.email = "Enter a valid email address, like name@example.com.";
    return next;
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!vendorId) {
      toast.error("Couldn't load your store. Refresh the page and try again.");
      return;
    }

    const found = validate();
    setErrors(found);
    const firstError = Object.keys(found).find((key) => found[key as keyof FieldErrors]);
    if (firstError) {
      document.getElementById(`${ids}-${firstError}`)?.focus();
      return;
    }

    setSaving(true);
    const trimmed: VendorForm = {
      name: vendor.name.trim(),
      contact: vendor.contact.trim(),
      email: vendor.email.trim().toLowerCase(),
      address: vendor.address.trim(),
      description: vendor.description.trim(),
    };
    const { data: authData } = await supabase.auth.getUser();
    const { error } = await supabase.from("vendors").update(trimmed).eq("id", vendorId);
    let ownerError = null;
    if (!error && authData.user) {
      ({ error: ownerError } = await supabase
        .from("users")
        .update({ name: ownerName.trim() })
        .eq("auth_id", authData.user.id));
    }
    setSaving(false);

    if (error || ownerError) {
      console.error("Unable to save vendor settings", error ?? ownerError);
      toast.error("Couldn't save your changes. Please try again.");
      return;
    }

    setVendor(trimmed);
    setOwnerName(ownerName.trim());
    setSaved({ vendor: trimmed, ownerName: ownerName.trim() });
    setJustSaved(true);
    toast.success("Store details saved.");
  };

  const inputProps = (key: keyof VendorForm | "ownerName") => ({
    id: `${ids}-${key}`,
    "aria-invalid": Boolean(errors[key]),
    "aria-describedby": `${ids}-${key}-msg`,
    className: "rounded-xl",
  });

  return (
    <DashboardShell
      brand={vendor.name || saved.vendor.name || "My Store"}
      role="Vendor Account"
      title="Settings"
      subtitle="Your store profile and contact details"
      nav={vendorNav}
    >
      {loading ? (
        <div className="flex justify-center p-10" role="status" aria-label="Loading settings">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <form className="grid gap-6 lg:grid-cols-2" onSubmit={submit} noValidate>
          <section className="surface-card p-5">
            <h2 className="font-bold">Store profile</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              This is how customers see your store.
            </p>
            <div className="mt-4 space-y-4">
              <Field
                id={`${ids}-name`}
                label="Store name"
                required
                hint="Shown on your products and store page."
                error={errors.name}
              >
                <Input
                  {...inputProps("name")}
                  value={vendor.name}
                  maxLength={80}
                  onChange={(e) => update("name", e.target.value)}
                />
              </Field>
              <Field
                id={`${ids}-ownerName`}
                label="Owner name"
                required
                hint="Only visible to the azadari.store team."
                error={errors.ownerName}
              >
                <Input
                  {...inputProps("ownerName")}
                  value={ownerName}
                  maxLength={80}
                  onChange={(e) => {
                    setOwnerName(e.target.value);
                    setErrors((current) => ({ ...current, ownerName: undefined }));
                    setJustSaved(false);
                  }}
                />
              </Field>
              <Field
                id={`${ids}-description`}
                label="Store description"
                hint={`${vendor.description.length}/500 · Tell customers what you sell.`}
              >
                <Textarea
                  {...inputProps("description")}
                  rows={4}
                  maxLength={500}
                  value={vendor.description}
                  onChange={(e) => update("description", e.target.value)}
                />
              </Field>
            </div>
          </section>

          <section className="surface-card p-5">
            <h2 className="font-bold">Contact and pickup</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Used by customers and couriers to reach you.
            </p>
            <div className="mt-4 space-y-4">
              <Field
                id={`${ids}-contact`}
                label="Phone"
                required
                hint="Customers can call this number from your store page."
                error={errors.contact}
              >
                <Input
                  {...inputProps("contact")}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="0300-1234567"
                  value={vendor.contact}
                  onChange={(e) => update("contact", e.target.value)}
                />
              </Field>
              <Field
                id={`${ids}-email`}
                label="Email for order alerts"
                hint="We email you here whenever a new order arrives."
                error={errors.email}
              >
                <Input
                  {...inputProps("email")}
                  type="email"
                  autoComplete="email"
                  placeholder="store@example.com"
                  value={vendor.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </Field>
              <Field
                id={`${ids}-address`}
                label="Pickup address"
                hint="Where the courier collects your parcels."
              >
                <Textarea
                  {...inputProps("address")}
                  rows={3}
                  value={vendor.address}
                  onChange={(e) => update("address", e.target.value)}
                />
              </Field>
            </div>
          </section>

          <section className="surface-card p-5 lg:col-span-2">
            <h2 className="font-bold">Alerts</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              <li className="flex gap-3 rounded-xl bg-muted/60 p-3 text-sm">
                <Mail aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  <span className="font-semibold">New orders</span>
                  <span className="block text-xs text-muted-foreground">
                    Emailed to {vendor.email.trim() || "your sign-in email"} and shown in the bell.
                  </span>
                </span>
              </li>
              <li className="flex gap-3 rounded-xl bg-muted/60 p-3 text-sm">
                <Bell aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  <span className="font-semibold">Low stock</span>
                  <span className="block text-xs text-muted-foreground">
                    Products with fewer than 10 left appear in the bell at the top.
                  </span>
                </span>
              </li>
            </ul>
          </section>

          <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
            <Button type="submit" disabled={saving || !dirty} className="rounded-xl">
              {saving && <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? "Saving..." : "Save changes"}
            </Button>
            <span className="text-sm" role="status" aria-live="polite">
              {justSaved && !dirty ? (
                <span className="inline-flex items-center gap-1.5 text-success">
                  <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                  All changes saved
                </span>
              ) : dirty ? (
                <span className="text-muted-foreground">You have unsaved changes.</span>
              ) : (
                <span className="text-muted-foreground">No changes to save.</span>
              )}
            </span>
          </div>
        </form>
      )}
    </DashboardShell>
  );
}
