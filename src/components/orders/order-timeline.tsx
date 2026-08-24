import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import type { OrderWithDetail } from "@/lib/orders/access";

export function OrderTimeline({ history }: { history: OrderWithDetail["statusHistory"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tracking Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-4">
          {history.map((entry, i) => (
            <li key={entry.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    i === history.length - 1 ? "bg-primary" : "bg-border"
                  }`}
                />
                {i < history.length - 1 && <span className="w-px flex-1 bg-border" />}
              </div>
              <div className="pb-4">
                <div className="flex items-center gap-2">
                  <StatusBadge status={entry.status} />
                  <span className="text-xs text-muted">{formatDateTime(entry.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm text-muted">
                  by {entry.actor.name} ({entry.actorRole})
                </p>
                {entry.note && <p className="mt-1 text-sm">{entry.note}</p>}
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
