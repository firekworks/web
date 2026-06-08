import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)),
    googleMapsPublic: Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY),
    googlePlaces: Boolean(process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_SERVER_API_KEY),
    googleRoutes: Boolean(process.env.GOOGLE_ROUTES_API_KEY),
    googleCalendar: Boolean(process.env.GOOGLE_CALENDAR_CLIENT_ID && process.env.GOOGLE_CALENDAR_CLIENT_SECRET),
    meta: Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET),
    whatsapp: Boolean(process.env.WHATSAPP_BUSINESS_TOKEN),
    stats: Boolean(process.env.FIREKWORKS_STATS_URL)
  });
}
