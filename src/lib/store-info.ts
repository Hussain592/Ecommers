import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

async function fetchSupportHelpline(): Promise<string | null> {
  const { data, error } = await supabase.rpc("support_helpline");

  if (error) {
    console.warn("Support helpline unavailable", error.message);
    return null;
  }

  return typeof data === "string" && data.trim() ? data.trim() : null;
}

/** Support helpline set by the admin in Settings → Marketplace, or null if none is set. */
export function useSupportHelpline(): string | null {
  const { data } = useQuery({
    queryKey: ["support-helpline"],
    queryFn: fetchSupportHelpline,
    staleTime: 5 * 60 * 1000,
  });

  return data ?? null;
}
