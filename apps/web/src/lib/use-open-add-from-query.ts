import { useEffect } from "react";
import { useSearchParams } from "react-router";

// Lets a Link elsewhere in the app (the nav drawer's "This Page" action)
// open a page's own add-drawer by navigating to `?action=add`, instead of
// reaching into that page's drawer state from outside. `openAddDrawer` is
// intentionally left out of the deps array — it's a fresh closure every
// render, and re-running on every render would still be harmless here
// (the early return makes it idempotent), but only running when the query
// param itself changes is clearer.
export function useOpenAddFromQuery(openAddDrawer: () => void) {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("action") !== "add") return;

    openAddDrawer();
    setSearchParams(
      (params) => {
        params.delete("action");
        return params;
      },
      { replace: true },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
}
