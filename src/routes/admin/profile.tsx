import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHeader } from "@/components/admin-shell";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
export const Route = createFileRoute("/admin/profile")({ component: Page });
function Page() {
  const [email, setEmail] = useState("");
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email || "")); }, []);
  return (
    <><PageHeader title="Profile" subtitle="Your admin account." />
    <Card>
      <div className="space-y-2 text-sm">
        <div><span className="text-black/50 dark:text-cream/50">Email: </span>{email || "—"}</div>
        <div><span className="text-black/50 dark:text-cream/50">Role: </span>Administrator</div>
      </div>
    </Card></>
  );
}
