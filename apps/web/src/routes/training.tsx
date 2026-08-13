import { SectionStat } from "@/components/ui/section-stat";
import { useTraining } from "@/features/training/use-training";

export function TrainingPage() {
  const query = useTraining();

  if (!query.data) return null;

  const { data } = query;

  return (
    <div className="p-4">
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest">
          SELF/OS
        </p>

        <h1 className="mt-2 text-3xl font-semibold">Training</h1>
      </header>

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
