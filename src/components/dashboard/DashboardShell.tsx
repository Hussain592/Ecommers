import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, LogOut, Menu, X } from "lucide-react";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export type NavItem = { to: string; label: string; icon: ComponentType<{ className?: string }> };

type Props = {
  title: string;
  subtitle?: string;
  brand: string;
  role: string;
  nav: NavItem[];
  actions?: ReactNode;
  children: ReactNode;
};

export function DashboardShell({ title, subtitle, brand, role, nav, actions, children }: Props) {
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user, profile, loading, signOut } = useAuth();
  const portalRole = nav[0]?.to.startsWith("/admin") ? "admin" : nav[0]?.to.startsWith("/partner") ? "partner" : "vendor";
  const profilePath = portalRole === "admin" ? "/admin/profile" : portalRole === "partner" ? "/partner/profile" : "/vendor/settings";
  useEffect(() => {
    if (loading) return;
    if (!user) {
      void navigate({ to: "/login" });
      return;
    }
    if (profile && profile.role !== portalRole) {
      void navigate({ to: profile.role === "admin" ? "/admin/overview" : profile.role === "partner" ? "/partner" : "/vendor" });
    }
  }, [loading, navigate, portalRole, profile, user]);

  useEffect(() => {
    if (!notificationsOpen || portalRole !== "admin") return;

    const loadNotifications = async () => {
      setNotificationsLoading(true);
      const [ordersRes, vendorsRes, productsRes] = await Promise.all([
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "Pending"),
        supabase.from("vendors").select("id", { count: "exact", head: true }).eq("status", "Pending"),
        supabase.from("products").select("id", { count: "exact", head: true }).lt("stock", 10).eq("active", true),
      ]);

      const next: string[] = [];
      if (!ordersRes.error && (ordersRes.count ?? 0) > 0) next.push(`${ordersRes.count} pending orders need review`);
      if (!vendorsRes.error && (vendorsRes.count ?? 0) > 0) next.push(`${vendorsRes.count} vendor approvals are pending`);
      if (!productsRes.error && (productsRes.count ?? 0) > 0) next.push(`${productsRes.count} active products are low in stock`);
      setNotifications(next);
      setNotificationsLoading(false);
    };

    void loadNotifications();
  }, [notificationsOpen, portalRole]);
  if (loading || !user) return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading account...</div>;
  const displayBrand = profile?.name || brand;

  const SidebarBody = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-sidebar-border px-5 py-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl gradient-primary text-sm font-bold text-primary-foreground">
          D
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-bold">{displayBrand}</p>
          <p className="truncate text-[11px] text-muted-foreground">{profile?.role || role}</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {nav.map((item) => {
          const isMatch = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to + "/"));
          const hasMoreSpecificMatch = nav.some((candidate) => candidate.to !== item.to && candidate.to.startsWith(item.to + "/") && (pathname === candidate.to || pathname.startsWith(candidate.to + "/")));
          const active = isMatch && !hasMoreSpecificMatch;
          return (
            <Link
              key={item.to}
              to={item.to as "/"}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" onClick={() => void signOut()}>
          <LogOut className="h-4 w-4" /> Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-sidebar-border bg-sidebar lg:block">
        {SidebarBody}
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-foreground/40"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-sidebar-border bg-sidebar">
            {SidebarBody}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 rounded-xl lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle sidebar"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold sm:text-xl">{title}</h1>
              {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {actions}
            <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="relative rounded-xl" aria-label="Notifications">
                  <Bell className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="border-b px-4 py-3">
                  <p className="text-sm font-semibold">Notifications</p>
                </div>
                <div className="p-2">
                  {notificationsLoading ? (
                    <p className="px-2 py-3 text-sm text-muted-foreground">Loading notifications...</p>
                  ) : notifications.length === 0 ? (
                    <p className="px-2 py-3 text-sm text-muted-foreground">You are all caught up.</p>
                  ) : (
                    notifications.map((notification) => (
                      <p key={notification} className="rounded-lg px-2 py-2.5 text-sm hover:bg-muted">
                        {notification}
                      </p>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <Button asChild variant="ghost" size="icon" className="hidden rounded-full bg-primary-soft text-sm font-bold text-primary hover:bg-primary-soft sm:inline-flex" aria-label="Open profile">
              <Link to={profilePath as "/"}>{displayBrand.charAt(0).toLowerCase()}</Link>
            </Button>
          </div>
        </header>
        <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
