"use client"

import { ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { fieldLabel } from "@/lib/labels"
import { cn } from "@/lib/utils"

function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// Bold every extracted value that appears word-for-word in the doctor's note.
// The value of the field the staff is looking at gets a stronger highlight.
function highlight(transcript: string, values: string[], activeValue: string | null) {
  const terms = values
    .map((v) => v.trim())
    .filter((v) => v.length > 1)
    .sort((a, b) => b.length - a.length) // longest first, so "Robert Chen" beats "Robert"
    .map(escapeRegex)
  if (terms.length === 0) return transcript

  const pattern = new RegExp(`(${terms.join("|")})`, "gi")
  const active = activeValue?.trim().toLowerCase()

  // split() with a capture group puts the matches at the odd positions
  return transcript.split(pattern).map((part, i) =>
    i % 2 === 1 ? (
      <strong
        key={i}
        className={cn(
          "rounded px-0.5 font-semibold text-foreground transition-colors",
          part.toLowerCase() === active ? "bg-primary/30 ring-2 ring-primary/40" : "bg-primary/10"
        )}
      >
        {part}
      </strong>
    ) : (
      part
    )
  )
}

export function SourceTranscript({
  transcript,
  extractedValues,
  activeValue,
  inferred,
}: {
  transcript: string
  extractedValues: string[]
  activeValue: string | null // value of the field being hovered/focused
  inferred: { key: string; value: string }[] // AI values that aren't in the transcript
}) {
  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="group -ml-2 text-muted-foreground">
          Source Transcript
          <ChevronDown className="transition-transform group-data-[state=open]:rotate-180" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2">
        <blockquote className="mt-1 border-l-2 pl-3 text-sm text-muted-foreground italic">
          &ldquo;{highlight(transcript, extractedValues, activeValue)}&rdquo;
        </blockquote>
        {inferred.length > 0 && (
          <div className="pl-3 text-xs text-amber-700 dark:text-amber-400">
            <span className="font-medium">AI inferred (not in the transcript): </span>
            {inferred.map(({ key, value }, i) => (
              <span key={key}>
                {i > 0 && ", "}
                {fieldLabel(key)} → <span className="font-mono">{value}</span>
              </span>
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}
