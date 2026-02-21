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
import { demoAnalyzeResult, demoOutfitResult, demoPreferences } from "@/lib/demo-data"
import { hasPlannerFormErrors, validatePlannerForm } from "@/lib/validation"
import type {
  AnalyzeClosetResponse,
  GenerateOutfitsResponse,
  PlannerFormErrors,
  PlannerFormValues,
} from "@/types/api"

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
  const [formErrors, setFormErrors] = useState<PlannerFormErrors>({})
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

  function handleValuesChange(nextValues: PlannerFormValues) {
    setValues(nextValues)
    if (hasPlannerFormErrors(formErrors)) {
      setFormErrors(validatePlannerForm(nextValues))
    }
  }

  function handleClearFiles() {
    const nextValues = { ...values, files: [] }
    setValues(nextValues)
    if (hasPlannerFormErrors(formErrors)) {
      setFormErrors(validatePlannerForm(nextValues))
    }
  }

  async function handleSubmit() {
    const nextFormErrors = validatePlannerForm(values)
    if (hasPlannerFormErrors(nextFormErrors)) {
      setFormErrors(nextFormErrors)
      setErrorMessage(null)
      return
    }

    setFormErrors({})
    setLoading(true)
    setErrorMessage(null)
    setAnalysisResult(null)
    setOutfitResult(null)

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
      const baseErrorMessage = "Backend unavailable or request failed. Retry or use demo data."
      if (error instanceof ApiError) {
        setErrorMessage(`${baseErrorMessage} (${error.message})`)
      } else {
        setErrorMessage(baseErrorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  function handleUseDemoData() {
    setFormErrors({})
    setLoading(false)
    setErrorMessage(null)
    setAnalysisResult(demoAnalyzeResult)
    setOutfitResult(demoOutfitResult)
    setValues((previous) => ({
      ...previous,
      occasion: demoOutfitResult.occasion,
      itinerary: demoOutfitResult.itinerary,
      preferences: demoPreferences,
    }))
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
      <AppHeader healthState={healthState} />

      <PlannerForm
        values={values}
        errors={formErrors}
        loading={loading}
        onChange={handleValuesChange}
        onClearFiles={handleClearFiles}
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
