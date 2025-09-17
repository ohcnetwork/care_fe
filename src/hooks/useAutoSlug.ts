import { generateSlug } from "@/Utils/utils";
import { useEffect } from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

type AutoSlugOptions<T extends FieldValues> = {
  slugField?: Path<T>; // default: "slug"
  sourceFields?: Path<T>[]; // default: ["name", "title"] (whichever exists)
  maxLength?: number; // default: 25
};

/**
 * Auto-fills the slug field from "name" or "title" (configurable).
 * - Skips when editing (if initialData.id or initialData.slug present)
 * - Stops if slug is touched/dirty
 * - Stops when slug reaches max length
 * - Prefills on mount if base exists and slug is empty
 */
export function useAutoSlug<T extends FieldValues>(
  form: UseFormReturn<T>,
  initialData?: { slug?: string; id?: string | number },
  options?: AutoSlugOptions<T>,
) {
  useEffect(() => {
    // Only auto-generate for new entries (no id or slug)
    if (initialData?.id || initialData?.slug) return;

    const MAX_SLUG_LENGTH = options?.maxLength ?? 25;
    const slugField = (options?.slugField ?? ("slug" as Path<T>)) as Path<T>;
    const defaultSources = ["name", "title"].filter(Boolean) as Path<T>[];
    const sourceFields = options?.sourceFields ?? defaultSources;

    // Helper to get current base string (prefers first non-empty source)
    const getBase = (): string => {
      for (const src of sourceFields) {
        const val = form.getValues(src) as unknown as string | undefined;
        if (val) return val;
      }
      return "";
    };

    // Early prefill on mount if possible
    const currentSlug = form.getValues(slugField) as unknown as
      | string
      | undefined;
    if (!currentSlug || currentSlug.length === 0) {
      const base = getBase();
      if (base) {
        const slug = generateSlug(base).slice(0, MAX_SLUG_LENGTH);
        form.setValue(slugField, slug as any, {
          shouldValidate: true,
          shouldDirty: false,
        });
      }
    }

    const subscription = form.watch((_, info) => {
      const changed = info?.name as Path<T> | undefined;
      if (!changed || !sourceFields.includes(changed)) return;

      // Stop autofill if slug was manually edited or touched
      const dirtySlug = (form.formState.dirtyFields as any)?.[slugField];
      const touchedSlug = (form.formState.touchedFields as any)?.[slugField];
      if (dirtySlug || touchedSlug) return;

      const current = form.getValues(slugField) as unknown as
        | string
        | undefined;
      if (typeof current === "string" && current.length >= MAX_SLUG_LENGTH)
        return;

      const base = getBase();
      const slug = generateSlug(base).slice(0, MAX_SLUG_LENGTH);

      form.setValue(slugField, slug as any, {
        shouldValidate: true,
        shouldDirty: false,
      });
    });

    return () => subscription.unsubscribe();
  }, [
    form,
    initialData?.id,
    initialData?.slug,
    options?.slugField,
    options?.maxLength,
    // stringify sourceFields to keep effect stable across referential changes
    JSON.stringify(options?.sourceFields ?? ["name", "title"]),
  ]);
}
