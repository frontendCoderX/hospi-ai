import Link from "next/link"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Link href="/doctor">
        <Card className="h-full transition-colors hover:bg-muted/50">
          <CardHeader>
            <CardTitle>Doctor&apos;s Command Center</CardTitle>
            <CardDescription>
              Type notes in plain English. The AI turns them into tasks for staff.
            </CardDescription>
          </CardHeader>
        </Card>
      </Link>
      <Link href="/staff">
        <Card className="h-full transition-colors hover:bg-muted/50">
          <CardHeader>
            <CardTitle>Staff Action Queue</CardTitle>
            <CardDescription>
              Review, correct and approve AI-generated tasks before they sync.
            </CardDescription>
          </CardHeader>
        </Card>
      </Link>
    </div>
  )
}
