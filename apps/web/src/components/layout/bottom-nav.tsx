import { Dumbbell, Home, UtensilsCrossed } from "lucide-react";
import { NavLink } from "react-router";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/status", label: "Status", icon: Home },
  { to: "/nutrition", label: "Nutrition", icon: UtensilsCrossed },
  { to: "/training", label: "Training", icon: Dumbbell },
];

export function BottomNav() {
  return (
    <div className="fixed inset-x-0 bottom-0 bg-background">
      <nav className="mx-auto flex w-full max-w-[430px] border-x border-t">
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
  );
}
