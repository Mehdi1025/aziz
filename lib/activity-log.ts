import type { ActivityLogRow, ActivityType } from "@/lib/activity-log-shared";
import { prisma } from "@/lib/prisma";

export type { ActivityLogRow, ActivityType } from "@/lib/activity-log-shared";
export { getActivityLabel } from "@/lib/activity-log-shared";

type LogActivityInput = {
  type: ActivityType;
  distributorId?: string;
  code?: string;
  boxNumber?: number;
  reservationId?: string;
  details?: string;
};

export async function logActivity(input: LogActivityInput) {
  await prisma.activityLog.create({
    data: {
      type: input.type,
      distributorId: input.distributorId,
      code: input.code,
      boxNumber: input.boxNumber,
      reservationId: input.reservationId,
      details: input.details,
    },
  });
}

export async function getRecentActivityLogs(
  limit = 50,
): Promise<ActivityLogRow[]> {
  const logs = await prisma.activityLog.findMany({
    include: {
      distributor: { include: { city: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return logs.map((log) => ({
    id: log.id,
    type: log.type as ActivityType,
    distributorId: log.distributorId,
    distributorName: log.distributor?.name ?? null,
    cityName: log.distributor?.city.name ?? null,
    code: log.code,
    boxNumber: log.boxNumber,
    reservationId: log.reservationId,
    details: log.details,
    createdAt: log.createdAt.toISOString(),
  }));
}
