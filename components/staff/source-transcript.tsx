"use client"

import { ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// Bold every extracted value that appears word-for-word in the doctor's note.
function highlight(transcript: string, values: string[]) {
  const terms = values
    .map((v) => v.trim())
    .filter((v) => v.length > 1)
    .sort((a, b) => b.length - a.length) // longest first, so "Robert Chen" beats "Robert"
    .map(escapeRegex)
  if (terms.length === 0) return transcript

  const pattern = new RegExp(`(${terms.join("|")})`, "gi")
  // split() with a capture group puts the matches at the odd positions
  return transcript.split(pattern).map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="rounded bg-primary/10 px-0.5 font-semibold text-foreground">
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
}: {
  transcript: string
  extractedValues: string[]
}) {
  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="group -ml-2 text-muted-foreground">
          Source Transcript
          <ChevronDown className="transition-transform group-data-[state=open]:rotate-180" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <blockquote className="mt-1 border-l-2 pl-3 text-sm text-muted-foreground italic">
          {highlight(transcript, extractedValues)}
        </blockquote>
      </CollapsibleContent>
    </Collapsible>
  )
}
