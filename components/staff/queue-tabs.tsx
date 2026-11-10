import { Inbox } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ActionRow, ActionStatus } from "@/lib/types"

import { ActionCard } from "./action-card"

// `short` is shown on phones so all three tabs fit in one row.
const TABS: { value: ActionStatus; label: string; short: string; empty: string }[] = [
  {
    value: "pending",
    label: "Pending Review",
    short: "Pending",
    empty: "Inbox zero. Nothing waiting for review.",
  },
  { value: "completed", label: "Approved", short: "Approved", empty: "Nothing approved yet." },
  {
    value: "flagged",
    label: "Needs Doctor Clarification",
    short: "Needs info",
    empty: "Nothing flagged.",
  },
]

export function QueueTabs({ actions }: { actions: ActionRow[] }) {
  return (
    <Tabs defaultValue="pending">
      <TabsList className="w-full group-data-horizontal/tabs:h-9 sm:w-fit">
        {TABS.map((tab) => {
          const count = actions.filter((a) => a.status === tab.value).length
          return (
            <TabsTrigger key={tab.value} value={tab.value} className="px-2 text-xs sm:text-sm">
              <span className="sm:hidden">{tab.short}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.value === "pending" && count > 0 ? (
                <Badge className="bg-destructive text-white">{count}</Badge>
              ) : (
                <span className="text-muted-foreground">{count}</span>
              )}
            </TabsTrigger>
          )
        })}
      </TabsList>

      {TABS.map((tab) => {
        const items = actions.filter((a) => a.status === tab.value)
        return (
          <TabsContent key={tab.value} value={tab.value} className="space-y-4 pt-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-14 text-center text-sm text-muted-foreground">
                <Inbox className="size-8 text-muted-foreground/60" />
                {tab.empty}
              </div>
            ) : (
              items.map((action) => <ActionCard key={action.id} action={action} />)
            )}
          </TabsContent>
        )
      })}
    </Tabs>
  )
}
