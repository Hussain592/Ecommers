import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, FileText, Loader2, Printer, Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatPKR } from "@/data/mock";
import { useAuth } from "@/lib/auth";
import { code128B } from "@/lib/barcode";
import { useSupportHelpline } from "@/lib/store-info";
import { supabase } from "@/lib/supabase";

type Doc = "invoice" | "label";

export const Route = createFileRoute("/print/orders")({
  validateSearch: (search: Record<string, unknown>): { ids: string; doc: Doc } => ({
    ids: typeof search["ids"] === "string" ? search["ids"] : "",
    doc: search["doc"] === "invoice" ? "invoice" : "label",
  }),
  head: () => ({
    meta: [{ title: "Print orders — azadari.store" }, { name: "robots", content: "noindex" }],
  }),
  component: PrintOrders,
});

type OrderItem = {
  name?: string;
  quantity?: number;
  price?: number;
  size?: string | null;
  color?: string | null;
};

type VendorInfo = { name: string; contact: string | null; address: string | null };

type PrintOrder = {
  id: string;
  customer_name: string;
  phone: string;
  alternate_phone: string | null;
  city: string;
  address: string;
  notes: string | null;
  total: number;
  delivery_fee: number;
  status: string;
  items: OrderItem[];
  created_at: string;
  vendor: VendorInfo | null;
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });

const variantText = (item: OrderItem) => [item.size, item.color].filter(Boolean).join(" · ");

function Barcode({ value }: { value: string }) {
  const modules = code128B(value);
  if (!modules) return null;
  const quiet = 10;
  const total = modules.reduce((sum, width) => sum + width, 0) + quiet * 2;
  let x = quiet;
  const bars: Array<{ x: number; w: number }> = [];
  modules.forEach((width, index) => {
    if (index % 2 === 0) bars.push({ x, w: width });
    x += width;
  });
  return (
    <svg
      viewBox={`0 0 ${total} 50`}
      preserveAspectRatio="none"
      className="h-14 w-full"
      role="img"
      aria-label={`Barcode for ${value}`}
    >
      <rect width={total} height="50" fill="#fff" />
      {bars.map((bar) => (
        <rect key={bar.x} x={bar.x} y="0" width={bar.w} height="50" fill="#000" />
      ))}
    </svg>
  );
}

function ShippingLabel({ order }: { order: PrintOrder }) {
  const itemCount = order.items.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0);
  return (
    <section className="print-page label-page mx-auto flex flex-col border-2 border-black bg-white p-3 text-black">
      <div className="flex items-center justify-between border-b-2 border-black pb-2">
        <p className="text-base font-extrabold">azadari.store</p>
        <p className="rounded border-2 border-black px-2 py-0.5 text-xs font-extrabold">
          CASH ON DELIVERY
        </p>
      </div>

      <div className="border-b-2 border-black py-2 text-center">
        <p className="text-[10px] font-bold uppercase tracking-wider">Collect from customer</p>
        <p className="text-3xl font-extrabold leading-tight">{formatPKR(order.total)}</p>
      </div>

      <div className="border-b-2 border-black py-2">
        <Barcode value={order.id} />
        <p className="mt-1 text-center font-mono text-base font-bold tracking-wider">{order.id}</p>
      </div>

      <div className="border-b-2 border-black py-2">
        <p className="text-[10px] font-bold uppercase tracking-wider">Deliver to</p>
        <p className="text-lg font-extrabold leading-snug">{order.customer_name}</p>
        <p className="text-sm font-bold">
          {order.phone}
          {order.alternate_phone ? ` / ${order.alternate_phone}` : ""}
        </p>
        <p className="mt-1 text-sm leading-snug">{order.address}</p>
        <p className="text-xl font-extrabold uppercase">{order.city}</p>
      </div>

      <div className="flex-1 border-b-2 border-black py-2 text-xs">
        <p className="text-[10px] font-bold uppercase tracking-wider">From</p>
        <p className="font-bold">{order.vendor?.name ?? "azadari.store"}</p>
        {order.vendor?.contact && <p>{order.vendor.contact}</p>}
        {order.vendor?.address && <p className="leading-snug">{order.vendor.address}</p>}
      </div>

      <div className="flex justify-between pt-2 text-[11px] font-semibold">
        <span>
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </span>
        <span>{formatDate(order.created_at)}</span>
      </div>
      {order.notes && (
        <p className="mt-1 text-[11px] leading-snug">
          <span className="font-bold">Note:</span> {order.notes}
        </p>
      )}
    </section>
  );
}

function Invoice({ order, helpline }: { order: PrintOrder; helpline: string | null }) {
  const subtotal = order.items.reduce(
    (sum, item) => sum + Number(item.price ?? 0) * Number(item.quantity ?? 0),
    0,
  );
  return (
    <section className="print-page invoice-page mx-auto bg-white p-8 text-[#111]">
      <header className="flex items-start justify-between border-b-2 border-[#0b513b] pb-4">
        <div>
          <p className="text-2xl font-extrabold text-[#0b513b]">azadari.store</p>
          <p className="text-xs text-[#555]">Islamic Marketplace · Cash on Delivery</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold">Invoice</p>
          <p className="font-mono text-sm">{order.id}</p>
          <p className="text-xs text-[#555]">{formatDate(order.created_at)}</p>
        </div>
      </header>

      <div className="mt-5 grid grid-cols-2 gap-6 text-sm">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#777]">Sold by</p>
          <p className="font-semibold">{order.vendor?.name ?? "azadari.store"}</p>
          {order.vendor?.contact && <p>{order.vendor.contact}</p>}
          {order.vendor?.address && <p className="text-[#444]">{order.vendor.address}</p>}
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#777]">Bill to</p>
          <p className="font-semibold">{order.customer_name}</p>
          <p>{order.phone}</p>
          <p className="text-[#444]">
            {order.address}, {order.city}
          </p>
        </div>
      </div>

      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b border-[#ccc] text-left text-[11px] uppercase tracking-wider text-[#777]">
            <th className="py-2">Item</th>
            <th className="py-2 text-right">Qty</th>
            <th className="py-2 text-right">Price</th>
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, index) => (
            <tr key={`${item.name}-${index}`} className="border-b border-[#eee] align-top">
              <td className="py-2">
                <p className="font-medium">{item.name ?? "Product"}</p>
                {variantText(item) && <p className="text-xs text-[#666]">{variantText(item)}</p>}
              </td>
              <td className="py-2 text-right">{Number(item.quantity ?? 0)}</td>
              <td className="py-2 text-right">{formatPKR(Number(item.price ?? 0))}</td>
              <td className="py-2 text-right">
                {formatPKR(Number(item.price ?? 0) * Number(item.quantity ?? 0))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ml-auto mt-4 w-80 space-y-1 text-sm [&_span:last-child]:whitespace-nowrap">
        <div className="flex justify-between">
          <span className="text-[#555]">Subtotal</span>
          <span>{formatPKR(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#555]">Delivery</span>
          <span>
            {Number(order.delivery_fee) === 0 ? "Free" : formatPKR(Number(order.delivery_fee))}
          </span>
        </div>
        <div className="flex justify-between border-t-2 border-[#0b513b] pt-2 text-base font-bold">
          <span>Total (Cash on Delivery)</span>
          <span>{formatPKR(order.total)}</span>
        </div>
      </div>

      <footer className="mt-10 border-t border-[#ddd] pt-3 text-center text-xs text-[#666]">
        Thank you for shopping with azadari.store.
        {helpline ? ` Questions? Call ${helpline}.` : ""}
      </footer>
    </section>
  );
}

function PrintOrders() {
  const { ids, doc } = Route.useSearch();
  const navigate = useNavigate({ from: "/print/orders" });
  const { user, loading: authLoading } = useAuth();
  const helpline = useSupportHelpline();
  const [orders, setOrders] = useState<PrintOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const idList = useMemo(
    () =>
      [
        ...new Set(
          ids
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean),
        ),
      ].slice(0, 100),
    [ids],
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user || idList.length === 0) {
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      const { data, error: loadError } = await supabase
        .from("orders")
        .select(
          "id, customer_name, phone, alternate_phone, city, address, notes, total, delivery_fee, status, items, created_at, vendors(name, contact, address)",
        )
        .in("id", idList);
      if (loadError) {
        console.error("Unable to load orders for printing", loadError);
        setError("Couldn't load these orders. Please go back and try again.");
        setLoading(false);
        return;
      }
      const byId = new Map(
        (data ?? []).map((row) => {
          const vendors = row.vendors as VendorInfo | VendorInfo[] | null;
          return [
            row.id,
            {
              ...row,
              total: Number(row.total),
              delivery_fee: Number(row.delivery_fee ?? 0),
              items: Array.isArray(row.items) ? (row.items as OrderItem[]) : [],
              vendor: Array.isArray(vendors) ? (vendors[0] ?? null) : vendors,
            } as PrintOrder,
          ];
        }),
      );
      // Keep the order the user selected them in.
      setOrders(idList.map((id) => byId.get(id)).filter((o): o is PrintOrder => Boolean(o)));
      setLoading(false);
    };
    void load();
  }, [authLoading, user, idList]);

  const missing = idList.length - orders.length;
  const title = doc === "label" ? "Shipping label" : "Invoice";

  return (
    <div className="min-h-screen bg-[#eef0ec] print:bg-white">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .print-page { box-shadow: none !important; margin: 0 auto !important; }
          .print-page + .print-page { break-before: page; }
        }
        @page { size: ${doc === "label" ? "100mm 150mm" : "A4"}; margin: ${doc === "label" ? "3mm" : "12mm"}; }
        .label-page { width: 94mm; min-height: 144mm; }
        .invoice-page { width: 186mm; min-height: 260mm; }
        @media screen {
          .print-page { margin-bottom: 24px; box-shadow: 0 6px 24px rgba(8,43,33,.12); }
        }
      `}</style>

      <div className="no-print sticky top-0 z-10 border-b border-[#d8cdae] bg-[#fffdf7]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => (window.history.length > 1 ? window.history.back() : window.close())}
            >
              <ArrowLeft aria-hidden="true" className="mr-1.5 h-4 w-4" />
              Back
            </Button>
            <div>
              <p className="text-sm font-bold text-[#102d24]">
                {loading
                  ? "Preparing..."
                  : `${orders.length} ${title.toLowerCase()}${orders.length === 1 ? "" : "s"} ready to print`}
              </p>
              <p className="text-xs text-[#6f7d75]">Check the preview below, then print.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              className="flex rounded-xl border border-[#d8cdae] bg-white p-1"
              role="group"
              aria-label="Choose document"
            >
              {(
                [
                  { key: "label", label: "Shipping label", icon: Tag },
                  { key: "invoice", label: "Invoice", icon: FileText },
                ] as const
              ).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  aria-pressed={doc === item.key}
                  onClick={() =>
                    void navigate({ search: (prev) => ({ ...prev, doc: item.key }), replace: true })
                  }
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b] ${
                    doc === item.key
                      ? "bg-[#082b21] text-[#fffaf0]"
                      : "text-[#44564d] hover:bg-[#f7f1e4]"
                  }`}
                >
                  <item.icon aria-hidden="true" className="h-3.5 w-3.5" />
                  {item.label}
                </button>
              ))}
            </div>
            <Button
              type="button"
              autoFocus
              disabled={loading || orders.length === 0}
              onClick={() => window.print()}
              className="rounded-xl bg-[#082b21] text-[#fffaf0] hover:bg-[#0d3d2f]"
            >
              <Printer aria-hidden="true" className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </div>
      </div>

      <main className="px-4 py-6 print:p-0">
        {authLoading || loading ? (
          <div className="no-print flex justify-center py-20" role="status">
            <Loader2 className="h-6 w-6 animate-spin text-[#0b513b]" />
          </div>
        ) : !user ? (
          <div className="no-print mx-auto max-w-md rounded-2xl bg-white p-8 text-center">
            <p className="font-semibold">Sign in to print orders.</p>
            <Button asChild className="mt-4 rounded-xl">
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
        ) : error || orders.length === 0 ? (
          <div
            className="no-print mx-auto max-w-md rounded-2xl bg-white p-8 text-center"
            role="alert"
          >
            <p className="font-semibold">{error || "No orders to print."}</p>
            <p className="mt-1 text-sm text-[#6f7d75]">
              Choose orders from your Orders page and use Print.
            </p>
          </div>
        ) : (
          <>
            {missing > 0 && (
              <p className="no-print mx-auto mb-4 max-w-md rounded-xl bg-[#fdf3dc] p-3 text-center text-sm text-[#7a5a12]">
                {missing} of {idList.length} orders couldn't be loaded and are not included.
              </p>
            )}
            {orders.map((order) =>
              doc === "label" ? (
                <ShippingLabel key={order.id} order={order} />
              ) : (
                <Invoice key={order.id} order={order} helpline={helpline} />
              ),
            )}
          </>
        )}
      </main>
    </div>
  );
}
