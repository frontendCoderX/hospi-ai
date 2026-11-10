import { HeartPulse, MessageSquare, Receipt, type LucideIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { ACTION_TYPE_LABELS } from "@/lib/labels"
import type { ActionType } from "@/lib/types"
import { cn } from "@/lib/utils"

// One colour + icon per task type, so staff can scan the queue at a glance.
export const ACTION_TYPE_STYLES: Record<
  ActionType,
  { icon: LucideIcon; badge: string; accent: string }
> = {
  billing: {
    icon: Receipt,
    badge: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
    accent: "border-l-violet-500",
  },
  emr_update: {
    icon: HeartPulse,
    badge: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
    accent: "border-l-sky-500",
  },
  patient_comms: {
    icon: MessageSquare,
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    accent: "border-l-emerald-500",
  },
}

export function ActionTypeBadge({ type, className }: { type: ActionType; className?: string }) {
  const { icon: Icon, badge } = ACTION_TYPE_STYLES[type]
  return (
    <Badge className={cn("gap-1", badge, className)}>
      <Icon />
      {ACTION_TYPE_LABELS[type]}
    </Badge>
  )
}
