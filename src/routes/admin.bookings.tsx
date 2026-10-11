import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { adminNav } from "@/components/dashboard/nav-config";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/bookings")({
  head: () => ({
    meta: [
      { title: "Service Bookings — Dukaan.pk Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminBookings,
});

type BookingRequest = {
  id: string;
  service_name: string;
  customer_name: string;
  email: string | null;
  phone: string;
  details: string | null;
  status: string;
  created_at: string;
};

const statuses = ["Pending", "Confirmed", "Rejected", "Completed"] as const;

function AdminBookings() {
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("booking_requests")
      .select("id, service_name, customer_name, email, phone, details, status, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Unable to load service bookings:", error);
      toast.error("Booking requests load nahi ho sakin.");
      setLoading(false);
      return;
    }

    setRequests(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void loadRequests();
  }, []);

  const updateStatus = async (request: BookingRequest, status: string) => {
    if (!statuses.some((allowedStatus) => allowedStatus === status)) {
      return;
    }

    setBusyId(request.id);
    const { data, error } = await supabase
      .from("booking_requests")
      .update({ status })
      .eq("id", request.id)
      .select("id");
    setBusyId(null);

    if (error || !data?.length) {
      console.error("Unable to update booking status:", error);
      toast.error("Booking status update nahi ho saka.");
      return;
    }

    setRequests((current) =>
      current.map((item) =>
        item.id === request.id ? { ...item, status } : item,
      ),
    );
    toast.success("Booking status update ho gaya.");
    if (status === "Confirmed") {
      const { error: emailError } = await supabase.functions.invoke(
        "send-confirmation-email",
        { body: { type: "booking", id: request.id } },
      );
      if (emailError) {
        console.error("Booking confirmed but email notification failed:", emailError);
        toast.error("Booking confirm ho gayi, lekin email nahi bheji ja saki.");
      } else {
        toast.success("Customer ko confirmation email bhej di.");
      }
    }
  };

  return (
    <DashboardShell
      brand="Dukaan.pk"
      role="Owner / Admin"
      title="Service Bookings"
      subtitle="Customer requests dekhein aur unka status manage karein"
      nav={adminNav}
    >
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          disabled={loading}
          onClick={() => void loadRequests()}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-10" role="status" aria-live="polite">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <section className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <caption className="sr-only">Service booking requests</caption>
              <thead className="bg-muted/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Service</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Customer</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Phone</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Email</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Requirements / Address</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Date</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-4 py-3 font-medium">{request.service_name}</td>
                    <td className="px-4 py-3">{request.customer_name}</td>
                    <td className="px-4 py-3">
                      <a className="text-primary underline" href={`tel:${request.phone}`}>
                        {request.phone}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      {request.email ? (
                        <a className="text-primary underline" href={`mailto:${request.email}`}>
                          {request.email}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">Email not provided</span>
                      )}
                    </td>
                    <td className="max-w-xs whitespace-pre-wrap px-4 py-3 text-muted-foreground">
                      {request.details || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(request.created_at).toLocaleString("en-PK")}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={request.status as never} />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        aria-label={`Update booking ${request.id} status`}
                        className="h-9 rounded-lg border border-border bg-background px-2"
                        disabled={busyId === request.id}
                        value={request.status}
                        onChange={(event) =>
                          void updateStatus(request, event.target.value)
                        }
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                      Abhi koi booking request nahi aayi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </DashboardShell>
  );
}
