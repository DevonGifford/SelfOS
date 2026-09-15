import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { enterGuestSession } from "@/data/guest";
import { ApiError } from "@/data/http";
import { useLogin } from "@/features/auth/use-login";

// Password-only, no username or email field — the API has nothing to check
// one against (single user, no users table; decision 07 on the neon map).
// Renders only the form fields — the surrounding Card/label shell lives in
// routes/login.tsx so it can stay identical between the login and
// authenticating states (no layout jump on submit).
export function LoginForm({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [attempt, setAttempt] = useState(0);
  const login = useLogin();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(undefined);

    login.mutate(password, {
      onSuccess: onAuthenticated,
      onError: (err) => {
        if (err instanceof ApiError) {
          setError("Nope, wrong password.");
        } else {
          setError("Something broke. Try again?");
        }
        setAttempt((n) => n + 1);
      },
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Field key={attempt} className={error ? "animate-shake" : undefined}>
          <Input
            id="password"
            type="password"
            aria-label="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoFocus
            aria-invalid={!!error}
            className={error ? "border-destructive" : undefined}
          />
          {error && (
            <p className="animate-in fade-in text-xs text-destructive duration-300">{error}</p>
          )}
        </Field>

        <Field>
          <Button type="submit" disabled={login.isPending}>
            Log In
          </Button>
        </Field>

        <Field>
          <div className="relative my-1 text-center text-xs">
            <div className="absolute inset-0 top-1/2 border-t border-border" />
            <span className="relative bg-card px-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Exploring?
            </span>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              enterGuestSession();
              onAuthenticated();
            }}
          >
            Guest Access
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
