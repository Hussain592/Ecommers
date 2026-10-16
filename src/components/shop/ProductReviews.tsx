import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  CheckCircle2,
  Info,
  Loader2,
  LogIn,
  PackageCheck,
  RotateCw,
  Star,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import {
  RATING_LABELS,
  REVIEW_BODY_MAX,
  REVIEW_BODY_MIN,
  REVIEW_TITLE_MAX,
  reviewKeys,
  summarize,
  useProductReviews,
  usePurchaseStatus,
  type ProductReview,
} from "@/lib/reviews";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Star display (read-only)                                            */
/* ------------------------------------------------------------------ */

export function StarRow({ rating, size = "h-4 w-4" }: { rating: number; size?: string }) {
  return (
    <span className="inline-flex text-warning" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(size, star <= Math.round(rating) ? "fill-current" : "text-border")}
        />
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Star input: a real radio group, usable by mouse, touch and keyboard */
/* ------------------------------------------------------------------ */

function StarRatingInput({
  value,
  onChange,
  invalid,
  describedBy,
}: {
  value: number;
  onChange: (value: number) => void;
  invalid: boolean;
  describedBy: string;
}) {
  const [hovered, setHovered] = useState(0);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const shown = hovered || value;

  const handleKey = (event: KeyboardEvent<HTMLButtonElement>, star: number) => {
    const next =
      event.key === "ArrowRight" || event.key === "ArrowUp"
        ? Math.min(5, star + 1)
        : event.key === "ArrowLeft" || event.key === "ArrowDown"
          ? Math.max(1, star - 1)
          : event.key === "Home"
            ? 1
            : event.key === "End"
              ? 5
              : 0;
    if (!next) return;
    event.preventDefault();
    onChange(next);
    buttons.current[next - 1]?.focus();
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div
        role="radiogroup"
        aria-label="Rating"
        aria-required="true"
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className="flex items-center gap-0.5"
        onMouseLeave={() => setHovered(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const checked = value === star;
          return (
            <button
              key={star}
              ref={(element) => {
                buttons.current[star - 1] = element;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={`${star} star — ${RATING_LABELS[star]}`}
              // Roving tab index: one tab stop for the whole group.
              tabIndex={checked || (value === 0 && star === 1) ? 0 : -1}
              onClick={() => onChange(star)}
              onMouseEnter={() => setHovered(star)}
              onFocus={() => setHovered(0)}
              onKeyDown={(event) => handleKey(event, star)}
              className="grid h-10 w-10 place-items-center rounded-lg transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Star
                aria-hidden="true"
                className={cn(
                  "h-7 w-7 transition-colors",
                  star <= shown ? "fill-warning text-warning" : "text-border",
                )}
              />
            </button>
          );
        })}
      </div>

      <span
        className={cn(
          "min-w-[5.5rem] text-sm font-semibold",
          shown ? "text-foreground" : "text-muted-foreground",
        )}
        aria-hidden="true"
      >
        {shown ? RATING_LABELS[shown] : "Select a rating"}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Status box: tells the customer why they can or can't review, and   */
/* what to do next                                                     */
/* ------------------------------------------------------------------ */

function StatusBox({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: typeof Info;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-muted/40 p-4" role="status">
      <div className="flex gap-3">
        <Icon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="text-sm font-bold">{title}</p>
          <div className="mt-1 text-sm leading-6 text-muted-foreground">{children}</div>
          {action && <div className="mt-3">{action}</div>}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Review form                                                         */
/* ------------------------------------------------------------------ */

type FieldErrors = {
  rating?: string | undefined;
  body?: string | undefined;
  title?: string | undefined;
  form?: string | undefined;
};

function ReviewForm({
  productId,
  existing,
}: {
  productId: string;
  existing: ProductReview | undefined;
}) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const ids = useId();

  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Once the customer's earlier review loads, show it so they edit instead of starting over.
  useEffect(() => {
    if (!existing) return;
    setRating(existing.rating);
    setTitle(existing.title ?? "");
    setBody(existing.body);
  }, [existing]);

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (rating < 1) next.rating = "Select a rating from 1 to 5 stars.";
    const trimmed = body.trim();
    if (trimmed.length < REVIEW_BODY_MIN)
      next.body = `Write at least ${REVIEW_BODY_MIN} characters.`;
    else if (trimmed.length > REVIEW_BODY_MAX)
      next.body = `Keep your review under ${REVIEW_BODY_MAX} characters.`;
    if (title.trim().length > REVIEW_TITLE_MAX)
      next.title = `Keep the title under ${REVIEW_TITLE_MAX} characters.`;
    return next;
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || saving) return;

    const found = validate();
    setErrors(found);
    if (found.rating || found.body || found.title) {
      // Move focus to the first problem so keyboard and screen-reader users land on it.
      if (found.rating) {
        document
          .getElementById(`${ids}-rating`)
          ?.querySelector<HTMLElement>('[role="radio"]')
          ?.focus();
      } else {
        document.getElementById(found.body ? `${ids}-body` : `${ids}-title`)?.focus();
      }
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("product_reviews").upsert(
      {
        product_id: productId,
        user_id: user.id,
        verified_purchase: true,
        reviewer_name: profile?.name || user.email?.split("@")[0] || "Customer",
        rating,
        title: title.trim() || null,
        body: body.trim(),
      },
      { onConflict: "product_id,user_id" },
    );

    setSaving(false);

    if (error) {
      console.error("Unable to save review", error);
      setErrors({
        form:
          error.code === "42501"
            ? "We couldn't find a delivered order for this product on your account, so the review wasn't saved."
            : "Couldn't save your review. Check your connection and try again.",
      });
      return;
    }

    setSavedAt(Date.now());
    toast.success(existing ? "Your review has been updated." : "Thanks! Your review is now live.");
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: reviewKeys.list(productId) }),
      queryClient.invalidateQueries({ queryKey: reviewKeys.summaries }),
    ]);
  };

  const bodyLength = body.trim().length;

  return (
    <form onSubmit={submit} noValidate className="rounded-2xl border border-border p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-bold">{existing ? "Edit your review" : "Write a review"}</h3>
        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
          <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
          Verified purchase
        </span>
      </div>

      {/* Rating */}
      <fieldset className="mt-4">
        <legend className="text-sm font-semibold">
          Rating <span className="text-destructive">*</span>
        </legend>
        <div id={`${ids}-rating`} className="mt-1">
          <StarRatingInput
            value={rating}
            onChange={(value) => {
              setRating(value);
              setErrors((current) => ({ ...current, rating: undefined }));
            }}
            invalid={Boolean(errors.rating)}
            describedBy={`${ids}-rating-error`}
          />
        </div>
        <p
          id={`${ids}-rating-error`}
          className="mt-1 min-h-5 text-xs text-destructive"
          aria-live="polite"
        >
          {errors.rating}
        </p>
      </fieldset>

      {/* Title */}
      <div className="mt-2 space-y-1.5">
        <Label htmlFor={`${ids}-title`}>
          Title <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id={`${ids}-title`}
          className="rounded-xl"
          placeholder="Jaise: Bohat achhi quality"
          value={title}
          maxLength={REVIEW_TITLE_MAX}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? `${ids}-title-error` : undefined}
          onChange={(event) => {
            setTitle(event.target.value);
            setErrors((current) => ({ ...current, title: undefined }));
          }}
        />
        {errors.title && (
          <p id={`${ids}-title-error`} className="text-xs text-destructive">
            {errors.title}
          </p>
        )}
      </div>

      {/* Body */}
      <div className="mt-4 space-y-1.5">
        <Label htmlFor={`${ids}-body`}>
          Your review <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id={`${ids}-body`}
          className="rounded-xl"
          rows={4}
          placeholder="What did you think? Tell others about the quality, size and delivery."
          value={body}
          maxLength={REVIEW_BODY_MAX}
          aria-invalid={Boolean(errors.body)}
          aria-describedby={`${ids}-body-hint`}
          onChange={(event) => {
            setBody(event.target.value);
            setErrors((current) => ({ ...current, body: undefined }));
          }}
        />
        <div id={`${ids}-body-hint`} className="flex justify-between gap-3 text-xs">
          <span className="text-destructive" aria-live="polite">
            {errors.body}
          </span>
          <span
            className={cn(
              "shrink-0 tabular-nums",
              bodyLength > REVIEW_BODY_MAX - 50
                ? "text-warning-foreground"
                : "text-muted-foreground",
            )}
          >
            {bodyLength}/{REVIEW_BODY_MAX}
          </span>
        </div>
      </div>

      {errors.form && (
        <p className="mt-3 rounded-xl bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {errors.form}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="submit" className="rounded-xl" disabled={saving}>
          {saving && <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />}
          {saving ? "Saving..." : existing ? "Update review" : "Submit review"}
        </Button>

        {savedAt && !saving && (
          <span className="inline-flex items-center gap-1 text-sm text-success" role="status">
            <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
            Saved
          </span>
        )}
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Composer: picks the right message or the form                      */
/* ------------------------------------------------------------------ */

function ReviewComposer({
  productId,
  existing,
}: {
  productId: string;
  existing: ProductReview | undefined;
}) {
  const { user, loading: authLoading } = useAuth();
  const purchase = usePurchaseStatus(productId, user?.id);

  if (authLoading || (user && purchase.isPending)) {
    return (
      <StatusBox icon={Loader2} title="Checking...">
        Checking whether you can review this product.
      </StatusBox>
    );
  }

  if (!user) {
    return (
      <StatusBox
        icon={LogIn}
        title="Sign in to write a review"
        action={
          <Button asChild size="sm" className="rounded-xl">
            <Link to="/login" search={{ redirect: `/products/${productId}` }}>
              <LogIn aria-hidden="true" className="mr-2 h-4 w-4" />
              Sign in
            </Link>
          </Button>
        }
      >
        Only customers who have received this product can review it. Ordered as a guest? Create an
        account with the email you used at checkout.
      </StatusBox>
    );
  }

  if (purchase.isError) {
    return (
      <StatusBox
        icon={Info}
        title="We couldn't check right now"
        action={
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl"
            onClick={() => void purchase.refetch()}
          >
            <RotateCw aria-hidden="true" className="mr-2 h-4 w-4" />
            Try again
          </Button>
        }
      >
        We couldn't verify your purchase. Check your connection and try again.
      </StatusBox>
    );
  }

  if (purchase.data === "in_progress") {
    return (
      <StatusBox icon={Truck} title="Your order is on its way">
        You can review this product once it has been delivered.
      </StatusBox>
    );
  }

  if (purchase.data !== "delivered") {
    return (
      <StatusBox icon={PackageCheck} title="Only buyers can review this product">
        You're signed in as <strong className="text-foreground">{user.email}</strong>. We couldn't
        find a delivered order for this product with that email. If you ordered with a different
        email, sign in with that one.
      </StatusBox>
    );
  }

  return <ReviewForm productId={productId} existing={existing} />;
}

/* ------------------------------------------------------------------ */
/* Public component                                                    */
/* ------------------------------------------------------------------ */

export function ProductReviews({ productId }: { productId: string }) {
  const { user } = useAuth();
  const { data: reviews = [], isPending, isError, refetch } = useProductReviews(productId);
  const { rating, count } = summarize(reviews);
  const mine = user ? reviews.find((review) => review.user_id === user.id) : undefined;

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((review) => review.rating === star).length,
  }));

  return (
    <div className="grid gap-6 py-6 lg:grid-cols-[260px_1fr]">
      {/* Summary */}
      <div className="h-fit rounded-2xl bg-muted/60 p-5">
        <div className="text-center">
          <p className="font-display text-5xl font-extrabold">
            {count > 0 ? rating.toFixed(1) : "—"}
          </p>
          <div className="mt-2 flex justify-center">
            <StarRow rating={rating} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {count > 0
              ? `${count} verified ${count === 1 ? "rating" : "ratings"}`
              : "No ratings yet"}
          </p>
        </div>

        {count > 0 && (
          <ul className="mt-4 space-y-1.5" aria-label="Rating breakdown">
            {distribution.map(({ star, count: starCount }) => (
              <li key={star} className="flex items-center gap-2 text-xs">
                <span className="w-8 shrink-0 tabular-nums">{star} ★</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-border">
                  <span
                    className="block h-full rounded-full bg-warning"
                    style={{ width: `${(starCount / count) * 100}%` }}
                  />
                </span>
                <span className="w-6 shrink-0 text-right tabular-nums text-muted-foreground">
                  {starCount}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-6">
        <ReviewComposer productId={productId} existing={mine} />

        {/* Review list */}
        {isPending ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            Loading reviews...
          </p>
        ) : isError ? (
          <p className="text-sm text-muted-foreground" role="alert">
            Couldn't load reviews.{" "}
            <button
              type="button"
              className="font-semibold text-primary underline underline-offset-4"
              onClick={() => void refetch()}
            >
              Try again
            </button>
          </p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No reviews yet. Bought this product? Be the first to review it.
          </p>
        ) : (
          <ul className="space-y-4">
            {reviews.map((review) => (
              <li key={review.id}>
                <article className="border-b border-border pb-4">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p className="font-semibold">{review.reviewer_name}</p>
                    {review.user_id === user?.id && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        Your review
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs text-success">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Verified purchase
                    </span>
                  </div>

                  <div className="mt-1 flex items-center gap-2">
                    <StarRow rating={review.rating} size="h-3.5 w-3.5" />
                    <span className="sr-only">
                      {review.rating} out of 5 — {RATING_LABELS[review.rating]}
                    </span>
                    <time className="text-xs text-muted-foreground" dateTime={review.created_at}>
                      {new Date(review.created_at).toLocaleDateString("en-PK", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </time>
                  </div>

                  {review.title && <h4 className="mt-3 text-sm font-bold">{review.title}</h4>}
                  <p className="mt-1 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                    {review.body}
                  </p>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
