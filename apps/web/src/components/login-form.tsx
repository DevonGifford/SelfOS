import { useState, type FormEvent } from "react";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/data/http";
import { useLogin } from "@/features/auth/use-login";

// Password-only, no username or email field — the API has nothing to check
// one against (single user, no users table; decision 07 on the neon map).
// Structurally still login-01's shape (Card/Field/Input), stripped of the
// OAuth button, "Forgot your password?" link, and sign-up text that don't
// apply here, and restyled to match the rest of the app's look
// (MeasurementDrawer's font-mono uppercase label, plain bordered input)
// rather than shadcn's default Card styling (ticket 09 §2).
export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const login = useLogin();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(undefined);

    login.mutate(password, {
      onSuccess: () => {
        window.location.assign("/status");
      },
      onError: (err) => {
        if (err instanceof ApiError) {
          setError(err.fieldErrors.password ?? "Incorrect password");
        } else {
          setError("Something went wrong");
        }
      },
    });
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border ring-0">
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel
                  htmlFor="password"
                  className="font-mono text-xs uppercase tracking-wider text-muted-foreground"
                >
                  Password
                </FieldLabel>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoFocus
                />
                {error && <p className="text-xs text-destructive">{error}</p>}
              </Field>

              <Field>
                <Button type="submit" disabled={login.isPending}>
                  Log In
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
