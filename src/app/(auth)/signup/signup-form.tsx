"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { signup, type AuthState } from "../actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const initialState: AuthState = { error: null, message: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Création…" : "Créer un compte"}
    </Button>
  );
}

export function SignupForm() {
  const [state, formAction] = useActionState(signup, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-2xl">Chealf</CardTitle>
        <CardDescription>Créez votre compte</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm_password">Confirmer le mot de passe</Label>
            <Input
              id="confirm_password"
              name="confirm_password"
              type="password"
              autoComplete="new-password"
              required
            />
          </div>
          {state.error && (
            <p
              role="alert"
              className="text-sm px-3 py-2 rounded-md"
              style={{
                background: "var(--error-bg)",
                border: "1px solid var(--error-border)",
                borderLeft: "3px solid var(--destructive)",
                color: "var(--error-fg)",
              }}
            >
              {state.error}
            </p>
          )}
          {state.message && (
            <p
              role="status"
              className="text-sm px-3 py-2 rounded-md"
              style={{
                background: "var(--success-bg)",
                border: "1px solid var(--success-border)",
                borderLeft: "3px solid var(--success-border)",
                color: "var(--success-fg)",
              }}
            >
              {state.message}
            </p>
          )}
          <SubmitButton />
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Déjà un compte ?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
