import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ActionRow, ActionStatus } from "@/lib/types"

import { ActionCard } from "./action-card"

const TABS: { value: ActionStatus; label: string; empty: string }[] = [
  { value: "pending", label: "Pending Review", empty: "Inbox zero. Nothing waiting for review." },
  { value: "completed", label: "Approved / Synced", empty: "Nothing synced yet." },
  { value: "flagged", label: "Needs Doctor Clarification", empty: "Nothing flagged." },
]

export function QueueTabs({ actions }: { actions: ActionRow[] }) {
  return (
    <Tabs defaultValue="pending">
      <TabsList className="h-auto flex-wrap">
        {TABS.map((tab) => {
          const count = actions.filter((a) => a.status === tab.value).length
          return (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
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
              <p className="py-12 text-center text-sm text-muted-foreground">{tab.empty}</p>
            ) : (
              items.map((action) => <ActionCard key={action.id} action={action} />)
            )}
          </TabsContent>
        )
      })}
    </Tabs>
  )
}
