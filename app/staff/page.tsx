import { ClipboardCheck } from "lucide-react"
import { connection } from "next/server"

import { AutoRefresh } from "@/components/auto-refresh"
import { PageHeader } from "@/components/page-header"
import { QueueTabs } from "@/components/staff/queue-tabs"
import { getActions } from "@/lib/queries"

export default async function StaffPage() {
  await connection()
  const actions = await getActions()

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ClipboardCheck}
        title="Staff Action Queue"
        description="Check what the AI extracted, fix anything wrong, then approve."
      />
      <QueueTabs actions={actions} />
      <AutoRefresh />
    </div>
  )
}
