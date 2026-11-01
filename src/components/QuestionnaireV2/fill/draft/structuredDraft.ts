import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function equal(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

/** Keep `fresh` except where `edited` differs from `baseline`. */
function mergeFields(
  baseline: unknown,
  edited: unknown,
  fresh: unknown,
): unknown {
  if (equal(baseline, edited)) return fresh;
  if (!isRecord(baseline) || !isRecord(edited) || !isRecord(fresh)) {
    return edited;
  }
  const merged = { ...fresh };
  for (const key of new Set([
    ...Object.keys(baseline),
    ...Object.keys(edited),
  ])) {
    if (equal(baseline[key], edited[key])) continue;
    if (!(key in edited)) delete merged[key];
    else merged[key] = mergeFields(baseline[key], edited[key], fresh[key]);
  }
  return merged;
}

function rowId(row: unknown): string | undefined {
  if (!isRecord(row)) return undefined;
  return typeof row.id === "string" ? row.id : undefined;
}

function mergeRows(
  baseline: unknown[],
  edited: unknown[],
  fresh: unknown[],
  singleton: boolean,
): unknown[] {
  if (singleton && baseline.length <= 1 && edited.length <= 1) {
    if (!edited.length) return baseline.length ? [] : fresh;
    return [mergeFields(baseline[0], edited[0], fresh[0])];
  }
  const baselineIds = new Map(
    baseline.flatMap((row) => {
      const id = rowId(row);
      return id ? [[id, row] as const] : [];
    }),
  );
  const editedIds = new Map(
    edited.flatMap((row) => {
      const id = rowId(row);
      return id ? [[id, row] as const] : [];
    }),
  );
  const freshIds = new Set(fresh.map(rowId));
  const merged = fresh.flatMap((row) => {
    const id = rowId(row);
    if (!id || !baselineIds.has(id)) return [editedIds.get(id ?? "") ?? row];
    if (!editedIds.has(id)) return [];
    return [mergeFields(baselineIds.get(id), editedIds.get(id), row)];
  });
  for (const row of edited) {
    const id = rowId(row);
    if (id && freshIds.has(id)) continue;
    if (id && baselineIds.has(id) && equal(row, baselineIds.get(id))) continue;
    merged.push(row);
  }
  return merged;
}

/** Rebase clinician edits onto a fresh server prefill: rows merge by id,
 * the id-less encounter singleton merges by field. */
export function initializeStructuredResponse(
  response: QuestionnaireResponse,
  fresh: ResponseValue[],
): QuestionnaireResponse {
  const baseline = response.draft_context;
  if (!baseline && !response.values.length) {
    return { ...response, values: fresh, draft_context: fresh };
  }
  const values = fresh.map((entry) => {
    const edited = response.values.find((value) => value.type === entry.type);
    const before = baseline?.find((value) => value.type === entry.type);
    if (!edited) {
      return baseline && Array.isArray(entry.value)
        ? ({ ...entry, value: [] } as ResponseValue)
        : entry;
    }
    if (!Array.isArray(edited.value) || !Array.isArray(entry.value))
      return edited;
    return {
      ...edited,
      value: mergeRows(
        Array.isArray(before?.value) ? before.value : [],
        edited.value,
        entry.value,
        entry.type === "encounter",
      ),
    } as ResponseValue;
  });
  for (const entry of response.values) {
    if (!fresh.some((value) => value.type === entry.type)) values.push(entry);
  }
  return { ...response, values, draft_context: fresh };
}

export function structuredResponseHasEdits(
  response: QuestionnaireResponse,
): boolean {
  return (
    response.draft_context !== undefined &&
    !equal(response.values, response.draft_context)
  );
}

/** Strip untouched prefills so arriving server records cannot arm autosave. */
export function draftIntentResponse(
  response: QuestionnaireResponse,
): QuestionnaireResponse {
  if (response.sub_results) {
    return {
      ...response,
      sub_results: response.sub_results.map((row) =>
        row.map(draftIntentResponse),
      ),
    };
  }
  const { draft_context, ...rest } = response;
  if (draft_context && !structuredResponseHasEdits(response)) {
    return { ...rest, values: [] };
  }
  return rest;
}
