import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BadgePercent,
  Check,
  Loader2,
  Percent,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { adminNav } from "@/components/dashboard/nav-config";
import { Button } from "@/components/ui/button";
import { formatPKR } from "@/data/mock";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/commissions")({
  head: () => ({
    meta: [
      {
        title: "Commissions — Dukaan.pk Admin",
      },
      {
        name: "description",
        content:
          "Review and manage partner commissions across the marketplace.",
      },
      {
        name: "robots",
        content: "noindex",
      },
      {
        property: "og:title",
        content: "Commissions — Dukaan.pk Admin",
      },
      {
        property: "og:description",
        content:
          "Partner commission history and payment status.",
      },
    ],
  }),

  component: AdminCommissions,
});

type CommissionRow = {
  id: string;

  order_id: string | null;

  partner_id: string | null;

  partner_name: string;

  vendor_id: string | null;

  vendor_name: string;

  product_id: string | null;

  product_name: string | null;

  rate: number;

  sale_amount: number;

  quantity: number | null;

  amount: number;

  status: string;

  order_status: string | null;

  created_at: string;

  paid_at: string | null;
};

function AdminCommissions() {
  const [commissions, setCommissions] =
    useState<CommissionRow[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [busyId, setBusyId] =
    useState<string | null>(null);

  /*
   * ----------------------------------------
   * LOAD COMMISSIONS
   * ----------------------------------------
   */
  const loadCommissions = async () => {
    setLoading(true);

    const {
      data,
      error,
    } = await supabase
      .from("commissions")
      .select(`
        id,
        order_id,
        partner_id,
        partner_name,
        vendor_id,
        product_id,
        product_name,
        rate,
        sale_amount,
        quantity,
        amount,
        status,
        created_at,
        paid_at
      `)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Unable to load commissions",
        error,
      );

      toast.error(
        "Commissions load nahi ho sake.",
      );

      setLoading(false);
      return;
    }

    const commissionRows =
      data ?? [];

    /*
     * Vendor names load karo.
     */
    const vendorIds = Array.from(
      new Set(
        commissionRows
          .map(
            (commission) =>
              commission.vendor_id,
          )
          .filter(
            (
              id,
            ): id is string =>
              Boolean(id),
          ),
      ),
    );

    const vendorMap =
      new Map<string, string>();

    if (vendorIds.length > 0) {
      const {
        data: vendorData,
      } = await supabase
        .from("vendors")
        .select("id, name")
        .in("id", vendorIds);

      for (const vendor of
        vendorData ?? []) {
        vendorMap.set(
          vendor.id,
          vendor.name,
        );
      }
    }

    /*
     * Order status load karo.
     */
    const orderIds = Array.from(
      new Set(
        commissionRows
          .map(
            (commission) =>
              commission.order_id,
          )
          .filter(
            (
              id,
            ): id is string =>
              Boolean(id),
          ),
      ),
    );

    const orderStatusMap =
      new Map<string, string>();

    if (orderIds.length > 0) {
      const {
        data: orderData,
      } = await supabase
        .from("orders")
        .select("id, status")
        .in("id", orderIds);

      for (const order of
        orderData ?? []) {
        orderStatusMap.set(
          order.id,
          order.status,
        );
      }
    }

    const prepared: CommissionRow[] =
      commissionRows.map(
        (commission) => ({
          id: commission.id,

          order_id:
            commission.order_id,

          partner_id:
            commission.partner_id,

          partner_name:
            commission.partner_name ??
            "Partner",

          vendor_id:
            commission.vendor_id,

          vendor_name:
            commission.vendor_id
              ? vendorMap.get(
                  commission.vendor_id,
                ) ?? "Vendor"
              : "—",

          product_id:
            commission.product_id,

          product_name:
            commission.product_name,

          rate: Number(
            commission.rate ?? 0,
          ),

          sale_amount: Number(
            commission.sale_amount ??
              0,
          ),

          quantity:
            commission.quantity,

          amount: Number(
            commission.amount ?? 0,
          ),

          status:
            commission.status ??
            "Pending",

          order_status:
            commission.order_id
              ? orderStatusMap.get(
                  commission.order_id,
                ) ?? null
              : null,

          created_at:
            commission.created_at,

          paid_at:
            commission.paid_at,
        }),
      );

    setCommissions(prepared);

    setLoading(false);
  };

  useEffect(() => {
    void loadCommissions();
  }, []);

  /*
   * ----------------------------------------
   * APPROVE / PAID
   * ----------------------------------------
   */
  const updateCommissionStatus =
    async (
      commissionId: string,
      action:
        | "approve"
        | "paid",
    ) => {
      setBusyId(commissionId);

      try {
        const { error } =
          await supabase.rpc(
            "admin_update_commission_status",
            {
              p_commission_id:
                commissionId,

              p_action:
                action,
            },
          );

        if (error) {
          throw error;
        }

        const nextStatus =
          action === "approve"
            ? "Approved"
            : "Paid";

        setCommissions(
          (previous) =>
            previous.map(
              (commission) =>
                commission.id ===
                commissionId
                  ? {
                      ...commission,

                      status:
                        nextStatus,

                      paid_at:
                        action ===
                        "paid"
                          ? new Date().toISOString()
                          : commission.paid_at,
                    }
                  : commission,
            ),
        );

        toast.success(
          action === "approve"
            ? "Commission approve ho gayi."
            : "Commission Paid mark ho gayi.",
        );
      } catch (error) {
        console.error(
          "Unable to update commission",
          error,
        );

        toast.error(
          error instanceof Error
            ? error.message
            : "Commission update nahi ho saki.",
        );
      } finally {
        setBusyId(null);
      }
    };

  /*
   * ----------------------------------------
   * SUMMARY
   * ----------------------------------------
   */
  const total =
    commissions.reduce(
      (sum, commission) =>
        sum +
        Number(
          commission.amount,
        ),
      0,
    );

  const pending =
    commissions
      .filter(
        (commission) =>
          commission.status ===
          "Pending",
      )
      .reduce(
        (sum, commission) =>
          sum +
          Number(
            commission.amount,
          ),
        0,
      );

  const approved =
    commissions
      .filter(
        (commission) =>
          commission.status ===
          "Approved",
      )
      .reduce(
        (sum, commission) =>
          sum +
          Number(
            commission.amount,
          ),
        0,
      );

  const paid =
    commissions
      .filter(
        (commission) =>
          commission.status ===
          "Paid",
      )
      .reduce(
        (sum, commission) =>
          sum +
          Number(
            commission.amount,
          ),
        0,
      );

  const thisMonth =
    commissions
      .filter(
        (commission) => {
          const date =
            new Date(
              commission.created_at,
            );

          const now =
            new Date();

          return (
            date.getMonth() ===
              now.getMonth() &&
            date.getFullYear() ===
              now.getFullYear()
          );
        },
      )
      .reduce(
        (sum, commission) =>
          sum +
          Number(
            commission.amount,
          ),
        0,
      );

  if (loading) {
    return (
      <DashboardShell
        brand="Dukaan.pk"
        role="Owner / Admin"
        title="Commissions"
        subtitle="Partner commissions aur payments"
        nav={adminNav}
      >
        <div className="flex justify-center p-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      brand="Dukaan.pk"
      role="Owner / Admin"
      title="Commissions"
      subtitle="Sab partner commissions manage karein"
      nav={adminNav}
    >
      {/* SUMMARY */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="This Month"
          value={formatPKR(
            thisMonth,
          )}
          hint="Generated commission"
          icon={BadgePercent}
        />

        <StatCard
          label="Pending"
          value={formatPKR(
            pending,
          )}
          icon={Percent}
          tone="warning"
        />

        <StatCard
          label="Approved"
          value={formatPKR(
            approved,
          )}
          icon={Check}
          tone="success"
        />

        <StatCard
          label="Paid"
          value={formatPKR(
            paid,
          )}
          icon={Wallet}
          tone="success"
        />

        <StatCard
          label="All Time"
          value={formatPKR(
            total,
          )}
          icon={BadgePercent}
        />
      </div>

      {/* COMMISSION TABLE */}
      <section className="surface-card overflow-hidden">
        <div className="px-5 pt-5">
          <h2 className="font-bold">
            Commission Records
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            {commissions.length} total
            records
          </p>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1350px] text-sm">
            <thead className="bg-muted/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">
                  Order
                </th>

                <th className="px-4 py-3 font-semibold">
                  Partner
                </th>

                <th className="px-4 py-3 font-semibold">
                  Vendor
                </th>

                <th className="px-4 py-3 font-semibold">
                  Product
                </th>

                <th className="px-4 py-3 font-semibold">
                  Qty
                </th>

                <th className="px-4 py-3 font-semibold">
                  Sale
                </th>

                <th className="px-4 py-3 font-semibold">
                  Rate
                </th>

                <th className="px-4 py-3 font-semibold">
                  Commission
                </th>

                <th className="px-4 py-3 font-semibold">
                  Order Status
                </th>

                <th className="px-4 py-3 font-semibold">
                  Commission Status
                </th>

                <th className="px-4 py-3 font-semibold">
                  Created
                </th>

                <th className="px-4 py-3 font-semibold">
                  Paid
                </th>

                <th className="px-4 py-3 text-right font-semibold">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {commissions.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={13}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    Abhi koi commission
                    record nahi.
                  </td>
                </tr>
              ) : (
                commissions.map(
                  (commission) => {
                    const busy =
                      busyId ===
                      commission.id;

                    return (
                      <tr
                        key={
                          commission.id
                        }
                        className="hover:bg-muted/40"
                      >
                        <td className="px-4 py-3 font-medium">
                          {commission.order_id ??
                            "—"}
                        </td>

                        <td className="px-4 py-3">
                          {
                            commission.partner_name
                          }
                        </td>

                        <td className="px-4 py-3">
                          {
                            commission.vendor_name
                          }
                        </td>

                        <td className="px-4 py-3">
                          <p className="font-medium">
                            {commission.product_name ??
                              "—"}
                          </p>

                          {commission.product_id && (
                            <p className="mt-1 max-w-[180px] truncate text-xs text-muted-foreground">
                              {
                                commission.product_id
                              }
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          {commission.quantity ??
                            "—"}
                        </td>

                        <td className="px-4 py-3">
                          {formatPKR(
                            commission.sale_amount,
                          )}
                        </td>

                        <td className="px-4 py-3">
                          {
                            commission.rate
                          }
                          %
                        </td>

                        <td className="px-4 py-3 font-semibold">
                          {formatPKR(
                            commission.amount,
                          )}
                        </td>

                        <td className="px-4 py-3">
                          {commission.order_status ? (
                            <StatusBadge
                              status={
                                commission.order_status as never
                              }
                            />
                          ) : (
                            "—"
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <StatusBadge
                            status={
                              commission.status as never
                            }
                          />
                        </td>

                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(
                            commission.created_at,
                          ).toLocaleDateString(
                            "en-PK",
                          )}
                        </td>

                        <td className="px-4 py-3 text-muted-foreground">
                          {commission.paid_at
                            ? new Date(
                                commission.paid_at,
                              ).toLocaleDateString(
                                "en-PK",
                              )
                            : "—"}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex justify-end">
                            {commission.status ===
                              "Pending" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-lg text-success"
                                disabled={
                                  busy
                                }
                                onClick={() =>
                                  void updateCommissionStatus(
                                    commission.id,
                                    "approve",
                                  )
                                }
                              >
                                {busy ? (
                                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Check className="mr-1.5 h-3.5 w-3.5" />
                                )}

                                Approve
                              </Button>
                            )}

                            {commission.status ===
                              "Approved" && (
                              <Button
                                size="sm"
                                className="rounded-lg"
                                disabled={
                                  busy
                                }
                                onClick={() =>
                                  void updateCommissionStatus(
                                    commission.id,
                                    "paid",
                                  )
                                }
                              >
                                {busy ? (
                                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Wallet className="mr-1.5 h-3.5 w-3.5" />
                                )}

                                Mark Paid
                              </Button>
                            )}

                            {commission.status ===
                              "Paid" && (
                              <span className="text-xs font-medium text-muted-foreground">
                                Complete
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  },
                )
              )}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardShell>
  );
}