export type Patient = {
  id: string
  name: string
  current_status: "Admitted" | "Discharged" | "Outpatient"
  current_location: string | null
}

export type ActionType = "billing" | "emr_update" | "patient_comms"
export type ActionStatus = "pending" | "completed" | "flagged"

export type Payload = Record<string, unknown> & {
  missing_fields?: string[] // required but not mentioned → red
  inferred_fields?: string[] // not in the doctor's words, AI inferred it → yellow
}

export type ActionRow = {
  id: string
  created_at: string
  action_type: ActionType
  patient_id: string | null
  raw_transcript: string
  ai_payload: Payload // what the AI extracted; never changed after insert
  edited_payload: Payload | null // staff's corrected version; null until staff saves
  status: ActionStatus
  confidence_flag: boolean
}

// What an AI write tool returns after queueing a task (shown as a chip in the doctor's chat).
export type QueuedTask = {
  queued: true
  id: string
  action_type: ActionType
  patient_name: string | null
  patient_found_in_records: boolean
  missing_fields: string[]
}
