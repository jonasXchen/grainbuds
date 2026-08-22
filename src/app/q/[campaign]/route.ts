import { NextResponse, type NextRequest } from "next/server";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: RouteContext<"/q/[campaign]">
) {
  const { campaign: rawCampaign } = await context.params;
  const campaign = rawCampaign.toLowerCase().match(/^[a-z0-9-]{1,60}$/)
    ? rawCampaign.toLowerCase()
    : "unlabelled";
  const orderMode = request.nextUrl.searchParams.get("order");
  const language =
    request.nextUrl.searchParams.get("lang") === "en" ? "en" : "de";
  const kind = orderMode === "table" ? "table" : "online";
  const rawTable = Number.parseInt(
    request.nextUrl.searchParams.get("table") ?? "",
    10
  );
  const tableNumber =
    kind === "table" && rawTable >= 1 && rawTable <= 999 ? rawTable : null;
  const requestedDestination =
    request.nextUrl.searchParams.get("destination") || "/shop";
  const safeDestination =
    requestedDestination.startsWith("/") &&
    !requestedDestination.startsWith("//")
      ? requestedDestination
      : "/shop";
  const destination = new URL(safeDestination, request.nextUrl.origin);
  destination.searchParams.set("order", kind);
  destination.searchParams.set("campaign", campaign);
  if (tableNumber) destination.searchParams.set("table", String(tableNumber));

  if (hasSupabaseEnv()) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.from("grainbuds_qr_scans").insert({
        campaign,
        qr_kind: kind,
        table_number: tableNumber,
        destination_path: `${destination.pathname}${destination.search}`.slice(
          0,
          500
        ),
      });
      if (error) {
        console.error("Could not record QR scan", {
          code: error.code,
          message: error.message,
        });
      }
    } catch (error) {
      console.error("Could not record QR scan", error);
    }
  }

  const response = NextResponse.redirect(destination, 307);
  response.headers.set("Cache-Control", "no-store");
  response.cookies.set("grainbuds-lang", language, {
    path: "/",
    maxAge: 365 * 24 * 60 * 60,
    sameSite: "lax",
  });
  return response;
}
