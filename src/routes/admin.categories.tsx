import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Pencil, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { adminNav } from "@/components/dashboard/nav-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/categories")({
  head: () => ({
    meta: [
      { title: "Categories — Dukaan.pk Admin" },
      { name: "description", content: "Create and manage marketplace product categories." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Categories — Dukaan.pk Admin" },
      { property: "og:description", content: "Category management for the marketplace." },
    ],
  }),
  component: AdminCategories,
});

type Category = { id: string; name: string };
type CategoryProduct = { id: string; name: string; image: string | null; price: number; stock: number; active: boolean };

function AdminCategories() {
  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [newCategory, setNewCategory] = useState("");
  const [saving, setSaving] = useState(false);

  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<CategoryProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productBusyId, setProductBusyId] = useState<string | null>(null);

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name")
      .eq("active", true)
      .order("name");
    if (error) {
      console.error("Unable to load categories", error);
      return;
    }
    if (data) {
      setCategoryList(data);
      const counts = await Promise.all(data.map(async (category) => {
        const { count } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("category", category.name);
        return [category.name, count ?? 0] as const;
      }));
      setProductCounts(Object.fromEntries(counts));
    }
  };

  useEffect(() => {
    void loadCategories();
  }, []);

  const addCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newCategory.trim();
    if (!name) return;
    setSaving(true);
    const { error } = await supabase.from("categories").insert({ name });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setNewCategory("");
    toast.success("Category Supabase mein save ho gayi.");
    void loadCategories();
  };

  const openEdit = (category: Category) => {
    setEditTarget(category);
    setEditName(category.name);
  };

  const saveEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editTarget) return;
    const name = editName.trim();
    if (!name) return;

    setEditSaving(true);
    const { error } = await supabase.from("categories").update({ name }).eq("id", editTarget.id);
    setEditSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Category update ho gayi.");
    setEditTarget(null);
    void loadCategories();
  };

  const handleDelete = async (category: Category) => {
    const confirmed = window.confirm(`Kya aap "${category.name}" ko delete karna chahte hain?`);
    if (!confirmed) return;

    setDeletingId(category.id);
    const { error } = await supabase.from("categories").delete().eq("id", category.id);
    setDeletingId(null);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Category delete ho gayi.");
    setCategoryList((current) => current.filter((c) => c.id !== category.id));
  };

  const openCategoryProducts = async (categoryName: string) => {
    if (selectedCategory === categoryName) {
      setSelectedCategory(null);
      return;
    }
    setSelectedCategory(categoryName);
    setProductsLoading(true);
    const { data, error } = await supabase.from("products").select("id, name, image, price, stock, active").eq("category", categoryName).order("created_at", { ascending: false });
    if (error) toast.error("Category products load nahi ho sake.");
    setCategoryProducts((data ?? []).map((product) => ({ ...product, price: Number(product.price) })));
    setProductsLoading(false);
  };

  const toggleProduct = async (product: CategoryProduct) => {
    setProductBusyId(product.id);
    const { error } = await supabase.from("products").update({ active: !product.active }).eq("id", product.id);
    setProductBusyId(null);
    if (error) {
      toast.error("Product visibility update nahi ho saki.");
      return;
    }
    setCategoryProducts((current) => current.map((item) => item.id === product.id ? { ...item, active: !item.active } : item));
    toast.success(product.active ? "Product website se hide ho gaya." : "Product website par show ho gaya.");
  };

  return (
    <DashboardShell
      brand="Dukaan.pk"
      role="Owner / Admin"
      title="Categories"
      subtitle={`${categoryList.length} active categories`}
      nav={adminNav}
      actions={
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl"><Plus className="mr-2 h-4 w-4" /> New Category</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Category</DialogTitle>
              <DialogDescription>Nayi category marketplace mein shamil karein.</DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={addCategory}
            >
              <div className="space-y-1.5">
                <Label htmlFor="cn">Category Name</Label>
                <Input id="cn" value={newCategory} onChange={(event) => setNewCategory(event.target.value)} required placeholder="e.g. Sports" className="rounded-xl" />
              </div>
              <Button type="submit" disabled={saving} className="w-full rounded-xl">{saving ? "Saving..." : "Add Category"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {categoryList.map((c) => (
          <div key={c.id} className={`surface-card p-5 ${selectedCategory === c.name ? "border-primary" : ""}`}>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
              <button type="button" className="min-w-0 text-left" onClick={() => void openCategoryProducts(c.name)}>
                <p className="truncate font-semibold">{c.name}</p>
                <p className="text-xs text-muted-foreground">
                  {productCounts[c.name] ?? 0} products
                </p>
                <p className="mt-2 text-xs font-semibold text-primary">{selectedCategory === c.name ? "Close products" : "View products"}</p>
              </button>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  disabled={deletingId === c.id}
                  onClick={() => handleDelete(c)}
                >
                  {deletingId === c.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
            {selectedCategory === c.name && (
              <div className="mt-4 border-t pt-4">
                {productsLoading ? <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div> : categoryProducts.length === 0 ? <p className="text-sm text-muted-foreground">Is category mein koi product nahi.</p> : <div className="space-y-2">{categoryProducts.slice(0, 20).map((product) => <div key={product.id} className="flex items-center gap-3 rounded-xl bg-muted/60 p-2"><img src={product.image || "/favicon.ico"} alt="" width={40} height={40} className="h-10 w-10 rounded-lg object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{product.name}</p><p className="text-xs text-muted-foreground">Rs. {product.price.toLocaleString("en-PK")} · Stock {product.stock}</p></div><Button variant={product.active ? "outline" : "default"} size="sm" className="rounded-lg" disabled={productBusyId === product.id} onClick={() => void toggleProduct(product)}>{product.active ? <><EyeOff className="mr-1 h-3.5 w-3.5" /> Hide</> : <><Eye className="mr-1 h-3.5 w-3.5" /> Show</>}</Button></div>)}</div>}
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Category ka naam update karein.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={saveEdit}>
            <div className="space-y-1.5">
              <Label htmlFor="ecn">Category Name</Label>
              <Input
                id="ecn"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                required
                className="rounded-xl"
              />
            </div>
            <Button type="submit" disabled={editSaving} className="w-full rounded-xl">
              {editSaving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}