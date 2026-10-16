import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

/** Name of the signed-in user from the users table, for dashboard headers. */
export function useAccountName(fallback: string) {
  const [name, setName] = useState(fallback);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;
      const { data } = await supabase
        .from("users")
        .select("name")
        .eq("auth_id", authData.user.id)
        .maybeSingle();
      const loaded = data?.name?.trim();
      if (!cancelled && loaded) setName(loaded);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return name;
}
