import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface AuthPanelProps {
  authenticated: boolean
  userEmail: string | null
  busy: boolean
  onSignIn: (email: string, password: string) => Promise<void>
  onSignUp: (email: string, password: string) => Promise<void>
  onGoogle: () => Promise<void>
  onSignOut: () => Promise<void>
}

export function AuthPanel({
  authenticated,
  userEmail,
  busy,
  onSignIn,
  onSignUp,
  onGoogle,
  onSignOut,
}: AuthPanelProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  return (
    <Card>
      <CardHeader className="bg-secondary/45">
        <CardTitle>Account</CardTitle>
        <CardDescription>
          Sign in to persist your closet, upload item photos, and save outfits.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {authenticated ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Signed in as {userEmail ?? "unknown user"}.</p>
            <Button disabled={busy} variant="secondary" onClick={() => void onSignOut()}>
              Sign out
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                disabled={busy}
                onChange={(event) => setEmail(event.target.value)}
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                disabled={busy}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                disabled={busy}
                onClick={() => {
                  void onSignIn(email.trim(), password)
                }}
              >
                Sign in
              </Button>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  void onSignUp(email.trim(), password)
                }}
              >
                Sign up
              </Button>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => {
                  void onGoogle()
                }}
              >
                Continue with Google
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
