// All database reads live here. Pages call these functions and never touch Supabase directly.
import "server-only"

import { supabase } from "./supabase"
import type { ActionRow, Patient } from "./types"

export async function getActions(): Promise<ActionRow[]> {
  const { data, error } = await supabase
    .from("action_queue")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw new Error(`Could not load actions: ${error.message}`)
  return data as ActionRow[]
}

export async function getPatients(): Promise<Patient[]> {
  const { data, error } = await supabase.from("patients").select("*").order("name")

  if (error) throw new Error(`Could not load patients: ${error.message}`)
  return data as Patient[]
}
