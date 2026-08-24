import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ZoneForm } from "@/components/admin/zone-form";
import { AreaForm } from "@/components/admin/area-form";

export default async function AdminZonesPage() {
  await requireRole("ADMIN");
  const [zones, areas] = await Promise.all([
    prisma.zone.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { areas: true, agents: true } } },
    }),
    prisma.area.findMany({
      orderBy: { pincode: "asc" },
      include: { zone: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Zones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ZoneForm />
          <div className="overflow-x-auto rounded-[5px] border-[1.5px] border-line bg-paper-raised">
            <table className="w-full text-sm">
              <thead className="border-b-[1.5px] border-line bg-paper text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                <tr>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Code</th>
                  <th className="px-4 py-2 font-medium">Pincodes mapped</th>
                  <th className="px-4 py-2 font-medium">Agents</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((z) => (
                  <tr key={z.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-2">{z.name}</td>
                    <td className="px-4 py-2 font-manifest">{z.code}</td>
                    <td className="px-4 py-2">{z._count.areas}</td>
                    <td className="px-4 py-2">{z._count.agents}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pincode → Zone Mapping</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AreaForm zones={zones.map((z) => ({ id: z.id, name: z.name }))} />
          <div className="max-h-96 overflow-y-auto rounded-[5px] border-[1.5px] border-line bg-paper-raised">
            <table className="w-full text-sm">
              <thead className="sticky top-0 border-b-[1.5px] border-line bg-paper text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                <tr>
                  <th className="px-4 py-2 font-medium">Pincode</th>
                  <th className="px-4 py-2 font-medium">Label</th>
                  <th className="px-4 py-2 font-medium">Zone</th>
                </tr>
              </thead>
              <tbody>
                {areas.map((a) => (
                  <tr key={a.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-2 font-manifest">{a.pincode}</td>
                    <td className="px-4 py-2">{a.label}</td>
                    <td className="px-4 py-2">{a.zone.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
