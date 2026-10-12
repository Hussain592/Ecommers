import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

export type DeliverySettings = {
  deliveryCharges: number;
  freeDeliveryThreshold: number;
};

/**
 * Used until the admin settings load, or if the database function is unavailable.
 * The order total is always recalculated on the server, so these are only for display.
 */
export const DEFAULT_DELIVERY_SETTINGS: DeliverySettings = {
  deliveryCharges: 250,
  freeDeliveryThreshold: 3000,
};

function toAmount(value: unknown, fallback: number) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : fallback;
}

async function fetchDeliverySettings(): Promise<DeliverySettings> {
  const { data, error } = await supabase.rpc("delivery_settings");

  if (error || !data || typeof data !== "object") {
    if (error) console.warn("Using default delivery settings", error.message);
    return DEFAULT_DELIVERY_SETTINGS;
  }

  const row = data as Record<string, unknown>;

  return {
    deliveryCharges: toAmount(row["delivery_charges"], DEFAULT_DELIVERY_SETTINGS.deliveryCharges),
    freeDeliveryThreshold: toAmount(
      row["free_delivery_threshold"],
      DEFAULT_DELIVERY_SETTINGS.freeDeliveryThreshold,
    ),
  };
}

/** Delivery charges configured by the admin in Settings → Delivery & Orders. */
export function useDeliverySettings(): DeliverySettings {
  const { data } = useQuery({
    queryKey: ["delivery-settings"],
    queryFn: fetchDeliverySettings,
    staleTime: 5 * 60 * 1000,
  });

  return data ?? DEFAULT_DELIVERY_SETTINGS;
}

/** Same rule as the database function delivery_fee_for_subtotal. */
export function deliveryFeeFor(subtotal: number, settings: DeliverySettings) {
  if (subtotal <= 0 || subtotal >= settings.freeDeliveryThreshold) return 0;
  return settings.deliveryCharges;
}
