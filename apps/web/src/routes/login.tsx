import { useState } from "react";
import { cn } from "cn";

import { Card, CardContent } from "@/components/ui/card";
import { ProgressBar, TerminalOutput, useBootSequence } from "@/features/auth/authenticating-panel";
import { LoginForm } from "@/features/auth/login-form";

export function LoginPage() {
  const [authenticating, setAuthenticating] = useState(false);
  const { displayedLines, progress } = useBootSequence(authenticating, () => window.location.assign("/home"));

  return (
    <div className="flex min-h-dvh w-full flex-col items-center gap-8 p-6">
      <img src="/favicon.svg" alt="SELF/OS" className="-mt-3 size-[202px] rounded-2xl" />

      <div className="flex w-full max-w-sm flex-col gap-6">
        {/* Heading/progress slot — both occupy the same space so nothing
            below shifts when one replaces the other. */}
        <div className="relative flex items-center justify-center">
          <h1 className={cn("text-3xl font-semibold", authenticating && "invisible")}>Log In</h1>
          {authenticating && (
            <div className="absolute inset-0 flex items-center justify-center">
              <ProgressBar value={progress} />
            </div>
          )}
        </div>

        {/* Single shared card shell for both states. The login fields stay
            mounted (just visually hidden) so their natural height — taller
            once the guest section is added — is what fixes the card's size;
            the terminal renders as an overlay on top of that same space. */}
        <Card className="border ring-0">
          <CardContent>
            <p className="mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              {authenticating ? "Terminal" : "Password"}
            </p>

            <div className="relative">
              <div className={authenticating ? "invisible" : undefined} inert={authenticating}>
                <LoginForm onAuthenticated={() => setAuthenticating(true)} />
              </div>

              {authenticating && (
                <div className="absolute inset-0 top-0">
                  <TerminalOutput lines={displayedLines} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
