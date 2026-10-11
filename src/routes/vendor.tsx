import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/vendor")({
  beforeLoad: async ({ location }) => {
    // Only run in browser
    if (typeof window === "undefined") {
      return;
    }

    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

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
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    if (profile?.role !== "vendor") {
      // If not a vendor, kick them to home or a forbidden page
      // For now, let's go home.
      throw redirect({ to: "/" });
    }

    // Only admin-approved vendors (status "Active") can access the dashboard.
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("status")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (vendorError) {
      throw vendorError;
    }

    if (vendor?.status !== "Active") {
      throw redirect({ to: "/" });
    }
  },
  component: () => <Outlet />,
});
