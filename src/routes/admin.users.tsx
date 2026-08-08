import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, UserCog } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { adminNav } from "@/components/dashboard/nav-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { partnersList, vendorsList } from "@/data/mock";

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

const customers = [
  { id: "CUS-01", name: "Ahmed Raza", phone: "0300-1234567", city: "Karachi", orders: 6, status: "Active" },
  { id: "CUS-02", name: "Sana Malik", phone: "0321-9876543", city: "Lahore", orders: 3, status: "Active" },
  { id: "CUS-03", name: "Bilal Khan", phone: "0333-4567890", city: "Islamabad", orders: 9, status: "Inactive" },
];

function AdminUsers() {
  const [tab, setTab] = useState("partners");
  const [q, setQ] = useState("");

  return (
    <DashboardShell brand="Dukaan.pk" role="Owner / Admin" title="Partners / Users" subtitle="Accounts aur roles manage karein" nav={adminNav}>
      <div className="surface-card space-y-4 p-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="rounded-xl">
            <TabsTrigger value="partners" className="rounded-lg text-xs">Partners</TabsTrigger>
            <TabsTrigger value="vendors" className="rounded-lg text-xs">Vendor Owners</TabsTrigger>
            <TabsTrigger value="customers" className="rounded-lg text-xs">Customers</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users" className="h-10 rounded-xl pl-9" />
        </div>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">City</th>
                <th className="px-4 py-3 font-semibold">{tab === "customers" ? "Orders" : tab === "vendors" ? "Store" : "Products"}</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(tab === "partners"
                ? partnersList.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())).map((p) => ({
                    key: p.id, name: p.name, contact: p.phone, city: p.city, extra: String(p.products), status: p.status,
                  }))
                : tab === "vendors"
                  ? vendorsList.filter((v) => v.owner.toLowerCase().includes(q.toLowerCase())).map((v) => ({
                      key: v.id, name: v.owner, contact: `${v.id}@dukaan.pk`, city: v.city, extra: v.name, status: v.status,
                    }))
                  : customers.filter((c) => c.name.toLowerCase().includes(q.toLowerCase())).map((c) => ({
                      key: c.id, name: c.name, contact: c.phone, city: c.city, extra: String(c.orders), status: c.status,
                    }))
              ).map((r) => (
                <tr key={r.key} className="hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.contact}</td>
                  <td className="px-4 py-3">{r.city}</td>
                  <td className="px-4 py-3">{r.extra}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="outline" size="sm" className="rounded-lg" onClick={() => toast("Manage user (demo)")}>
                      <UserCog className="mr-1.5 h-3.5 w-3.5" /> Manage
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}