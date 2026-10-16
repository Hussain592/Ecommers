/**
 * One place that turns a product's database fields into a clear state,
 * so the admin, vendor and partner screens always use the same words.
 */
export type ApprovalStatus = "pending" | "approved" | "rejected";

export type ProductState = "pending" | "live" | "hidden" | "rejected";

export function productState(product: {
  active: boolean;
  approval_status?: string | null;
}): ProductState {
  if (product.approval_status === "pending") return "pending";
  if (product.approval_status === "rejected") return "rejected";
  return product.active ? "live" : "hidden";
}

/** Short labels used in badges. StatusBadge has a colour for each one. */
export const PRODUCT_STATE_LABEL: Record<ProductState, string> = {
  pending: "Waiting for approval",
  live: "Live",
  hidden: "Hidden",
  rejected: "Rejected",
};

/** One-line explanations for vendors, who cannot change these states themselves. */
export const PRODUCT_STATE_HELP: Record<ProductState, string> = {
  pending: "The admin will review it soon. You'll see it go live here.",
  live: "Customers can see and buy this product.",
  hidden: "The admin has taken this product off the store for now.",
  rejected: "Fix the issue and save your changes to send it for review again.",
};
