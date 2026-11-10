import { Skeleton } from "@/components/ui/skeleton"

// Shown instantly on navigation while the page loads patients and tasks on the server.
// Same layout as DoctorWorkspace: switch on top, chat below, input pinned at the bottom.
export default function DoctorLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-9 w-full rounded-lg sm:w-80" />
      <div className="flex h-[calc(100svh-10rem)] min-h-[420px] flex-col sm:h-[calc(100svh-11rem)]">
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <Skeleton className="size-12 rounded-2xl" />
          <Skeleton className="h-4 w-48" />
          <div className="flex flex-wrap justify-center gap-2">
            <Skeleton className="h-7 w-56 rounded-full" />
            <Skeleton className="h-7 w-64 rounded-full" />
            <Skeleton className="h-7 w-52 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-16 w-full rounded-2xl" />
      </div>
    </div>
  )
}
