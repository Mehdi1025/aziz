import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activity-log";
import { prisma } from "@/lib/prisma";

type ScanRequestBody = {
  code?: string;
};

export async function POST(request: Request) {
  let body: ScanRequestBody;

  try {
    body = (await request.json()) as ScanRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Corps de requête JSON invalide" },
      { status: 400 },
    );
  }

  const code = body.code?.trim();
  if (!code) {
    return NextResponse.json(
      { error: "Le champ code est requis" },
      { status: 400 },
    );
  }

  try {
    const reservation = await prisma.reservation.findUnique({
      where: { code },
      include: { distributor: { include: { city: true } } },
    });

    if (!reservation) {
      await logActivity({
        type: "SCAN_FAILED",
        details: `Code inconnu · ${code}`,
      });
      return NextResponse.json({ error: "Code invalide" }, { status: 404 });
    }

    const now = new Date();
    if (now < reservation.validFrom || now > reservation.validTo) {
      await logActivity({
        type: "SCAN_FAILED",
        distributorId: reservation.distributorId,
        code: reservation.code,
        boxNumber: reservation.boxNumber,
        reservationId: reservation.id,
        details: `Hors validité · ${reservation.distributor.city.name} ${reservation.distributor.name}`,
      });
      return NextResponse.json(
        { error: "Hors des dates de validité" },
        { status: 403 },
      );
    }

    await prisma.reservation.update({
      where: { code },
      data: { isUsed: true, scannedAt: now },
    });

    await logActivity({
      type: "SCAN",
      distributorId: reservation.distributorId,
      code: reservation.code,
      boxNumber: reservation.boxNumber,
      reservationId: reservation.id,
      details: `Scan QR · ${reservation.distributor.city.name} ${reservation.distributor.name}`,
    });

    return NextResponse.json({
      status: "success",
      openBox: reservation.boxNumber,
      distributorSlug: reservation.distributor.slug,
      distributorName: reservation.distributor.name,
      cityName: reservation.distributor.city.name,
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}
