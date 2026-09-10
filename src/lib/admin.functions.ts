import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

// ---------- Generic table listers retained for auxiliary marketing & cms tables ----------
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

export const listBanners = makeLister("banners");
export const listSubscribers = makeLister("newsletter_subscribers");
export const listCampaigns = makeLister("newsletter_campaigns");
