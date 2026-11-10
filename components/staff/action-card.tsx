"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"

import { executeAction, flagForDoctor, saveEdits, type Result } from "@/app/staff/actions"
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
import { ACTION_TYPE_LABELS, fieldLabel } from "@/lib/labels"
import type { ActionRow } from "@/lib/types"

import { SourceTranscript } from "./source-transcript"

type Fields = Record<string, string | null>

// Turn the AI payload into plain text fields for the form (patient name first).
function toFields(payload: ActionRow["ai_payload"]): Fields {
  const fields: Fields = {}
  if ("patient_name" in payload) fields.patient_name = String(payload.patient_name ?? "")
  for (const [key, value] of Object.entries(payload)) {
    if (key === "missing_fields" || key in fields) continue
    fields[key] = value == null ? null : String(value)
  }
  return fields
}

export function ActionCard({ action }: { action: ActionRow }) {
  const original = toFields(action.ai_payload)
  const [fields, setFields] = useState<Fields>(original)
  const [isPending, startTransition] = useTransition()

  const flagged = new Set(action.ai_payload.missing_fields ?? [])
  const stillMissing = [...flagged].filter((key) => !fields[key]?.trim())
  const isDirty = JSON.stringify(fields) !== JSON.stringify(original)
  const readOnly = action.status === "completed"

  const patientName = fields.patient_name || "Unknown patient"
  const hospital = fields.hospital ?? fields.location ?? "No location"
  const extractedValues = Object.values(original).filter((v): v is string => !!v)

  function setField(key: string, value: string) {
    setFields((prev) => ({ ...prev, [key]: value === "" ? null : value }))
  }

  function run(task: () => Promise<Result>) {
    startTransition(async () => {
      try {
        const result = await task()
        if (result.ok) toast.success(result.message)
        else toast.error(result.message)
      } catch {
        toast.error("Something went wrong. Please try again.")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{ACTION_TYPE_LABELS[action.action_type]}</Badge>
          <CardTitle>{patientName}</CardTitle>
        </div>
        <CardDescription>{hospital}</CardDescription>
        {stillMissing.length > 0 && !readOnly && (
          <CardAction>
            <Badge variant="destructive">
              {stillMissing.length} field{stillMissing.length > 1 ? "s" : ""} need attention
            </Badge>
          </CardAction>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(fields).map(([key, value]) => {
            const isMissing = stillMissing.includes(key)
            const isLong = key === "message"
            const inputProps = {
              id: `${action.id}-${key}`,
              value: value ?? "",
              disabled: readOnly || isPending,
              "aria-invalid": isMissing || undefined,
              placeholder: isMissing ? "Required" : undefined,
            }
            return (
              <div key={key} className={isLong ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}>
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
              </div>
            )
          })}
        </div>

        <SourceTranscript transcript={action.raw_transcript} extractedValues={extractedValues} />
      </CardContent>

      {!readOnly && (
        <CardFooter className="flex flex-wrap items-center gap-2">
          <Button
            disabled={isPending || stillMissing.length > 0}
            onClick={() => run(() => executeAction({ id: action.id, fields }))}
          >
            Execute &amp; Sync
          </Button>
          <Button
            variant="secondary"
            disabled={isPending || !isDirty}
            onClick={() => run(() => saveEdits({ id: action.id, fields }))}
          >
            Save Edits
          </Button>
          {action.status === "pending" && (
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => run(() => flagForDoctor(action.id))}
            >
              Flag for Doctor
            </Button>
          )}
          {stillMissing.length > 0 && (
            <p className="w-full text-xs text-muted-foreground">
              Fill in {stillMissing.map(fieldLabel).join(", ")} to enable Execute.
            </p>
          )}
        </CardFooter>
      )}
    </Card>
  )
}
