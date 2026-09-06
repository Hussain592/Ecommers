import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, LogOut, Menu, X } from "lucide-react";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

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
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user, profile, loading, signOut } = useAuth();
  const portalRole = nav[0]?.to.startsWith("/admin") ? "admin" : nav[0]?.to.startsWith("/partner") ? "partner" : "vendor";
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
            <Button variant="outline" size="icon" className="rounded-xl" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </Button>
            <span className="hidden h-9 w-9 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary sm:grid">
              {displayBrand.charAt(0)}
            </span>
          </div>
        </header>
        <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
