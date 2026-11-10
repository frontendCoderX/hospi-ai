export type Patient = {
  id: string
  name: string
  current_status: "Admitted" | "Discharged" | "Outpatient"
  current_location: string | null
}

export type ActionType = "billing" | "emr_update" | "patient_comms"
export type ActionStatus = "pending" | "completed" | "flagged"

export type ActionRow = {
  id: string
  created_at: string
  action_type: ActionType
  patient_id: string | null
  raw_transcript: string
  ai_payload: Record<string, unknown> & { missing_fields?: string[] }
  status: ActionStatus
  confidence_flag: boolean
}
