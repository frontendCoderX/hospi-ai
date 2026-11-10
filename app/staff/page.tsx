import { connection } from "next/server"

import { AutoRefresh } from "@/components/auto-refresh"
import { QueueTabs } from "@/components/staff/queue-tabs"
import { getActions } from "@/lib/queries"

export default async function StaffPage() {
  await connection()
  const actions = await getActions()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Staff Action Queue</h1>
        <p className="text-sm text-muted-foreground">
          Check what the AI extracted, fix anything wrong, then approve.
        </p>
      </div>
      <QueueTabs actions={actions} />
      <AutoRefresh />
    </div>
  )
}
