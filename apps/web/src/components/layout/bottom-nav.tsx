import { useState } from "react";
import { Home, Menu, Plus, X } from "lucide-react";
import { NavLink } from "react-router";

import { NavDrawer } from "@/components/layout/nav-drawer";
import { QuickLogDrawer } from "@/components/layout/quick-log-drawer";
import { cn } from "@/lib/utils";

// Home is the one direct link slot (highest-frequency destination —
// .scratch/bottom-nav-wayfinding/map.md); Menu and Add both open drawers
// rather than routing directly.
const NAV_ITEMS = [{ to: "/home", label: "Home", icon: Home }];

export function BottomNav() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [quickLogOpen, setQuickLogOpen] = useState(false);

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 bg-background">
        <nav className="mx-auto flex w-full max-w-[430px] border-x border-t">
          <button
            type="button"
            onClick={() => setDrawerOpen((isOpen) => !isOpen)}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-3 text-muted-foreground transition-colors",
              drawerOpen && "text-foreground",
            )}
          >
            {drawerOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            <span className="font-mono text-[10px] uppercase tracking-wider">Menu</span>
          </button>

          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex flex-1 flex-col items-center gap-1 py-3 text-muted-foreground transition-colors",
                  isActive && "text-foreground",
                )
              }
            >
              <Icon className="size-5" />
              <span className="font-mono text-[10px] uppercase tracking-wider">
                {label}
              </span>
            </NavLink>
          ))}

          <button
            type="button"
            onClick={() => setQuickLogOpen((isOpen) => !isOpen)}
            className="flex flex-1 flex-col items-center justify-center py-3 text-muted-foreground transition-colors"
          >
            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Plus className="size-5" />
            </span>
          </button>
        </nav>
      </div>

      <NavDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      <QuickLogDrawer open={quickLogOpen} onOpenChange={setQuickLogOpen} />
    </>
  );
}
