import { expect, type Page, test } from "@playwright/test";
import { atPath, expectHistoryIndex } from "tests/helper/history";

test.use({ storageState: "tests/.auth/user.json" });

interface AdminFormCase {
  name: string;
  listPath: string;
  formPath: string;
  openForm: (page: Page) => Promise<void>;
  /** The form's back link. It stays a link so it can open in a new tab. */
  backLink: string;
}

const CASES: AdminFormCase[] = [
  {
    name: "workspace",
    listPath: "/admin/workspaces",
    formPath: "/admin/workspaces/create",
    openForm: (page) =>
      page.getByRole("link", { name: "Create workspace", exact: true }).click(),
    backLink: "Back",
  },
  {
    name: "action configuration",
    listPath: "/admin/actions",
    formPath: "/admin/actions/new",
    openForm: (page) =>
      page
        .getByRole("button", { name: "New action configuration", exact: true })
        .click(),
    backLink: "Back",
  },
  {
    name: "immunization policy",
    listPath: "/admin/immunization-policies",
    formPath: "/admin/immunization-policies/new",
    openForm: (page) =>
      page.getByRole("link", { name: "New policy", exact: true }).click(),
    backLink: "Immunization policies",
  },
];

test.describe("Back from admin forms", () => {
  for (const { name, listPath, formPath, openForm, backLink } of CASES) {
    test(`back on a new ${name} returns to the list it was opened from`, async ({
      page,
    }) => {
      await page.goto(listPath);
      await openForm(page);
      await expect(page).toHaveURL(formPath);
      await expectHistoryIndex(page, 1);

      const back = page
        .getByRole("main")
        .getByRole("link", { name: backLink, exact: true });
      await expect(back).toHaveAttribute("href", listPath);
      await back.click();
      await expect(page).toHaveURL(atPath(listPath));
      await expectHistoryIndex(page, 0);

      // A real back keeps the form as the forward entry.
      await page.goForward();
      await expect(page).toHaveURL(formPath);
    });
  }
});
