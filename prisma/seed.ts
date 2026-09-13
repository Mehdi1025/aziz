import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { getLibSqlConfig } from "../lib/libsql-config";
import { MOCK_CITIES, MOCK_DISTRIBUTORS } from "../lib/mock-network-data";

const adapter = new PrismaLibSql(getLibSqlConfig());

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(`🌱 Seed réseau mock — ${MOCK_CITIES.length} villes, ${MOCK_DISTRIBUTORS.length} distributeurs…`);

  for (const city of MOCK_CITIES) {
    await prisma.city.upsert({
      where: { slug: city.slug },
      create: { id: city.id, slug: city.slug, name: city.name, region: city.region },
      update: { name: city.name, region: city.region },
    });
    console.log(`  🏙  ${city.name}`);
  }

  const cities = await prisma.city.findMany();
  const cityBySlug = new Map(cities.map((c) => [c.slug, c.id]));

  for (const distributor of MOCK_DISTRIBUTORS) {
    const cityId = cityBySlug.get(distributor.citySlug);
    if (!cityId) continue;

    await prisma.distributor.upsert({
      where: { slug: distributor.slug },
      create: {
        id: distributor.id,
        slug: distributor.slug,
        name: distributor.name,
        address: distributor.address,
        latitude: distributor.latitude,
        longitude: distributor.longitude,
        departmentCode: distributor.departmentCode,
        departmentName: distributor.departmentName,
        cityId,
        totalBoxes: distributor.totalBoxes,
        isActive: true,
      },
      update: {
        name: distributor.name,
        address: distributor.address,
        latitude: distributor.latitude,
        longitude: distributor.longitude,
        departmentCode: distributor.departmentCode,
        departmentName: distributor.departmentName,
        cityId,
        totalBoxes: distributor.totalBoxes,
        isActive: true,
      },
    });
    console.log(`    📍 ${distributor.departmentCode} ${distributor.name} — ${distributor.address}`);
  }

  const distCount = await prisma.distributor.count({ where: { isActive: true } });
  const boxTotal = await prisma.distributor.aggregate({
    where: { isActive: true },
    _sum: { totalBoxes: true },
  });

  console.log(`\n✅ ${distCount} distributeurs · ${boxTotal._sum.totalBoxes ?? 0} casiers · adresses GPS à jour.`);

  const offlineSlug = "nancy-stanislas";
  await prisma.distributor.update({
    where: { slug: offlineSlug },
    data: { isActive: false },
  });
  console.log(`  ⚠️  Distributeur hors ligne simulé · ${offlineSlug}`);

  const niceGare = await prisma.distributor.findUnique({ where: { slug: "nice-gare" } });
  const lyonPartDieu = await prisma.distributor.findUnique({ where: { slug: "lyon-part-dieu" } });
  const parisOpera = await prisma.distributor.findUnique({ where: { slug: "paris-opera" } });

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  if (niceGare) {
    for (let box = 1; box <= niceGare.totalBoxes; box++) {
      await prisma.reservation.upsert({
        where: { code: `DEMO-NICE-${box}` },
        create: {
          code: `DEMO-NICE-${box}`,
          distributorId: niceGare.id,
          boxNumber: box,
          validFrom: yesterday,
          validTo: tomorrow,
          isUsed: box <= 2,
          scannedAt: box <= 2 ? yesterday : null,
        },
        update: {
          validFrom: yesterday,
          validTo: tomorrow,
          isUsed: box <= 2,
          scannedAt: box <= 2 ? yesterday : null,
        },
      });
    }
    console.log("  🔶 Saturation simulée · nice-gare (100%)");
  }

  if (lyonPartDieu) {
    await prisma.reservation.upsert({
      where: { code: "DEMO-BLOCKED-LYON" },
      create: {
        code: "DEMO-BLOCKED-LYON",
        distributorId: lyonPartDieu.id,
        boxNumber: 3,
        validFrom: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        validTo: yesterday,
        isUsed: false,
      },
      update: {
        validFrom: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        validTo: yesterday,
        isUsed: false,
        scannedAt: null,
      },
    });
    console.log("  🔒 Casier bloqué simulé · lyon-part-dieu #3");
  }

  if (parisOpera) {
    await prisma.activityLog.create({
      data: {
        type: "SCAN_FAILED",
        distributorId: parisOpera.id,
        code: "INVALID-DEMO",
        boxNumber: 5,
        details: "Scan refusé · hors validité · Paris Opéra",
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
    });
    await prisma.activityLog.create({
      data: {
        type: "SCAN_FAILED",
        distributorId: parisOpera.id,
        code: "WRONG-CODE",
        details: "Scan refusé · code invalide · Paris Opéra",
        createdAt: new Date(now.getTime() - 45 * 60 * 1000),
      },
    });
    console.log("  ⛔ Scans refusés simulés · paris-opera");
  }

  const plans = [
    {
      slug: "starter",
      name: "Starter",
      description: "Idéal pour 1 à 3 logements",
      maxKeys: 3,
      priceMonthly: 2900,
    },
    {
      slug: "pro",
      name: "Pro",
      description: "Pour les loueurs actifs",
      maxKeys: 10,
      priceMonthly: 7900,
    },
    {
      slug: "business",
      name: "Business",
      description: "Parc immobilier étendu",
      maxKeys: 25,
      priceMonthly: 14900,
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { slug: plan.slug },
      create: plan,
      update: plan,
    });
  }
  console.log(`\n  💳 ${plans.length} formules d'abonnement`);

  type KeySeed = {
    id: string;
    propertyLabel: string;
    propertyAddress: string;
    distributorSlug?: string;
    boxNumber?: number;
    status: "pending_deposit" | "in_locker" | "checked_out" | "inactive";
  };

  type LandlordSeed = {
    email: string;
    name: string;
    phone?: string;
    company?: string;
    planSlug: string;
    subscriptionStatus: string;
    keys: KeySeed[];
  };

  const landlordDemos: LandlordSeed[] = [
    {
      email: "lucas.petit@loueur.fr",
      name: "Lucas Petit",
      phone: "06 11 22 33 44",
      planSlug: "starter",
      subscriptionStatus: "trial",
      keys: [
        {
          id: "demo-key-lucas-studio",
          propertyLabel: "Studio République",
          propertyAddress: "5 rue de la République, Lyon",
          status: "pending_deposit",
        },
      ],
    },
    {
      email: "sophie.martin@loueur.fr",
      name: "Sophie Martin",
      phone: "06 22 33 44 55",
      company: "SM Conciiergerie",
      planSlug: "starter",
      subscriptionStatus: "active",
      keys: [
        {
          id: "demo-key-sophie-t1",
          propertyLabel: "T1 Bastille",
          propertyAddress: "12 rue de la Roquette, Paris",
          distributorSlug: "paris-opera",
          boxNumber: 1,
          status: "in_locker",
        },
        {
          id: "demo-key-sophie-t2",
          propertyLabel: "T2 Nation",
          propertyAddress: "8 cours de Vincennes, Paris",
          distributorSlug: "paris-montmartre",
          boxNumber: 2,
          status: "in_locker",
        },
        {
          id: "demo-key-sophie-t3",
          propertyLabel: "T3 Belleville",
          propertyAddress: "44 rue de Belleville, Paris",
          status: "pending_deposit",
        },
      ],
    },
    {
      email: "thomas.bernard@immo.fr",
      name: "Thomas Bernard",
      phone: "06 98 76 54 32",
      planSlug: "starter",
      subscriptionStatus: "past_due",
      keys: [
        {
          id: "demo-key-thomas-villa",
          propertyLabel: "Villa Chartrons",
          propertyAddress: "22 quai des Chartrons, Bordeaux",
          distributorSlug: "bordeaux-gare",
          boxNumber: 2,
          status: "in_locker",
        },
      ],
    },
    {
      email: "marie.dupont@loueur.fr",
      name: "Marie Dupont",
      phone: "06 12 34 56 78",
      company: "MD Locations",
      planSlug: "pro",
      subscriptionStatus: "active",
      keys: [
        {
          id: "demo-key-marie-t2",
          propertyLabel: "T2 Haussmann",
          propertyAddress: "8 rue de la Paix, Paris",
          distributorSlug: "paris-opera",
          boxNumber: 7,
          status: "in_locker",
        },
        {
          id: "demo-key-marie-studio",
          propertyLabel: "Studio Marais",
          propertyAddress: "14 rue des Archives, Paris",
          status: "pending_deposit",
        },
        {
          id: "demo-key-marie-loft",
          propertyLabel: "Loft Canal Saint-Martin",
          propertyAddress: "3 quai de Valmy, Paris",
          distributorSlug: "paris-gare-nord",
          boxNumber: 4,
          status: "in_locker",
        },
        {
          id: "demo-key-marie-duplex",
          propertyLabel: "Duplex Montorgueil",
          propertyAddress: "18 rue Montorgueil, Paris",
          distributorSlug: "paris-opera",
          boxNumber: 9,
          status: "checked_out",
        },
      ],
    },
    {
      email: "contact@immolyonplus.fr",
      name: "Immo Lyon Plus",
      phone: "04 78 00 12 34",
      company: "Immo Lyon Plus",
      planSlug: "pro",
      subscriptionStatus: "active",
      keys: [
        { id: "demo-key-ilyon-1", propertyLabel: "T2 Part-Dieu", propertyAddress: "10 rue Garibaldi, Lyon", distributorSlug: "lyon-bellecour", boxNumber: 1, status: "in_locker" },
        { id: "demo-key-ilyon-2", propertyLabel: "Studio Confluence", propertyAddress: "2 rue de la Charité, Lyon", distributorSlug: "lyon-bellecour", boxNumber: 3, status: "in_locker" },
        { id: "demo-key-ilyon-3", propertyLabel: "T3 Croix-Rousse", propertyAddress: "55 montée de la Grande-Côte, Lyon", distributorSlug: "lyon-bellecour", boxNumber: 5, status: "in_locker" },
        { id: "demo-key-ilyon-4", propertyLabel: "T1 Guillotière", propertyAddress: "8 rue Victor Hugo, Lyon", distributorSlug: "lyon-bellecour", boxNumber: 7, status: "in_locker" },
        { id: "demo-key-ilyon-5", propertyLabel: "Loft Presqu'île", propertyAddress: "14 rue de la République, Lyon", distributorSlug: "lyon-bellecour", boxNumber: 9, status: "in_locker" },
        { id: "demo-key-ilyon-6", propertyLabel: "T2 Vaise", propertyAddress: "3 rue Marietton, Lyon", distributorSlug: "lyon-bellecour", boxNumber: 11, status: "in_locker" },
        { id: "demo-key-ilyon-7", propertyLabel: "Studio Monplaisir", propertyAddress: "22 avenue des Frères Lumière, Lyon", status: "pending_deposit" },
        { id: "demo-key-ilyon-8", propertyLabel: "T3 Gerland", propertyAddress: "6 avenue Tony Garnier, Lyon", distributorSlug: "lyon-bellecour", boxNumber: 2, status: "checked_out" },
      ],
    },
    {
      email: "reservations@hotelmercure-nantes.fr",
      name: "Hôtel Mercure Nantes",
      phone: "02 40 00 56 78",
      company: "Mercure Nantes Gare",
      planSlug: "pro",
      subscriptionStatus: "active",
      keys: [
        { id: "demo-key-mercure-1", propertyLabel: "Ch. 101 — Standard", propertyAddress: "Hôtel Mercure, Nantes", distributorSlug: "nantes-gare", boxNumber: 1, status: "in_locker" },
        { id: "demo-key-mercure-2", propertyLabel: "Ch. 205 — Supérieure", propertyAddress: "Hôtel Mercure, Nantes", distributorSlug: "nantes-gare", boxNumber: 3, status: "in_locker" },
        { id: "demo-key-mercure-3", propertyLabel: "Ch. 312 — Suite", propertyAddress: "Hôtel Mercure, Nantes", distributorSlug: "nantes-gare", boxNumber: 5, status: "in_locker" },
        { id: "demo-key-mercure-4", propertyLabel: "Ch. 118 — Familiale", propertyAddress: "Hôtel Mercure, Nantes", distributorSlug: "nantes-chateau", boxNumber: 2, status: "in_locker" },
        { id: "demo-key-mercure-5", propertyLabel: "Ch. 401 — Panorama", propertyAddress: "Hôtel Mercure, Nantes", status: "pending_deposit" },
      ],
    },
    {
      email: "camille.renard@loueur.fr",
      name: "Camille Renard",
      phone: "06 45 67 89 01",
      planSlug: "pro",
      subscriptionStatus: "canceled",
      keys: [
        {
          id: "demo-key-camille-old-1",
          propertyLabel: "Ancien T2 (archivé)",
          propertyAddress: "Lille centre",
          status: "inactive",
        },
        {
          id: "demo-key-camille-old-2",
          propertyLabel: "Studio Fives (archivé)",
          propertyAddress: "Lille Fives",
          status: "inactive",
        },
      ],
    },
    {
      email: "gestion@agence-rivoli.fr",
      name: "Agence Rivoli",
      phone: "01 42 00 88 99",
      company: "Agence Rivoli Patrimoine",
      planSlug: "business",
      subscriptionStatus: "active",
      keys: [
        { id: "demo-key-rivoli-01", propertyLabel: "Immeuble Rivoli — Apt A1", propertyAddress: "10 rue de Rivoli, Paris", distributorSlug: "paris-opera", boxNumber: 2, status: "in_locker" },
        { id: "demo-key-rivoli-02", propertyLabel: "Immeuble Rivoli — Apt A2", propertyAddress: "10 rue de Rivoli, Paris", distributorSlug: "paris-opera", boxNumber: 4, status: "in_locker" },
        { id: "demo-key-rivoli-03", propertyLabel: "Immeuble Rivoli — Apt B1", propertyAddress: "10 rue de Rivoli, Paris", distributorSlug: "paris-opera", boxNumber: 6, status: "in_locker" },
        { id: "demo-key-rivoli-04", propertyLabel: "Immeuble Rivoli — Apt B2", propertyAddress: "10 rue de Rivoli, Paris", distributorSlug: "paris-opera", boxNumber: 8, status: "in_locker" },
        { id: "demo-key-rivoli-05", propertyLabel: "Haussmann — 3e étage", propertyAddress: "24 bd Haussmann, Paris", distributorSlug: "paris-montmartre", boxNumber: 1, status: "in_locker" },
        { id: "demo-key-rivoli-06", propertyLabel: "Haussmann — 5e étage", propertyAddress: "24 bd Haussmann, Paris", distributorSlug: "paris-montmartre", boxNumber: 3, status: "in_locker" },
        { id: "demo-key-rivoli-07", propertyLabel: "Saint-Germain — Duplex", propertyAddress: "6 rue de Seine, Paris", distributorSlug: "paris-montmartre", boxNumber: 5, status: "in_locker" },
        { id: "demo-key-rivoli-08", propertyLabel: "Marseille Vieux-Port — T3", propertyAddress: "1 quai du Port, Marseille", distributorSlug: "marseille-vieux-port", boxNumber: 1, status: "in_locker" },
        { id: "demo-key-rivoli-09", propertyLabel: "Marseille Joliette — T2", propertyAddress: "15 av. Robert Schuman, Marseille", distributorSlug: "marseille-joliette", boxNumber: 2, status: "in_locker" },
        { id: "demo-key-rivoli-10", propertyLabel: "Toulouse Capitole — Studio", propertyAddress: "1 place du Capitole, Toulouse", distributorSlug: "toulouse-capitole", boxNumber: 1, status: "in_locker" },
        { id: "demo-key-rivoli-11", propertyLabel: "Toulouse Compans — T2", propertyAddress: "9 esp. Compans Caffarelli, Toulouse", distributorSlug: "toulouse-compans", boxNumber: 3, status: "in_locker" },
        { id: "demo-key-rivoli-12", propertyLabel: "Bordeaux Bourse — Loft", propertyAddress: "1 place de la Bourse, Bordeaux", distributorSlug: "bordeaux-bourse", boxNumber: 1, status: "in_locker" },
        { id: "demo-key-rivoli-13", propertyLabel: "Strasbourg Petite France", propertyAddress: "3 petite rue des Dentelles, Strasbourg", distributorSlug: "strasbourg-petite-france", boxNumber: 2, status: "in_locker" },
        { id: "demo-key-rivoli-14", propertyLabel: "Lille Euralille — T2", propertyAddress: "100 av. Willy Brandt, Lille", distributorSlug: "lille-euralille", boxNumber: 4, status: "in_locker" },
        { id: "demo-key-rivoli-15", propertyLabel: "Rennes Gare — T1", propertyAddress: "19 rue du Champ de Mars, Rennes", distributorSlug: "rennes-gare", boxNumber: 1, status: "in_locker" },
        { id: "demo-key-rivoli-16", propertyLabel: "Montpellier Comédie — T3", propertyAddress: "1 place de la Comédie, Montpellier", distributorSlug: "montpellier-comedie", boxNumber: 2, status: "in_locker" },
        { id: "demo-key-rivoli-17", propertyLabel: "Grenoble Gare — Studio", propertyAddress: "16 place de la Gare, Grenoble", distributorSlug: "grenoble-gare", boxNumber: 3, status: "in_locker" },
        { id: "demo-key-rivoli-18", propertyLabel: "Reims Cathédrale — T2", propertyAddress: "2 rue Guillaume de Machault, Reims", distributorSlug: "reims-cathedrale", boxNumber: 1, status: "checked_out" },
        { id: "demo-key-rivoli-19", propertyLabel: "Nantes Château — T4", propertyAddress: "4 place Marc Elder, Nantes", status: "pending_deposit" },
        { id: "demo-key-rivoli-20", propertyLabel: "Paris Nord — Penthouse", propertyAddress: "112 rue de Maubeuge, Paris", status: "pending_deposit" },
      ],
    },
  ];

  const plansBySlug = new Map(
    (await prisma.subscriptionPlan.findMany()).map((plan) => [plan.slug, plan]),
  );
  const distributorsBySlug = new Map(
    (await prisma.distributor.findMany()).map((dist) => [dist.slug, dist]),
  );

  const renewsAt = new Date(now);
  renewsAt.setMonth(renewsAt.getMonth() + 1);

  for (const demo of landlordDemos) {
    const plan = plansBySlug.get(demo.planSlug);
    if (!plan) continue;

    const landlord = await prisma.landlord.upsert({
      where: { email: demo.email },
      create: {
        name: demo.name,
        email: demo.email,
        phone: demo.phone ?? null,
        company: demo.company ?? null,
      },
      update: {
        name: demo.name,
        phone: demo.phone ?? null,
        company: demo.company ?? null,
      },
    });

    let subscription = await prisma.subscription.findFirst({
      where: { landlordId: landlord.id },
      orderBy: { startedAt: "desc" },
    });

    if (subscription) {
      subscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          planId: plan.id,
          status: demo.subscriptionStatus,
          renewsAt,
          canceledAt: demo.subscriptionStatus === "canceled" ? yesterday : null,
        },
      });
    } else {
      subscription = await prisma.subscription.create({
        data: {
          landlordId: landlord.id,
          planId: plan.id,
          status: demo.subscriptionStatus,
          renewsAt,
          canceledAt: demo.subscriptionStatus === "canceled" ? yesterday : null,
        },
      });
    }

    for (const key of demo.keys) {
      const distributor = key.distributorSlug
        ? distributorsBySlug.get(key.distributorSlug)
        : null;
      const inLocker = key.status === "in_locker" || key.status === "checked_out";

      await prisma.keyDeposit.upsert({
        where: { id: key.id },
        create: {
          id: key.id,
          landlordId: landlord.id,
          subscriptionId: subscription.id,
          propertyLabel: key.propertyLabel,
          propertyAddress: key.propertyAddress,
          distributorId: distributor?.id ?? null,
          boxNumber: key.boxNumber ?? null,
          status: key.status,
          depositedAt: inLocker ? yesterday : null,
        },
        update: {
          subscriptionId: subscription.id,
          propertyLabel: key.propertyLabel,
          propertyAddress: key.propertyAddress,
          distributorId: distributor?.id ?? null,
          boxNumber: key.boxNumber ?? null,
          status: key.status,
          depositedAt: inLocker ? yesterday : null,
        },
      });
    }
  }

  const landlordCount = landlordDemos.length;
  const keyCount = landlordDemos.reduce((sum, demo) => sum + demo.keys.length, 0);
  console.log(`  🏠 ${landlordCount} loueurs démo · ${keyCount} clés · quotas variés`);
}

main()
  .catch((e) => { console.error("❌ Seed échoué:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
