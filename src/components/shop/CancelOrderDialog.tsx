import { useId, useState } from "react";
import { Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const REASONS = [
  "I ordered by mistake",
  "I want to change the size, colour or quantity",
  "I want to change the delivery address",
  "Delivery will take too long",
  "I found a better price elsewhere",
  "Other",
];

export function CancelOrderDialog({
  orderId,
  phone,
  onCancelled,
  triggerClassName,
}: {
  orderId: string;
  /** Needed for guest orders (Track Order). Signed-in customers don't need it. */
  phone?: string;
  onCancelled: (reason: string) => void;
  triggerClassName?: string;
}) {
  const ids = useId();
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState("");
  const [other, setOther] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const reason = choice === "Other" ? other.trim() : choice;
  const canSubmit = reason.length >= 3 && !saving;

  const reset = () => {
    setChoice("");
    setOther("");
    setError("");
  };

  const submit = async () => {
    if (!canSubmit) {
      setError(
        choice === "Other" ? "Tell us briefly why you're cancelling." : "Choose a reason first.",
      );
      return;
    }

    setSaving(true);
    setError("");
    const { error: rpcError } = await supabase.rpc("cancel_order_as_customer", {
      p_order_id: orderId,
      p_phone: phone ?? null,
      p_reason: reason,
    });
    setSaving(false);

    if (rpcError) {
      console.error("Unable to cancel order", rpcError);
      // The database explains the exact problem (already dispatched, not found ...).
      setError(rpcError.message || "Couldn't cancel the order. Please try again.");
      return;
    }

    toast.success(`Order ${orderId} has been cancelled.`);
    setOpen(false);
    reset();
    onCancelled(reason);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "rounded-xl border-[#e7c9cc] bg-white text-[#a61f2b] hover:bg-[#fff5f6] hover:text-[#a61f2b]",
            triggerClassName,
          )}
        >
          <XCircle aria-hidden="true" className="mr-2 h-4 w-4" />
          Cancel order
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel order {orderId}?</DialogTitle>
          <DialogDescription>
            The seller won't send this order, and you won't pay anything. This can't be undone, so
            you'd need to place a new order if you change your mind.
          </DialogDescription>
        </DialogHeader>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-semibold">
            Why are you cancelling? <span className="text-destructive">*</span>
          </legend>
          {REASONS.map((item) => (
            <label
              key={item}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                choice === item
                  ? "border-[#0b513b] bg-[#e8f1eb] text-[#0b513b]"
                  : "border-border hover:bg-muted",
              )}
            >
              <input
                type="radio"
                name={`${ids}-reason`}
                value={item}
                checked={choice === item}
                onChange={() => {
                  setChoice(item);
                  setError("");
                }}
                className="h-4 w-4 accent-[#0b513b]"
              />
              {item}
            </label>
          ))}

          {choice === "Other" && (
            <Textarea
              aria-label="Your reason"
              autoFocus
              rows={2}
              maxLength={300}
              value={other}
              onChange={(event) => {
                setOther(event.target.value);
                setError("");
              }}
              placeholder="Tell us briefly why"
              className="rounded-xl"
            />
          )}
        </fieldset>

        {error && (
          <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} autoFocus>
            Keep my order
          </Button>
          <Button
            type="button"
            onClick={() => void submit()}
            disabled={saving}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {saving && <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />}
            {saving ? "Cancelling..." : "Cancel order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
