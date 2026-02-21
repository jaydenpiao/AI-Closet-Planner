import { useEffect, useState } from "react"
import { AlertCircle } from "lucide-react"

import { PlannerForm } from "@/components/forms/PlannerForm"
import { AppHeader } from "@/components/layout/AppHeader"
import { ClosetSummary } from "@/components/results/ClosetSummary"
import { OutfitCards } from "@/components/results/OutfitCards"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { analyzeCloset, ApiError, generateOutfits, getHealth } from "@/lib/api"
import { demoAnalyzeResult, demoOutfitResult } from "@/lib/demo-data"
import type { AnalyzeClosetResponse, GenerateOutfitsResponse, PlannerFormValues } from "@/types/api"

const initialValues: PlannerFormValues = {
  files: [],
  manualClothesText: "",
  occasion: "",
  itinerary: "",
  preferences: "",
}

type HealthState = "checking" | "ok" | "error"

function App() {
  const [values, setValues] = useState<PlannerFormValues>(initialValues)
  const [analysisResult, setAnalysisResult] = useState<AnalyzeClosetResponse | null>(null)
  const [outfitResult, setOutfitResult] = useState<GenerateOutfitsResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [healthState, setHealthState] = useState<HealthState>("checking")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        const health = await getHealth()
        setHealthState(health.status === "ok" ? "ok" : "error")
      } catch {
        setHealthState("error")
      }
    })()
  }, [])

  async function handleSubmit() {
    if (!values.manualClothesText.trim() && values.files.length === 0) {
      setErrorMessage("Provide at least one input: closet images or manual clothes text.")
      return
    }

    if (!values.occasion.trim() || !values.itinerary.trim()) {
      setErrorMessage("Occasion and itinerary are required to generate outfits.")
      return
    }

    setLoading(true)
    setErrorMessage(null)

    try {
      const analyzed = await analyzeCloset(values)
      setAnalysisResult(analyzed)

      const generated = await generateOutfits({
        closet_items: analyzed.items,
        occasion: values.occasion.trim(),
        itinerary: values.itinerary.trim(),
        preferences: values.preferences.trim() || null,
      })

      setOutfitResult(generated)
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage("Unexpected error. Please retry or use demo data.")
      }
    } finally {
      setLoading(false)
    }
  }

  function handleUseDemoData() {
    setErrorMessage(null)
    setAnalysisResult(demoAnalyzeResult)
    setOutfitResult(demoOutfitResult)
    setValues((previous) => ({
      ...previous,
      occasion: demoOutfitResult.occasion,
      itinerary: demoOutfitResult.itinerary,
    }))
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
      <AppHeader healthState={healthState} />

      <PlannerForm
        values={values}
        loading={loading}
        onChange={setValues}
        onSubmit={handleSubmit}
        onUseDemoData={handleUseDemoData}
      />

      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Request failed</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-36 w-full" />
          </CardContent>
        </Card>
      )}

      {analysisResult && <ClosetSummary result={analysisResult} />}
      {outfitResult && <OutfitCards result={outfitResult} />}
    </main>
  )
}

export default App
