import type { Locator, Page } from "@playwright/test";

interface SelectFromCommandOptions {
  search?: string;
  option?: number | "first" | "last";
  placeholder?: RegExp | string;
}

export async function selectFromCommand(
  page: Page,
  trigger: Locator,
  { search, option = "first", placeholder }: SelectFromCommandOptions = {},
) {
  await trigger.click();

  // Prefer semantic roles/placeholders first (Dialog/Drawer or Popover)
  const root = page.getByRole("dialog").first();
  const hasDialog = await root.isVisible().catch(() => false);
  const scope = hasDialog ? root : page;

  const input =
    placeholder !== undefined
      ? scope.getByPlaceholder(placeholder)
      : scope.locator('[data-slot="command-input"]').first();

  if (await input.isVisible().catch(() => false)) {
    if (search !== undefined) {
      await input.fill("");
      await input.fill(String(search));
    }
  }

  const list = scope.locator('[data-slot="command-list"]').first();

  await list.waitFor({ state: "visible" });

  const items = hasDialog ? root.getByRole("option") : page.getByRole("option");

  const count = await items.count();
  if (!count) throw new Error("No options found in command list");

  const index =
    option === "first" ? 0 : option === "last" ? count - 1 : Number(option);

  if (Number.isNaN(index) || index < 0 || index >= count) {
    throw new Error(
      `Option index ${String(option)} out of bounds (0..${count - 1})`,
    );
  }

  await items.nth(index).click();
}
