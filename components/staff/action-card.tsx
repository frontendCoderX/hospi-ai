"use client"

import { Check, CircleCheck, Flag, MapPin, Save } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { executeAction, flagForDoctor, saveEdits, type Result } from "@/app/staff/actions"
import { ACTION_TYPE_STYLES, ActionTypeBadge } from "@/components/action-type-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { fieldLabel } from "@/lib/labels"
import type { ActionRow } from "@/lib/types"
import { cn } from "@/lib/utils"

import { SourceTranscript } from "./source-transcript"

type Fields = Record<string, string | null>

const BOOKKEEPING_KEYS = new Set(["missing_fields", "inferred_fields"])

// Turn the AI payload into plain text fields for the form (patient name first).
function toFields(payload: ActionRow["ai_payload"]): Fields {
  const fields: Fields = {}
  if ("patient_name" in payload) fields.patient_name = String(payload.patient_name ?? "")
  for (const [key, value] of Object.entries(payload)) {
    if (BOOKKEEPING_KEYS.has(key) || key in fields) continue
    fields[key] = value == null ? null : String(value)
  }
  return fields
}

// "Robert Chen" → "RC"
function initials(name: string | null | undefined) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean)
  return parts.length ? parts.slice(0, 2).map((p) => p[0].toUpperCase()).join("") : "?"
}

export function ActionCard({ action }: { action: ActionRow }) {
  const aiFields = toFields(action.ai_payload)
  const editedFields = action.edited_payload ? toFields(action.edited_payload) : aiFields
  const saved: Fields = Object.fromEntries(
    Object.keys(aiFields).map((key) => [key, editedFields[key] ?? null])
  )

  const [fields, setFields] = useState<Fields>(saved)
  const [activeField, setActiveField] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const stillMissing = (action.ai_payload.missing_fields ?? []).filter(
    (key) => !fields[key]?.trim()
  )
  // Yellow: the AI inferred it (not in the doctor's words). Clears once staff changes it.
  const toVerify = (action.ai_payload.inferred_fields ?? []).filter(
    (key) => fields[key] === aiFields[key] && !stillMissing.includes(key)
  )

  const isDirty = JSON.stringify(fields) !== JSON.stringify(saved)
  const readOnly = action.status === "completed"

  const patientName = fields.patient_name || "Unknown patient"
  const hospital = fields.hospital ?? fields.location ?? "No location"
  const extractedValues = Object.values(aiFields).filter((v): v is string => !!v)

  function setField(key: string, value: string) {
    setFields((prev) => ({ ...prev, [key]: value === "" ? null : value }))
  }

  function run(task: () => Promise<Result>, { toastOnSuccess = true } = {}) {
    startTransition(async () => {
      try {
        const result = await task()
        if (!result.ok) toast.error(result.message)
        else if (toastOnSuccess) toast.success(result.message)
      } catch {
        toast.error("Something went wrong. Please try again.")
      }
    })
  }

  return (
    <Card className={cn("border-l-4", ACTION_TYPE_STYLES[action.action_type].accent)}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
            {initials(fields.patient_name)}
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="truncate">{patientName}</CardTitle>
              <ActionTypeBadge type={action.action_type} />
            </div>
            <CardDescription className="flex items-center gap-1">
              <MapPin className="size-3.5" />
              {hospital}
            </CardDescription>
          </div>
        </div>
        <CardAction className="flex flex-wrap justify-end gap-1">
          {action.status === "completed" && (
            <Badge className="gap-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <CircleCheck /> Approved
            </Badge>
          )}
          {action.status === "flagged" && (
            <Badge variant="outline" className="gap-1">
              <Flag /> Waiting on doctor
            </Badge>
          )}
          {!readOnly && stillMissing.length > 0 && (
            <Badge variant="destructive">{stillMissing.length} missing</Badge>
          )}
          {!readOnly && toVerify.length > 0 && (
            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              {toVerify.length} to verify
            </Badge>
          )}
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(fields).map(([key, value]) => {
            const isMissing = stillMissing.includes(key)
            const isInferred = toVerify.includes(key)
            const isLong = key === "message"
            const inputProps = {
              id: `${action.id}-${key}`,
              value: value ?? "",
              disabled: readOnly || isPending,
              "aria-invalid": isMissing || undefined,
              placeholder: isMissing ? "Required" : undefined,
              className: cn(
                isInferred &&
                  "border-amber-500 bg-amber-50 focus-visible:border-amber-500 focus-visible:ring-amber-500/30 dark:bg-amber-950/30"
              ),
            }
            return (
              <div
                key={key}
                className={isLong ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}
                // Hover or focus a field to see where it came from in the transcript.
                onMouseEnter={() => setActiveField(key)}
                onMouseLeave={() => setActiveField(null)}
                onFocus={() => setActiveField(key)}
                onBlur={() => setActiveField(null)}
              >
                <Label htmlFor={inputProps.id}>{fieldLabel(key)}</Label>
                {isLong ? (
                  <Textarea {...inputProps} onChange={(e) => setField(key, e.target.value)} />
                ) : (
                  <Input {...inputProps} onChange={(e) => setField(key, e.target.value)} />
                )}
                {isMissing && (
                  <p className="text-xs text-destructive">
                    The doctor didn&apos;t mention this. Please fill it in.
                  </p>
                )}
                {isInferred && (
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Not in the doctor&apos;s words. The AI inferred this, so please verify.
                  </p>
                )}
                {(value ?? null) !== (aiFields[key] ?? null) && !isMissing && (
                  <p className="text-xs text-muted-foreground">
                    Edited by staff · AI said:{" "}
                    <span className="font-mono">{aiFields[key] ?? "nothing"}</span>
                  </p>
                )}
              </div>
            )
          })}
        </div>

        <SourceTranscript
          transcript={action.raw_transcript}
          extractedValues={extractedValues}
          activeValue={activeField ? aiFields[activeField] : null}
          inferred={toVerify.map((key) => ({ key, value: aiFields[key] ?? "" }))}
        />
      </CardContent>

      {!readOnly && (
        <CardFooter className="flex flex-wrap items-center gap-2 border-t bg-muted/40">
          <Button
            disabled={isPending || stillMissing.length > 0}
            onClick={() =>
              run(() => executeAction({ id: action.id, fields }), { toastOnSuccess: false })
            }
          >
            <Check /> Approve
          </Button>
          <Button
            variant="secondary"
            disabled={isPending || !isDirty}
            onClick={() => run(() => saveEdits({ id: action.id, fields }))}
          >
            <Save /> Save Edits
          </Button>
          {action.status === "pending" && (
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => run(() => flagForDoctor(action.id))}
            >
              <Flag /> Flag for Doctor
            </Button>
          )}
          {stillMissing.length > 0 && (
            <p className="w-full text-xs text-muted-foreground">
              Fill in {stillMissing.map(fieldLabel).join(", ")} to enable Approve.
            </p>
          )}
        </CardFooter>
      )}
    </Card>
  )
}
