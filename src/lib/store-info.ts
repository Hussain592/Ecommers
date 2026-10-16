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

export type StoreSettings = {
  /** Custom announcement text, or null to show the delivery info automatically. */
  announcement: string | null;
  /** Days a customer has to return an item; 0 means no returns. */
  returnWindowDays: number;
  /** When false, customers must sign in before placing an order. */
  guestCheckout: boolean;
};

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  announcement: null,
  returnWindowDays: 7,
  guestCheckout: true,
};

async function fetchStoreSettings(): Promise<StoreSettings> {
  const { data, error } = await supabase.rpc("public_store_settings");

  if (error || !data || typeof data !== "object") {
    if (error) console.warn("Using default store settings", error.message);
    return DEFAULT_STORE_SETTINGS;
  }

  const row = data as Record<string, unknown>;
  const announcement =
    typeof row["announcement_bar"] === "string" ? row["announcement_bar"].trim() : "";
  const days = Number(row["return_window"]);

  return {
    announcement: announcement || null,
    returnWindowDays:
      Number.isInteger(days) && days >= 0 ? days : DEFAULT_STORE_SETTINGS.returnWindowDays,
    guestCheckout: row["guest_checkout"] !== "false",
  };
}

/** Public store settings set by the admin in Settings. */
export function useStoreSettings(): StoreSettings {
  const { data } = useQuery({
    queryKey: ["store-settings"],
    queryFn: fetchStoreSettings,
    staleTime: 5 * 60 * 1000,
  });

  return data ?? DEFAULT_STORE_SETTINGS;
}
