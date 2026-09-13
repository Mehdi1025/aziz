import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.reservation.count();
    return NextResponse.json({ ok: true, database: true });
  } catch {
    return NextResponse.json(
      { ok: false, database: false },
      { status: 503 },
    );
  }
}
