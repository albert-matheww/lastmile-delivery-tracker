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
                  className={`h-2.5 w-2.5 shrink-0 rounded-full border-[1.5px] ${
                    i === history.length - 1
                      ? "border-route bg-route"
                      : "border-line-strong bg-paper-raised"
                  }`}
                />
                {i < history.length - 1 && (
                  <span
                    className="timeline-line w-px flex-1 bg-line-strong"
                    style={{ animationDelay: `${i * 90}ms` }}
                  />
                )}
              </div>
              <div className="pb-4">
                <div className="flex items-center gap-2">
                  <StatusBadge status={entry.status} />
                  <span className="font-manifest text-xs text-ink-soft">
                    {formatDateTime(entry.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink-soft">
                  by {entry.actor.name} ({entry.actorRole})
                </p>
                {entry.note && <p className="mt-1 text-sm text-ink">{entry.note}</p>}
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
