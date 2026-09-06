import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    // Server ke paas browser ka session nahi hota, isliye sirf client (browser) mein check karein
    if (typeof window === "undefined") {
      return;
    }

    // '/admin' khud login form hai — usay sabke liye khula rehne dein
    if (location.pathname === "/admin" || location.pathname === "/admin/") {
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (!user) {
      throw redirect({ to: "/admin" });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      throw redirect({ to: "/admin" });
    }
  },
  component: () => <Outlet />,
});