import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

export type ProductReview = {
  id: string;
  reviewer_name: string;
  rating: number;
  title: string | null;
  body: string;
  created_at: string;
  user_id: string;
  verified_purchase: boolean;
};

/** What the signed-in customer's orders say about this product. */
export type PurchaseStatus = "delivered" | "in_progress" | "none";

export type RatingSummary = { rating: number; count: number };

export const REVIEW_BODY_MIN = 3;
export const REVIEW_BODY_MAX = 1000;
export const REVIEW_TITLE_MAX = 120;

/** Words shown next to the stars so a rating's meaning is never a guess. */
export const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"] as const;

export const reviewKeys = {
  list: (productId: string) => ["product-reviews", productId] as const,
  purchase: (productId: string, userId: string) => ["purchase-status", productId, userId] as const,
  summaries: ["product-rating-summaries"] as const,
};

async function fetchReviews(productId: string): Promise<ProductReview[]> {
  const { data, error } = await supabase
    .from("product_reviews")
    .select("id, reviewer_name, rating, title, body, created_at, user_id, verified_purchase")
    .eq("product_id", productId)
    .eq("verified_purchase", true)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((review) => ({ ...review, rating: Number(review.rating) }));
}

export function useProductReviews(productId: string | undefined) {
  return useQuery({
    queryKey: reviewKeys.list(productId ?? ""),
    queryFn: () => fetchReviews(productId ?? ""),
    enabled: Boolean(productId),
  });
}

export function summarize(reviews: ProductReview[]): RatingSummary {
  if (reviews.length === 0) return { rating: 0, count: 0 };
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return { rating: total / reviews.length, count: reviews.length };
}

export function usePurchaseStatus(productId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: reviewKeys.purchase(productId ?? "", userId ?? ""),
    enabled: Boolean(productId && userId),
    queryFn: async (): Promise<PurchaseStatus> => {
      const { data, error } = await supabase.rpc("customer_purchase_status", {
        p_product_id: productId,
      });
      if (error) throw error;
      return data === "delivered" || data === "in_progress" ? data : "none";
    },
  });
}

async function fetchRatingSummaries(): Promise<Map<string, RatingSummary>> {
  const { data, error } = await supabase.rpc("product_rating_summaries");

  const map = new Map<string, RatingSummary>();
  if (error) {
    console.warn("Rating summaries unavailable", error.message);
    return map;
  }

  for (const row of (data ?? []) as Array<{
    product_id: string;
    rating: number | string;
    review_count: number;
  }>) {
    map.set(row.product_id, { rating: Number(row.rating), count: Number(row.review_count) });
  }
  return map;
}

/**
 * Star rating for one product card. All cards share one cached request,
 * so a page of 40 products still makes a single database call.
 */
export function useRatingSummary(productId: string): RatingSummary | undefined {
  const { data } = useQuery({
    queryKey: reviewKeys.summaries,
    queryFn: fetchRatingSummaries,
    staleTime: 5 * 60 * 1000,
  });
  return data?.get(productId);
}
