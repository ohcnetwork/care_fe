import { expect, test } from "@playwright/test";
import { faker } from "@faker-js/faker";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Product Form Redirects", () => {
    const newLotNumber = `LOT-${faker.string.alphanumeric(10)}`;
    let facilityId: string;
    const productId: string = "dummy-existing-product-id"; 

    test.beforeEach(async ({ page }) => {
        facilityId = getFacilityId();
        const targetUrl = `/facility/${facilityId}/settings/products`;
        await page.goto(targetUrl);
        
        await expect(
            page.getByRole("heading", { name: /products/i }),
        ).toBeVisible();
    });

    test("should redirect to product details page after successful edit and enable correct back navigation", async ({
        page,
    }) => {
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

            await page.goBack(); 

            const expectedListUrlRegex = new RegExp(
                `/facility/${facilityId}/settings/products$`,
            );
            await expect(page).toHaveURL(expectedListUrlRegex);
            
            await expect(page.getByRole("button", { name: "Add Product" })).toBeVisible();
        });
    });
});
