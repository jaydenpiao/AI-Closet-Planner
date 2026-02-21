import { Badge } from "@/components/ui/badge"

type HealthState = "checking" | "ok" | "error"

interface AppHeaderProps {
  healthState: HealthState
}

function healthLabel(state: HealthState) {
  if (state === "ok") {
    return { text: "Backend healthy", variant: "success" as const }
  }

  if (state === "error") {
    return { text: "Backend unavailable", variant: "destructive" as const }
  }

  return { text: "Checking backend...", variant: "secondary" as const }
}

export function AppHeader({ healthState }: AppHeaderProps) {
  const status = healthLabel(healthState)

  return (
    <header className="rounded-2xl border bg-card/85 p-6 shadow-sm backdrop-blur-sm md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Hackathon MVP
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Closet Planner AI
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
            Upload closet photos or type your pieces, add an occasion and itinerary, and get
            structured outfit plans in seconds.
          </p>
        </div>
        <Badge variant={status.variant}>{status.text}</Badge>
      </div>
    </header>
  )
}
