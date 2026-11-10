import { connection } from "next/server"

import { CensusCard } from "@/components/doctor/census-card"
import { ChatPanel } from "@/components/doctor/chat-panel"
import { DoctorWorkspace } from "@/components/doctor/doctor-workspace"
import { getActions, getPatients } from "@/lib/queries"

export default async function DoctorPage() {
  await connection() // always load fresh data, never at build time
  const [patients, actions] = await Promise.all([getPatients(), getActions()])

  return (
    <DoctorWorkspace
      chat={<ChatPanel />}
      census={<CensusCard patients={patients} actions={actions} />}
      pendingCount={actions.filter((a) => a.status === "pending").length}
    />
  )
}
