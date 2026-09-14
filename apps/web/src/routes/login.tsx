import { LoginForm } from "@/components/login-form";

export function LoginPage() {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <p className="font-mono text-xs uppercase tracking-widest">SELF/OS</p>
        <h1 className="mt-2 text-3xl font-semibold">Log In</h1>
      </div>

      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
