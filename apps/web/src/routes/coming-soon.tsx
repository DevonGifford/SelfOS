import { Header } from "@/components/ui/header";

type ComingSoonPageProps = {
  title: string;
  description: string;
};

// Generic placeholder destination — used for every drawer link that
// points at a section/feature that doesn't exist yet (Settings, each
// section's Analytics/History). Real routes rather than dead links, so
// the nav structure is complete now even where the feature behind it
// isn't (.scratch/bottom-nav-wayfinding/map.md).
export function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  return (
    <div className="p-4">
      <div className="mb-8">
        <Header eyebrow="SELF/OS" title={title} />
      </div>

      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
