// Sends one doctor note to /api/chat and prints what the AI did.
// Usage (with `npm run dev` running):
//   node scripts/test-chat.mjs "Discharged Jane Doe, bill a level 3"

const text = process.argv.slice(2).join(" ")
if (!text) {
  console.error('Usage: node scripts/test-chat.mjs "your note here"')
  process.exit(1)
}

const res = await fetch("http://localhost:3000/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    messages: [{ id: "test-1", role: "user", parts: [{ type: "text", text }] }],
  }),
})

if (!res.ok) {
  console.error(`HTTP ${res.status}: ${await res.text()}`)
  process.exit(1)
}

// The response is a stream of "data: {...}" lines.
const decoder = new TextDecoder()
let buffer = ""
for await (const chunk of res.body) {
  buffer += decoder.decode(chunk, { stream: true })
  const lines = buffer.split("\n")
  buffer = lines.pop()

  for (const line of lines) {
    if (!line.startsWith("data: ") || line === "data: [DONE]") continue
    const part = JSON.parse(line.slice(6))

    if (part.type === "tool-input-available") {
      console.log(`\n→ ${part.toolName}`, JSON.stringify(part.input))
    } else if (part.type === "tool-output-available") {
      console.log("← result", JSON.stringify(part.output))
    } else if (part.type === "text-delta") {
      process.stdout.write(part.delta)
    } else if (part.type === "error") {
      console.error("\nERROR:", part.errorText)
    }
  }
}
console.log()
