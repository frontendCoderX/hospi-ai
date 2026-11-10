import { BedDouble, Clock, Flag, LogOut, MapPin, type LucideIcon } from "lucide-react"
import Link from "next/link"

import { ActionTypeBadge } from "@/components/action-type-badge"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { ActionRow, Patient } from "@/lib/types"
import { cn } from "@/lib/utils"

function groupByLocation(patients: Patient[]) {
  const groups = new Map<string, Patient[]>()
  for (const p of patients) {
    const key = p.current_location ?? "No location"
    groups.set(key, [...(groups.get(key) ?? []), p])
  }
  return [...groups.entries()]
}

function Stat({
  label,
  value,
  icon: Icon,
  highlight = false,
}: {
  label: string
  value: number
  icon: LucideIcon
  highlight?: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-muted/40 p-2.5",
        highlight && "border-destructive/30 bg-destructive/5"
      )}
    >
      <Icon className={cn("size-4 text-muted-foreground", highlight && "text-destructive")} />
      <p className="mt-1.5 text-xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

export function CensusCard({ patients, actions }: { patients: Patient[]; actions: ActionRow[] }) {
  const admitted = patients.filter((p) => p.current_status === "Admitted")
  const discharged = patients.filter((p) => p.current_status === "Discharged")
  const pending = actions.filter((a) => a.status === "pending")
  const flagged = actions.filter((a) => a.status === "flagged")

  return (
    <div className="h-full space-y-5 overflow-y-auto py-2 text-sm">
      <p className="text-muted-foreground">Approved records. Updates automatically.</p>

        <div className="grid grid-cols-3 gap-2">
          <Stat label="Active" value={admitted.length} icon={BedDouble} />
          <Stat label="Discharged" value={discharged.length} icon={LogOut} />
          <Stat label="Pending" value={pending.length} icon={Clock} highlight={pending.length > 0} />
        </div>

        <section className="space-y-3">
          <h3 className="font-medium">
            Active patients <span className="text-muted-foreground">({admitted.length})</span>
          </h3>
          {admitted.length === 0 && <p className="text-muted-foreground">No admitted patients.</p>}
          {groupByLocation(admitted).map(([location, list]) => (
            <div key={location}>
              <p className="flex items-center gap-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                <MapPin className="size-3" />
                {location} · {list.length}
              </p>
              <ul className="mt-1.5 space-y-1">
                {list.map((p) => (
                  <li key={p.id} className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-primary" />
                    {p.name}
                  </li>
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
            <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <p className="flex items-center gap-1.5 font-medium text-destructive">
                <Flag className="size-3.5" /> Needs your input ({flagged.length})
              </p>
              <ul className="space-y-1.5">
                {flagged.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center gap-2">
                    <ActionTypeBadge type={a.action_type} />
                    {String((a.edited_payload ?? a.ai_payload).patient_name ?? "Unknown patient")}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
    </div>
  )
}
