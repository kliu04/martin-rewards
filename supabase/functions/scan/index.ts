import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import type { Database } from "../_shared/database.types.ts";
import { createHash } from "node:crypto";

export default {
  fetch: withSupabase<Database>({ auth: "none" }, async (req, ctx) => {
    if (req.method !== "POST") {
      return Response.json({ error: "Method Not Allowed" }, { status: 405 });
    }

    const deviceKey = req.headers.get("x-device-key")?.trim();
    if (!deviceKey) {
      return Response.json({ error: "Not Authorized" }, { status: 401 });
    }

    const deviceKeyHash = createHash("sha256")
      .update(deviceKey, "utf8")
      .digest("hex");

    const { data: device, error: deviceError } = await ctx.supabaseAdmin.from(
      "devices",
    )
      .select("id, name")
      .eq("key_hash", deviceKeyHash)
      .eq("active", true)
      .maybeSingle();

    if (deviceError) {
      return Response.json({ error: deviceError.message }, { status: 400 });
    }

    if (!device) {
      return Response.json({ error: "Not Authorized" }, { status: 401 });
    }

    let customerId: unknown;
    try {
      ({ customerId } = await req.json());
    } catch {
      return Response.json({ error: "Body must be JSON" }, { status: 400 });
    }

    if (typeof customerId !== "string" || !customerId.trim()) {
      return Response.json({ error: "customerId is required" }, {
        status: 400,
      });
    }

    const { data: customer, error: customerError } = await ctx.supabaseAdmin
      .from("customers")
      .select("id, name, stamps")
      .eq("id", customerId)
      .single();

    if (customerError) {
      return Response.json({ error: customerError.message }, { status: 400 });
    }

    return Response.json({});
  }),
};
