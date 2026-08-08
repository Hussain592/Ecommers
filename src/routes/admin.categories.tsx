import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import { categories, products } from "@/data/mock";

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

function AdminCategories() {
  return (
    <DashboardShell
      brand="Dukaan.pk"
      role="Owner / Admin"
      title="Categories"
      subtitle={`${categories.length} active categories`}
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
              onSubmit={(e) => {
                e.preventDefault();
                toast.success("Category add ho gayi (demo)");
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="cn">Category Name</Label>
                <Input id="cn" required placeholder="e.g. Sports" className="rounded-xl" />
              </div>
              <Button type="submit" className="w-full rounded-xl">Add Category</Button>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map((c) => (
          <div key={c} className="surface-card p-5">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold">{c}</p>
                <p className="text-xs text-muted-foreground">
                  {products.filter((p) => p.category === c).length} products
                </p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast("Edit category (demo)")}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => toast("Category deleted (demo)")}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}