import { NextResponse } from "next/server";
import { parseReservationLink } from "@/lib/parse-reservation-link";
import { getRequestOrigin } from "@/lib/request-origin";

export async function POST(request: Request) {
  const formData = await request.formData();
  const link = formData.get("link")?.toString().trim() ?? "";
  const origin = getRequestOrigin(request);

  if (!link) {
    return NextResponse.redirect(
      new URL(
        `/recuperer?error=${encodeURIComponent("Collez le lien complet de votre pass.")}`,
        origin,
      ),
      303,
    );
  }

  const parsed = parseReservationLink(link, origin);

  if (!parsed.ok) {
    return NextResponse.redirect(
      new URL(
        `/recuperer?error=${encodeURIComponent(parsed.error)}`,
        origin,
      ),
      303,
    );
  }

  return NextResponse.redirect(new URL(parsed.passUrl, origin), 303);
}
