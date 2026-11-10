import { connection } from "next/server"

import { CensusCard } from "@/components/doctor/census-card"
import { ChatPanel } from "@/components/doctor/chat-panel"
import { getActions, getPatients } from "@/lib/queries"

export default async function DoctorPage() {
  await connection() // always load fresh data, never at build time
  const [patients, actions] = await Promise.all([getPatients(), getActions()])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Doctor&apos;s Command Center</h1>
        <p className="text-sm text-muted-foreground">
          Dump your notes between rounds. Staff verifies everything before it syncs.
        </p>
      </div>

      {/* Two columns on desktop, stacked on mobile */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <ChatPanel />
        <CensusCard patients={patients} actions={actions} />
      </div>
    </div>
  )
}
