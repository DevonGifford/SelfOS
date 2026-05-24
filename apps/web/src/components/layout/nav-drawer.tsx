import { BarChart3, ClipboardList, Dumbbell, LogOut, Plus, Scale, Settings } from "lucide-react";
import { Link, useLocation } from "react-router";

import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { logout } from "@/data/auth-client";

// The sections that don't already have a direct bottom-nav slot
// (Status/Nutrition do — see bottom-nav.tsx). Exercise joins this list
// once it exists as a real page. Always shown, regardless of current
// page — no "hide current page" logic (explicitly not wanted, per
// .scratch/bottom-nav-wayfinding/map.md).
const SECTION_LINKS = [
  { to: "/habits", label: "Habits", icon: ClipboardList },
  { to: "/training", label: "Training", icon: Dumbbell },
  { to: "/measurements", label: "Measurements", icon: Scale },
];

// The Action/Analytics half of the map's Action/Analytics/Goals template
// — Goals (Nutrition Targets, Training Schedule, ...) waits for a real
// Configuration surface (Settings) to edit them from. Action links land
// back on the section's own page (where the real action already lives)
// rather than trying to trigger that page's mutation drawer from outside
// — deliberately simple for this pass, not wired cross-page yet.
const SECTION_EXTRAS: Record<
  string,
  { action: { label: string; to: string }; analytics: { label: string; to: string } }
> = {
  "/habits": {
    action: { label: "Add Habit", to: "/habits" },
    analytics: { label: "Habits History", to: "/habits/history" },
  },
  "/nutrition": {
    action: { label: "Log Food", to: "/nutrition" },
    analytics: { label: "Nutrition Trends", to: "/nutrition/history" },
  },
  "/training": {
    action: { label: "Log Workout", to: "/training" },
    analytics: { label: "Training History", to: "/training/history" },
  },
  "/measurements": {
    action: { label: "Log Weight", to: "/measurements" },
    analytics: { label: "Weight History", to: "/measurements/history" },
  },
};

type NavDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NavDrawer({ open, onOpenChange }: NavDrawerProps) {
  const location = useLocation();
  const extras = SECTION_EXTRAS[location.pathname];

  function close() {
    onOpenChange(false);
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} swipeDirection="left">
      <DrawerContent>
        <DrawerHeader>
          <Link to="/status" onClick={close} className="flex items-center gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-foreground">
              <span className="size-2 rounded-full bg-foreground" />
            </span>
            <DrawerTitle className="font-heading text-lg uppercase tracking-wide">
              Self<span className="text-muted-foreground">/OS</span>
            </DrawerTitle>
          </Link>
        </DrawerHeader>

        <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
          {extras && (
            <>
              <p className="px-2 pb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                This Page
              </p>
              <Link
                to={extras.action.to}
                onClick={close}
                className="flex items-center gap-3 rounded-md px-2 py-2.5 text-sm hover:bg-muted"
              >
                <Plus className="size-4" />
                {extras.action.label}
              </Link>
              <Link
                to={extras.analytics.to}
                onClick={close}
                className="flex items-center gap-3 rounded-md px-2 py-2.5 text-sm hover:bg-muted"
              >
                <BarChart3 className="size-4" />
                {extras.analytics.label}
              </Link>

              <div className="my-2 border-t" />
            </>
          )}

          <p className="px-2 pb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Sections
          </p>
          {SECTION_LINKS.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={close}
              className="flex items-center gap-3 rounded-md px-2 py-2.5 text-sm hover:bg-muted"
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}

          <div className="my-2 border-t" />

          <Link
            to="/settings"
            onClick={close}
            className="flex items-center gap-3 rounded-md px-2 py-2.5 text-sm hover:bg-muted"
          >
            <Settings className="size-4" />
            Settings
          </Link>
        </div>

        <DrawerFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              close();
              void logout();
            }}
            className="justify-start gap-3"
          >
            <LogOut className="size-4" />
            Log Out
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
