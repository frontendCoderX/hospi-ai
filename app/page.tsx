import { ArrowRight, ClipboardCheck, ShieldCheck, Stethoscope, type LucideIcon } from "lucide-react"
import Link from "next/link"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const ROLES: { href: string; icon: LucideIcon; title: string; description: string }[] = [
  {
    href: "/doctor",
    icon: Stethoscope,
    title: "Doctor's Command Center",
    description: "Type notes in plain English. The AI turns them into tasks for staff.",
  },
  {
    href: "/staff",
    icon: ClipboardCheck,
    title: "Staff Action Queue",
    description: "Review, correct and approve AI-generated tasks.",
  },
]

export default function Home() {
  return (
    <div className="space-y-10 py-6 sm:py-12">
      <div className="mx-auto max-w-2xl space-y-4 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 text-primary" />
          Every AI task is checked by a person before it counts
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Doctor notes in. <span className="text-primary">Verified staff tasks</span> out.
        </h1>
        <p className="text-muted-foreground text-balance">
          The doctor dumps what happened between rounds. HospiAI turns it into billing, EMR and
          follow-up tasks, and flags anything it wasn&apos;t sure about.
        </p>
      </div>

      <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
        {ROLES.map(({ href, icon: Icon, title, description }) => (
          <Link key={href} href={href} className="group">
            <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:ring-primary/40 group-hover:shadow-md">
              <CardHeader className="gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <CardTitle className="flex items-center gap-1.5">
                  {title}
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
