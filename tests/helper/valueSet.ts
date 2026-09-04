import { adminApiHeaders, apiBaseUrl } from "tests/helper/questionnaireV2";

interface ValueSetSummary {
  id: string;
  slug: string;
  name: string;
}

/** Lists a facility's value sets (every status) through the API. */
export async function listFacilityValueSets(
  facilityId: string,
): Promise<ValueSetSummary[]> {
  const res = await fetch(
    `${apiBaseUrl()}/api/v1/valueset/?facility=${facilityId}&limit=100`,
    { headers: adminApiHeaders() },
  );
  if (!res.ok) {
    throw new Error(`valueset list failed: ${res.status}`);
  }
  const body = (await res.json()) as { results: ValueSetSummary[] };
  return body.results;
}

/**
 * Removes this facility's value sets with `slug`. The backend enforces slug
 * uniqueness per facility, and specs that create an override run against a
 * DB that may already hold one — from a prior run, or from another spec —
 * so each clears leftovers first and cleans up after itself. Soft-deleted
 * rows no longer count towards the constraint.
 */
export async function deleteFacilityValueSetsBySlug(
  facilityId: string,
  slug: string,
): Promise<void> {
  const leftovers = (await listFacilityValueSets(facilityId)).filter(
    (valueset) => valueset.slug === slug,
  );
  for (const valueset of leftovers) {
    await fetch(`${apiBaseUrl()}/api/v1/valueset/${valueset.id}/`, {
      method: "DELETE",
      headers: adminApiHeaders(),
    });
  }
}

const UCUM_MILLIGRAM = {
  system: "http://unitsofmeasure.org",
  version: null,
  concept: [{ code: "mg", display: "milligram" }],
};

/**
 * Creates a facility override of an instance value set: an `inherited`
 * child that takes the parent's slug and adds one include rule (a UCUM
 * unit unless `include` says otherwise) on top of the parent's
 * composition. Returns the new set's id.
 */
export async function createFacilityOverride({
  facilityId,
  parentId,
  parentSlug,
  name,
  include = UCUM_MILLIGRAM,
}: {
  facilityId: string;
  parentId: string;
  parentSlug: string;
  name: string;
  include?: typeof UCUM_MILLIGRAM;
}): Promise<string> {
  const res = await fetch(`${apiBaseUrl()}/api/v1/valueset/`, {
    method: "POST",
    headers: adminApiHeaders(),
    body: JSON.stringify({
      auth_context: "facility",
      facility: facilityId,
      parent: parentId,
      inherited: true,
      name,
      slug: parentSlug,
      description: "Playwright facility override",
      status: "active",
      compose: { include: [include], exclude: [] },
    }),
  });
  if (!res.ok) {
    throw new Error(
      `valueset create failed: ${res.status} ${await res.text()}`,
    );
  }
  const body = (await res.json()) as { id: string };
  return body.id;
}

/**
 * What `slug` currently resolves to for the calling user inside `facility`
 * — i.e. what `get_closest_valueset` picks after the user's preference.
 * Asserting on this proves a preference reached the backend, which a
 * client-side re-render cannot.
 */
export async function resolveSlugForFacility(
  slug: string,
  facilityId: string,
): Promise<{ id: string; name: string }> {
  const res = await fetch(`${apiBaseUrl()}/api/v1/valueset/expand_slug/`, {
    method: "POST",
    headers: adminApiHeaders(),
    body: JSON.stringify({ slug, facility: facilityId, search: "", count: 1 }),
  });
  if (!res.ok) {
    throw new Error(`expand_slug failed: ${res.status}`);
  }
  const body = (await res.json()) as { valueset: { id: string; name: string } };
  return body.valueset;
}

/** Resolves an instance value set by slug (the list has no slug filter). */
export async function getInstanceValueSetIdBySlug(
  slug: string,
): Promise<string> {
  const res = await fetch(
    `${apiBaseUrl()}/api/v1/valueset/?auth_context=instance&limit=100`,
    { headers: adminApiHeaders() },
  );
  const body = (await res.json()) as { results: ValueSetSummary[] };
  const match = body.results.find((valueset) => valueset.slug === slug);
  if (!match) {
    throw new Error(`instance value set ${slug} not found`);
  }
  return match.id;
}
