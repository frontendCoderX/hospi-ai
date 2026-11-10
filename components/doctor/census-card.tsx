import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ACTION_TYPE_LABELS } from "@/lib/labels"
import type { ActionRow, Patient } from "@/lib/types"

function groupByLocation(patients: Patient[]) {
  const groups = new Map<string, Patient[]>()
  for (const p of patients) {
    const key = p.current_location ?? "No location"
    groups.set(key, [...(groups.get(key) ?? []), p])
  }
  return [...groups.entries()]
}

export function CensusCard({ patients, actions }: { patients: Patient[]; actions: ActionRow[] }) {
  const admitted = patients.filter((p) => p.current_status === "Admitted")
  const discharged = patients.filter((p) => p.current_status === "Discharged")
  const pending = actions.filter((a) => a.status === "pending")
  const flagged = actions.filter((a) => a.status === "flagged")

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Daily Census</CardTitle>
        <CardDescription>Approved records. Updates automatically.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 text-sm">
        <section className="space-y-3">
          <h3 className="font-medium">
            Active patients <span className="text-muted-foreground">({admitted.length})</span>
          </h3>
          {admitted.length === 0 && <p className="text-muted-foreground">No admitted patients.</p>}
          {groupByLocation(admitted).map(([location, list]) => (
            <div key={location}>
              <p className="text-xs text-muted-foreground uppercase">
                {location} · {list.length}
              </p>
              <ul className="mt-1 space-y-0.5">
                {list.map((p) => (
                  <li key={p.id}>{p.name}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <Separator />

        <section className="space-y-2">
          <h3 className="font-medium">
            Recent discharges <span className="text-muted-foreground">({discharged.length})</span>
          </h3>
          {discharged.length === 0 ? (
            <p className="text-muted-foreground">No discharges.</p>
          ) : (
            <ul className="space-y-0.5">
              {discharged.map((p) => (
                <li key={p.id}>
                  {p.name} <span className="text-muted-foreground">· {p.current_location}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Separator />

        <section className="space-y-2">
          <h3 className="flex items-center gap-2 font-medium">
            Pending tasks
            <Badge variant={pending.length > 0 ? "destructive" : "secondary"}>{pending.length}</Badge>
          </h3>
          <p className="text-muted-foreground">
            Waiting for staff review.{" "}
            <Link href="/staff" className="underline underline-offset-2">
              Open queue
            </Link>
          </p>

          {flagged.length > 0 && (
            <div className="space-y-1 pt-2">
              <p className="font-medium text-destructive">Needs your input ({flagged.length})</p>
              <ul className="space-y-0.5">
                {flagged.map((a) => (
                  <li key={a.id}>
                    {ACTION_TYPE_LABELS[a.action_type]} ·{" "}
                    {String((a.edited_payload ?? a.ai_payload).patient_name ?? "Unknown patient")}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  )
}
