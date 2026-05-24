import { ClipboardList, Dumbbell, LogOut, Scale } from "lucide-react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { logout } from "@/data/auth-client";

// The sections that don't already have a direct bottom-nav slot
// (Home/Nutrition do — see bottom-nav.tsx). Exercise joins this list once
// it exists as a real page.
const SECTION_LINKS = [
  { to: "/habits", label: "Habits", icon: ClipboardList },
  { to: "/training", label: "Training", icon: Dumbbell },
  { to: "/measurements", label: "Measurements", icon: Scale },
];

type NavDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Pure cross-section navigation for now, same content regardless of the
// current page — the richer per-section Action/Analytics/Goals panel
// (.scratch/bottom-nav-wayfinding/map.md) is deferred until the features
// it would link to (Nutrition Targets, Training logging, analytics)
// actually exist. Building that now would mean stub links to nothing.
export function NavDrawer({ open, onOpenChange }: NavDrawerProps) {
  function close() {
    onOpenChange(false);
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} swipeDirection="left">
      <DrawerContent>
        <DrawerHeader>
          <Link to="/status" onClick={close}>
            <DrawerTitle className="font-mono text-xs uppercase tracking-widest">
              SELF/OS
            </DrawerTitle>
          </Link>
        </DrawerHeader>

        <nav className="flex flex-1 flex-col gap-1 p-4">
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
        </nav>

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
