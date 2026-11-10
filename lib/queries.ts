// All database access for pages and AI tools lives here. Nothing else touches Supabase directly.
import "server-only"

import { supabase } from "./supabase"
import type { ActionRow, ActionType, Patient } from "./types"

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

// Case-insensitive exact name match. Returns null if there's no match, or more than one.
export async function findPatientByName(name: string): Promise<Patient | null> {
  const { data, error } = await supabase.from("patients").select("*").ilike("name", name.trim())

  if (error) throw new Error(`Could not look up patient: ${error.message}`)
  return data.length === 1 ? (data[0] as Patient) : null
}

// Used by the AI to answer census questions. Location matches partially ("Mercy" → "Mercy General").
export async function searchPatients(filters: {
  location: string | null
  status: Patient["current_status"] | null
}): Promise<Patient[]> {
  let query = supabase.from("patients").select("*").order("name")
  if (filters.location) query = query.ilike("current_location", `%${filters.location.trim()}%`)
  if (filters.status) query = query.eq("current_status", filters.status)

  const { data, error } = await query
  if (error) throw new Error(`Could not search patients: ${error.message}`)
  return data as Patient[]
}

export async function createAction(row: {
  action_type: ActionType
  patient_id: string | null
  raw_transcript: string
  ai_payload: ActionRow["ai_payload"]
  confidence_flag: boolean
}): Promise<string> {
  const { data, error } = await supabase.from("action_queue").insert(row).select("id").single()

  if (error) throw new Error(`Could not queue action: ${error.message}`)
  return data.id as string
}
