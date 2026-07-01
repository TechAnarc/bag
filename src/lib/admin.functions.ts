import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

// ---------- BOOTSTRAP ----------
// Public: creates the seeded admin if no admin exists yet. Safe to expose because it's a no-op after first admin.
export const bootstrapAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; password: string }) =>
    z.object({ email: z.string().email(), password: z.string().min(6) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Refuse if any admin already exists.
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) > 0) return { ok: false, reason: "admin_exists" as const };

    // Try to fetch existing user by email; otherwise create.
    let userId: string | null = null;
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = list?.users?.find((u) => u.email?.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      userId = existing.id;
      await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        password: data.password,
        email_confirm: true,
      });
    } else {
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: { full_name: "Store Admin" },
      });
      if (error) throw new Error(error.message);
      userId = created.user!.id;
    }
    const { error: rerr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" as const });
    if (rerr && !rerr.message.includes("duplicate")) throw new Error(rerr.message);
    return { ok: true, userId };
  });

// ---------- DASHBOARD ----------
export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const s = (context as any).supabase;
    await assertAdmin(s, (context as any).userId);

    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [ordersAll, ordersToday, ordersMonth, products, customers, reviews, subs, coupons] =
      await Promise.all([
        s.from("orders").select("total,status,created_at"),
        s.from("orders").select("total").gte("created_at", startToday),
        s.from("orders").select("total").gte("created_at", startMonth),
        s.from("products").select("id,stock,low_stock_threshold,status"),
        s.from("profiles").select("id", { count: "exact", head: true }),
        s.from("reviews").select("id", { count: "exact", head: true }),
        s.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("is_subscribed", true),
        s.from("coupons").select("id", { count: "exact", head: true }).eq("is_active", true),
      ]);

    const all = ordersAll.data ?? [];
    const byStatus = (st: string) => all.filter((o: any) => o.status === st).length;
    const sum = (rows: any[]) => rows.reduce((a: number, r: any) => a + Number(r.total || 0), 0);

    // 14-day sales series
    const series: { date: string; revenue: number; orders: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const rows = all.filter((o: any) => (o.created_at || "").slice(0, 10) === key);
      series.push({ date: key, revenue: sum(rows), orders: rows.length });
    }

    const prods = products.data ?? [];
    return {
      revenueToday: sum(ordersToday.data ?? []),
      revenueMonth: sum(ordersMonth.data ?? []),
      revenueAll: sum(all),
      ordersToday: (ordersToday.data ?? []).length,
      ordersMonth: (ordersMonth.data ?? []).length,
      ordersAll: all.length,
      pending: byStatus("pending"),
      cancelled: byStatus("cancelled"),
      delivered: byStatus("delivered"),
      avgOrderValue: all.length ? sum(all) / all.length : 0,
      customers: customers.count ?? 0,
      products: prods.length,
      outOfStock: prods.filter((p: any) => (p.stock ?? 0) <= 0).length,
      lowStock: prods.filter(
        (p: any) => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= (p.low_stock_threshold ?? 5),
      ).length,
      reviews: reviews.count ?? 0,
      subscribers: subs.count ?? 0,
      couponsActive: coupons.count ?? 0,
      series,
    };
  });

export const listRecentOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const s = (context as any).supabase;
    await assertAdmin(s, (context as any).userId);
    const { data } = await s
      .from("orders")
      .select("id,order_number,customer_name,customer_email,status,payment_status,total,created_at")
      .order("created_at", { ascending: false })
      .limit(10);
    return data ?? [];
  });

// ---------- Generic table listers used by admin sub-pages ----------
const makeLister = (table: string, select = "*", order = "created_at") =>
  createServerFn({ method: "GET" })
    .middleware([requireSupabaseAuth])
    .handler(async ({ context }) => {
      const s = (context as any).supabase;
      await assertAdmin(s, (context as any).userId);
      const q = s.from(table).select(select).order(order, { ascending: false }).limit(200);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return data ?? [];
    });

export const listOrders = makeLister("orders");
export const listProducts = makeLister("products");
export const listCategories = makeLister("categories", "*", "sort_order");
export const listBrands = makeLister("brands");
export const listCustomers = makeLister("profiles");
export const listReviews = makeLister("reviews");
export const listCoupons = makeLister("coupons");
export const listBanners = makeLister("banners");
export const listSubscribers = makeLister("newsletter_subscribers");
export const listCampaigns = makeLister("newsletter_campaigns");
export const listReturns = makeLister("returns");
export const listPayments = makeLister("payments");
export const listInventoryMovements = makeLister("inventory_movements");
export const listNotifications = makeLister("notifications");

// ---------- PRODUCT CRUD ----------
export const upsertProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d as any)
  .handler(async ({ data, context }) => {
    const s = (context as any).supabase;
    await assertAdmin(s, (context as any).userId);
    const payload: any = { ...data };
    if (!payload.slug && payload.name)
      payload.slug = String(payload.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const { data: row, error } = payload.id
      ? await s.from("products").update(payload).eq("id", payload.id).select().single()
      : await s.from("products").insert(payload).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const s = (context as any).supabase;
    await assertAdmin(s, (context as any).userId);
    const { error } = await s.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- CATEGORY CRUD ----------
export const upsertCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d as any)
  .handler(async ({ data, context }) => {
    const s = (context as any).supabase;
    await assertAdmin(s, (context as any).userId);
    const payload: any = { ...data };
    if (!payload.slug && payload.name)
      payload.slug = String(payload.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const { data: row, error } = payload.id
      ? await s.from("categories").update(payload).eq("id", payload.id).select().single()
      : await s.from("categories").insert(payload).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const s = (context as any).supabase;
    await assertAdmin(s, (context as any).userId);
    const { error } = await s.from("categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- ORDER STATUS ----------
export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: string; note?: string }) =>
    z.object({ id: z.string().uuid(), status: z.string(), note: z.string().optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const s = (context as any).supabase;
    await assertAdmin(s, (context as any).userId);
    const { error } = await s.from("orders").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    await s.from("order_events").insert({
      order_id: data.id,
      status: data.status,
      note: data.note,
      created_by: (context as any).userId,
    });
    return { ok: true };
  });

// ---------- ROLE CHECK ----------
export const whoAmI = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const s = (context as any).supabase;
    const userId = (context as any).userId as string;
    const { data: isAdmin } = await s.rpc("has_role", { _user_id: userId, _role: "admin" });
    return { userId, isAdmin: !!isAdmin };
  });
