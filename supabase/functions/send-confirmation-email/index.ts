import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type NotificationRequest = {
  type: "order" | "booking";
  id: string;
};

type OrderItem = {
  name?: string;
  quantity?: number;
  price?: number;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character] ?? character;
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return Response.json(
      { error: "Method not allowed" },
      { status: 405, headers: corsHeaders },
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL");

  if (!supabaseUrl || !anonKey || !serviceRoleKey || !resendApiKey || !fromEmail) {
    return Response.json(
      { error: "Email service is not configured" },
      { status: 503, headers: corsHeaders },
    );
  }

  const authorization = request.headers.get("Authorization");
  const accessToken = authorization?.replace(/^Bearer\s+/i, "");
  if (!accessToken) {
    return Response.json(
      { error: "Authentication required" },
      { status: 401, headers: corsHeaders },
    );
  }

  let payload: NotificationRequest;
  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid request body" },
      { status: 400, headers: corsHeaders },
    );
  }

  if (
    !payload ||
    !["order", "booking"].includes(payload.type) ||
    typeof payload.id !== "string" ||
    payload.id.length < 1 ||
    payload.id.length > 160
  ) {
    return Response.json(
      { error: "Invalid notification request" },
      { status: 400, headers: corsHeaders },
    );
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData.user) {
    return Response.json(
      { error: "Invalid session" },
      { status: 401, headers: corsHeaders },
    );
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let recipientEmail = "";
  let subject = "";
  let html = "";
  let text = "";

  if (payload.type === "order") {
    const [{ data: order, error: orderError }, { data: profile }] =
      await Promise.all([
        adminClient
          .from("orders")
          .select("id, customer_name, customer_email, total, delivery_fee, items, status, vendor_id")
          .eq("id", payload.id)
          .maybeSingle(),
        adminClient
          .from("users")
          .select("role")
          .eq("auth_id", authData.user.id)
          .maybeSingle(),
      ]);

    if (orderError) {
      return Response.json(
        { error: "Unable to verify order" },
        { status: 500, headers: corsHeaders },
      );
    }
    if (!order || order.status !== "Confirmed") {
      return Response.json(
        { error: "Order is not confirmed" },
        { status: 409, headers: corsHeaders },
      );
    }

    const isAdmin = profile?.role === "admin";
    let ownsVendor = false;
    if (!isAdmin && order.vendor_id) {
      const { data: vendor } = await adminClient
        .from("vendors")
        .select("id")
        .eq("id", order.vendor_id)
        .eq("owner_id", authData.user.id)
        .maybeSingle();
      ownsVendor = Boolean(vendor);
    }
    if (!isAdmin && !ownsVendor) {
      return Response.json(
        { error: "Not allowed to notify this order" },
        { status: 403, headers: corsHeaders },
      );
    }

    recipientEmail = order.customer_email ?? "";
    if (!recipientEmail) {
      return Response.json(
        { error: "Order has no customer email address" },
        { status: 422, headers: corsHeaders },
      );
    }

    const items: OrderItem[] = Array.isArray(order.items) ? order.items : [];
    const rows = items.map((item) => {
      const name = escapeHtml(String(item.name ?? "Product"));
      const quantity = Number(item.quantity ?? 0);
      const price = Number(item.price ?? 0);
      return `<li>${name} × ${quantity} — Rs. ${(price * quantity).toLocaleString("en-PK")}</li>`;
    });
    const itemList = rows.join("");
    const customerName = escapeHtml(String(order.customer_name ?? "Customer"));
    const orderId = escapeHtml(String(order.id));
    const total = Number(order.total).toLocaleString("en-PK");
    const delivery = Number(order.delivery_fee ?? 0).toLocaleString("en-PK");
    subject = `Aapka order ${order.id} confirm ho gaya`;
    html = `<p>Assalam-o-alaikum ${customerName},</p><p>Aapka order <strong>${orderId}</strong> confirm ho gaya hai.</p><ul>${itemList}</ul><p>Delivery fee: Rs. ${delivery}<br><strong>Total payable (Cash on Delivery): Rs. ${total}</strong></p><p>Expected delivery: 2–4 working days. Parcel milne par courier ko cash pay karein.</p><p>Shukriya,<br>azadari.store</p>`;
    text = `Assalam-o-alaikum ${order.customer_name}, aapka order ${order.id} confirm ho gaya. Total COD: Rs. ${total}. Expected delivery: 2–4 working days.`;
  } else {
    const [{ data: booking, error: bookingError }, { data: profile }] =
      await Promise.all([
        adminClient
          .from("booking_requests")
          .select("id, service_name, customer_name, email, details, status")
          .eq("id", payload.id)
          .maybeSingle(),
        adminClient
          .from("users")
          .select("role")
          .eq("auth_id", authData.user.id)
          .maybeSingle(),
      ]);

    if (bookingError) {
      return Response.json(
        { error: "Unable to verify booking" },
        { status: 500, headers: corsHeaders },
      );
    }
    if (profile?.role !== "admin") {
      return Response.json(
        { error: "Only admins can confirm service bookings" },
        { status: 403, headers: corsHeaders },
      );
    }
    if (!booking || booking.status !== "Confirmed") {
      return Response.json(
        { error: "Booking is not confirmed" },
        { status: 409, headers: corsHeaders },
      );
    }

    recipientEmail = booking.email ?? "";
    if (!recipientEmail) {
      return Response.json(
        { error: "Booking has no customer email address" },
        { status: 422, headers: corsHeaders },
      );
    }

    const customerName = escapeHtml(String(booking.customer_name));
    const serviceName = escapeHtml(String(booking.service_name));
    const details = escapeHtml(String(booking.details ?? "No extra details"));
    subject = `${booking.service_name} booking confirm ho gayi`;
    html = `<p>Assalam-o-alaikum ${customerName},</p><p>Aapki <strong>${serviceName}</strong> service booking confirm ho gayi hai.</p><p>Aapki di hui requirements: ${details}</p><p>Provider aapse timing aur final details ke liye rabta karega.</p><p>Shukriya,<br>azadari.store</p>`;
    text = `Assalam-o-alaikum ${booking.customer_name}, aapki ${booking.service_name} service booking confirm ho gayi. Provider timing aur details ke liye aapse rabta karega.`;
  }

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `confirmation-${payload.type}-${payload.id}`,
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [recipientEmail],
      subject,
      html,
      text,
    }),
  });

  if (!resendResponse.ok) {
    const responseBody = await resendResponse.text();
    console.error("Resend rejected confirmation email:", responseBody);
    return Response.json(
      { error: "Email provider could not send the confirmation" },
      { status: 502, headers: corsHeaders },
    );
  }

  return Response.json({ sent: true }, { headers: corsHeaders });
});
