import { Page, expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

async function openCommandMenu(page: Page): Promise<void> {
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("option").first()).toBeVisible({ timeout: 5000 });
}

async function getSelectedOptionText(page: Page): Promise<string> {
  const selected = page.getByRole("option", { selected: true });
  await expect(selected).toBeVisible();
  return (await selected.innerText()).trim();
}

async function pressKeyAndGetSelected(
  page: Page,
  key: string,
): Promise<string> {
  await page.keyboard.press(key);
  return getSelectedOptionText(page);
}

test.describe("Keyboard navigation in search patients", () => {
  test.beforeEach(async ({ page }) => {
    const facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/patients`);
  });

  test("keyboard navigation: arrow keys highlight, enter commits selection", async ({
    page,
  }) => {
    await openCommandMenu(page);

    const highlightedText = await pressKeyAndGetSelected(page, "ArrowDown");

    await page.keyboard.press("Enter");

    await expect(page.getByRole("option")).toHaveCount(0);

    await openCommandMenu(page);
    const selectedOption = page.getByRole("option", { selected: true });
    await expect(selectedOption).toContainText(highlightedText);
  });

  test("keyboard navigation: ArrowUp moves highlight back and commits selection", async ({
    page,
  }) => {
    await openCommandMenu(page);

    await page.keyboard.press("ArrowDown");
    const highlightedText = await pressKeyAndGetSelected(page, "ArrowUp");

    await page.keyboard.press("Enter");
    await expect(page.getByRole("option")).toHaveCount(0);

    await openCommandMenu(page);
    const selectedOption = page.getByRole("option", { selected: true });
    await expect(selectedOption).toContainText(highlightedText);
  });

  test("keyboard navigation: Home jumps to first item", async ({ page }) => {
    await openCommandMenu(page);

    const options = page.getByRole("option");
    const firstOptionText = (await options.first().innerText()).trim();

    await page.keyboard.press("End");
    await page.keyboard.press("Home");

    const selectedText = await getSelectedOptionText(page);
    expect(selectedText).toBe(firstOptionText);
  });

  test("keyboard navigation: End jumps to last item", async ({ page }) => {
    await openCommandMenu(page);

    const options = page.getByRole("option");
    const lastOptionText = (await options.last().innerText()).trim();

    await page.keyboard.press("End");

    const selectedText = await getSelectedOptionText(page);
    expect(selectedText).toBe(lastOptionText);
  });

  test("keyboard navigation: selection does not move past list boundaries", async ({
    page,
  }) => {
    await openCommandMenu(page);

    const options = page.getByRole("option");
    const firstOptionText = (await options.first().innerText()).trim();
    const lastOptionText = (await options.last().innerText()).trim();

    const afterUpAtTop = await pressKeyAndGetSelected(page, "ArrowUp");
    expect(afterUpAtTop).toBe(firstOptionText);

    await page.keyboard.press("End");
    const afterEnd = await getSelectedOptionText(page);
    expect(afterEnd).toBe(lastOptionText);

    const afterDownAtBottom = await pressKeyAndGetSelected(page, "ArrowDown");
    expect(afterDownAtBottom).toBe(lastOptionText);
  });

  test("keyboard navigation: multiple key presses end with last item selected after End", async ({
    page,
  }) => {
    await openCommandMenu(page);

    const options = page.getByRole("option");
    const lastOptionText = (await options.last().innerText()).trim();

    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("Home");
    await page.keyboard.press("End");

    const selectedText = await getSelectedOptionText(page);
    expect(selectedText).toBe(lastOptionText);
  });
});
