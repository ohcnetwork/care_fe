import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { BatchRequestObject } from "@/Utils/request/batch";

import {
  type PendingSpecimen,
  type SpecimenEntry,
  type SpecimenEntryErrors,
  collectRequest,
  initialEntry,
  validateEntry,
} from "./specimenCollection";

/**
 * What is typed or scanned for tests still to collect, shared by the request
 * page and the batch sheet. `included` are the tests being collected, in the
 * order a scanner moves through them; `nameOf` is what each row is called;
 * `scanner` is the batch sheet's rules (see specimenCollection.ts).
 */
export function useSpecimenEntries(
  included: PendingSpecimen[],
  nameOf: (item: PendingSpecimen) => string = ({ request }) => request.title,
  scanner = true,
) {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<Record<string, SpecimenEntry>>({});
  const [errors, setErrors] = useState<Record<string, SpecimenEntryErrors>>({});
  const [cameraFor, setCameraFor] = useState<PendingSpecimen | null>(null);
  const identifierInputs = useRef(new Map<string, HTMLInputElement>());

  const entryOf = (item: PendingSpecimen) =>
    entries[item.key] ?? initialEntry(item.requirement, item.draft);
  const identifierOf = (item: PendingSpecimen) =>
    entryOf(item).accessionIdentifier.trim();

  const clearErrors = (keys: string[]) =>
    setErrors((prev) => {
      const next = { ...prev };
      for (const key of keys) delete next[key];
      return next;
    });

  const updateEntry = (
    item: PendingSpecimen,
    patch: Partial<SpecimenEntry>,
  ) => {
    setEntries((prev) => ({
      ...prev,
      [item.key]: {
        ...(prev[item.key] ?? initialEntry(item.requirement, item.draft)),
        ...patch,
      },
    }));
    clearErrors([item.key]);
  };

  /** Forgets what was entered, once a test is saved. */
  const resetEntries = (keys: string[]) => {
    setEntries((prev) => {
      const next = { ...prev };
      for (const key of keys) delete next[key];
      return next;
    });
    clearErrors(keys);
  };

  // Shows why an ID can't be used, and returns whether it can.
  const checkIdentifier = (item: PendingSpecimen, id: string) => {
    const duplicate =
      id &&
      included.find((other) => other !== item && identifierOf(other) === id);
    const error = duplicate
      ? t("specimen_id_used_for", { name: nameOf(duplicate) })
      : validateEntry({ ...entryOf(item), accessionIdentifier: id }, t)
          .accessionIdentifier;
    if (error) {
      setErrors((prev) => ({
        ...prev,
        [item.key]: { ...prev[item.key], accessionIdentifier: error },
      }));
    }
    return !error;
  };

  const handleIdentifierEnter = (item: PendingSpecimen) => {
    if (!checkIdentifier(item, identifierOf(item))) {
      // So the next scan replaces the bad one.
      identifierInputs.current.get(item.key)?.select();
      return;
    }
    // A scanner ends each code with Enter, so move on to the next empty ID.
    const index = included.indexOf(item);
    const next = [
      ...included.slice(index + 1),
      ...included.slice(0, index),
    ].find((other) => !identifierOf(other));
    if (next) identifierInputs.current.get(next.key)?.focus();
    else identifierInputs.current.get(item.key)?.blur();
  };

  const handleCameraScan = (value: string) => {
    if (!cameraFor) return;
    updateEntry(cameraFor, { accessionIdentifier: value.trim() });
    if (scanner) checkIdentifier(cameraFor, value.trim());
  };

  /** Checks the tests and returns their save requests, or null after showing why not. */
  const collect = (
    items: PendingSpecimen[],
    facilityId: string,
    collector: string,
  ): BatchRequestObject[] | null => {
    const found: Record<string, SpecimenEntryErrors> = {};
    const seen = new Map<string, PendingSpecimen>();
    for (const item of items) {
      const itemErrors = validateEntry(entryOf(item), t, scanner);
      const id = identifierOf(item);
      const first = scanner && seen.get(id);
      if (first) {
        itemErrors.accessionIdentifier = t("specimen_id_used_for", {
          name: nameOf(first),
        });
      } else if (id) {
        seen.set(id, item);
      }
      if (Object.keys(itemErrors).length) found[item.key] = itemErrors;
    }
    clearErrors(items.map(({ key }) => key));
    const invalid = items.find(({ key }) => found[key]);
    if (invalid) {
      setErrors((prev) => ({ ...prev, ...found }));
      document
        .getElementById(invalid.key)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return null;
    }
    return items.map((item) =>
      collectRequest(facilityId, item, entryOf(item), collector, scanner),
    );
  };

  /** The props a row needs to edit one test. */
  const rowProps = (item: PendingSpecimen) => ({
    scanner,
    entry: entryOf(item),
    errors: errors[item.key] ?? {},
    identifierRef: (input: HTMLInputElement | null) => {
      if (input) identifierInputs.current.set(item.key, input);
      else identifierInputs.current.delete(item.key);
    },
    onChange: (patch: Partial<SpecimenEntry>) => updateEntry(item, patch),
    onIdentifierEnter: () => handleIdentifierEnter(item),
    onCameraScan: () => setCameraFor(item),
  });

  return {
    identifierOf,
    identifierInputs,
    rowProps,
    collect,
    resetEntries,
    cameraFor,
    setCameraFor,
    handleCameraScan,
  };
}
