import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, Check, Ban, Loader2, Store, Users } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { adminNav } from "@/components/dashboard/nav-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Partners & Users — Dukaan.pk Admin" },
      { name: "description", content: "Manage partner accounts and platform users." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Partners & Users — Dukaan.pk Admin" },
      { property: "og:description", content: "User and partner account management." },
    ],
  }),
  component: AdminUsers,
});

type Row = {
  key: string;
  authId: string | null;
  name: string;
  email: string | null;
  contact: string;
  status: string;
  source: "users" | "vendors";
};

function AdminUsers() {
  const [tab, setTab] = useState<"partners" | "vendors" | "customers">("customers");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [vendorDialogRow, setVendorDialogRow] = useState<Row | null>(null);
  const [vendorSaving, setVendorSaving] = useState(false);

  const loadRows = async () => {
    setLoading(true);

    if (tab === "vendors") {
      const { data, error } = await supabase
        .from("vendors")
        .select("id, name, contact, email, status")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        toast.error("Vendors load nahi ho sake.");
        setLoading(false);
        return;
      }

      setRows(
        (data ?? []).map((v) => ({
          key: v.id,
          authId: null,
          name: v.name,
          email: v.email,
          contact: v.contact || v.email || "-",
          status: v.status ?? "Pending",
          source: "vendors" as const,
        })),
      );
    } else {
      const role = tab === "partners" ? "partner" : "customer";
      const { data, error } = await supabase
        .from("users")
        .select("id, auth_id, name, email, phone, status, role")
        .eq("role", role)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        toast.error("Users load nahi ho sake.");
        setLoading(false);
        return;
      }

      setRows(
        (data ?? []).map((u) => ({
          key: u.id,
          authId: u.auth_id,
          name: u.name || u.email,
          email: u.email,
          contact: u.phone || u.email || "-",
          status: u.status ?? "Active",
          source: "users" as const,
        })),
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    void loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const updateStatus = async (row: Row, status: "Active" | "Suspended") => {
    setBusyKey(row.key);
    const table = row.source === "vendors" ? "vendors" : "users";
    const { data, error } = await supabase.from(table).update({ status }).eq("id", row.key).select();
    setBusyKey(null);

    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data || data.length === 0) {
      toast.error("Permission nahi mili.");
      return;
    }

    toast.success(status === "Active" ? "Approve ho gaya." : "Suspend ho gaya.");
    setRows((prev) => prev.map((r) => (r.key === row.key ? { ...r, status } : r)));
  };

  const promoteToPartner = async (row: Row) => {
    setBusyKey(row.key);
    const { data, error } = await supabase
      .from("users")
      .update({ role: "partner", status: "Active" })
      .eq("id", row.key)
      .select();
    setBusyKey(null);

    if (error || !data || data.length === 0) {
      toast.error("Partner banane mein masla aaya.");
      return;
    }

    toast.success(`${row.name} ab Partner hai.`);
    setRows((prev) => prev.filter((r) => r.key !== row.key));
  };

  const promoteToVendor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!vendorDialogRow || !vendorDialogRow.authId) return;

    const formData = new FormData(e.currentTarget);
    const storeName = String(formData.get("storeName") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const address = String(formData.get("address") ?? "").trim();

    setVendorSaving(true);
    const { error: vendorError } = await supabase.from("vendors").insert({
      owner_id: vendorDialogRow.authId,
      name: storeName,
      contact: phone,
      email: vendorDialogRow.email,
      address,
      status: "Active",
    });

    if (vendorError) {
      setVendorSaving(false);
      toast.error(vendorError.message);
      return;
    }

    const { error: userError } = await supabase
      .from("users")
      .update({ role: "vendor", status: "Active" })
      .eq("id", vendorDialogRow.key);

    setVendorSaving(false);

    if (userError) {
      toast.error(userError.message);
      return;
    }

    toast.success(`${vendorDialogRow.name} ab Vendor hai.`);
    setRows((prev) => prev.filter((r) => r.key !== vendorDialogRow.key));
    setVendorDialogRow(null);
  };

  const list = rows.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <DashboardShell brand="Dukaan.pk" role="Owner / Admin" title="Partners / Users" subtitle="Accounts aur roles manage karein" nav={adminNav}>
      <div className="surface-card space-y-4 p-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="rounded-xl">
            <TabsTrigger value="customers" className="rounded-lg text-xs">Customers</TabsTrigger>
            <TabsTrigger value="vendors" className="rounded-lg text-xs">Vendor Owners</TabsTrigger>
            <TabsTrigger value="partners" className="rounded-lg text-xs">Partners</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users" className="h-10 rounded-xl pl-9" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Contact</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      Koi record nahi mila.
                    </td>
                  </tr>
                ) : (
                  list.map((r) => (
                    <tr key={r.key} className="hover:bg-muted/40">
                      <td className="px-4 py-3 font-medium">{r.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.contact}</td>
                      <td className="px-4 py-3"><StatusBadge status={r.status as never} /></td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          {tab === "customers" ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-lg"
                                disabled={busyKey === r.key}
                                onClick={() => setVendorDialogRow(r)}
                              >
                                <Store className="mr-1.5 h-3.5 w-3.5" /> Make Vendor
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-lg"
                                disabled={busyKey === r.key}
                                onClick={() => promoteToPartner(r)}
                              >
                                <Users className="mr-1.5 h-3.5 w-3.5" /> Make Partner
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-lg text-success"
                                disabled={busyKey === r.key || r.status === "Active"}
                                onClick={() => updateStatus(r, "Active")}
                              >
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-lg text-destructive"
                                disabled={busyKey === r.key || r.status === "Suspended"}
                                onClick={() => updateStatus(r, "Suspended")}
                              >
                                <Ban className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={!!vendorDialogRow} onOpenChange={(open) => !open && setVendorDialogRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vendor Banayein</DialogTitle>
            <DialogDescription>
              {vendorDialogRow?.name} ke liye store details bharein.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={promoteToVendor}>
            <div className="space-y-1.5">
              <Label htmlFor="storeName">Store / Business Name</Label>
              <Input id="storeName" name="storeName" required placeholder="e.g. Al-Madina Traders" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" name="phone" required placeholder="0300-1234567" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Address / City</Label>
              <Input id="address" name="address" required placeholder="Karachi" className="rounded-xl" />
            </div>
            <Button type="submit" disabled={vendorSaving} className="w-full rounded-xl">
              {vendorSaving ? "Saving..." : "Vendor Banayein"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}