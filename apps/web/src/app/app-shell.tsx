import { Outlet } from "react-router";

import { BottomNav } from "@/components/layout/bottom-nav";
import { logout } from "@/data/auth-client";

export function AppShell() {
  return (
    <div className="min-h-dvh overflow-x-hidden bg-background text-foreground">
      <main className="mx-auto min-h-dvh w-full max-w-[430px] border-x pb-16">
        <button
          type="button"
          onClick={() => void logout()}
          className="absolute right-4 top-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
        >
          Log Out
        </button>

        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}
