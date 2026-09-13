import QRCode from "qrcode";
import { NextResponse } from "next/server";
import { resolveDistributorSlugWithLegacy } from "@/lib/network";
import { parseFrenchDateParam } from "@/lib/parse-french-date";
import { buildPassUrl } from "@/lib/parse-reservation-link";
import { prisma } from "@/lib/prisma";

type PassRequestBody = {
  code?: string;
  in?: string;
  out?: string;
  box?: string;
  site?: string;
};

export async function POST(request: Request) {
  let body: PassRequestBody;

  try {
    body = (await request.json()) as PassRequestBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Corps JSON invalide" },
      { status: 400 },
    );
  }

  const code = body.code?.trim();
  const inDate = body.in?.trim();
  const outDate = body.out?.trim();
  const boxRaw = body.box?.trim();
  const siteRaw = body.site?.trim();

  if (!code || !inDate || !outDate || !boxRaw) {
    return NextResponse.json(
      { ok: false, error: "Paramètres code, in, out et box requis." },
      { status: 400 },
    );
  }

  const boxNumber = Number.parseInt(boxRaw, 10);
  if (!Number.isInteger(boxNumber) || boxNumber < 1) {
    return NextResponse.json(
      { ok: false, error: "Le casier (box) doit être un entier positif." },
      { status: 400 },
    );
  }

  const distributor = await resolveDistributorSlugWithLegacy(siteRaw);
  if (boxNumber > distributor.totalBoxes) {
    return NextResponse.json(
      {
        ok: false,
        error: `Casier ${boxNumber} invalide pour ${distributor.cityName} ${distributor.name} (max ${distributor.totalBoxes}).`,
      },
      { status: 400 },
    );
  }

  const validFromResult = parseFrenchDateParam(inDate, "in");
  if (!validFromResult.ok) {
    return NextResponse.json(
      { ok: false, error: validFromResult.error },
      { status: 400 },
    );
  }

  const validToResult = parseFrenchDateParam(outDate, "out");
  if (!validToResult.ok) {
    return NextResponse.json(
      { ok: false, error: validToResult.error },
      { status: 400 },
    );
  }

  if (validToResult.date <= validFromResult.date) {
    return NextResponse.json(
      {
        ok: false,
        error: "La date de départ doit être postérieure à la date d'arrivée.",
      },
      { status: 400 },
    );
  }

  try {
    const reservation = await prisma.reservation.upsert({
      where: { code },
      create: {
        code,
        distributorId: distributor.id,
        boxNumber,
        validFrom: validFromResult.date,
        validTo: validToResult.date,
        isUsed: false,
      },
      update: {
        distributorId: distributor.id,
        boxNumber,
        validFrom: validFromResult.date,
        validTo: validToResult.date,
      },
      include: { distributor: { include: { city: true } } },
    });

    const qrDataUrl = await QRCode.toDataURL(reservation.code, {
      width: 280,
      margin: 2,
      color: { dark: "#18181b", light: "#ffffff" },
    });

    return NextResponse.json({
      ok: true,
      code: reservation.code,
      boxNumber: reservation.boxNumber,
      distributorSlug: reservation.distributor.slug,
      distributorName: reservation.distributor.name,
      cityName: reservation.distributor.city.name,
      qrDataUrl,
      passUrl: buildPassUrl({
        code: reservation.code,
        in: inDate,
        out: outDate,
        box: String(reservation.boxNumber),
        site: reservation.distributor.slug,
      }),
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Erreur lors de la création du pass." },
      { status: 500 },
    );
  }
}
