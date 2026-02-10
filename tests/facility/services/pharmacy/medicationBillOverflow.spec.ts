import { expect, test } from "@playwright/test";
test.describe("Medication bill name overflow regression", () => {
  test("applies wrapping styles for medication name and substituted strike-through text", async ({
    page,
  }) => {
    test.setTimeout(120000);

    await test.step("Login", async () => {
      await page.goto("/login");
      await page.getByRole("textbox", { name: /username/i }).fill("admin");
      await page.getByLabel(/password/i).fill("admin");
      await page.getByRole("button", { name: /login/i }).click();
      await expect(page.getByRole("heading", { name: /^Hey .+/ })).toBeVisible({
        timeout: 20000,
      });
    });

    let facilityId = "";
    await test.step("Resolve facility id", async () => {
      await page.goto("/");
      await page.getByRole("link", { name: "Facility with Patient" }).click();
      await page.waitForURL(/\/facility\/[^/]+\/overview/);
      facilityId = page.url().match(/\/facility\/([^/]+)\/overview/)?.[1] ?? "";
      expect(facilityId).not.toBe("");
    });

    let locationId = "";
    await test.step("Open pharmacy prescription queue", async () => {
      await page.goto(`/facility/${facilityId}/services/`);
      await page.getByRole("link", { name: "Main Pharmacy" }).click();
      await page.getByRole("link", { name: "Pharmacy" }).click();
      await page.waitForURL(
        new RegExp(
          `/facility/${facilityId}/locations/[^/]+/medication_requests`,
        ),
      );

      locationId =
        page
          .url()
          .match(
            new RegExp(
              `/facility/${facilityId}/locations/([^/]+)/medication_requests`,
            ),
          )?.[1] ?? "";
      expect(locationId).not.toBe("");
    });

    await test.step("Open bill form and validate wrapping classes", async () => {
      await Promise.all([
        page.waitForURL(
          /\/medication_requests\/patient\/[^/]+\/prescription\/[^/]+\/bill/,
        ),
        page.getByRole("button", { name: "Bill" }).first().click(),
      ]);

      await page.waitForResponse(
        (response) =>
          response.status() === 200 &&
          response.url().includes("/medication/prescription/"),
      );

      await expect(page.getByText("Bill Medications")).toBeVisible({
        timeout: 20000,
      });
      await page.waitForFunction(() => {
        const rows = Array.from(document.querySelectorAll("table tbody tr"));
        return rows.some((row) => {
          const cells = row.querySelectorAll("td");
          return (
            cells.length >= 5 && (cells[1]?.textContent?.trim().length ?? 0) > 0
          );
        });
      });

      const bodyRows = page.locator("table tbody tr");
      const rowCount = await bodyRows.count();
      let medicationRowIndex = -1;
      for (let i = 0; i < rowCount; i++) {
        const cellCount = await bodyRows
          .nth(i)
          .evaluate((row) => row.querySelectorAll("td").length);
        if (cellCount >= 5) {
          medicationRowIndex = i;
          break;
        }
      }

      expect(medicationRowIndex).toBeGreaterThanOrEqual(0);
      const medicationRow = bodyRows.nth(medicationRowIndex);

      const medicationCell = medicationRow.locator("td").nth(1);
      const wrappingElements = await medicationCell.evaluate((cell) => {
        const elements = Array.from(
          cell.querySelectorAll("*"),
        ) as HTMLElement[];

        return elements
          .map((el) => {
            const style = getComputedStyle(el);
            const text = (el.textContent || "").trim();
            return {
              text,
              overflowWrap: style.overflowWrap,
              textDecorationLine: style.textDecorationLine,
            };
          })
          .filter(
            (item) =>
              item.text.length > 0 &&
              item.overflowWrap !== "normal" &&
              !item.text.includes("No product linked") &&
              !item.text.includes("Substitution Details"),
          );
      });

      expect(wrappingElements.length).toBeGreaterThan(0);

      const strikeThroughWrapped = await medicationCell.evaluate((cell) => {
        const elements = Array.from(
          cell.querySelectorAll("*"),
        ) as HTMLElement[];
        return elements.some((el) => {
          const text = (el.textContent || "").trim();
          if (!text) return false;
          const style = getComputedStyle(el);
          return (
            style.textDecorationLine.includes("line-through") &&
            style.overflowWrap !== "normal"
          );
        });
      });

      expect(strikeThroughWrapped).toBeTruthy();
    });
  });
});
