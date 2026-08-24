import { prisma } from "@/lib/db/client";
import { AppError } from "@/lib/errors";
import type { Zone } from "@/generated/prisma/client";

/**
 * Zone detection is a plain admin-managed pincode → zone lookup (the
 * Area table), not a geocoding call. Admins map pincodes to zones ahead
 * of time; order creation just looks the mapping up.
 */
export async function resolveZoneForPincode(pincode: string): Promise<Zone> {
  const area = await prisma.area.findUnique({
    where: { pincode },
    include: { zone: true },
  });
  if (!area) {
    throw new AppError(
      `No zone is configured for pincode "${pincode}". An admin needs to map this pincode to a zone before orders can be created for it.`,
      422
    );
  }
  return area.zone;
}
