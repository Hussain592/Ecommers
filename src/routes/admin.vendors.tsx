import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Search, Ban, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { adminNav } from "@/components/dashboard/nav-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/vendors")({
  head: () => ({
    meta: [
      { title: "Vendors — Dukaan.pk Admin" },
      { name: "description", content: "Approve, suspend and review all marketplace vendors." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Vendors — Dukaan.pk Admin" },
      { property: "og:description", content: "Vendor management for platform owners." },
    ],
  }),
  component: AdminVendors,
});

type Vendor = {
  id: string;
  name: string;
  contact: string | null;
  email: string | null;
  address: string | null;
  status: string | null;
  created_at: string;
  products: number;
};

function AdminVendors() {
  return <VendorList />;
}

function VendorList() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadVendors = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("vendors")
      .select("id, name, contact, email, address, status, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading vendors", error);
      toast.error("Vendors load nahi ho sake.");
      setLoading(false);
      return;
    }

    const withCounts = await Promise.all(
      (data ?? []).map(async (v) => {
        const { count } = await supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("vendor_id", v.id);
        return { ...v, products: count ?? 0 };
      }),
    );

    setVendors(withCounts);
    setLoading(false);
  };

  useEffect(() => {
    void loadVendors();
  }, []);

  const updateStatus = async (id: string, status: "Active" | "Suspended") => {
    setBusyId(id);
    const { data, error } = await supabase.from("vendors").update({ status }).eq("id", id).select();
    setBusyId(null);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (!data || data.length === 0) {
      toast.error("Permission nahi mili. Admin account se login karein.");
      return;
    }

    toast.success(status === "Active" ? "Vendor approve ho gaya." : "Vendor suspend ho gaya.");
    setVendors((prev) => prev.map((v) => (v.id === id ? { ...v, status } : v)));
  };

  const list = vendors.filter((v) => v.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <DashboardShell brand="Dukaan.pk" role="Owner / Admin" title="Vendors" subtitle={`${list.length} registered vendors`} nav={adminNav}>
      <div className="surface-card p-4">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search vendors" className="h-10 rounded-xl pl-9" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-sm">
              <thead className="bg-muted/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Vendor</th>
                  <th className="px-4 py-3 font-semibold">Contact</th>
                  <th className="px-4 py-3 font-semibold">Address</th>
                  <th className="px-4 py-3 font-semibold">Products</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.map((v) => (
                  <tr
                    key={v.id}
                    className="cursor-pointer transition-colors hover:bg-muted/40 focus-within:bg-muted/40"
                    tabIndex={0}
                    role="link"
                    aria-label={`${v.name} ki details dekhein`}
                    onClick={() => navigate({ to: "/admin/vendors/$vendorId", params: { vendorId: v.id } })}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        navigate({ to: "/admin/vendors/$vendorId", params: { vendorId: v.id } });
                      }
                    }}
                  >
                    <td className="px-4 py-3">
                      <Link to="/admin/vendors/$vendorId" params={{ vendorId: v.id }} className="font-medium text-primary hover:underline">
                        {v.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{v.email}</p>
                    </td>
                    <td className="px-4 py-3">{v.contact}</td>
                    <td className="px-4 py-3 text-muted-foreground">{v.address}</td>
                    <td className="px-4 py-3">{v.products}</td>
                    <td className="px-4 py-3"><StatusBadge status={(v.status ?? "Pending") as never} /></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-success"
                          disabled={busyId === v.id || v.status === "Active"}
                          onClick={(event) => {
                            event.stopPropagation();
                            void updateStatus(v.id, "Active");
                          }}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-destructive"
                          disabled={busyId === v.id || v.status === "Suspended"}
                          onClick={(event) => {
                            event.stopPropagation();
                            void updateStatus(v.id, "Suspended");
                          }}
                        >
                          <Ban className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
