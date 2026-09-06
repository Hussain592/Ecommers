import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, Loader2, MapPin, MessageCircle, Phone, ShieldCheck, Store, Truck, Undo2, Users } from "lucide-react";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { ProductCard } from "@/components/shop/ProductCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { PackageSearch } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { resolveProductImage, type Product } from "@/data/mock";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/store/$vendorId")({
  head: () => ({
    meta: [
      { title: "Vendor Store — Dukaan.pk" },
      { name: "description", content: "Browse all products from this Dukaan.pk vendor." },
    ],
  }),
  component: VendorStorePage,
});

type VendorInfo = {
  id: string;
  name: string;
  contact: string | null;
  address: string | null;
  description: string | null;
  email: string | null;
  created_at: string;
};

function VendorStorePage() {
  const { vendorId } = Route.useParams();
  const [vendor, setVendor] = useState<VendorInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const [vendorRes, productsRes] = await Promise.all([
        supabase.from("vendors").select("id, name, contact, address, description, email, created_at").eq("id", vendorId).maybeSingle(),
        supabase
          .from("products")
          .select("id, name, description, image, price, compare_price, stock, category")
          .eq("vendor_id", vendorId)
          .eq("active", true)
          .order("created_at", { ascending: false }),
      ]);

      if (vendorRes.data) {
        setVendor(vendorRes.data);
        const [{ data: count }, { data: currentFollow }] = await Promise.all([
          supabase.rpc("vendor_follower_count", { target_vendor_id: vendorId }),
          user
            ? supabase.from("vendor_followers").select("vendor_id").eq("vendor_id", vendorId).eq("user_id", user.id).maybeSingle()
            : Promise.resolve({ data: null }),
        ]);
        setFollowerCount(Number(count ?? 0));
        setIsFollowing(Boolean(currentFollow));
      }

      if (productsRes.data) {
        setProducts(
          productsRes.data.map((item) => ({
            id: item.id,
            name: item.name,
            slug: item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
            category: item.category ?? "Uncategorized",
            price: Number(item.price),
            oldPrice: item.compare_price ? Number(item.compare_price) : undefined,
            stock: item.stock,
            active: true,
            vendor: vendorRes.data?.name ?? "Dukaan.pk Seller",
            vendorId,
            city: "",
            rating: 0,
            reviews: 0,
            image: resolveProductImage(item.image),
            description: item.description ?? "",
          })),
        );
      }

      setLoading(false);
    };
    void load();
  }, [vendorId, user]);

  const toggleFollow = async () => {
    if (!user) {
      await navigate({ to: "/login" });
      return;
    }
    setFollowBusy(true);
    const result = isFollowing
      ? await supabase.from("vendor_followers").delete().eq("vendor_id", vendorId).eq("user_id", user.id)
      : await supabase.from("vendor_followers").insert({ vendor_id: vendorId, user_id: user.id });
    setFollowBusy(false);
    if (result.error) {
      toast.error("Follow update nahi ho saka.");
      return;
    }
    setIsFollowing((value) => !value);
    setFollowerCount((count) => count + (isFollowing ? -1 : 1));
    toast.success(isFollowing ? "Store unfollow ho gaya." : "Store follow ho gaya.");
  };

  if (loading) {
    return (
      <ShopLayout>
        <div className="flex justify-center p-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </ShopLayout>
    );
  }

  if (!vendor) {
    return (
      <ShopLayout>
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Store nahi mila</h1>
          <Link to="/products" className="mt-4 inline-block text-primary underline">Products dekhein</Link>
        </div>
      </ShopLayout>
    );
  }

  return (
    <ShopLayout>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <div className="h-28 bg-linear-to-r from-primary via-blue-500 to-cyan-400 sm:h-36" />
          <div className="px-5 pb-5 sm:px-8">
            <div className="-mt-10 flex flex-col gap-4 sm:-mt-12 sm:flex-row sm:items-end">
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl border-4 border-card bg-primary-soft text-primary shadow-card sm:h-24 sm:w-24"><Store className="h-9 w-9" /></div>
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-extrabold sm:text-3xl">{vendor.name}</h1><span className="flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success"><CheckCircle2 className="h-3.5 w-3.5" /> Verified store</span></div><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">{vendor.address && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{vendor.address}</span>}<span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> Responds within 1 hour</span></div></div>
              <div className="flex flex-wrap gap-2"><Button variant="outline" className="rounded-xl" onClick={() => vendor.contact && window.open(`tel:${vendor.contact}`)}><Phone className="mr-2 h-4 w-4" /> Contact</Button><Button className="rounded-xl" onClick={() => vendor.contact && window.open(`tel:${vendor.contact}`)}><MessageCircle className="mr-2 h-4 w-4" /> Chat seller</Button><Button variant={isFollowing ? "secondary" : "outline"} className="rounded-xl" disabled={followBusy} onClick={() => void toggleFollow()}><Users className="mr-2 h-4 w-4" /> {isFollowing ? "Following" : "Follow store"}</Button></div>
            </div>
            <div className="mt-6 grid grid-cols-2 border-t pt-5 text-center sm:grid-cols-4"><div><p className="text-xl font-extrabold text-primary">4.7/5</p><p className="text-xs text-muted-foreground">Seller rating</p></div><div className="border-l"><p className="text-xl font-extrabold">{products.length}</p><p className="text-xs text-muted-foreground">Products</p></div><div className="border-t pt-4 sm:border-l sm:border-t-0 sm:pt-0"><p className="flex items-center justify-center gap-1 text-xl font-extrabold text-success"><Users className="h-4 w-4" />{followerCount.toLocaleString("en-PK")}</p><p className="text-xs text-muted-foreground">Followers</p></div><div className="border-l border-t pt-4 sm:border-t-0 sm:pt-0"><p className="text-xl font-extrabold">24h</p><p className="text-xs text-muted-foreground">Dispatch time</p></div></div>
          </div>
        </div>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="surface-card p-5 sm:p-6"><div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /><h2 className="text-lg font-bold">About {vendor.name}</h2></div><p className="mt-3 text-sm leading-7 text-muted-foreground">{vendor.description || `${vendor.name} is a verified Dukaan.pk seller offering quality products with Cash on Delivery.`}</p><div className="mt-5 grid gap-3 text-sm sm:grid-cols-2"><p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> Genuine products</p><p className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /><span>Nationwide delivery</span></p><p className="flex items-center gap-2"><Undo2 className="h-4 w-4 text-primary" /><span>7-day return policy</span></p><p className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-primary" /> Fast response</p></div></div>
          <div className="surface-card p-5 sm:p-6"><h2 className="text-lg font-bold">Store information</h2><div className="mt-4 space-y-4 text-sm">{vendor.email && <div><p className="text-xs text-muted-foreground">Email</p><p className="mt-1 font-medium">{vendor.email}</p></div>}{vendor.contact && <div><p className="text-xs text-muted-foreground">Phone</p><p className="mt-1 font-medium">{vendor.contact}</p></div>}<div><p className="text-xs text-muted-foreground">Member since</p><p className="mt-1 font-medium">{new Date(vendor.created_at).toLocaleDateString("en-PK", { month: "long", year: "numeric" })}</p></div><div><p className="text-xs text-muted-foreground">Payment method</p><p className="mt-1 font-medium">Cash on Delivery</p></div></div></div>
        </section>

        <div className="mt-10 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-primary">Shop from this seller</p><h2 className="mt-1 text-2xl font-extrabold">All products</h2></div><p className="text-sm text-muted-foreground">{products.length} products available</p></div>

        <div className="mt-8">
          {products.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="Is store mein abhi koi product nahi"
              description="Baad mein dobara check karein."
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </ShopLayout>
  );
}