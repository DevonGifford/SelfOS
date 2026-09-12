import { Outlet } from "react-router";

import { BottomNav } from "@/components/layout/bottom-nav";

export function AppShell() {
  return (
    <div className="min-h-dvh overflow-x-hidden bg-background text-foreground">
      <main className="mx-auto min-h-dvh w-full max-w-[430px] border-x pb-16">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}
