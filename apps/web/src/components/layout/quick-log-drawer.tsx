import { Camera, ClipboardList, Dumbbell, Mic, Scale, ScanBarcode, UtensilsCrossed } from "lucide-react";
import { Link } from "react-router";

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

const LINK_CLASS = "flex items-center gap-3 rounded-md px-2 py-2.5 text-sm hover:bg-muted";

type QuickLogDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Log Food is functional (deep-links into Nutrition's own Add Food drawer
// via useOpenAddFromQuery); the other three route into the app's existing
// Coming Soon page treatment rather than pretending to work.
const QUICK_ACTIONS = [
  { to: "/nutrition?action=add", label: "Log Food", icon: UtensilsCrossed },
  { to: "/nutrition/barcode-scan", label: "Barcode Scan", icon: ScanBarcode },
  { to: "/nutrition/voice-log", label: "Voice Log", icon: Mic },
  { to: "/nutrition/meal-scan", label: "Meal Scan", icon: Camera },
];

// Compact snap shows the header + quick-action grid plus a little
// breathing room below the cards, so the drawer reads as intentionally
// complete rather than cut off; the expanded snap fits the grid plus the
// domain rows below it. Both measured against the rendered drawer, not
// copied from the shadcn docs example.
const SNAP_POINTS = ["16rem", "26rem"];

const DOMAIN_LINKS = [
  { to: "/habits", label: "Habits", icon: ClipboardList },
  { to: "/measurements", label: "Measurements", icon: Scale },
  { to: "/training", label: "Training", icon: Dumbbell },
];

export function QuickLogDrawer({ open, onOpenChange }: QuickLogDrawerProps) {
  function close() {
    onOpenChange(false);
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} snapPoints={SNAP_POINTS} showSwipeHandle>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Add</DrawerTitle>
        </DrawerHeader>

        <div className="flex flex-col gap-4 p-4">
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map(({ to, label, icon: Icon }) => (
              <Link
                key={label}
                to={to}
                onClick={close}
                className="flex flex-col items-center justify-center gap-2 rounded-md border p-4 text-center hover:bg-muted"
              >
                <Icon className="size-6" />
                <span className="font-mono text-[10px] uppercase tracking-wider">{label}</span>
              </Link>
            ))}
          </div>

          <div className="border-t" />

          <div className="flex flex-col gap-1">
            {DOMAIN_LINKS.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} onClick={close} className={LINK_CLASS}>
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
