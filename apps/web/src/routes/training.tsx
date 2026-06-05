import { DemoDataBadge } from "@/components/ui/demo-data-badge";
import { Header } from "@/components/ui/header";
import { SectionStat } from "@/components/ui/section-stat";
import { useTraining } from "@/features/training/use-training";

export function TrainingPage() {
  const query = useTraining();

  if (!query.data) return null;

  const { data } = query;

  return (
    <div className="p-4">
      <div className="mb-8">
        <Header eyebrow="SELF/OS" badge={<DemoDataBadge domain="training" />} title="Training" />
      </div>

      <SectionStat label="Split" value={data.split} />

      <SectionStat label="Exercises">
        <ul className="space-y-3">
          {data.exercises.map((exercise) => (
            <li
              key={exercise.name}
              className="flex items-baseline justify-between"
            >
              <span>{exercise.name}</span>
              <span className="font-mono text-sm text-muted-foreground">
                {exercise.sets}×{exercise.reps} @ {exercise.weight}kg
              </span>
            </li>
          ))}
        </ul>
      </SectionStat>
    </div>
  );
}
