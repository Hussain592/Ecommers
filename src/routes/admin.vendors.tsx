import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Ban,
  Check,
  Loader2,
  Search,
  X,
} from "lucide-react";
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
      {
        title: "Vendors — Dukaan.pk Admin",
      },
      {
        name: "description",
        content:
          "Approve, reject, suspend and review all marketplace vendors.",
      },
      {
        name: "robots",
        content: "noindex",
      },
      {
        property: "og:title",
        content: "Vendors — Dukaan.pk Admin",
      },
      {
        property: "og:description",
        content: "Vendor management for platform owners.",
      },
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
      .select(
        "id, name, contact, email, address, status, created_at",
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Error loading vendors",
        error,
      );

      toast.error(
        "Vendors load nahi ho sake.",
      );

      setLoading(false);
      return;
    }

    const withCounts = await Promise.all(
      (data ?? []).map(
        async (vendor) => {
          const { count } =
            await supabase
              .from("products")
              .select("id", {
                count: "exact",
                head: true,
              })
              .eq(
                "vendor_id",
                vendor.id,
              );

          return {
            ...vendor,
            products: count ?? 0,
          };
        },
      ),
    );

    setVendors(withCounts);
    setLoading(false);
  };

  useEffect(() => {
    void loadVendors();
  }, []);

  /*
   * ----------------------------------------
   * APPROVE / REJECT APPLICATION
   * ----------------------------------------
   *
   * Supabase RPC:
   *
   * Approve:
   * vendors.status = Active
   * users.role = vendor
   *
   * Reject:
   * vendors.status = Rejected
   * users.role = customer
   */
  const reviewApplication = async (
    id: string,
    action: "approve" | "reject",
  ) => {
    setBusyId(id);

    try {
      const { error } =
        await supabase.rpc(
          "review_vendor_application",
          {
            p_vendor_id: id,
            p_action: action,
          },
        );

      if (error) {
        throw error;
      }

      const nextStatus =
        action === "approve"
          ? "Active"
          : "Rejected";

      setVendors((previous) =>
        previous.map((vendor) =>
          vendor.id === id
            ? {
                ...vendor,
                status: nextStatus,
              }
            : vendor,
        ),
      );

      if (action === "approve") {
        toast.success(
          "Vendor application approve ho gayi.",
        );
      } else {
        toast.success(
          "Vendor application reject ho gayi.",
        );
      }
    } catch (error) {
      console.error(
        "Unable to review vendor",
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Vendor application update nahi ho saki.",
      );
    } finally {
      setBusyId(null);
    }
  };

  /*
   * ----------------------------------------
   * SUSPEND ACTIVE VENDOR
   * ----------------------------------------
   */
  const suspendVendor = async (
    id: string,
  ) => {
    setBusyId(id);

    try {
      const {
        data,
        error,
      } = await supabase
        .from("vendors")
        .update({
          status: "Suspended",
        })
        .eq("id", id)
        .select("id");

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error(
          "Permission nahi mili. Admin account se login karein.",
        );
      }

      setVendors((previous) =>
        previous.map((vendor) =>
          vendor.id === id
            ? {
                ...vendor,
                status: "Suspended",
              }
            : vendor,
        ),
      );

      toast.success(
        "Vendor suspend ho gaya.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Vendor suspend nahi ho saka.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const normalizedQuery =
    q.trim().toLowerCase();

  const list = vendors.filter(
    (vendor) =>
      vendor.name
        .toLowerCase()
        .includes(normalizedQuery) ||
      (vendor.email ?? "")
        .toLowerCase()
        .includes(normalizedQuery),
  );

  const pendingCount =
    vendors.filter(
      (vendor) =>
        (vendor.status ?? "Pending") ===
        "Pending",
    ).length;

  return (
    <DashboardShell
      brand="Dukaan.pk"
      role="Owner / Admin"
      title="Vendors"
      subtitle={`${vendors.length} vendors · ${pendingCount} pending applications`}
      nav={adminNav}
    >
      {/* Search */}
      <div className="surface-card p-4">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={q}
            onChange={(event) =>
              setQ(event.target.value)
            }
            placeholder="Search name or email"
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
            <table className="w-full min-w-[840px] text-sm">
              <thead className="bg-muted/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">
                    Vendor
                  </th>

                  <th className="px-4 py-3 font-semibold">
                    Contact
                  </th>

                  <th className="px-4 py-3 font-semibold">
                    Address
                  </th>

                  <th className="px-4 py-3 font-semibold">
                    Products
                  </th>

                  <th className="px-4 py-3 font-semibold">
                    Status
                  </th>

                  <th className="px-4 py-3 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {list.map((vendor) => {
                  const status =
                    vendor.status ??
                    "Pending";

                  const busy =
                    busyId ===
                    vendor.id;

                  return (
                    <tr
                      key={vendor.id}
                      className="cursor-pointer transition-colors hover:bg-muted/40 focus-within:bg-muted/40"
                      tabIndex={0}
                      role="link"
                      aria-label={`${vendor.name} ki details dekhein`}
                      onClick={() =>
                        navigate({
                          to: "/admin/vendors/$vendorId",
                          params: {
                            vendorId:
                              vendor.id,
                          },
                        })
                      }
                      onKeyDown={(
                        event,
                      ) => {
                        if (
                          event.key ===
                            "Enter" ||
                          event.key === " "
                        ) {
                          event.preventDefault();

                          navigate({
                            to: "/admin/vendors/$vendorId",
                            params: {
                              vendorId:
                                vendor.id,
                            },
                          });
                        }
                      }}
                    >
                      {/* Vendor */}
                      <td className="px-4 py-3">
                        <Link
                          to="/admin/vendors/$vendorId"
                          params={{
                            vendorId:
                              vendor.id,
                          }}
                          className="font-medium text-primary hover:underline"
                        >
                          {vendor.name}
                        </Link>

                        <p className="text-xs text-muted-foreground">
                          {vendor.email ??
                            "No email"}
                        </p>
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3">
                        {vendor.contact ??
                          "—"}
                      </td>

                      {/* Address */}
                      <td className="max-w-[260px] px-4 py-3 text-muted-foreground">
                        {vendor.address ??
                          "—"}
                      </td>

                      {/* Products */}
                      <td className="px-4 py-3">
                        {vendor.products}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusBadge
                          status={
                            status as never
                          }
                        />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {/* Pending Application */}
                          {status ===
                            "Pending" && (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-lg text-success"
                                disabled={
                                  busy
                                }
                                title="Approve vendor"
                                aria-label={`Approve ${vendor.name}`}
                                onClick={(
                                  event,
                                ) => {
                                  event.stopPropagation();

                                  void reviewApplication(
                                    vendor.id,
                                    "approve",
                                  );
                                }}
                              >
                                {busy ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                              </Button>

                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-lg text-destructive"
                                disabled={
                                  busy
                                }
                                title="Reject vendor"
                                aria-label={`Reject ${vendor.name}`}
                                onClick={(
                                  event,
                                ) => {
                                  event.stopPropagation();

                                  void reviewApplication(
                                    vendor.id,
                                    "reject",
                                  );
                                }}
                              >
                                {busy ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <X className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </>
                          )}

                          {/* Active Vendor */}
                          {status ===
                            "Active" && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-lg text-destructive"
                              disabled={
                                busy
                              }
                              title="Suspend vendor"
                              aria-label={`Suspend ${vendor.name}`}
                              onClick={(
                                event,
                              ) => {
                                event.stopPropagation();

                                void suspendVendor(
                                  vendor.id,
                                );
                              }}
                            >
                              {busy ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Ban className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          )}

                          {/* Rejected / Suspended */}
                          {(status ===
                            "Rejected" ||
                            status ===
                              "Suspended") && (
                            <span className="px-2 py-1 text-xs text-muted-foreground">
                              No action
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {list.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-sm text-muted-foreground"
                    >
                      Koi vendor nahi mila.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}