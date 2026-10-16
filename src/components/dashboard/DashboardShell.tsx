import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, ChevronRight, LogOut, Menu, MoonStar, X } from "lucide-react";
import { useCallback, useEffect, useState, type ComponentType, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export type NavItem = { to: string; label: string; icon: ComponentType<{ className?: string }> };

type PortalRole = "admin" | "vendor" | "partner";

type Notification = { text: string; to: string };

type Props = {
  title: string;
  subtitle?: string;
  brand: string;
  role: string;
  nav: NavItem[];
  actions?: ReactNode;
  children: ReactNode;
};

const PORTAL_LABEL: Record<PortalRole, string> = {
  admin: "Admin console",
  vendor: "Vendor dashboard",
  partner: "Partner dashboard",
};

const LOW_STOCK = 10;

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/**
 * Things that need the signed-in person's attention, each linking to the page
 * where they can act. Each role only sees what it can actually do something about:
 *   admin   -> approve products and vendors, chase orders that are stuck
 *   vendor  -> confirm new orders, fix rejected products, restock
 *   partner -> fix rejected products, restock
 */
async function loadNotifications(role: PortalRole, userId: string): Promise<Notification[]> {
  const next: Notification[] = [];
  const count = { count: "exact" as const, head: true };

  if (role === "admin") {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const [review, vendors, stuck] = await Promise.all([
      supabase.from("products").select("id", count).eq("approval_status", "pending"),
      supabase.from("vendors").select("id", count).eq("status", "Pending"),
      supabase.from("orders").select("id", count).eq("status", "Pending").lt("created_at", dayAgo),
    ]);
    const error = review.error ?? vendors.error ?? stuck.error;
    if (error) throw error;

    if (review.count)
      next.push({
        text: `${plural(review.count, "product is", "products are")} waiting for your approval`,
        to: "/admin/products",
      });
    if (vendors.count)
      next.push({
        text: `${plural(vendors.count, "vendor application needs", "vendor applications need")} review`,
        to: "/admin/vendors",
      });
    if (stuck.count)
      next.push({
        text: `${plural(stuck.count, "order has", "orders have")} been waiting over 24 hours for the seller`,
        to: "/admin/orders",
      });
    return next;
  }

  if (role === "vendor") {
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();
    if (vendorError) throw vendorError;
    if (!vendor) return next;

    const [orders, rejected, waiting, low] = await Promise.all([
      supabase
        .from("orders")
        .select("id", count)
        .eq("vendor_id", vendor.id)
        .eq("status", "Pending"),
      supabase
        .from("products")
        .select("id", count)
        .eq("vendor_id", vendor.id)
        .eq("approval_status", "rejected"),
      supabase
        .from("products")
        .select("id", count)
        .eq("vendor_id", vendor.id)
        .eq("approval_status", "pending"),
      supabase
        .from("products")
        .select("id", count)
        .eq("vendor_id", vendor.id)
        .eq("active", true)
        .lt("stock", LOW_STOCK),
    ]);
    const error = orders.error ?? rejected.error ?? waiting.error ?? low.error;
    if (error) throw error;

    if (orders.count)
      next.push({
        text: `${plural(orders.count, "new order needs", "new orders need")} your confirmation`,
        to: "/vendor/orders",
      });
    if (rejected.count)
      next.push({
        text: `${plural(rejected.count, "product was", "products were")} rejected. See why and fix ${rejected.count === 1 ? "it" : "them"}`,
        to: "/vendor/products",
      });
    if (low.count)
      next.push({
        text: `${plural(low.count, "product is", "products are")} low on stock`,
        to: "/vendor/products",
      });
    if (waiting.count)
      next.push({
        text: `${plural(waiting.count, "product is", "products are")} waiting for admin approval`,
        to: "/vendor/products",
      });
    return next;
  }

  const [rejected, low] = await Promise.all([
    supabase
      .from("products")
      .select("id", count)
      .eq("created_by", userId)
      .eq("approval_status", "rejected"),
    supabase.from("products").select("id", count).eq("created_by", userId).lt("stock", LOW_STOCK),
  ]);
  const error = rejected.error ?? low.error;
  if (error) throw error;
  if (rejected.count)
    next.push({
      text: `${plural(rejected.count, "product was", "products were")} rejected. See why and fix ${rejected.count === 1 ? "it" : "them"}`,
      to: "/partner/products",
    });
  if (low.count)
    next.push({
      text: `${plural(low.count, "of your products is", "of your products are")} low on stock`,
      to: "/partner/stock",
    });
  return next;
}

export function DashboardShell({ title, subtitle, brand, role, nav, actions, children }: Props) {
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user, profile, loading, signOut } = useAuth();
  const portalRole: PortalRole = nav[0]?.to.startsWith("/admin")
    ? "admin"
    : nav[0]?.to.startsWith("/partner")
      ? "partner"
      : "vendor";
  const profilePath =
    portalRole === "admin"
      ? "/admin/profile"
      : portalRole === "partner"
        ? "/partner/profile"
        : "/vendor/settings";

  useEffect(() => {
    if (loading) return;
    if (!user) {
      void navigate({ to: "/login" });
      return;
    }
    if (profile && profile.role !== portalRole) {
      void navigate({
        to:
          profile.role === "admin"
            ? "/admin/overview"
            : profile.role === "partner"
              ? "/partner"
              : "/vendor",
      });
    }
  }, [loading, navigate, portalRole, profile, user]);

  // Dialogs, dropdowns and toasts render outside this component, so put the theme on <body>
  // while a dashboard is open. That way every popup matches the panel.
  useEffect(() => {
    document.body.classList.add("portal-theme");
    return () => document.body.classList.remove("portal-theme");
  }, []);

  const userId = user?.id;

  const refreshNotifications = useCallback(async () => {
    if (!userId) return;
    setNotificationsLoading(true);
    setNotificationsError(false);
    try {
      setNotifications(await loadNotifications(portalRole, userId));
    } catch (error) {
      console.error("Unable to load notifications", error);
      setNotificationsError(true);
    } finally {
      setNotificationsLoading(false);
    }
  }, [portalRole, userId]);

  // Keep the bell current: refresh on every page change, when it is opened,
  // and once a minute while the tab is visible (e.g. after approving a product).
  useEffect(() => {
    void refreshNotifications();
  }, [refreshNotifications, pathname]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refreshNotifications();
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [refreshNotifications]);

  useEffect(() => {
    if (notificationsOpen) void refreshNotifications();
  }, [notificationsOpen, refreshNotifications]);

  if (loading || !user)
    return (
      <div
        className="portal-theme grid min-h-screen place-items-center bg-background text-sm text-muted-foreground"
        role="status"
      >
        Loading your dashboard...
      </div>
    );

  const displayBrand =
    portalRole === "admin" ? "azadari.store" : profile?.name || brand || "My Store";
  const avatarLetter = (profile?.name || displayBrand).trim().charAt(0).toUpperCase() || "A";
  const notificationCount = notifications.length;

  const SidebarBody = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-[#c9a24b]/25 px-5 py-4">
        <span
          aria-hidden="true"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#d8b85c]/60 bg-[#0d4031] text-[#f2d883] shadow-sm"
        >
          <MoonStar className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p
            className="truncate font-display text-sm font-bold text-[#fffaf0]"
            title={displayBrand}
          >
            {displayBrand}
          </p>
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-[#d8b85c]">
            {PORTAL_LABEL[portalRole] ?? role}
          </p>
        </div>
      </div>
      <nav aria-label="Dashboard navigation" className="flex-1 space-y-1 overflow-y-auto p-3">
        {nav.map((item) => {
          const isMatch =
            pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to + "/"));
          const hasMoreSpecificMatch = nav.some(
            (candidate) =>
              candidate.to !== item.to &&
              candidate.to.startsWith(item.to + "/") &&
              (pathname === candidate.to || pathname.startsWith(candidate.to + "/")),
          );
          const active = isMatch && !hasMoreSpecificMatch;
          return (
            <Link
              key={item.to}
              to={item.to as "/"}
              onClick={() => setOpen(false)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8b85c]",
                active
                  ? "bg-[#d8b85c] font-semibold text-[#082b21] shadow-sm"
                  : "text-[#e7e0d1] hover:bg-white/10 hover:text-white",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[#c9a24b]/25 p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-[#e7e0d1] hover:bg-white/10 hover:text-white focus-visible:ring-[#d8b85c]"
          onClick={() => void signOut()}
        >
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <div className="portal-theme min-h-screen bg-background">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-[#c9a24b]/25 bg-[#082b21] lg:block">
          {SidebarBody}
        </aside>

        <SheetContent
          id="dashboard-mobile-navigation"
          side="left"
          aria-label="Dashboard navigation"
          className="w-64 border-r border-[#c9a24b]/25 bg-[#082b21] p-0 sm:max-w-64 lg:hidden"
        >
          {SidebarBody}
        </SheetContent>

        <div className="lg:pl-64">
          <header className="sticky top-0 z-30 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-[#ded5bd] bg-[#fffdf7]/95 px-4 py-3 text-[#102d24] shadow-sm backdrop-blur sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={open}
                aria-controls="dashboard-mobile-navigation"
                className="shrink-0 rounded-xl border-[#d8cdae] bg-white text-[#0b513b] hover:bg-[#f7efd9] lg:hidden"
              >
                {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold text-[#102d24] sm:text-xl">{title}</h1>
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
                    className="relative rounded-xl border-[#d8cdae] bg-white text-[#0b513b] hover:bg-[#f7efd9]"
                    aria-label={
                      notificationCount > 0
                        ? `Notifications, ${notificationCount} new`
                        : "Notifications"
                    }
                  >
                    <Bell className="h-4 w-4" />
                    {notificationCount > 0 && (
                      <span
                        aria-hidden="true"
                        className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#a61f2b] px-1 text-[11px] font-bold text-white shadow-sm"
                      >
                        {notificationCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="portal-theme w-80 p-0">
                  <div className="border-b px-4 py-3">
                    <p className="text-sm font-semibold">Notifications</p>
                  </div>
                  <div className="p-2" aria-live="polite">
                    {notificationsLoading && notificationCount === 0 ? (
                      <p className="px-2 py-3 text-sm text-muted-foreground" role="status">
                        Loading notifications...
                      </p>
                    ) : notificationsError ? (
                      <div className="space-y-2 px-2 py-3" role="alert">
                        <p className="text-sm text-destructive">Couldn't load notifications.</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void refreshNotifications()}
                        >
                          Try again
                        </Button>
                      </div>
                    ) : notificationCount === 0 ? (
                      <p className="px-2 py-3 text-sm text-muted-foreground">
                        You're all caught up.
                      </p>
                    ) : (
                      <ul>
                        {notifications.map((notification) => (
                          <li key={notification.text}>
                            <Link
                              to={notification.to as "/"}
                              onClick={() => setNotificationsOpen(false)}
                              className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <span>{notification.text}</span>
                              <ChevronRight
                                aria-hidden="true"
                                className="h-4 w-4 shrink-0 text-muted-foreground"
                              />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="hidden rounded-full bg-[#e8f1eb] text-sm font-bold text-[#0b513b] hover:bg-[#d8e8dc] sm:inline-flex"
              >
                <Link to={profilePath as "/"} aria-label="Open your profile" title="Your profile">
                  {avatarLetter}
                </Link>
              </Button>
            </div>
          </header>
          <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </Sheet>
  );
}
