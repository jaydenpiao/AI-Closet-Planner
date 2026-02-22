import { useEffect, useMemo, useState } from "react"
import { AlertCircle } from "lucide-react"
import type { Session } from "@supabase/supabase-js"

import { AccountPlannerForm } from "@/components/account/AccountPlannerForm"
import { ClosetManager } from "@/components/account/ClosetManager"
import { SavedOutfitsPanel } from "@/components/account/SavedOutfitsPanel"
import { AuthPanel } from "@/components/auth/AuthPanel"
import { PlannerForm } from "@/components/forms/PlannerForm"
import { AppHeader } from "@/components/layout/AppHeader"
import { ClosetSummary } from "@/components/results/ClosetSummary"
import { OutfitCards } from "@/components/results/OutfitCards"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { signInWithEmail, signInWithGoogle, signOut, signUpWithEmail } from "@/lib/auth"
import {
  analyzeCloset,
  ApiError,
  createClosetItem,
  createSavedOutfit,
  deleteClosetItem,
  deleteClosetItemImage,
  deleteSavedOutfit,
  generateOutfits,
  generateOutfitsFromSavedCloset,
  getHealth,
  getMe,
  listClosetItems,
  listSavedOutfits,
  updateClosetItem,
  uploadClosetItemImage,
} from "@/lib/api"
import { demoAnalyzeResult, demoOutfitResult, demoPreferences } from "@/lib/demo-data"
import { supabase } from "@/lib/supabase"
import { hasPlannerFormErrors, validatePlannerForm } from "@/lib/validation"
import type {
  AnalyzeClosetResponse,
  ClosetItemCreate,
  ClosetItemRecord,
  ClosetItemUpdate,
  GenerateOutfitsResponse,
  PlannerFormErrors,
  PlannerFormValues,
  SavedOutfitRecord,
} from "@/types/api"

const initialValues: PlannerFormValues = {
  files: [],
  manualClothesText: "",
  occasion: "",
  itinerary: "",
  preferences: "",
}

type HealthState = "checking" | "ok" | "error"
type ViewMode = "guest" | "account"

function App() {
  const [values, setValues] = useState<PlannerFormValues>(initialValues)
  const [analysisResult, setAnalysisResult] = useState<AnalyzeClosetResponse | null>(null)
  const [outfitResult, setOutfitResult] = useState<GenerateOutfitsResponse | null>(null)
  const [formErrors, setFormErrors] = useState<PlannerFormErrors>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [healthState, setHealthState] = useState<HealthState>("checking")
  const [loading, setLoading] = useState(false)

  const [session, setSession] = useState<Session | null>(null)
  const [authBusy, setAuthBusy] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("guest")
  const [closetItems, setClosetItems] = useState<ClosetItemRecord[]>([])
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfitRecord[]>([])
  const [accountLoading, setAccountLoading] = useState(false)
  const [accountOutfits, setAccountOutfits] = useState<GenerateOutfitsResponse | null>(null)
  const [accountPlanInputs, setAccountPlanInputs] = useState({
    occasion: "",
    itinerary: "",
    preferences: "",
  })

  const accessToken = useMemo(() => session?.access_token ?? null, [session])
  const authenticated = Boolean(accessToken)

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

  useEffect(() => {
    void (async () => {
      const result = await supabase.auth.getSession()
      setSession(result.data.session ?? null)
    })()

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })
    return () => {
      data.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!accessToken) {
      setClosetItems([])
      setSavedOutfits([])
      setAccountOutfits(null)
      return
    }

    void (async () => {
      try {
        await getMe(accessToken)
        const [items, saved] = await Promise.all([
          listClosetItems(accessToken),
          listSavedOutfits(accessToken),
        ])
        setClosetItems(items)
        setSavedOutfits(saved)
      } catch (error) {
        if (error instanceof ApiError) {
          setErrorMessage(error.message)
        } else {
          setErrorMessage("Failed to load account data.")
        }
      }
    })()
  }, [accessToken])

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

  async function runAuthAction(action: () => Promise<void>) {
    setAuthBusy(true)
    setErrorMessage(null)
    try {
      await action()
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage("Auth failed.")
      }
    } finally {
      setAuthBusy(false)
    }
  }

  async function refreshAccountData() {
    if (!accessToken) {
      return
    }
    const [items, saved] = await Promise.all([listClosetItems(accessToken), listSavedOutfits(accessToken)])
    setClosetItems(items)
    setSavedOutfits(saved)
  }

  async function runAccountAction(action: () => Promise<void>) {
    setAccountLoading(true)
    setErrorMessage(null)
    try {
      await action()
      await refreshAccountData()
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message)
      } else if (error instanceof Error) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage("Account request failed.")
      }
    } finally {
      setAccountLoading(false)
    }
  }

  async function handleCreateItem(payload: ClosetItemCreate) {
    if (!accessToken) return
    await runAccountAction(async () => {
      await createClosetItem(accessToken, payload)
    })
  }

  async function handleUpdateItem(itemId: string, payload: ClosetItemUpdate) {
    if (!accessToken) return
    await runAccountAction(async () => {
      await updateClosetItem(accessToken, itemId, payload)
    })
  }

  async function handleDeleteItem(itemId: string) {
    if (!accessToken) return
    await runAccountAction(async () => {
      await deleteClosetItem(accessToken, itemId)
    })
  }

  async function handleUploadItemImage(itemId: string, file: File) {
    if (!accessToken) return
    await runAccountAction(async () => {
      await uploadClosetItemImage(accessToken, itemId, file)
    })
  }

  async function handleDeleteItemImage(itemId: string) {
    if (!accessToken) return
    await runAccountAction(async () => {
      await deleteClosetItemImage(accessToken, itemId)
    })
  }

  async function handleGenerateFromSavedCloset() {
    if (!accessToken) {
      return
    }
    if (!accountPlanInputs.occasion.trim() || !accountPlanInputs.itinerary.trim()) {
      setErrorMessage("Occasion and itinerary are required.")
      return
    }

    await runAccountAction(async () => {
      const generated = await generateOutfitsFromSavedCloset(accessToken, {
        occasion: accountPlanInputs.occasion.trim(),
        itinerary: accountPlanInputs.itinerary.trim(),
        preferences: accountPlanInputs.preferences.trim() || null,
      })
      setAccountOutfits(generated)
    })
  }

  async function handleSaveOutfit(outfitIndex: number) {
    if (!accessToken || !accountOutfits) {
      return
    }
    const chosenOutfit = accountOutfits.outfits[outfitIndex]
    await runAccountAction(async () => {
      await createSavedOutfit(accessToken, {
        title: chosenOutfit.title,
        occasion: accountOutfits.occasion,
        itinerary: accountOutfits.itinerary,
        outfit_snapshot: chosenOutfit,
        global_tips: accountOutfits.global_tips,
      })
    })
  }

  async function handleDeleteSavedOutfit(savedOutfitId: string) {
    if (!accessToken) return
    await runAccountAction(async () => {
      await deleteSavedOutfit(accessToken, savedOutfitId)
    })
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
      <AppHeader healthState={healthState} />

      <AuthPanel
        authenticated={authenticated}
        userEmail={session?.user.email ?? null}
        busy={authBusy}
        onSignIn={(email, password) => runAuthAction(async () => signInWithEmail(email, password).then(() => {}))}
        onSignUp={(email, password) => runAuthAction(async () => signUpWithEmail(email, password).then(() => {}))}
        onGoogle={() => runAuthAction(async () => signInWithGoogle().then(() => {}))}
        onSignOut={() =>
          runAuthAction(async () => {
            await signOut()
            setViewMode("guest")
          })
        }
      />

      {authenticated && (
        <div className="flex flex-wrap gap-3">
          <Button
            variant={viewMode === "guest" ? "default" : "secondary"}
            onClick={() => setViewMode("guest")}
          >
            Guest Planner
          </Button>
          <Button
            variant={viewMode === "account" ? "default" : "secondary"}
            onClick={() => setViewMode("account")}
          >
            My Account
          </Button>
        </div>
      )}

      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Request failed</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {viewMode === "guest" && (
        <>
          <PlannerForm
            values={values}
            errors={formErrors}
            loading={loading}
            onChange={handleValuesChange}
            onClearFiles={handleClearFiles}
            onSubmit={handleSubmit}
            onUseDemoData={handleUseDemoData}
          />

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
        </>
      )}

      {viewMode === "account" && authenticated && (
        <>
          <ClosetManager
            items={closetItems}
            busy={accountLoading}
            onCreate={handleCreateItem}
            onUpdate={handleUpdateItem}
            onDelete={handleDeleteItem}
            onUploadImage={handleUploadItemImage}
            onDeleteImage={handleDeleteItemImage}
          />

          <AccountPlannerForm
            occasion={accountPlanInputs.occasion}
            itinerary={accountPlanInputs.itinerary}
            preferences={accountPlanInputs.preferences}
            busy={accountLoading}
            onChange={setAccountPlanInputs}
            onGenerate={handleGenerateFromSavedCloset}
          />

          {accountOutfits && (
            <Card>
              <CardContent className="space-y-3 pt-6">
                <OutfitCards result={accountOutfits} />
                <div className="flex flex-wrap gap-2">
                  {accountOutfits.outfits.map((outfit, index) => (
                    <Button
                      key={outfit.outfit_id}
                      disabled={accountLoading}
                      onClick={() => {
                        void handleSaveOutfit(index)
                      }}
                    >
                      Save "{outfit.title}"
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <SavedOutfitsPanel
            items={savedOutfits}
            busy={accountLoading}
            onDelete={handleDeleteSavedOutfit}
          />
        </>
      )}
    </main>
  )
}

export default App
