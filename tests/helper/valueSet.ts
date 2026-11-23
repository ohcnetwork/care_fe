import { test, type Page } from "@playwright/test";
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
  return listValueSets({ facility: facilityId });
}

async function listValueSets(
  filters: Record<string, string>,
): Promise<ValueSetSummary[]> {
  const results: ValueSetSummary[] = [];
  let count: number;
  do {
    const params = new URLSearchParams({
      ...filters,
      limit: "100",
      offset: String(results.length),
    });
    const res = await fetch(`${apiBaseUrl()}/api/v1/valueset/?${params}`, {
      headers: adminApiHeaders(),
    });
    if (!res.ok) throw new Error(`valueset list failed: ${res.status}`);
    const body = (await res.json()) as {
      count: number;
      results: ValueSetSummary[];
    };
    count = body.count;
    results.push(...body.results);
    if (!body.results.length) break;
  } while (results.length < count);
  return results;
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
      disable_composition: false,
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
 * Creates an instance value set (the admin is a superuser) and returns its
 * id. Specs that override a slug use their own instance set, so their
 * facility override never redirects other specs bound to a shared one.
 */
export async function createInstanceValueSet({
  slug,
  name,
  include = UCUM_MILLIGRAM,
}: {
  slug: string;
  name: string;
  include?: typeof UCUM_MILLIGRAM;
}): Promise<string> {
  const res = await fetch(`${apiBaseUrl()}/api/v1/valueset/`, {
    method: "POST",
    headers: adminApiHeaders(),
    body: JSON.stringify({
      auth_context: "instance",
      inherited: false,
      disable_composition: false,
      name,
      slug,
      description: "Playwright instance value set",
      status: "active",
      compose: { include: [include], exclude: [] },
    }),
  });
  if (!res.ok) {
    throw new Error(
      `valueset create failed: ${res.status} ${await res.text()}`,
    );
  }
  return ((await res.json()) as { id: string }).id;
}

export async function deleteValueSet(id: string): Promise<void> {
  await fetch(`${apiBaseUrl()}/api/v1/valueset/${id}/`, {
    method: "DELETE",
    headers: adminApiHeaders(),
  });
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
  return (await expandFirstCode(slug, facilityId)).valueset;
}

export async function firstValueSetDisplay(slug: string, facilityId: string) {
  const { results } = await expandFirstCode(slug, facilityId);
  if (!results[0]?.display) throw new Error(`No codes available in ${slug}`);
  return results[0].display;
}

async function expandFirstCode(slug: string, facilityId: string) {
  const res = await fetch(`${apiBaseUrl()}/api/v1/valueset/expand_slug/`, {
    method: "POST",
    headers: adminApiHeaders(),
    body: JSON.stringify({ slug, facility: facilityId, search: "", count: 1 }),
  });
  if (!res.ok) {
    throw new Error(`expand_slug failed: ${res.status}`);
  }
  return (await res.json()) as {
    valueset: { id: string; name: string };
    results: { display: string }[];
  };
}

/**
 * Creates an instance value set through the admin create form ("Create
 * ValueSet" on `/admin/valuesets`, opened first when the page is elsewhere)
 * and waits for the redirect back to the list. `description` and `status`
 * (an option label such as "Draft") are only set when given.
 */
export async function createValueSetViaUi(
  page: Page,
  {
    name,
    slug,
    description,
    status,
  }: { name: string; slug: string; description?: string; status?: string },
): Promise<{ name: string; slug: string }> {
  await test.step(
    "valueset.create",
    async () => {
      if (!/\/admin\/valuesets\/?$/.test(new URL(page.url()).pathname)) {
        await page.goto("/admin/valuesets");
      }
      await page.getByRole("link", { name: "Create ValueSet" }).click();
      await page.getByRole("textbox", { name: "Name *" }).fill(name);
      await page.getByRole("textbox", { name: "Slug *" }).fill(slug);
      if (description !== undefined) {
        await page
          .getByRole("textbox", { name: "Description" })
          .fill(description);
      }
      if (status) {
        await page.getByRole("combobox", { name: "Status *" }).click();
        await page.getByRole("option", { name: status }).click();
      }
      await page.getByRole("button", { name: "Save ValueSet" }).click();
      // Wait for redirect back to valueset list
      await page.waitForURL("**/admin/valuesets");
    },
    { box: true },
  );

  return { name, slug };
}
