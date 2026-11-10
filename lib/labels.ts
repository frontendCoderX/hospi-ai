import type { ActionType } from "./types"

export const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  billing: "Billing",
  emr_update: "EMR Sync",
  patient_comms: "Patient Comms",
}

// "insurance_provider" → "Insurance provider"
export function fieldLabel(key: string) {
  const words = key.replace(/_/g, " ")
  return words.charAt(0).toUpperCase() + words.slice(1)
}
