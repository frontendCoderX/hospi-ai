import { ClipboardCheck } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// Shown instantly on navigation while the page loads the queue on the server.
export default function StaffLoading() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={ClipboardCheck}
        title="Staff Action Queue"
        description="Check what the AI extracted, fix anything wrong, then approve."
      />

      {/* Tabs */}
      <Skeleton className="h-9 w-full rounded-lg sm:w-96" />

      <div className="space-y-4">
        {Array.from({ length: 2 }, (_, i) => (
          <Card key={i} className="border-l-4 border-l-muted">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }, (_, j) => (
                  <div key={j} className="space-y-1.5">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-12 w-full" />
            </CardContent>
            <CardFooter className="gap-2 border-t bg-muted/40">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-32" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
