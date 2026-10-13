import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type NotificationRequest = {
  type: "order" | "booking" | "new_order";
  id: string;
};

// New-order alerts are only sent for fresh orders, so old order IDs cannot be replayed.
const NEW_ORDER_ALERT_WINDOW_MS = 30 * 60 * 1000;

type EmailMessage = {
  to: string[];
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
};

async function sendEmail(resendApiKey: string, fromEmail: string, message: EmailMessage) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": message.idempotencyKey,
    },
    body: JSON.stringify({
      from: fromEmail,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
  });

  if (!response.ok) {
    console.error("Resend rejected email:", await response.text());
  }

  return response.ok;
}

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
    return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });
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
    return Response.json({ error: "Invalid request body" }, { status: 400, headers: corsHeaders });
  }

  if (
    !payload ||
    !["order", "booking", "new_order"].includes(payload.type) ||
    typeof payload.id !== "string" ||
    payload.id.length < 1 ||
    payload.id.length > 160
  ) {
    return Response.json(
      { error: "Invalid notification request" },
      { status: 400, headers: corsHeaders },
    );
  }

  if (payload.type === "new_order") {
    // Guests place orders too, so this alert does not need a signed-in user.
    // It only fires for a fresh Pending order, and Resend's idempotency key
    // makes sure each order alerts its seller at most once.
    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: order, error: orderError } = await serviceClient
      .from("orders")
      .select("id, customer_name, city, total, delivery_fee, items, status, vendor_id, created_at")
      .eq("id", payload.id)
      .maybeSingle();

    if (orderError) {
      return Response.json(
        { error: "Unable to load order" },
        { status: 500, headers: corsHeaders },
      );
    }

    const createdAt = order ? new Date(order.created_at).getTime() : 0;
    if (
      !order ||
      order.status !== "Pending" ||
      !Number.isFinite(createdAt) ||
      Date.now() - createdAt > NEW_ORDER_ALERT_WINDOW_MS
    ) {
      return Response.json(
        { error: "Order is not a new pending order" },
        { status: 409, headers: corsHeaders },
      );
    }

    let recipients: string[] = [];
    let storeName = "azadari.store";

    if (order.vendor_id) {
      const { data: vendor } = await serviceClient
        .from("vendors")
        .select("name, email, owner_id")
        .eq("id", order.vendor_id)
        .maybeSingle();

      storeName = vendor?.name ?? storeName;
      let vendorEmail = (vendor?.email ?? "").trim();

      if (!vendorEmail && vendor?.owner_id) {
        const { data: owner } = await serviceClient.auth.admin.getUserById(vendor.owner_id);
        vendorEmail = owner.user?.email ?? "";
      }

      if (vendorEmail) recipients = [vendorEmail];
    } else {
      // Platform's own products: alert the admins.
      const { data: admins } = await serviceClient
        .from("users")
        .select("email")
        .eq("role", "admin");
      recipients = (admins ?? []).map((admin) => String(admin.email ?? "").trim()).filter(Boolean);
    }

    if (recipients.length === 0) {
      return Response.json(
        { error: "No seller email address on file" },
        { status: 422, headers: corsHeaders },
      );
    }

    const items: OrderItem[] = Array.isArray(order.items) ? order.items : [];
    const itemList = items
      .map((item) => {
        const name = escapeHtml(String(item.name ?? "Product"));
        const quantity = Number(item.quantity ?? 0);
        const price = Number(item.price ?? 0);
        return `<li>${name} × ${quantity} — Rs. ${(price * quantity).toLocaleString("en-PK")}</li>`;
      })
      .join("");
    const itemCount = items.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0);
    const orderId = escapeHtml(String(order.id));
    const customerName = escapeHtml(String(order.customer_name ?? "Customer"));
    const city = escapeHtml(String(order.city ?? ""));
    const total = Number(order.total).toLocaleString("en-PK");
    const siteUrl = (Deno.env.get("SITE_URL") ?? "https://www.azadari.store").replace(/\/$/, "");
    const dashboardUrl = order.vendor_id ? `${siteUrl}/vendor/orders` : `${siteUrl}/admin/orders`;

    const sent = await sendEmail(resendApiKey, fromEmail, {
      to: recipients,
      subject: `New order ${order.id}: ${itemCount} item${itemCount === 1 ? "" : "s"}, Rs. ${total}`,
      html: `<p>Assalam-o-Alaikum ${escapeHtml(storeName)},</p><p>You have a new Cash on Delivery order.</p><p><strong>Order:</strong> ${orderId}<br><strong>Customer:</strong> ${customerName}${city ? `, ${city}` : ""}</p><ul>${itemList}</ul><p><strong>Total (COD): Rs. ${total}</strong></p><p>Please call the customer and confirm the order soon:<br><a href="${dashboardUrl}">${dashboardUrl}</a></p><p>Thank you,<br>azadari.store</p>`,
      text: `New order ${order.id}: ${customerName}${city ? `, ${city}` : ""}. Total COD: Rs. ${total}. Confirm it here: ${dashboardUrl}`,
      idempotencyKey: `new-order-${order.id}`,
    });

    if (!sent) {
      return Response.json(
        { error: "Email provider could not send the alert" },
        { status: 502, headers: corsHeaders },
      );
    }

    return Response.json({ sent: true }, { headers: corsHeaders });
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData.user) {
    return Response.json({ error: "Invalid session" }, { status: 401, headers: corsHeaders });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let recipientEmail = "";
  let subject = "";
  let html = "";
  let text = "";

  if (payload.type === "order") {
    const [{ data: order, error: orderError }, { data: profile }] = await Promise.all([
      adminClient
        .from("orders")
        .select("id, customer_name, customer_email, total, delivery_fee, items, status, vendor_id")
        .eq("id", payload.id)
        .maybeSingle(),
      adminClient.from("users").select("role").eq("auth_id", authData.user.id).maybeSingle(),
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
    subject = `Your order ${order.id} is confirmed`;
    html = `<p>Assalam-o-Alaikum ${customerName},</p><p>Your order <strong>${orderId}</strong> is confirmed.</p><ul>${itemList}</ul><p>Delivery fee: Rs. ${delivery}<br><strong>Total payable (Cash on Delivery): Rs. ${total}</strong></p><p>Expected delivery: 2–4 working days. Please pay the courier in cash when the parcel arrives.</p><p>Thank you,<br>azadari.store</p>`;
    text = `Assalam-o-Alaikum ${order.customer_name}, your order ${order.id} is confirmed. Total COD: Rs. ${total}. Expected delivery: 2–4 working days.`;
  } else {
    const [{ data: booking, error: bookingError }, { data: profile }] = await Promise.all([
      adminClient
        .from("booking_requests")
        .select("id, service_name, customer_name, email, details, status")
        .eq("id", payload.id)
        .maybeSingle(),
      adminClient.from("users").select("role").eq("auth_id", authData.user.id).maybeSingle(),
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
    subject = `Your ${booking.service_name} booking is confirmed`;
    html = `<p>Assalam-o-Alaikum ${customerName},</p><p>Your <strong>${serviceName}</strong> booking is confirmed.</p><p>Your requirements: ${details}</p><p>The provider will contact you to agree on timing and final details.</p><p>Thank you,<br>azadari.store</p>`;
    text = `Assalam-o-Alaikum ${booking.customer_name}, your ${booking.service_name} booking is confirmed. The provider will contact you about timing and details.`;
  }

  const sent = await sendEmail(resendApiKey, fromEmail, {
    to: [recipientEmail],
    subject,
    html,
    text,
    idempotencyKey: `confirmation-${payload.type}-${payload.id}`,
  });

  if (!sent) {
    return Response.json(
      { error: "Email provider could not send the confirmation" },
      { status: 502, headers: corsHeaders },
    );
  }

  return Response.json({ sent: true }, { headers: corsHeaders });
});
