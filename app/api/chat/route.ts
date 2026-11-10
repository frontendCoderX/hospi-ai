import { openai } from "@ai-sdk/openai"
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  validateUIMessages,
  type UIMessage,
} from "ai"

import { buildInstructions } from "@/lib/ai/instructions"
import { buildTools } from "@/lib/ai/tools"

// The doctor's latest note, word for word. Saved on every task as raw_transcript.
function latestDoctorText(messages: UIMessage[]) {
  const last = messages.findLast((m) => m.role === "user")
  return (last?.parts ?? [])
    .map((part) => (part.type === "text" ? part.text : ""))
    .join(" ")
    .trim()
}

export async function POST(req: Request) {
  const modelId = process.env.OPENAI_MODEL
  if (!modelId) return new Response("OPENAI_MODEL is not set in .env.local", { status: 500 })

  const body = await req.json().catch(() => null)
  if (!body) return new Response("Invalid JSON body", { status: 400 })

  // Placeholder transcript for validation; the real tools are built below.
  let messages: UIMessage[]
  try {
    messages = await validateUIMessages({ messages: body.messages, tools: buildTools("") })
  } catch {
    return new Response("Invalid messages", { status: 400 })
  }

  const transcript = latestDoctorText(messages)
  if (!transcript) return new Response("Empty message", { status: 400 })

  const result = streamText({
    model: openai(modelId),
    instructions: buildInstructions(),
    messages: await convertToModelMessages(messages),
    tools: buildTools(transcript),
    stopWhen: isStepCount(5), // allow: tool call(s) → read results → write the summary sentence
  })

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  })
}
