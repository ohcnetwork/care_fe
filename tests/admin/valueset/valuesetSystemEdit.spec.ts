import { expect, test } from "@playwright/test";

import {
  ValueSetRead,
  ValueSetStatus,
  ValueSetUpdate,
} from "../../../src/types/valueSet/valueSet";

test.use({
  storageState: "tests/.auth/user.json",
  viewport: { width: 1440, height: 1000 },
});

const SYSTEM_VALUE_SET: ValueSetRead = {
  id: "655cae23-bb9f-43ab-8d28-a8d83e558062",
  slug: "system-additional-instruction",
  name: "Additional Instruction",
  description: "System-defined instructions for prescriptions.",
  status: ValueSetStatus.ACTIVE,
  is_system_defined: true,
  compose: {
    // The API can omit the unused concept list. Opening this rule must
    // not make the form dirty or prevent saving an unchanged long slug.
    include: [
      {
        system: "http://snomed.info/sct",
        version: null,
        filter: [{ property: "concept", op: "is-a", value: "419492006" }],
      },
    ],
    exclude: [],
  },
  created_by: null,
  updated_by: null,
};

test("admins can edit a system value set while its existing slug stays locked", async ({
  page,
}) => {
  let savedValueSet = structuredClone(SYSTEM_VALUE_SET);
  const mutations: string[] = [];
  const detailPath = `/api/v1/valueset/${SYSTEM_VALUE_SET.id}/`;

  // Isolate all value-set requests. Even if the UI regresses, no mutation
  // can reach the backend or change a real system-defined value set.
  await page.route(
    (url) => url.pathname.startsWith("/api/v1/valueset/"),
    async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (request.method() !== "GET") {
        mutations.push(`${request.method()} ${url.pathname}`);
        if (request.method() === "PUT" && url.pathname === detailPath) {
          const payload = request.postDataJSON() as ValueSetUpdate;
          savedValueSet = { ...savedValueSet, ...payload };
          await route.fulfill({ json: savedValueSet });
        } else {
          await route.abort();
        }
        return;
      }

      if (url.pathname === detailPath) {
        await route.fulfill({ json: savedValueSet });
      } else if (url.pathname === "/api/v1/valueset/") {
        const status = url.searchParams.get("status");
        const search = url.searchParams.get("name")?.toLowerCase() ?? "";
        const results =
          (!status || status === savedValueSet.status) &&
          savedValueSet.name.toLowerCase().includes(search)
            ? [savedValueSet]
            : [];
        await route.fulfill({ json: { count: results.length, results } });
      } else {
        await route.abort();
      }
    },
  );

  await page.goto("/admin/valuesets");
  const row = page.getByRole("row").filter({
    has: page.getByText(SYSTEM_VALUE_SET.name, { exact: true }),
  });
  await expect(
    row.getByRole("button", { name: "Edit", exact: true }),
  ).toBeVisible();
  await row.getByRole("button", { name: "Edit", exact: true }).click();

  await expect(
    page.getByRole("heading", { name: "Edit ValueSet", exact: true }),
  ).toBeVisible();
  const save = page.getByRole("button", { name: "Save ValueSet", exact: true });
  await expect(save).toBeDisabled();
  await expect(
    page.getByText("No changes to save", { exact: true }).first(),
  ).toBeVisible();

  const name = page.getByRole("textbox", { name: "Name *" });
  const description = page.getByRole("textbox", {
    name: "Description (Optional)",
    exact: true,
  });
  const status = page.getByRole("combobox", { name: "Status *" });
  const slug = page.getByRole("textbox", { name: "Slug *" });
  await expect(name).toBeEnabled();
  await expect(description).toBeEnabled();
  await expect(status).toBeEnabled();
  await expect(slug).toBeDisabled();
  await expect(slug).toHaveValue(SYSTEM_VALUE_SET.slug);
  await expect(
    page.getByRole("combobox", { name: "System", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Add Rule", exact: true }).first(),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Add Filter", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Remove Include rule 1", exact: true }),
  ).toBeEnabled();

  const updatedName = "Updated additional instructions";
  const updatedDescription = "Instructions reviewed by the administrator.";
  await name.fill(updatedName);
  await expect(slug).toHaveValue(SYSTEM_VALUE_SET.slug);
  await description.fill(updatedDescription);
  await status.click();
  await page.getByRole("option", { name: "Draft", exact: true }).click();
  const filterValue = page.getByRole("textbox", { name: "Value", exact: true });
  await expect(filterValue).toBeEnabled();
  await filterValue.fill("422037009");
  await expect(save).toBeEnabled();

  const [updateRequest] = await Promise.all([
    page.waitForRequest(
      (request) =>
        request.method() === "PUT" &&
        new URL(request.url()).pathname === detailPath,
    ),
    save.click(),
  ]);
  expect(updateRequest.postDataJSON()).toMatchObject({
    id: SYSTEM_VALUE_SET.id,
    name: updatedName,
    description: updatedDescription,
    status: ValueSetStatus.DRAFT,
    slug: SYSTEM_VALUE_SET.slug,
    is_system_defined: true,
    compose: {
      include: [
        {
          system: "http://snomed.info/sct",
          version: null,
          filter: [{ property: "concept", op: "is-a", value: "422037009" }],
        },
      ],
      exclude: [],
    },
  });
  await expect(page.getByText("ValueSet updated successfully")).toBeVisible();
  await page.waitForURL("**/admin/valuesets");
  await page.getByRole("tab", { name: "Draft", exact: true }).click();
  await expect(
    page.getByRole("cell").getByText(updatedName, { exact: true }),
  ).toBeVisible();
  expect(mutations).toEqual([`PUT ${detailPath}`]);
});
