import { useState } from "react";
import { Home, Menu, UtensilsCrossed, X } from "lucide-react";
import { NavLink } from "react-router";

import { NavDrawer } from "@/components/layout/nav-drawer";
import { cn } from "@/lib/utils";

// Status and Nutrition get direct slots (highest-frequency actions —
// .scratch/bottom-nav-wayfinding/map.md); every other section moves into
// the drawer the third slot opens.
const NAV_ITEMS = [
  { to: "/status", label: "Status", icon: Home },
  { to: "/nutrition", label: "Nutrition", icon: UtensilsCrossed },
];

export function BottomNav() {
  const [drawerOpen, setDrawerOpen] = useState(false);

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
        </nav>
      </div>

      <NavDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  );
}
