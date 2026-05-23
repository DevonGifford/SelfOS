import { Link } from "react-router";

import { ProgressRing } from "@/components/ui/progress-ring";
import type { Status } from "@/data/schemas/status";

type StatusHeaderProps = {
  training: Status["training"];
  measurementsKg: number;
  habits: Status["habits"];
};

export function StatusHeader({ training, measurementsKg, habits }: StatusHeaderProps) {
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <header>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
        <div className="grid min-w-0 grid-rows-[auto_auto] gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 mt-2">
              <p className="font-mono text-xs italic uppercase tracking-widest text-muted-foreground">
                {today}
              </p>

              <Link to="/training" className="block">
                <h1 className="font-heading text-2xl uppercase">{training.focus} Day</h1>
                <p className="text-xs text-muted-foreground">
                  <span>tomorrow: </span>
                  <span className="italic"> {training.tomorrow}</span>
                </p>
              </Link>
            </div>

            <Link to="/measurements" className="pb-2 pl-1 font-extrabold">
              <ProgressRing value={80} max={100} size={70} strokeWidth={4}>
                <p className="text-xs translate-y-1">{measurementsKg}</p>
                <p className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground ">
                  kg
                </p>
              </ProgressRing>
            </Link>
          </div>

          <div className="min-w-0 text-xs italic font-thin font-mono text-muted-foreground">
            TODO: New feat/ either quote or warning message
          </div>
        </div>

        <Link to="/habits">
          <ProgressRing value={habits.completed} max={habits.total} size={116}>
            <p className="text-xl font-semibold">
              {habits.completed}/{habits.total}
            </p>
            <p className="text-center font-mono text-[10px] uppercase leading-tight text-muted-foreground">
              Daily Habit
            </p>
          </ProgressRing>
        </Link>
      </div>
    </header>
  );
}
