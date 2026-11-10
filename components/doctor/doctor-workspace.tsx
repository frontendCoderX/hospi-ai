"use client"

import { MessageSquareText, Users } from "lucide-react"
import { useState, type ReactNode } from "react"

import { cn } from "@/lib/utils"

type View = "chat" | "census"

// One panel at a time with a switch on top, on every screen size.
// Both stay mounted so the chat keeps its messages when you switch.
export function DoctorWorkspace({
  chat,
  census,
  pendingCount,
}: {
  chat: ReactNode
  census: ReactNode
  pendingCount: number
}) {
  const [view, setView] = useState<View>("chat")

  const views: { value: View; label: string; icon: typeof Users; count?: number }[] = [
    { value: "chat", label: "Notes", icon: MessageSquareText },
    { value: "census", label: "Census", icon: Users, count: pendingCount },
  ]

  return (
    <div className="space-y-4">
      <div role="tablist" className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 sm:w-80">
        {views.map(({ value, label, icon: Icon, count }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={view === value}
            onClick={() => setView(value)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-medium transition-colors",
              view === value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {label}
            {count ? (
              <span className="rounded-full bg-destructive px-1.5 text-xs text-white">{count}</span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Fixed height = screen minus the top nav and the switch, so nothing scrolls twice. */}
      <div className="h-[calc(100svh-10rem)] min-h-[420px] sm:h-[calc(100svh-11rem)]">
        <div className={cn("h-full", view !== "chat" && "hidden")}>{chat}</div>
        <div className={cn("h-full", view !== "census" && "hidden")}>{census}</div>
      </div>
    </div>
  )
}
