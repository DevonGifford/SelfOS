import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Header } from "@/components/ui/header";
import { Input } from "@/components/ui/input";
import type { Configuration } from "@/data/schemas/configuration";
import { useConfiguration } from "@/features/configuration/use-configuration";
import { useUpdateConfiguration } from "@/features/configuration/use-configuration-mutations";
import { validate } from "@/features/configuration/validate";
import { SettingsSection, SettingsSectionBadge } from "@/features/settings/settings-section";

export function SettingsPage() {
  const configQuery = useConfiguration();

  return (
    <div className="p-4">
      <div className="mb-8">
        <Header eyebrow="SELF/OS" title="Settings" />
      </div>

      <SettingsSection title="Nutrition Targets">
        {configQuery.data ? (
          <NutritionTargetsForm configuration={configQuery.data} />
        ) : (
          <p className="text-sm text-muted-foreground">Loading…</p>
        )}
      </SettingsSection>

      <SettingsSection title="Measurement Targets">
        <MeasurementTargetsPreview />
      </SettingsSection>

      <SettingsSection title="Habit Targets">
        <HabitTargetsPreview />
      </SettingsSection>

      <SettingsSection
        title="Training Targets"
        badge={<SettingsSectionBadge>In progress</SettingsSectionBadge>}
      >
        <p className="text-sm text-muted-foreground">Training targets are coming soon.</p>
      </SettingsSection>
    </div>
  );
}

// Mounted only once `configuration` has loaded, so its useState
// initializers reliably pick up the real values — same trick
// MeasurementDrawer uses via a remount `key`, just via conditional render
// here since this is a page, not a drawer reopened repeatedly.
function NutritionTargetsForm({ configuration }: { configuration: Configuration }) {
  const [calories, setCalories] = useState(String(configuration.nutritionCaloriesTarget));
  const [protein, setProtein] = useState(String(configuration.nutritionProteinTarget));
  const [carbs, setCarbs] = useState(String(configuration.nutritionCarbsTarget));
  const [fat, setFat] = useState(String(configuration.nutritionFatTarget));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useUpdateConfiguration();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const input: Configuration = {
      nutritionCaloriesTarget: Number(calories),
      nutritionProteinTarget: Number(protein),
      nutritionCarbsTarget: Number(carbs),
      nutritionFatTarget: Number(fat),
    };

    const validationErrors = validate(input);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    mutation.mutate(input);
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel
              htmlFor="calories"
              className="font-mono text-xs uppercase tracking-wider text-muted-foreground"
            >
              Calories
            </FieldLabel>
            <Input
              id="calories"
              type="number"
              inputMode="decimal"
              value={calories}
              onChange={(event) => setCalories(event.target.value)}
              aria-invalid={!!errors.nutritionCaloriesTarget}
            />
            {errors.nutritionCaloriesTarget && (
              <p className="text-xs text-destructive">{errors.nutritionCaloriesTarget}</p>
            )}
          </Field>

          <Field>
            <FieldLabel
              htmlFor="protein"
              className="font-mono text-xs uppercase tracking-wider text-muted-foreground"
            >
              Protein (g)
            </FieldLabel>
            <Input
              id="protein"
              type="number"
              inputMode="decimal"
              value={protein}
              onChange={(event) => setProtein(event.target.value)}
              aria-invalid={!!errors.nutritionProteinTarget}
            />
            {errors.nutritionProteinTarget && (
              <p className="text-xs text-destructive">{errors.nutritionProteinTarget}</p>
            )}
          </Field>

          <Field>
            <FieldLabel
              htmlFor="carbs"
              className="font-mono text-xs uppercase tracking-wider text-muted-foreground"
            >
              Carbs (g)
            </FieldLabel>
            <Input
              id="carbs"
              type="number"
              inputMode="decimal"
              value={carbs}
              onChange={(event) => setCarbs(event.target.value)}
              aria-invalid={!!errors.nutritionCarbsTarget}
            />
            {errors.nutritionCarbsTarget && (
              <p className="text-xs text-destructive">{errors.nutritionCarbsTarget}</p>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="fat" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Fat (g)
            </FieldLabel>
            <Input
              id="fat"
              type="number"
              inputMode="decimal"
              value={fat}
              onChange={(event) => setFat(event.target.value)}
              aria-invalid={!!errors.nutritionFatTarget}
            />
            {errors.nutritionFatTarget && <p className="text-xs text-destructive">{errors.nutritionFatTarget}</p>}
          </Field>
        </div>

        <Field>
          <Button type="submit" disabled={mutation.isPending}>
            Save
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}

// Weight isn't yet a field on Configuration (see data/schemas/configuration.ts
// — today it's exactly the 4 nutrition targets, end to end). This
// establishes the UI slot only; wiring it up is a separate pass that would
// touch the migration, sqlc queries, Go handler, and this schema together.
function MeasurementTargetsPreview() {
  const [targetWeight, setTargetWeight] = useState("");

  return (
    <Field>
      <FieldLabel
        htmlFor="target-weight"
        className="font-mono text-xs uppercase tracking-wider text-muted-foreground"
      >
        Target Weight (kg)
      </FieldLabel>
      <Input
        id="target-weight"
        type="number"
        inputMode="decimal"
        value={targetWeight}
        onChange={(event) => setTargetWeight(event.target.value)}
      />
    </Field>
  );
}

// Same as MeasurementTargetsPreview — no Habit domain field for this yet,
// UI slot only.
function HabitTargetsPreview() {
  const [targetCompletion, setTargetCompletion] = useState(70);

  return (
    <Field>
      <FieldLabel
        htmlFor="target-completion"
        className="font-mono text-xs uppercase tracking-wider text-muted-foreground"
      >
        Target completion: {targetCompletion}%
      </FieldLabel>
      <Input
        id="target-completion"
        type="number"
        inputMode="numeric"
        min={0}
        max={100}
        value={targetCompletion}
        onChange={(event) => setTargetCompletion(Number(event.target.value))}
      />
    </Field>
  );
}
