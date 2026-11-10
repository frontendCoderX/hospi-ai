"use client"

import { useChat } from "@ai-sdk/react"
import { getToolName, isToolUIPart, type UIMessage } from "ai"
import { Database, ListPlus, Mic } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ACTION_TYPE_LABELS } from "@/lib/labels"
import type { QueuedTask } from "@/lib/types"
import { cn } from "@/lib/utils"

const TOOL_LABELS: Record<string, string> = {
  create_billing_task: "billing task",
  update_patient_status: "status update",
  draft_staff_followup: "staff message",
  query_patients: "census lookup",
}

export function ChatPanel() {
  const router = useRouter()
  const [input, setInput] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  // Talks to app/api/chat/route.ts (the default endpoint).
  const { messages, sendMessage, status, error } = useChat({
    // Update the census right away instead of waiting for the next poll.
    onFinish: () => router.refresh(),
  })
  const busy = status === "submitted" || status === "streaming"

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages])

  function submit() {
    const text = input.trim()
    if (!text || busy) return
    sendMessage({ text })
    setInput("")
  }

  return (
    <Card className="flex h-[70svh] flex-col lg:h-[calc(100svh-10rem)]">
      <CardHeader>
        <CardTitle>Input Zone</CardTitle>
        <CardDescription>
          Type what happened, or ask a question. Tasks go to staff for review.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-4 overflow-y-auto">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Try &quot;Discharged Jane Doe from Mercy, bill a level 3&quot; or &quot;How many patients
            do I currently have at Mercy?&quot;
          </p>
        )}
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {status === "submitted" && <p className="text-sm text-muted-foreground">Thinking…</p>}
        {error && (
          <p className="text-sm text-destructive">Something went wrong. Please try again.</p>
        )}
        <div ref={bottomRef} />
      </CardContent>

      <CardFooter className="border-t">
        <form
          className="flex w-full items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              // Enter sends, Shift+Enter adds a new line
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
            placeholder="e.g. Admitted John Smith to Mercy"
            rows={2}
            className="min-h-0 resize-none"
            aria-label="Note for the assistant"
          />
          <TooltipProvider>
            <Tooltip>
              {/* A disabled button can't show a tooltip, so the span is the trigger. */}
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button type="button" variant="outline" size="icon" disabled aria-label="Dictation">
                    <Mic />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Dictation coming soon</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button type="submit" disabled={busy || !input.trim()}>
            Submit
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}

function ChatMessage({ message }: { message: UIMessage }) {
  const fromDoctor = message.role === "user"

  // goal.txt wow: show that the AI switched between writing tasks and reading the database.
  const toolNames = message.parts.filter((p) => isToolUIPart(p)).map((p) => getToolName(p))
  const wroteTasks = toolNames.some((name) => name !== "query_patients")
  const readDatabase = toolNames.includes("query_patients")

  return (
    <div className={cn("flex flex-col gap-2", fromDoctor ? "items-end" : "items-start")}>
      {!fromDoctor && (wroteTasks || readDatabase) && (
        <div className="flex flex-wrap gap-1.5">
          {wroteTasks && (
            <Badge variant="outline" className="gap-1">
              <ListPlus /> Action → staff queue
            </Badge>
          )}
          {readDatabase && (
            <Badge variant="outline" className="gap-1">
              <Database /> Query → read from database
            </Badge>
          )}
        </div>
      )}
      {message.parts.map((part, i) => {
        if (part.type === "text") {
          if (!part.text.trim()) return null
          return (
            <div
              key={i}
              className={cn(
                "max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
                fromDoctor ? "bg-primary text-primary-foreground" : "bg-muted"
              )}
            >
              {part.text}
            </div>
          )
        }
        if (isToolUIPart(part)) return <ToolStatus key={i} part={part} />
        return null
      })}
    </div>
  )
}

// Shows what each tool call did: a chip per queued task.
function ToolStatus({ part }: { part: Parameters<typeof getToolName>[0] }) {
  const toolName = getToolName(part)
  const label = TOOL_LABELS[toolName] ?? toolName

  if (part.state === "output-error") {
    return <p className="text-xs text-destructive">Couldn&apos;t complete the {label}.</p>
  }
  if (part.state !== "output-available") {
    return <p className="text-xs text-muted-foreground">Working on {label}…</p>
  }
  if (toolName === "query_patients") return null // the answer text says it all

  const task = part.output as QueuedTask
  const missing = task.missing_fields.length

  return (
    <div className="flex max-w-[85%] flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-sm">
      <Badge variant="secondary">{ACTION_TYPE_LABELS[task.action_type]}</Badge>
      <span className="font-medium">{task.patient_name ?? "Unknown patient"}</span>
      {missing > 0 ? (
        <Badge variant="destructive">
          {missing} field{missing > 1 ? "s" : ""} need review
        </Badge>
      ) : (
        <span className="text-xs text-muted-foreground">Sent to staff</span>
      )}
      <Link href="/staff" className="text-xs text-muted-foreground underline underline-offset-2">
        View queue
      </Link>
    </div>
  )
}
