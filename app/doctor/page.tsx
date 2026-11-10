import { connection } from "next/server"

import { getPatients } from "@/lib/queries"

export default async function DoctorPage() {
  await connection() // always load fresh data, never at build time
  const patients = await getPatients()

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
