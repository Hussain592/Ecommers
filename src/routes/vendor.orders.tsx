import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Eye,
  Loader2,
  PackageCheck,
  Phone,
  Printer,
  Search,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { vendorNav } from "@/components/dashboard/nav-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatPKR } from "@/data/mock";
import { PrintOrderMenu } from "@/components/dashboard/PrintOrderMenu";
import { printOrdersUrl } from "@/lib/print";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/vendor/orders")({
  head: () => ({
    meta: [
      { title: "azadari.store" },
      {
        name: "description",
        content: "View and manage COD orders received by your azadari.store store.",
      },
      { property: "og:title", content: "Vendor Orders — azadari.store" },
      { property: "og:description", content: "Track and update your COD order pipeline." },
    ],
  }),
  component: VendorOrders,
});

const tabs = ["All", "Pending", "Confirmed", "Dispatched", "Delivered", "Cancelled"] as const;

/**
 * The one forward step for each status, shown as a single clear button.
 * Matches what the database allows a vendor to do.
 */
const nextStep: Record<string, { status: string; label: string; icon: typeof Truck } | undefined> =
  {
    Pending: { status: "Confirmed", label: "Confirm", icon: CheckCircle2 },
    Confirmed: { status: "Dispatched", label: "Mark dispatched", icon: Truck },
    Dispatched: { status: "Delivered", label: "Mark delivered", icon: PackageCheck },
  };

const cancellable = new Set(["Pending", "Confirmed"]);

type OrderItem = {
  name?: string;
  quantity?: number;
  price?: number;
  size?: string | null;
  color?: string | null;
};

type OrderRow = {
  id: string;
  customer_name: string;
  phone: string;
  city: string;
  address: string | null;
  total: number;
  delivery_fee: number | null;
  status: string;
  items: unknown;
  created_at: string;
  cancel_reason: string | null;
  cancelled_by: string | null;
};

const orderItems = (order: OrderRow): OrderItem[] =>
  Array.isArray(order.items) ? (order.items as OrderItem[]) : [];

const itemCount = (order: OrderRow) =>
  orderItems(order).reduce((sum, item) => sum + Number(item.quantity ?? 0), 0);

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });

function VendorOrders() {
  const [tab, setTab] = useState<string>("All");
  const [q, setQ] = useState("");
  const [storeName, setStoreName] = useState("My Store");
  const [orderList, setOrderList] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const loadOrders = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        setLoading(false);
        return;
      }

      const { data: vendor } = await supabase
        .from("vendors")
        .select("id, name")
        .eq("owner_id", authData.user.id)
        .maybeSingle();
      if (!vendor) {
        setLoading(false);
        return;
      }
      setStoreName(vendor.name);

      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, customer_name, phone, city, address, total, delivery_fee, status, items, created_at, cancel_reason, cancelled_by",
        )
        .eq("vendor_id", vendor.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Unable to load vendor orders", error);
        setLoadError(true);
      } else {
        setOrderList(data ?? []);
      }
      setLoading(false);
    };
    void loadOrders();
  }, []);

  // Confirmed orders are packed and waiting for the courier: the daily label run.
  const readyToShip = useMemo(
    () => orderList.filter((order) => order.status === "Confirmed").map((order) => order.id),
    [orderList],
  );

  const counts = useMemo(() => {
    const result: Record<string, number> = { All: orderList.length };
    for (const order of orderList) result[order.status] = (result[order.status] ?? 0) + 1;
    return result;
  }, [orderList]);

  const query = q.trim().toLowerCase();
  const list = orderList.filter(
    (o) =>
      (tab === "All" || o.status === tab) &&
      (!query ||
        o.id.toLowerCase().includes(query) ||
        o.customer_name.toLowerCase().includes(query) ||
        o.phone.includes(query)),
  );

  const updateStatus = async (order: OrderRow, status: string) => {
    setBusyId(order.id);
    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", order.id)
      .select("id");
    setBusyId(null);

    if (error || !data || data.length === 0) {
      console.error("Unable to update order status", error);
      toast.error("Couldn't update the order. Please try again.");
      return;
    }

    setOrderList((current) =>
      current.map((item) => (item.id === order.id ? { ...item, status } : item)),
    );
    toast.success(`Order ${order.id} is now ${status.toLowerCase()}.`);

    if (status === "Confirmed") {
      const { error: emailError } = await supabase.functions.invoke("send-confirmation-email", {
        body: { type: "order", id: order.id },
      });
      if (emailError) {
        console.error("Order confirmed but email notification failed:", emailError);
        toast.error("Order confirmed, but the email to the customer couldn't be sent.");
      } else {
        toast.success("Confirmation email sent to the customer.");
      }
    }
  };

  return (
    <DashboardShell
      brand={storeName}
      role="Vendor Account"
      title="Orders"
      subtitle={
        counts["Pending"]
          ? `${counts["Pending"]} waiting for your confirmation`
          : "Manage your Cash on Delivery orders"
      }
      nav={vendorNav}
      actions={
        readyToShip.length > 0 ? (
          <Button asChild size="sm" className="rounded-xl">
            <a href={printOrdersUrl(readyToShip, "label")} target="_blank" rel="noopener">
              <Printer aria-hidden="true" className="mr-2 h-4 w-4" />
              Print {readyToShip.length} {readyToShip.length === 1 ? "label" : "labels"}
            </a>
          </Button>
        ) : undefined
      }
    >
      <div className="surface-card space-y-4 p-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl">
            {tabs.map((t) => (
              <TabsTrigger key={t} value={t} className="gap-1.5 rounded-lg text-xs">
                {t}
                <span className="rounded-full bg-background/70 px-1.5 text-[10px] tabular-nums text-muted-foreground">
                  {counts[t] ?? 0}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative max-w-sm">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by order ID, customer or phone"
            aria-label="Search orders"
            className="h-10 rounded-xl pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-10" role="status" aria-label="Loading orders">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : loadError ? (
        <EmptyState
          icon={ShoppingBag}
          title="Couldn't load your orders"
          description="Check your connection and refresh the page."
          action={
            <Button className="rounded-xl" onClick={() => window.location.reload()}>
              Refresh page
            </Button>
          }
        />
      ) : orderList.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No orders yet"
          description="When customers buy your products, their orders will appear here."
        />
      ) : (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-sm">
              <thead className="bg-muted/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">City</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Total (COD)</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Next step</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.map((o) => {
                  const step = nextStep[o.status];
                  const busy = busyId === o.id;
                  return (
                    <tr key={o.id} className="hover:bg-muted/40">
                      <td className="px-4 py-3">
                        <p className="font-medium">{o.id}</p>
                        <p className="text-xs text-muted-foreground">
                          {itemCount(o)} {itemCount(o) === 1 ? "item" : "items"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{o.customer_name}</p>
                        <a
                          href={`tel:${o.phone}`}
                          className="text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
                        >
                          {o.phone}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{o.city}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(o.created_at)}
                      </td>
                      <td className="px-4 py-3 font-medium">{formatPKR(Number(o.total))}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={o.status} />
                        {o.status === "Cancelled" && o.cancelled_by === "customer" && (
                          <p className="mt-1 max-w-48 text-[11px] leading-4 text-muted-foreground">
                            Cancelled by customer{o.cancel_reason ? `: ${o.cancel_reason}` : ""}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {step && (
                            <Button
                              size="sm"
                              className="rounded-lg"
                              disabled={busy}
                              onClick={() => void updateStatus(o, step.status)}
                            >
                              {busy ? (
                                <Loader2
                                  aria-hidden="true"
                                  className="mr-1.5 h-3.5 w-3.5 animate-spin"
                                />
                              ) : (
                                <step.icon aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />
                              )}
                              {step.label}
                            </Button>
                          )}

                          {cancellable.has(o.status) && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-lg text-destructive hover:text-destructive"
                                  disabled={busy}
                                >
                                  <XCircle aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />
                                  Cancel
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="portal-theme">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Cancel order {o.id}?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    The items go back into stock and the order can't be reopened.
                                    Let {o.customer_name} know before you cancel.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Keep order</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => void updateStatus(o, "Cancelled")}
                                  >
                                    Cancel order
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}

                          <PrintOrderMenu orderId={o.id} />

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-lg"
                                aria-label={`View details of order ${o.id}`}
                              >
                                <Eye aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" /> View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="portal-theme">
                              <DialogHeader>
                                <DialogTitle>Order {o.id}</DialogTitle>
                                <DialogDescription>
                                  Placed on {formatDate(o.created_at)} · Cash on Delivery
                                </DialogDescription>
                              </DialogHeader>

                              <div className="space-y-4 text-sm">
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">Status</span>
                                  <StatusBadge status={o.status} />
                                </div>

                                <div className="rounded-xl border border-border p-3">
                                  <p className="font-semibold">{o.customer_name}</p>
                                  <a
                                    href={`tel:${o.phone}`}
                                    className="mt-1 inline-flex items-center gap-1.5 text-primary underline-offset-4 hover:underline"
                                  >
                                    <Phone aria-hidden="true" className="h-3.5 w-3.5" />
                                    {o.phone}
                                  </a>
                                  <p className="mt-1 text-muted-foreground">
                                    {[o.address, o.city].filter(Boolean).join(", ")}
                                  </p>
                                </div>

                                <ul className="divide-y divide-border rounded-xl border border-border">
                                  {orderItems(o).map((item, index) => (
                                    <li
                                      key={`${item.name}-${index}`}
                                      className="flex justify-between gap-3 p-3"
                                    >
                                      <span>
                                        {item.name ?? "Product"}
                                        {(item.size || item.color) && (
                                          <span className="text-muted-foreground">
                                            {" "}
                                            ({[item.size, item.color].filter(Boolean).join(", ")})
                                          </span>
                                        )}{" "}
                                        <span className="text-muted-foreground">
                                          × {Number(item.quantity ?? 0)}
                                        </span>
                                      </span>
                                      <span className="font-medium">
                                        {formatPKR(
                                          Number(item.price ?? 0) * Number(item.quantity ?? 0),
                                        )}
                                      </span>
                                    </li>
                                  ))}
                                </ul>

                                <div className="space-y-1.5">
                                  <div className="flex justify-between text-muted-foreground">
                                    <span>Delivery</span>
                                    <span>
                                      {Number(o.delivery_fee ?? 0) === 0
                                        ? "Free"
                                        : formatPKR(Number(o.delivery_fee))}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-base font-semibold">
                                    <span>Collect on delivery</span>
                                    <span>{formatPKR(Number(o.total))}</span>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {list.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              <p>No orders match this filter.</p>
              <Button
                variant="link"
                className="mt-1"
                onClick={() => {
                  setTab("All");
                  setQ("");
                }}
              >
                Show all orders
              </Button>
            </div>
          )}
        </div>
      )}
    </DashboardShell>
  );
}
