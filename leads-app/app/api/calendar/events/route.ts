import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type CalendarEventRequest = {
  leadId?: string;
  title?: string;
  scheduledAt?: string;
  type?: string;
};

export async function GET() {
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ events: [], source: "local" });

  const { data, error } = await supabase
    .from("lead_calendar_events")
    .select("*")
    .order("scheduled_at", { ascending: true })
    .limit(100);

  if (error) return NextResponse.json({ events: [], error: error.message }, { status: 200 });

  return NextResponse.json({ events: data || [], source: "supabase" });
}

export async function POST(request: Request) {
  const body = (await request.json()) as CalendarEventRequest;

  if (!body.leadId || !body.scheduledAt) {
    return NextResponse.json({ error: "leadId y scheduledAt son requeridos" }, { status: 400 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: true, source: "lead-fallback" });
  }

  const { data, error } = await supabase
    .from("lead_calendar_events")
    .insert({
      lead_id: body.leadId,
      title: body.title || "Seguimiento comercial",
      scheduled_at: body.scheduledAt,
      type: body.type || "Seguimiento comercial",
      status: "pending"
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ ok: true, source: "lead-fallback", warning: error.message });
  }

  return NextResponse.json({ ok: true, event: data, source: "supabase" });
}
