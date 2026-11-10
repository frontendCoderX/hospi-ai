import { connection } from "next/server"

import { supabase } from "@/lib/supabase"
import type { Patient } from "@/lib/types"

export default async function DoctorPage() {
  await connection() // always load fresh data, never at build time

  const { data, error } = await supabase.from("patients").select("*").order("name")

  if (error) return <p className="text-destructive">Database error: {error.message}</p>

  const patients = data as Patient[]

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Doctor&apos;s Command Center</h1>
      <p className="text-sm text-muted-foreground">
        Connected to Supabase: {patients.length} patients found.
      </p>
      <ul className="text-sm">
        {patients.map((p) => (
          <li key={p.id}>
            {p.name}: {p.current_status} ({p.current_location ?? "no location"})
          </li>
        ))}
      </ul>
    </div>
  )
}
