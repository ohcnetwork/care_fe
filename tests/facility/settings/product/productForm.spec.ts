import { expect, test } from "@playwright/test";
import { faker } from "@faker-js/faker";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Product Form Redirects", () => {
    const newLotNumber = `LOT-${faker.string.alphanumeric(10)}`;
    let facilityId: string;
    // NOTE: This ID MUST be a valid, existing product ID for the test to work fully.
    const productId: string = "dummy-existing-product-id"; 

    test.beforeEach(async ({ page }) => {
        facilityId = getFacilityId();
        
        // --- ROBUST NAVIGATION FIX: Reverting to UI clicks for stability ---
        await page.goto(`/facility/${facilityId}`);
        await page.getByRole("button", { name: "Toggle Sidebar" }).click();
        await page.getByRole("link", { name: /settings/i }).click();
        await page.getByRole("link", { name: /products/i }).click();
        
        // --- STABLE ASSERTION FIX: Check for the unique 'Add Product' button ---
        await expect(
            page.getByRole("button", { name: "Add Product" }),
        ).toBeVisible();
    });

    test("should redirect to product details page after successful edit and enable correct back navigation", async ({
        page,
    }) => {
        // Navigating directly to the EDIT page for the assumed existing product
        const editUrl = `/facility/${facilityId}/settings/product/${productId}/edit`;
        await page.goto(editUrl);
        
        await expect(page.getByRole("button", { name: "Update" })).toBeVisible();
        
        await test.step("Update an Editable Field (Lot Number) and Save", async () => {
            const lotNumberInput = page.getByLabel("Lot Number");
            await lotNumberInput.clear();
            await lotNumberInput.fill(newLotNumber);

            await page.getByRole("button", { name: "Update" }).click();
        });

        await test.step("Verify Redirect to Details Page and Back Button Functionality", async () => {
            await expect(
                page.getByText(/product updated successfully/i),
            ).toBeVisible();

            const expectedDetailsUrlRegex = new RegExp(
                `/facility/${facilityId}/settings/product/${productId}$`,
            );

            await expect(page).toHaveURL(expectedDetailsUrlRegex);
            await expect(page.getByText(newLotNumber)).toBeVisible();

            // CRITICAL CHECK for the original bug fix
            await page.goBack(); 

            const expectedListUrlRegex = new RegExp(
                `/facility/${facilityId}/settings/products$`,
            );
            await expect(page).toHaveURL(expectedListUrlRegex);
            
            await expect(page.getByRole("button", { name: "Add Product" })).toBeVisible();
        });
    });
});
