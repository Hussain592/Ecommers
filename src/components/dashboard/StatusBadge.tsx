import { cn } from "@/lib/utils";

const map: Record<string, string> = {
  Pending: "bg-warning/15 text-warning-foreground",
  Processing: "bg-warning/15 text-warning-foreground",
  Confirmed: "bg-primary-soft text-primary",
  Approved: "bg-primary-soft text-primary",
  Dispatched: "bg-accent text-accent-foreground",
  Delivered: "bg-success/10 text-success",
  Paid: "bg-success/10 text-success",
  Active: "bg-success/10 text-success",
  Inactive: "bg-muted text-muted-foreground",
  Cancelled: "bg-destructive/10 text-destructive",
  Suspended: "bg-destructive/10 text-destructive",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        map[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {status}
    </span>
  );
}