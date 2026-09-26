import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Search,
  Check,
  Ban,
  Loader2,
  Store,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { adminNav } from "@/components/dashboard/nav-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      {
        title: "Partners & Users — Dukaan.pk Admin",
      },
      {
        name: "description",
        content:
          "Manage partner accounts and platform users.",
      },
      {
        name: "robots",
        content: "noindex",
      },
      {
        property: "og:title",
        content: "Partners & Users — Dukaan.pk Admin",
      },
      {
        property: "og:description",
        content: "User and partner account management.",
      },
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
  vendorId: string | null;
};

type VendorOption = {
  id: string;
  name: string;
  status: string | null;
};

function AdminUsers() {
  const [tab, setTab] = useState<
    "partners" | "vendors" | "customers"
  >("customers");

  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(
    null,
  );

  /*
   * Vendors available for partner assignment.
   */
  const [vendorOptions, setVendorOptions] = useState<
    VendorOption[]
  >([]);

  /*
   * Make Vendor dialog.
   */
  const [vendorDialogRow, setVendorDialogRow] =
    useState<Row | null>(null);

  const [vendorSaving, setVendorSaving] =
    useState(false);

  /*
   * Partner assignment dialog.
   */
  const [partnerDialogRow, setPartnerDialogRow] =
    useState<Row | null>(null);

  const [partnerVendorId, setPartnerVendorId] =
    useState("");

  const [partnerSaving, setPartnerSaving] =
    useState(false);

  /*
   * ------------------------------------------------
   * LOAD VENDORS FOR PARTNER ASSIGNMENT
   * ------------------------------------------------
   */
  const loadVendorOptions = async () => {
    const { data, error } = await supabase
      .from("vendors")
      .select("id, name, status")
      .order("name");

    if (error) {
      console.error(
        "Unable to load vendor options",
        error,
      );

      return;
    }

    setVendorOptions(data ?? []);
  };

  /*
   * ------------------------------------------------
   * LOAD USERS / VENDORS / PARTNERS
   * ------------------------------------------------
   */
  const loadRows = async () => {
    setLoading(true);

    if (tab === "vendors") {
      const { data, error } = await supabase
        .from("vendors")
        .select(
          "id, name, contact, email, status",
        )
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(error);

        toast.error(
          "Vendors load nahi ho sake.",
        );

        setLoading(false);
        return;
      }

      setRows(
        (data ?? []).map((vendor) => ({
          key: vendor.id,
          authId: null,
          name: vendor.name,
          email: vendor.email,
          contact:
            vendor.contact ||
            vendor.email ||
            "-",
          status:
            vendor.status ?? "Pending",
          source: "vendors" as const,
          vendorId: null,
        })),
      );
    } else {
      const role =
        tab === "partners"
          ? "partner"
          : "customer";

      const { data, error } = await supabase
        .from("users")
        .select(
          "id, auth_id, name, email, phone, status, role, vendor_id",
        )
        .eq("role", role)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(error);

        toast.error(
          "Users load nahi ho sake.",
        );

        setLoading(false);
        return;
      }

      setRows(
        (data ?? []).map((user) => ({
          key: user.id,
          authId: user.auth_id,
          name:
            user.name ||
            user.email ||
            "User",
          email: user.email,
          contact:
            user.phone ||
            user.email ||
            "-",
          status:
            user.status ?? "Active",
          source: "users" as const,
          vendorId:
            user.vendor_id ?? null,
        })),
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    void loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    void loadVendorOptions();
  }, []);

  /*
   * ------------------------------------------------
   * VENDOR STATUS
   * ------------------------------------------------
   */
  const updateVendorStatus = async (
    row: Row,
    status: "Active" | "Suspended",
  ) => {
    setBusyKey(row.key);

    try {
      const { data, error } = await supabase
        .from("vendors")
        .update({
          status,
        })
        .eq("id", row.key)
        .select("id");

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error(
          "Permission nahi mili.",
        );
      }

      setRows((previous) =>
        previous.map((item) =>
          item.key === row.key
            ? {
                ...item,
                status,
              }
            : item,
        ),
      );

      await loadVendorOptions();

      toast.success(
        status === "Active"
          ? "Vendor active ho gaya."
          : "Vendor suspend ho gaya.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Vendor status update nahi ho saka.",
      );
    } finally {
      setBusyKey(null);
    }
  };

  /*
   * ------------------------------------------------
   * OPEN PARTNER VENDOR DIALOG
   * ------------------------------------------------
   */
  const openPartnerDialog = (
    row: Row,
  ) => {
    setPartnerDialogRow(row);

    setPartnerVendorId(
      row.vendorId ?? "",
    );
  };

  /*
   * ------------------------------------------------
   * MAKE / ASSIGN PARTNER
   * ------------------------------------------------
   *
   * Admin selects Vendor.
   *
   * RPC will save:
   *
   * users.role = partner
   * users.status = Active
   * users.vendor_id = selected vendor
   */
  const savePartnerAssignment = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!partnerDialogRow) {
      return;
    }

    if (!partnerVendorId) {
      toast.error(
        "Partner ke liye Vendor select karein.",
      );

      return;
    }

    setPartnerSaving(true);

    try {
      const { error } = await supabase.rpc(
        "admin_assign_partner",
        {
          p_user_id:
            partnerDialogRow.key,
          p_vendor_id:
            partnerVendorId,
        },
      );

      if (error) {
        throw error;
      }

      /*
       * Customer tab:
       * Partner banne ke baad customer list se remove.
       */
      if (tab === "customers") {
        setRows((previous) =>
          previous.filter(
            (item) =>
              item.key !==
              partnerDialogRow.key,
          ),
        );

        toast.success(
          `${partnerDialogRow.name} ab Partner hai.`,
        );
      } else {
        /*
         * Existing partner:
         * assigned Vendor update.
         */
        setRows((previous) =>
          previous.map((item) =>
            item.key ===
            partnerDialogRow.key
              ? {
                  ...item,
                  vendorId:
                    partnerVendorId,
                  status: "Active",
                }
              : item,
          ),
        );

        toast.success(
          `${partnerDialogRow.name} ka Vendor assign ho gaya.`,
        );
      }

      setPartnerDialogRow(null);
      setPartnerVendorId("");
    } catch (error) {
      console.error(
        "Unable to assign partner",
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Partner assign nahi ho saka.",
      );
    } finally {
      setPartnerSaving(false);
    }
  };

  /*
   * ------------------------------------------------
   * PARTNER STATUS
   * ------------------------------------------------
   */
  const updatePartnerStatus = async (
    row: Row,
    action: "activate" | "suspend",
  ) => {
    setBusyKey(row.key);

    try {
      const { error } = await supabase.rpc(
        "admin_manage_partner",
        {
          p_user_id: row.key,
          p_action: action,
        },
      );

      if (error) {
        throw error;
      }

      const nextStatus =
        action === "activate"
          ? "Active"
          : "Suspended";

      setRows((previous) =>
        previous.map((item) =>
          item.key === row.key
            ? {
                ...item,
                status: nextStatus,
              }
            : item,
        ),
      );

      toast.success(
        action === "activate"
          ? "Partner active ho gaya."
          : "Partner suspend ho gaya.",
      );
    } catch (error) {
      console.error(
        "Unable to update partner",
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Partner status update nahi ho saka.",
      );
    } finally {
      setBusyKey(null);
    }
  };

  /*
   * ------------------------------------------------
   * MAKE CUSTOMER A VENDOR
   * ------------------------------------------------
   *
   * Existing flow unchanged.
   */
  const promoteToVendor = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      !vendorDialogRow ||
      !vendorDialogRow.authId
    ) {
      return;
    }

    const formData = new FormData(
      event.currentTarget,
    );

    const storeName = String(
      formData.get("storeName") ?? "",
    ).trim();

    const phone = String(
      formData.get("phone") ?? "",
    ).trim();

    const address = String(
      formData.get("address") ?? "",
    ).trim();

    setVendorSaving(true);

    const { error: vendorError } =
      await supabase
        .from("vendors")
        .insert({
          owner_id:
            vendorDialogRow.authId,
          name: storeName,
          contact: phone,
          email:
            vendorDialogRow.email,
          address,
          status: "Active",
        });

    if (vendorError) {
      setVendorSaving(false);

      toast.error(
        vendorError.message,
      );

      return;
    }

    const { error: userError } =
      await supabase
        .from("users")
        .update({
          role: "vendor",
          status: "Active",
        })
        .eq(
          "id",
          vendorDialogRow.key,
        );

    setVendorSaving(false);

    if (userError) {
      toast.error(
        userError.message,
      );

      return;
    }

    toast.success(
      `${vendorDialogRow.name} ab Vendor hai.`,
    );

    setRows((previous) =>
      previous.filter(
        (item) =>
          item.key !==
          vendorDialogRow.key,
      ),
    );

    setVendorDialogRow(null);

    await loadVendorOptions();
  };

  const normalizedQuery =
    q.trim().toLowerCase();

  const list = rows.filter(
    (row) =>
      row.name
        .toLowerCase()
        .includes(normalizedQuery) ||
      (row.email ?? "")
        .toLowerCase()
        .includes(normalizedQuery) ||
      row.contact
        .toLowerCase()
        .includes(normalizedQuery),
  );

  const activeVendors =
    vendorOptions.filter(
      (vendor) =>
        vendor.status === "Active",
    );

  const getVendorName = (
    vendorId: string | null,
  ) => {
    if (!vendorId) {
      return "Vendor not assigned";
    }

    return (
      vendorOptions.find(
        (vendor) =>
          vendor.id === vendorId,
      )?.name ??
      "Assigned Vendor"
    );
  };

  return (
    <DashboardShell
      brand="Dukaan.pk"
      role="Owner / Admin"
      title="Partners / Users"
      subtitle="Accounts aur roles manage karein"
      nav={adminNav}
    >
      <div className="surface-card space-y-4 p-4">
        <Tabs
          value={tab}
          onValueChange={(value) =>
            setTab(
              value as typeof tab,
            )
          }
        >
          <TabsList className="rounded-xl">
            <TabsTrigger
              value="customers"
              className="rounded-lg text-xs"
            >
              Customers
            </TabsTrigger>

            <TabsTrigger
              value="vendors"
              className="rounded-lg text-xs"
            >
              Vendor Owners
            </TabsTrigger>

            <TabsTrigger
              value="partners"
              className="rounded-lg text-xs"
            >
              Partners
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={q}
            onChange={(event) =>
              setQ(
                event.target.value,
              )
            }
            placeholder="Search users"
            className="h-10 rounded-xl pl-9"
          />
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
                  <th className="px-4 py-3 font-semibold">
                    Name
                  </th>

                  <th className="px-4 py-3 font-semibold">
                    Contact
                  </th>

                  <th className="px-4 py-3 font-semibold">
                    Status
                  </th>

                  <th className="px-4 py-3 text-right font-semibold">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {list.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      Koi record nahi mila.
                    </td>
                  </tr>
                ) : (
                  list.map((row) => {
                    const busy =
                      busyKey === row.key;

                    return (
                      <tr
                        key={row.key}
                        className="hover:bg-muted/40"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium">
                            {row.name}
                          </p>

                          {tab ===
                            "partners" && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Vendor:{" "}
                              {getVendorName(
                                row.vendorId,
                              )}
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-3 text-muted-foreground">
                          {row.contact}
                        </td>

                        <td className="px-4 py-3">
                          <StatusBadge
                            status={
                              row.status as never
                            }
                          />
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            {/* CUSTOMER */}
                            {tab ===
                            "customers" ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-lg"
                                  disabled={
                                    busy
                                  }
                                  onClick={() =>
                                    setVendorDialogRow(
                                      row,
                                    )
                                  }
                                >
                                  <Store className="mr-1.5 h-3.5 w-3.5" />
                                  Make Vendor
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-lg"
                                  disabled={
                                    busy
                                  }
                                  onClick={() =>
                                    openPartnerDialog(
                                      row,
                                    )
                                  }
                                >
                                  <Users className="mr-1.5 h-3.5 w-3.5" />
                                  Make Partner
                                </Button>
                              </>
                            ) : tab ===
                              "partners" ? (
                              <>
                                {/* ASSIGN / CHANGE VENDOR */}
                                {row.status ===
                                  "Active" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-lg"
                                    disabled={
                                      busy
                                    }
                                    onClick={() =>
                                      openPartnerDialog(
                                        row,
                                      )
                                    }
                                  >
                                    <Store className="mr-1.5 h-3.5 w-3.5" />

                                    {row.vendorId
                                      ? "Change Vendor"
                                      : "Assign Vendor"}
                                  </Button>
                                )}

                                {/* ACTIVATE */}
                                {row.status !==
                                  "Active" && (
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg text-success"
                                    disabled={
                                      busy
                                    }
                                    title="Activate partner"
                                    aria-label={`Activate ${row.name}`}
                                    onClick={() =>
                                      void updatePartnerStatus(
                                        row,
                                        "activate",
                                      )
                                    }
                                  >
                                    {busy ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Check className="h-3.5 w-3.5" />
                                    )}
                                  </Button>
                                )}

                                {/* SUSPEND */}
                                {row.status !==
                                  "Suspended" && (
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg text-destructive"
                                    disabled={
                                      busy
                                    }
                                    title="Suspend partner"
                                    aria-label={`Suspend ${row.name}`}
                                    onClick={() =>
                                      void updatePartnerStatus(
                                        row,
                                        "suspend",
                                      )
                                    }
                                  >
                                    {busy ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Ban className="h-3.5 w-3.5" />
                                    )}
                                  </Button>
                                )}
                              </>
                            ) : (
                              <>
                                {/* VENDOR ACTIVATE */}
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg text-success"
                                  disabled={
                                    busy ||
                                    row.status ===
                                      "Active"
                                  }
                                  title="Activate vendor"
                                  aria-label={`Activate ${row.name}`}
                                  onClick={() =>
                                    void updateVendorStatus(
                                      row,
                                      "Active",
                                    )
                                  }
                                >
                                  {busy ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Check className="h-3.5 w-3.5" />
                                  )}
                                </Button>

                                {/* VENDOR SUSPEND */}
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg text-destructive"
                                  disabled={
                                    busy ||
                                    row.status ===
                                      "Suspended"
                                  }
                                  title="Suspend vendor"
                                  aria-label={`Suspend ${row.name}`}
                                  onClick={() =>
                                    void updateVendorStatus(
                                      row,
                                      "Suspended",
                                    )
                                  }
                                >
                                  {busy ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Ban className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --------------------------------
          PARTNER VENDOR DIALOG
      -------------------------------- */}
      <Dialog
        open={!!partnerDialogRow}
        onOpenChange={(open) => {
          if (!open) {
            setPartnerDialogRow(null);
            setPartnerVendorId("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Partner Vendor Assignment
            </DialogTitle>

            <DialogDescription>
              {partnerDialogRow?.name} ko
              kis Vendor ke saath assign
              karna hai?
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={
              savePartnerAssignment
            }
          >
            <div className="space-y-1.5">
              <Label>
                Vendor / Store
              </Label>

              <Select
                value={partnerVendorId}
                onValueChange={
                  setPartnerVendorId
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Vendor select karein" />
                </SelectTrigger>

                <SelectContent>
                  {activeVendors.map(
                    (vendor) => (
                      <SelectItem
                        key={vendor.id}
                        value={vendor.id}
                      >
                        {vendor.name}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>

              {activeVendors.length ===
                0 && (
                <p className="text-xs text-destructive">
                  Koi Active Vendor
                  available nahi hai.
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full rounded-xl"
              disabled={
                partnerSaving ||
                !partnerVendorId
              }
            >
              {partnerSaving && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              {partnerDialogRow?.vendorId
                ? "Update Vendor Assignment"
                : "Assign Partner"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* --------------------------------
          MAKE VENDOR DIALOG
      -------------------------------- */}
      <Dialog
        open={!!vendorDialogRow}
        onOpenChange={(open) => {
          if (!open) {
            setVendorDialogRow(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Vendor Banayein
            </DialogTitle>

            <DialogDescription>
              {vendorDialogRow?.name} ke
              liye store details bharein.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={promoteToVendor}
          >
            <div className="space-y-1.5">
              <Label htmlFor="storeName">
                Store / Business Name
              </Label>

              <Input
                id="storeName"
                name="storeName"
                required
                placeholder="e.g. Al-Madina Traders"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">
                Phone Number
              </Label>

              <Input
                id="phone"
                name="phone"
                required
                placeholder="0300-1234567"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">
                Address / City
              </Label>

              <Input
                id="address"
                name="address"
                required
                placeholder="Karachi"
                className="rounded-xl"
              />
            </div>

            <Button
              type="submit"
              disabled={vendorSaving}
              className="w-full rounded-xl"
            >
              {vendorSaving && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              {vendorSaving
                ? "Saving..."
                : "Vendor Banayein"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}