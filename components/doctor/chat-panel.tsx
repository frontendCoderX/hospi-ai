"use client"

import { useChat } from "@ai-sdk/react"
import { getToolName, isToolUIPart, type UIMessage } from "ai"
import {
  Bot,
  Database,
  ListPlus,
  Mic,
  MicOff,
  SendHorizontal,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { ActionTypeBadge } from "@/components/action-type-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { TypewriterPlaceholder } from "./typewriter-placeholder"
import { useDictation } from "./use-dictation"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { QueuedTask } from "@/lib/types"
import { cn } from "@/lib/utils"

const TOOL_LABELS: Record<string, string> = {
  create_billing_task: "billing task",
  update_patient_status: "status update",
  draft_staff_followup: "staff message",
  query_patients: "census lookup",
}

const EXAMPLES = [
  "Discharged Jane Doe from Mercy, bill a level 3",
  "Admitted Mario Garcia to St. Luke's, tell the nurse to check his vitals",
  "How many patients do I currently have at Mercy?",
]

function AssistantAvatar() {
  return (
    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
      <Bot className="size-4" />
    </div>
  )
}

export function ChatPanel() {
  const router = useRouter()
  const [input, setInput] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const exampleRef = useRef(EXAMPLES[0])

  // Talks to app/api/chat/route.ts (the default endpoint).
  const { messages, sendMessage, status, error } = useChat({
    // Update the census right away instead of waiting for the next poll.
    onFinish: () => router.refresh(),
  })
  const busy = status === "submitted" || status === "streaming"

  // Browser speech-to-text: spoken words are added to whatever is already in the box.
  const dictation = useDictation({
    onText: setInput,
    onError: (message) => toast.error(message),
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages])

  function submit() {
    const text = input.trim()
    if (!text || busy) return
    dictation.cancel()
    sendMessage({ text })
    setInput("")
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages scroll; the input stays pinned at the bottom */}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto py-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="size-6" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">What happened on your rounds?</p>
              <p className="text-sm text-muted-foreground">
                Type a note or ask a question.
                <span className="hidden pointer-fine:inline">
                  {" "}
                  Press Tab to use the example.
                </span>
              </p>
            </div>
          </div>
        )}
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {status === "submitted" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AssistantAvatar />
            <span className="animate-pulse">Thinking…</span>
          </div>
        )}
        {error && (
          <p className="text-sm text-destructive">
            Something went wrong. Please try again.
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="pt-3">
        <form
          className="flex w-full items-end gap-2 rounded-2xl border bg-card p-2 shadow-sm focus-within:border-primary/50"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <div className="relative flex-1">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                // Tab on an empty box fills in the example being shown
                if (e.key === "Tab" && !e.shiftKey && !input) {
                  e.preventDefault()
                  setInput(exampleRef.current)
                }
                // Enter sends, Shift+Enter adds a new line
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  submit()
                }
              }}
              // Touch devices see this; mouse devices see the typing animation instead.
              placeholder={
                dictation.listening
                  ? "Listening… speak your note"
                  : "Type a note or ask a question…"
              }
              rows={2}
              className={cn(
                "min-h-0 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent",
                !dictation.listening &&
                  "pointer-fine:placeholder:text-transparent"
              )}
              aria-label="Note for the assistant"
            />
            {!input && !dictation.listening && (
              <TypewriterPlaceholder
                examples={EXAMPLES}
                currentRef={exampleRef}
              />
            )}
          </div>
          <TooltipProvider>
            <Tooltip>
              {/* A disabled button can't show a tooltip, so the span is the trigger. */}
              <TooltipTrigger asChild>
                <span tabIndex={dictation.supported ? -1 : 0}>
                  <Button
                    type="button"
                    variant={dictation.listening ? "destructive" : "outline"}
                    size="icon"
                    disabled={!dictation.supported || busy}
                    aria-pressed={dictation.listening}
                    aria-label={
                      dictation.listening ? "Stop dictation" : "Start dictation"
                    }
                    className={cn(
                      "disabled:bg-muted disabled:text-muted-foreground",
                      dictation.listening && "animate-pulse"
                    )}
                    onClick={() =>
                      dictation.listening
                        ? dictation.stop()
                        : dictation.start(input)
                    }
                  >
                    {dictation.listening ? <MicOff /> : <Mic />}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {!dictation.supported
                  ? "Dictation isn't supported in this browser. Try Chrome, Edge or Safari."
                  : dictation.listening
                    ? "Stop dictation"
                    : "Dictate your note"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            type="submit"
            size="icon"
            disabled={busy || !input.trim()}
            aria-label="Send"
          >
            <SendHorizontal />
          </Button>
        </form>
      </div>
    </div>
  )
}

function ChatMessage({ message }: { message: UIMessage }) {
  const fromDoctor = message.role === "user"

  // goal.txt wow: show that the AI switched between writing tasks and reading the database.
  const toolNames = message.parts
    .filter((p) => isToolUIPart(p))
    .map((p) => getToolName(p))
  const wroteTasks = toolNames.some((name) => name !== "query_patients")
  const readDatabase = toolNames.includes("query_patients")

  return (
    <div className={cn("flex gap-2", fromDoctor && "justify-end")}>
      {!fromDoctor && <AssistantAvatar />}
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col gap-2",
          fromDoctor ? "items-end" : "items-start"
        )}
      >
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
                  "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap",
                  fromDoctor
                    ? "rounded-br-sm bg-primary text-primary-foreground"
                    : "rounded-tl-sm bg-muted"
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
    </div>
  )
}

// Shows what each tool call did: a chip per queued task.
function ToolStatus({ part }: { part: Parameters<typeof getToolName>[0] }) {
  const toolName = getToolName(part)
  const label = TOOL_LABELS[toolName] ?? toolName

  if (part.state === "output-error") {
    return (
      <p className="text-xs text-destructive">
        Couldn&apos;t complete the {label}.
      </p>
    )
  }
  if (part.state !== "output-available") {
    return <p className="text-xs text-muted-foreground">Working on {label}…</p>
  }
  if (toolName === "query_patients") return null // the answer text says it all

  const task = part.output as QueuedTask
  const missing = task.missing_fields.length

  return (
    <div className="flex max-w-[85%] flex-wrap items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm shadow-xs">
      <ActionTypeBadge type={task.action_type} />
      <span className="font-medium">
        {task.patient_name ?? "Unknown patient"}
      </span>
      {missing > 0 ? (
        <Badge variant="destructive">
          {missing} field{missing > 1 ? "s" : ""} need review
        </Badge>
      ) : (
        <span className="text-xs text-muted-foreground">Sent to staff</span>
      )}
      <Link
        href="/staff"
        className="text-xs text-muted-foreground underline underline-offset-2"
      >
        View queue
      </Link>
    </div>
  )
}
