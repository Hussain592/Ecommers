import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/vendor")({
  beforeLoad: async ({ location }) => {
    // Only run in browser
    if (typeof window === "undefined") {
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    // If not logged in, go to login
    if (!user) {
      throw redirect({ 
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }

    // Check if user is a vendor
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (profile?.role !== "vendor") {
      // If not a vendor, kick them to home or a forbidden page
      // For now, let's go home.
      throw redirect({ to: "/" });
    }
  },
  component: () => <Outlet />,
});
