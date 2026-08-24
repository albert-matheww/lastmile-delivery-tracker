import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RateCardForm } from "@/components/admin/rate-card-form";
import { CodSurchargeForm } from "@/components/admin/cod-surcharge-form";
import { formatCurrency } from "@/lib/utils";

export default async function AdminRateCardsPage() {
  await requireRole("ADMIN");
  const [rateCards, codConfigs] = await Promise.all([
    prisma.rateCard.findMany({ orderBy: [{ orderType: "asc" }, { zoneRelation: "asc" }] }),
    prisma.codSurchargeConfig.findMany({ orderBy: { orderType: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Rate Cards</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted">
            One rate per order type × zone relation. Submitting an existing pair updates it.
          </p>
          <RateCardForm />
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-background text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Order type</th>
                  <th className="px-4 py-2 font-medium">Zone relation</th>
                  <th className="px-4 py-2 font-medium">Base fee</th>
                  <th className="px-4 py-2 font-medium">Per-kg rate</th>
                </tr>
              </thead>
              <tbody>
                {rateCards.map((rc) => (
                  <tr key={rc.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2">{rc.orderType}</td>
                    <td className="px-4 py-2">{rc.zoneRelation}</td>
                    <td className="px-4 py-2">{formatCurrency(rc.baseFee.toString())}</td>
                    <td className="px-4 py-2">{formatCurrency(rc.perKgRate.toString())}/kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>COD Surcharge</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CodSurchargeForm />
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-background text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Order type</th>
                  <th className="px-4 py-2 font-medium">Flat fee</th>
                  <th className="px-4 py-2 font-medium">Percent of charge</th>
                </tr>
              </thead>
              <tbody>
                {codConfigs.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2">{c.orderType}</td>
                    <td className="px-4 py-2">{formatCurrency(c.flatFee.toString())}</td>
                    <td className="px-4 py-2">{(Number(c.percentOfCharge) * 100).toFixed(1)}%</td>
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
