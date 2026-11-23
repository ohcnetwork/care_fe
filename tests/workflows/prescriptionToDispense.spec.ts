import { prescribeMedicationViaUi } from "tests/helper/encounterCare";
import { dispenseMedicationViaUi } from "tests/helper/inventory";
import { findLocationViaApi } from "tests/helper/locations";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { expect, test } from "tests/support/test";

import type { InvoiceRead } from "../../src/types/billing/invoice/invoice";
import type { DispenseOrderRead } from "../../src/types/emr/dispenseOrder/dispenseOrder";
import type { MedicationDispenseRead } from "../../src/types/emr/medicationDispense/medicationDispense";
import type { MedicationRequestRead } from "../../src/types/emr/medicationRequest/medicationRequest";

test.use({ storageState: "tests/.auth/user.json" });

/** A medicine the fixture facility's Pharmacy location stocks. */
const STOCKED_MEDICINE = "Paracetamol";

test(
  "a prescribed medicine is dispensed and billed at the pharmacy",
  { tag: ["@workflow", "@cap:workflow.prescription-to-dispense"] },
  async ({ page, facilityId, isolatedEncounter }) => {
    test.slow();
    const { patientId, encounterId } = isolatedEncounter;
    const pharmacy = await findLocationViaApi({ facilityId, name: "Pharmacy" });

    const { notes } = await prescribeMedicationViaUi(page, {
      facilityId,
      patientId,
      encounterId,
      medicineName: STOCKED_MEDICINE,
    });

    await test.step("The prescription is saved on the encounter", async () => {
      const response = await page.request.get(
        `${getApiUrl()}/api/v1/patient/${patientId}/medication/request/?encounter=${encounterId}`,
        { headers: getApiHeaders() },
      );
      await expect(response).toBeOK();
      const { results } = (await response.json()) as {
        results: MedicationRequestRead[];
      };
      const prescribed = results.find((request) => request.note === notes);
      expect(prescribed, "the prescription just written").toBeDefined();
      // The step picks the first coded medication matching the name, in any case.
      expect(prescribed!.medication?.display).toMatch(
        new RegExp(STOCKED_MEDICINE, "i"),
      );
    });

    // Billing issues the dispense's invoice right after creating it; wait for
    // that update the way the atomic Bill Selected test does.
    const issued = page.waitForResponse(
      (response) =>
        response.request().method() === "PUT" &&
        response.url().includes(`/facility/${facilityId}/invoice/`) &&
        response.request().postDataJSON().status === "issued",
    );
    const { dispenseOrderId } = await dispenseMedicationViaUi(page, {
      facilityId,
      locationId: pharmacy.id,
      patientId,
      encounterId,
      medicationName: STOCKED_MEDICINE,
    });
    const issuedResponse = await issued;
    expect(issuedResponse.ok(), await issuedResponse.text()).toBe(true);
    const { id: invoiceId } = (await issuedResponse.json()) as { id: string };

    await test.step("The dispense order page lists the dispensed medicine", async () => {
      await expect(page).toHaveURL(
        (url) =>
          url.pathname ===
          `/facility/${facilityId}/locations/${pharmacy.id}/medication_dispense/order/${dispenseOrderId}`,
      );
      await expect(
        page.getByText(STOCKED_MEDICINE, { exact: true }).first(),
      ).toBeVisible();
    });

    await test.step("The dispense order and its issued invoice are saved", async () => {
      const headers = getApiHeaders();

      const orderResponse = await page.request.get(
        `${getApiUrl()}/api/v1/facility/${facilityId}/order/dispense/${dispenseOrderId}/`,
        { headers },
      );
      await expect(orderResponse).toBeOK();
      const order: DispenseOrderRead = await orderResponse.json();
      expect(order.patient.id).toBe(patientId);
      expect(order.location.id).toBe(pharmacy.id);

      const dispenseResponse = await page.request.get(
        `${getApiUrl()}/api/v1/medication/dispense/?encounter=${encounterId}`,
        { headers },
      );
      await expect(dispenseResponse).toBeOK();
      const { results: dispenses } = (await dispenseResponse.json()) as {
        results: MedicationDispenseRead[];
      };
      const dispense = dispenses.find(
        (candidate) => candidate.order?.id === dispenseOrderId,
      );
      expect(dispense, "a dispense in the new order").toBeDefined();
      expect(dispense!.item.product.product_knowledge.name).toBe(
        STOCKED_MEDICINE,
      );
      expect(dispense!.charge_item?.id).toBeTruthy();

      const invoiceResponse = await page.request.get(
        `${getApiUrl()}/api/v1/facility/${facilityId}/invoice/${invoiceId}/`,
        { headers },
      );
      await expect(invoiceResponse).toBeOK();
      const invoice: InvoiceRead = await invoiceResponse.json();
      expect(invoice.status).toBe("issued");
      expect(invoice.charge_items.map((item) => item.id)).toContain(
        dispense!.charge_item!.id,
      );
    });
  },
);
