import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, PackageSearch, ShoppingBag } from "lucide-react";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { formatPKR } from "@/data/mock";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "My Orders — Dukaan.pk" }, { name: "description", content: "View your Dukaan.pk Cash on Delivery orders." }] }),
  component: OrdersPage,
});

type Order = { id: string; customer_name: string; city: string | null; total: number; status: string; created_at: string; items: Array<{ name: string; quantity: number }> | null };

function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const loadOrders = async () => {
      const { data } = await supabase.from("orders").select("id, customer_name, city, total, status, created_at, items").eq("customer_id", user.id).order("created_at", { ascending: false });
      setOrders((data ?? []).map((order) => ({ ...order, total: Number(order.total), items: Array.isArray(order.items) ? order.items : null })));
      setLoading(false);
    };
    void loadOrders();
  }, [user]);

  if (authLoading || loading) return <ShopLayout><div className="flex justify-center p-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div></ShopLayout>;
  if (!user) return <ShopLayout><div className="mx-auto max-w-2xl px-4 py-20"><EmptyState icon={ShoppingBag} title="Order history ke liye login zaroori nahi" description="Guest order ko Order ID aur mobile number se track karein." action={<div className="flex flex-wrap justify-center gap-3"><Button asChild className="rounded-xl"><Link to="/track-order">Track order</Link></Button><Button asChild variant="outline" className="rounded-xl"><Link to="/products">Start shopping</Link></Button></div>} /></div></ShopLayout>;

  return <ShopLayout><div className="mx-auto max-w-4xl px-4 py-8"><h1 className="text-2xl font-extrabold sm:text-3xl">My Orders</h1><p className="mt-1 text-sm text-muted-foreground">Apne COD orders ka status yahan dekhein.</p>{orders.length === 0 ? <div className="mt-6"><EmptyState icon={PackageSearch} title="Abhi koi order nahi" description="Products browse karke apna pehla order place karein." action={<Button asChild className="rounded-xl"><Link to="/products">Start shopping</Link></Button>} /></div> : <div className="mt-6 space-y-4">{orders.map((order) => <article key={order.id} className="surface-card p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-display font-bold">{order.id}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString("en-PK")} {order.city && `· ${order.city}`}</p></div><span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">{order.status}</span></div><div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t pt-4"><div><p className="text-xs text-muted-foreground">Items</p><p className="mt-1 text-sm">{order.items?.map((item) => `${item.name} × ${item.quantity}`).join(", ") ?? "Order items"}</p></div><p className="font-display text-lg font-extrabold text-primary">{formatPKR(order.total)}</p></div><Button asChild variant="outline" size="sm" className="mt-4 rounded-lg"><Link to="/track-order">Track order</Link></Button></article>)}</div>}</div></ShopLayout>;
}
