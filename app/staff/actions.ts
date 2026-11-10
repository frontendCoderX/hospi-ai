"use server"

import { refresh } from "next/cache"
import { z } from "zod"

import { fieldLabel } from "@/lib/labels"
import { supabase } from "@/lib/supabase"
import type { ActionRow, Patient } from "@/lib/types"

export type Result = { ok: boolean; message: string }
type Fields = Record<string, string | null>

// Server actions can be called by anyone with a POST request, so check the input shape.
const inputSchema = z.object({
  id: z.uuid(),
  fields: z.record(z.string(), z.string().nullable()),
})

const PATIENT_STATUSES: Patient["current_status"][] = ["Admitted", "Discharged", "Outpatient"]

async function loadAction(id: string) {
  const { data } = await supabase.from("action_queue").select("*").eq("id", id).single()
  return data as ActionRow | null
}

// A field stays "missing" until the staff fills it in, and "inferred" until the staff changes it.
function buildPayload(action: ActionRow, fields: Fields) {
  const clean = { ...fields }
  delete clean.missing_fields // the server decides these lists, not the browser
  delete clean.inferred_fields

  const missing = (action.ai_payload.missing_fields ?? []).filter((key) => !clean[key]?.trim())
  const inferred = (action.ai_payload.inferred_fields ?? []).filter(
    (key) => String(action.ai_payload[key] ?? "") === (clean[key] ?? "")
  )
  return {
    clean,
    payload: { ...clean, missing_fields: missing, inferred_fields: inferred },
    missing,
    inferred,
  }
}

export async function saveEdits(input: unknown): Promise<Result> {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: "Invalid input." }
  const { id, fields } = parsed.data

  const action = await loadAction(id)
  if (!action) return { ok: false, message: "Task not found." }
  if (action.status === "completed") return { ok: false, message: "This task is already synced." }

  const { payload, missing, inferred } = buildPayload(action, fields)
  const { error } = await supabase
    .from("action_queue")
    .update({ ai_payload: payload, confidence_flag: missing.length > 0 || inferred.length > 0 })
    .eq("id", id)
  if (error) return { ok: false, message: error.message }

  refresh()
  return { ok: true, message: "Edits saved." }
}

export async function executeAction(input: unknown): Promise<Result> {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: "Invalid input." }
  const { id, fields } = parsed.data

  const action = await loadAction(id)
  if (!action) return { ok: false, message: "Task not found." }
  if (action.status === "completed") return { ok: false, message: "This task is already synced." }

  // The server enforces the rule too, not just the disabled button.
  const { clean, payload, missing } = buildPayload(action, fields)
  if (missing.length > 0) {
    return { ok: false, message: `Fill in: ${missing.map(fieldLabel).join(", ")}` }
  }

  let patientId = action.patient_id
  if (action.action_type === "emr_update") {
    const result = await applyPatientUpdate(action, clean)
    if (!result.ok) return result
    patientId = result.patientId
  }

  // Pretend to call Epic / Salesforce.
  await new Promise((resolve) => setTimeout(resolve, 700))

  const { error } = await supabase
    .from("action_queue")
    .update({
      ai_payload: payload,
      confidence_flag: false,
      status: "completed",
      patient_id: patientId,
    })
    .eq("id", id)
  if (error) return { ok: false, message: error.message }

  refresh()
  const system = action.action_type === "billing" ? "Salesforce" : "Epic"
  return { ok: true, message: `Successfully synced to ${system}.` }
}

export async function flagForDoctor(id: unknown): Promise<Result> {
  const parsed = z.uuid().safeParse(id)
  if (!parsed.success) return { ok: false, message: "Invalid input." }

  const { error } = await supabase
    .from("action_queue")
    .update({ status: "flagged" })
    .eq("id", parsed.data)
    .eq("status", "pending")
  if (error) return { ok: false, message: error.message }

  refresh()
  return { ok: true, message: "Sent back to the doctor for clarification." }
}

// EMR Sync tasks change the patient's record when approved.
async function applyPatientUpdate(
  action: ActionRow,
  payload: Fields
): Promise<Result & { patientId: string | null }> {
  const raw = (payload.new_status ?? "").trim().toLowerCase()
  const status = PATIENT_STATUSES.find((s) => s.toLowerCase() === raw)
  if (!status) {
    return {
      ok: false,
      patientId: null,
      message: `New status must be one of: ${PATIENT_STATUSES.join(", ")}`,
    }
  }
  const location = payload.location?.trim() || null

  if (action.patient_id) {
    const { error } = await supabase
      .from("patients")
      .update({ current_status: status, ...(location && { current_location: location }) })
      .eq("id", action.patient_id)
    if (error) return { ok: false, patientId: null, message: error.message }
    return { ok: true, patientId: action.patient_id, message: "" }
  }

  // Patient isn't in the database yet (e.g. a new admission): create them.
  const name = payload.patient_name?.trim()
  if (!name) return { ok: false, patientId: null, message: "Fill in: Patient name" }

  const { data, error } = await supabase
    .from("patients")
    .insert({ name, current_status: status, current_location: location })
    .select("id")
    .single()
  if (error) return { ok: false, patientId: null, message: error.message }
  return { ok: true, patientId: data.id as string, message: "" }
}
