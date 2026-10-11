import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, LogOut, Menu, X } from "lucide-react";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent } from "@/components/ui/sheet";
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
  const [notificationsError, setNotificationsError] = useState(false);
  const [notificationRetry, setNotificationRetry] = useState(0);
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
      setNotificationsError(false);
      try {
        const [ordersRes, vendorsRes, productsRes] = await Promise.all([
          supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "Pending"),
          supabase.from("vendors").select("id", { count: "exact", head: true }).eq("status", "Pending"),
          supabase.from("products").select("id", { count: "exact", head: true }).lt("stock", 10).eq("active", true),
        ]);

        const error = ordersRes.error ?? vendorsRes.error ?? productsRes.error;
        if (error) {
          throw error;
        }

        const next: string[] = [];
        if ((ordersRes.count ?? 0) > 0) next.push(`${ordersRes.count} pending orders need review`);
        if ((vendorsRes.count ?? 0) > 0) next.push(`${vendorsRes.count} vendor approvals are pending`);
        if ((productsRes.count ?? 0) > 0) next.push(`${productsRes.count} active products are low in stock`);
        setNotifications(next);
      } catch (error) {
        console.error("Unable to load admin notifications", error);
        setNotificationsError(true);
      } finally {
        setNotificationsLoading(false);
      }
    };

    void loadNotifications();
  }, [notificationRetry, notificationsOpen, portalRole]);
  if (loading || !user) return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading account...</div>;
  const displayBrand = profile?.name || brand;

  const SidebarBody = (
    <div className="flex h-full flex-col">
      <div className={cn(
        "flex items-center gap-3 border-b px-5 py-4",
        portalRole === "admin" ? "border-[#c9a24b]/25" : "border-sidebar-border",
      )}>
        <span className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-extrabold shadow-sm",
          portalRole === "admin"
            ? "border border-[#d8b85c]/60 bg-[#0d4031] text-[#f2d883]"
            : "gradient-primary text-primary-foreground",
        )}>
          D
        </span>
        <div className="min-w-0">
          <p className={cn(
            "truncate font-display text-sm font-bold",
            portalRole === "admin" && "text-[#fffaf0]",
          )}>{portalRole === "admin" ? "azadari.store" : displayBrand}</p>
          <p className={cn(
            "truncate text-[11px]",
            portalRole === "admin" ? "text-[#d8b85c]" : "text-muted-foreground",
          )}>{portalRole === "admin" ? "ADMIN CONSOLE" : profile?.role || role}</p>
        </div>
      </div>
      <nav aria-label="Dashboard navigation" className="flex-1 space-y-1 overflow-y-auto p-3">
        {nav.map((item) => {
          const isMatch = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to + "/"));
          const hasMoreSpecificMatch = nav.some((candidate) => candidate.to !== item.to && candidate.to.startsWith(item.to + "/") && (pathname === candidate.to || pathname.startsWith(candidate.to + "/")));
          const active = isMatch && !hasMoreSpecificMatch;
          return (
            <Link
              key={item.to}
              to={item.to as "/"}
              onClick={() => setOpen(false)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? portalRole === "admin"
                    ? "bg-[#d8b85c] font-semibold text-[#082b21] shadow-sm"
                    : "bg-primary text-primary-foreground shadow-soft"
                  : portalRole === "admin"
                    ? "text-[#e7e0d1] hover:bg-white/10 hover:text-white"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className={cn(
        "border-t p-3",
        portalRole === "admin" ? "border-[#c9a24b]/25" : "border-sidebar-border",
      )}>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3",
            portalRole === "admin"
              ? "text-[#e7e0d1] hover:bg-white/10 hover:text-white"
              : "text-muted-foreground",
          )}
          onClick={() => void signOut()}
        >
          <LogOut className="h-4 w-4" /> Logout
        </Button>
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
    <div className={cn("min-h-screen bg-background", portalRole === "admin" && "admin-theme")}>
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 hidden w-64 border-r lg:block",
        portalRole === "admin"
          ? "border-[#c9a24b]/25 bg-[#082b21]"
          : "border-sidebar-border bg-sidebar",
      )}>
        {SidebarBody}
      </aside>

      <SheetContent
        id="dashboard-mobile-navigation"
        side="left"
        aria-label="Dashboard navigation"
        className={cn(
          "w-64 border-r p-0 sm:max-w-64 lg:hidden",
          portalRole === "admin"
            ? "border-[#c9a24b]/25 bg-[#082b21]"
            : "border-sidebar-border bg-sidebar",
        )}
      >
        {SidebarBody}
      </SheetContent>

      <div className="lg:pl-64">
        <header className={cn(
          "sticky top-0 z-30 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b px-4 py-3 backdrop-blur sm:px-6",
          portalRole === "admin"
            ? "border-[#ded5bd] bg-[#fffdf7]/95 text-[#102d24] shadow-sm"
            : "border-border bg-card/95",
        )}>
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={open}
              aria-controls="dashboard-mobile-navigation"
              className={cn(
                "shrink-0 rounded-xl lg:hidden",
                portalRole === "admin" && "border-[#d8cdae] bg-white text-[#0b513b] hover:bg-[#f7efd9]",
              )}
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            <div className="min-w-0">
              <h1 className={cn("truncate text-lg font-bold sm:text-xl", portalRole === "admin" && "text-[#102d24]")}>{title}</h1>
              {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {actions}
            <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "relative rounded-xl",
                    portalRole === "admin" && "border-[#d8cdae] bg-white text-[#0b513b] hover:bg-[#f7efd9]",
                  )}
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="border-b px-4 py-3">
                  <p className="text-sm font-semibold">Notifications</p>
                </div>
                <div className="p-2">
                  {notificationsLoading ? (
                    <p className="px-2 py-3 text-sm text-muted-foreground" role="status">Loading notifications...</p>
                  ) : notificationsError ? (
                    <div className="space-y-2 px-2 py-3" role="alert">
                      <p className="text-sm text-destructive">Notifications load nahi ho sakin.</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setNotificationRetry((value) => value + 1)}
                      >
                        Dobara try karein
                      </Button>
                    </div>
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
            <Button
              asChild
              variant="ghost"
              size="icon"
              className={cn(
                "hidden rounded-full text-sm font-bold sm:inline-flex",
                portalRole === "admin"
                  ? "bg-[#e8f1eb] text-[#0b513b] hover:bg-[#d8e8dc]"
                  : "bg-primary-soft text-primary hover:bg-primary-soft",
              )}
              aria-label="Open profile"
            >
              <Link to={profilePath as "/"}>{displayBrand.charAt(0).toLowerCase()}</Link>
            </Button>
          </div>
        </header>
        <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">{children}</main>
      </div>
    </div>
    </Sheet>
  );
}
