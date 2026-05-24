import { BarChart3, ClipboardList, Dumbbell, LogOut, Plus, Scale, Settings, UtensilsCrossed } from "lucide-react";
import { Link, useLocation } from "react-router";

import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerSwipeArea, DrawerTitle } from "@/components/ui/drawer";
import { logout } from "@/data/auth-client";

const LINK_CLASS = "flex items-center gap-3 rounded-md px-2 py-2.5 text-sm hover:bg-muted";

// Every major section, always shown regardless of current page — no
// "hide current page" logic, and no exception for Status/Nutrition just
// because they also have a direct bottom-nav slot (explicitly wanted,
// per .scratch/bottom-nav-wayfinding/map.md). Exercise joins this list
// once it exists as a real page.
const SECTION_LINKS = [
  { to: "/habits", label: "Habits", icon: ClipboardList },
  { to: "/nutrition", label: "Nutrition", icon: UtensilsCrossed },
  { to: "/training", label: "Training", icon: Dumbbell },
  { to: "/measurements", label: "Measurements", icon: Scale },
];

// The Action/Analytics half of the map's Action/Analytics/Goals template
// — Goals (Nutrition Targets, Training Schedule, ...) waits for a real
// Configuration surface (Settings) to edit them from. `?action=add` is read
// by the page itself (useOpenAddFromQuery) to open its own add-drawer, the
// same one its own "Add"/"Log" button opens — Training has no logging
// feature yet, so its action link just lands on the page for now.
const SECTION_EXTRAS: Record<
  string,
  { action: { label: string; to: string }; analytics: { label: string; to: string } }
> = {
  "/habits": {
    action: { label: "Add Habit", to: "/habits?action=add" },
    analytics: { label: "Habits History", to: "/habits/history" },
  },
  "/nutrition": {
    action: { label: "Log Food", to: "/nutrition?action=add" },
    analytics: { label: "Nutrition Trends", to: "/nutrition/history" },
  },
  "/training": {
    action: { label: "Log Workout", to: "/training" },
    analytics: { label: "Training History", to: "/training/history" },
  },
  "/measurements": {
    action: { label: "Log Weight", to: "/measurements?action=add" },
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
      <DrawerSwipeArea />

      <DrawerContent>
        <DrawerHeader>
          <Link to="/status" onClick={close}>
            <DrawerTitle className="font-heading text-2xl uppercase tracking-widest pt-2">
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
              <Link to={extras.action.to} onClick={close} className={LINK_CLASS}>
                <Plus className="size-4" />
                {extras.action.label}
              </Link>
              <Link to={extras.analytics.to} onClick={close} className={LINK_CLASS}>
                <BarChart3 className="size-4" />
                {extras.analytics.label}
              </Link>
            </>
          )}

          <div className="my-2 border-t" />

          {SECTION_LINKS.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} onClick={close} className={LINK_CLASS}>
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </div>

        <DrawerFooter>
          <div className="flex flex-col gap-1 border-t pt-3">
            <Link to="/settings" onClick={close} className={LINK_CLASS}>
              <Settings className="size-4" />
              Settings
            </Link>
            <button
              type="button"
              onClick={() => {
                close();
                void logout();
              }}
              className={LINK_CLASS}
            >
              <LogOut className="size-4" />
              Log Out
            </button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
