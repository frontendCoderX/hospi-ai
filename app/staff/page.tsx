import { connection } from "next/server"

import { supabase } from "@/lib/supabase"
import type { ActionRow } from "@/lib/types"

export default async function StaffPage() {
  await connection()

  const { data, error } = await supabase
    .from("action_queue")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) return <p className="text-destructive">Database error: {error.message}</p>

  const actions = data as ActionRow[]

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Staff Action Queue</h1>
      <p className="text-sm text-muted-foreground">{actions.length} actions in the queue.</p>
      <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs">
        {JSON.stringify(actions, null, 2)}
      </pre>
    </div>
  )
}
