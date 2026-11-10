import "server-only"

import { tool } from "ai"
import { z } from "zod"

import { createAction, findPatientByName, searchPatients } from "@/lib/queries"
import type { ActionType, QueuedTask } from "@/lib/types"

const PATIENT_STATUSES = ["Admitted", "Discharged", "Outpatient"] as const

// OpenAI requires every field to be present, so "not mentioned" is null, never left out.
const patientName = z.string().describe("Full patient name, as the doctor said it")

// Text the AI writes on purpose (drafts, notes, its own judgment). Never expected word-for-word.
const WRITTEN_BY_AI = new Set(["message", "notes", "urgency"])

// Values that don't appear in the doctor's words were inferred by the AI, e.g. "level 3" → 99213.
// Checked in code, not by asking the model how confident it is.
function findInferredFields(transcript: string, payload: Record<string, string | null>) {
  const words = transcript.toLowerCase()
  return Object.entries(payload)
    .filter(([key, value]) => value?.trim() && !WRITTEN_BY_AI.has(key))
    .filter(([, value]) => !words.includes(value!.trim().toLowerCase()))
    .map(([key]) => key)
}

// Saves one task to the staff queue. We decide what's missing or inferred here, in code,
// instead of trusting the model to report it.
async function queueTask(
  actionType: ActionType,
  transcript: string,
  payload: Record<string, string | null>,
  requiredFields: string[]
): Promise<QueuedTask> {
  const missing = requiredFields.filter((field) => !payload[field]?.trim())
  const inferred = findInferredFields(transcript, payload)
  const patient = await findPatientByName(payload.patient_name ?? "")

  const id = await createAction({
    action_type: actionType,
    patient_id: patient?.id ?? null,
    raw_transcript: transcript,
    ai_payload: { ...payload, missing_fields: missing, inferred_fields: inferred },
    // goal.txt: "True if the AI was unsure or missing data"
    confidence_flag: missing.length > 0 || inferred.length > 0,
  })

  // This goes back to the model (and to the chat UI in Phase 4).
  return {
    queued: true,
    id,
    action_type: actionType,
    patient_name: payload.patient_name,
    patient_found_in_records: patient !== null,
    missing_fields: missing,
  }
}

// Tools are built per request so they know the doctor's exact words.
export function buildTools(transcript: string) {
  return {
    create_billing_task: tool({
      description: "Queue a billing task for staff to review (e.g. 'bill a level 3').",
      inputSchema: z.object({
        patient_name: patientName,
        hospital: z.string().nullable(),
        billing_code: z.string().nullable().describe("CPT code, e.g. 99213"),
        insurance_provider: z
          .string()
          .nullable()
          .describe("Only if the doctor said it. Otherwise null."),
        notes: z.string().nullable(),
      }),
      execute: (input) =>
        queueTask("billing", transcript, input, ["billing_code", "insurance_provider"]),
    }),

    update_patient_status: tool({
      description: "Queue a patient status change (admit, discharge, outpatient) for staff to sync to the EMR.",
      inputSchema: z.object({
        patient_name: patientName,
        new_status: z.enum(PATIENT_STATUSES),
        location: z.string().nullable().describe("Hospital name, e.g. Mercy"),
      }),
      execute: (input) =>
        queueTask(
          "emr_update",
          transcript,
          input,
          input.new_status === "Admitted" ? ["location"] : []
        ),
    }),

    draft_staff_followup: tool({
      description: "Queue a message for a staff member (nurse, front desk, etc.) about a patient.",
      inputSchema: z.object({
        patient_name: patientName,
        recipient: z
          .enum(["nurse", "front_desk", "case_manager", "pharmacy"])
          .nullable()
          .describe("Who should receive it. Null if the doctor didn't say."),
        message: z.string().describe("Short, clear message to the staff member, written by you"),
        urgency: z.enum(["routine", "urgent"]),
      }),
      execute: (input) => queueTask("patient_comms", transcript, input, ["recipient"]),
    }),

    query_patients: tool({
      description:
        "Look up patients to answer questions like 'How many patients do I have at Mercy?'. Read-only.",
      inputSchema: z.object({
        location: z.string().nullable().describe("Hospital name, or null for all"),
        status: z
          .enum(PATIENT_STATUSES)
          .nullable()
          .describe(
            "Use 'Admitted' when the doctor asks about current or active patients. Null only for everyone, including discharged."
          ),
      }),
      execute: async (filters) => {
        console.log("query_patients filters", filters)
        const patients = await searchPatients(filters)
        console.log("query_patients found", patients, "patients")
        return {
          note: "Approved records only. Tasks still pending staff review are not counted; say so in your answer.",
          count: patients.length,
          patients: patients.map((p) => ({
            name: p.name,
            status: p.current_status,
            location: p.current_location,
          })),
        }
      },
    }),
  }
}
