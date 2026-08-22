import type { PropsWithChildren } from "react";
import { Toast as ToastPrimitive } from "@base-ui/react/toast";
import { cn } from "cn";

// Module-level manager so mutation callbacks (outside the React tree, in
// TanStack Query onSuccess handlers) can fire toasts imperatively — this
// is how add/edit/delete's "UNDO" toasts get shown (decision 05/Q17).
export const toastManager = ToastPrimitive.createToastManager();

function ToastViewport() {
  const { toasts } = ToastPrimitive.useToastManager();

  return (
    <ToastPrimitive.Portal>
      <ToastPrimitive.Viewport className="fixed inset-x-0 bottom-20 z-50 mx-auto flex w-full max-w-[430px] flex-col gap-2 px-4">
        {toasts.map((toast) => (
          <ToastPrimitive.Root
            key={toast.id}
            toast={toast}
            className={cn(
              "pointer-events-auto rounded-lg border bg-foreground text-background shadow-lg",
              "transition-all duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0 data-starting-style:translate-y-2",
            )}
          >
            <ToastPrimitive.Content className="flex items-center justify-between gap-3 px-4 py-3">
              <ToastPrimitive.Title className="font-mono text-xs uppercase tracking-wide" />
              <ToastPrimitive.Action className="shrink-0 font-mono text-xs font-semibold uppercase tracking-wide underline underline-offset-2" />
            </ToastPrimitive.Content>
          </ToastPrimitive.Root>
        ))}
      </ToastPrimitive.Viewport>
    </ToastPrimitive.Portal>
  );
}

export function ToastProvider({ children }: PropsWithChildren) {
  return (
    <ToastPrimitive.Provider toastManager={toastManager} timeout={5000}>
      {children}
      <ToastViewport />
    </ToastPrimitive.Provider>
  );
}
