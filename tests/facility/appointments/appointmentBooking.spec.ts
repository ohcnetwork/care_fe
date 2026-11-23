import { faker } from "@faker-js/faker";
import { addDays } from "date-fns";

import {
  bookAppointmentViaUi,
  createBookableServiceViaApi,
} from "tests/helper/appointment";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { expect, test } from "tests/support/test";

test.use({ storageState: "tests/.auth/user.json" });

test(
  "books an appointment with a healthcare service from the patient page",
  { tag: ["@atomic", "@cap:appointment.book"] },
  async ({ page, request, facilityId, isolatedPatient }) => {
    const { patientId } = isolatedPatient;
    const reason = `Follow-up visit ${faker.string.alphanumeric(8)}`;
    const service = await createBookableServiceViaApi({ request, facilityId });

    // The browser and backend can be on different calendar dates, so book a
    // day well inside the schedule rather than today.
    const { appointmentId } = await bookAppointmentViaUi(page, {
      facilityId,
      patientId,
      resourceType: "Healthcare Service",
      resourceName: service.serviceName,
      date: addDays(service.validFrom, 2),
      reason,
    });

    await expect(page.getByText(reason, { exact: true })).toBeVisible();
    const headers = getApiHeaders();
    const appointment = await request.get(
      `${getApiUrl()}/api/v1/facility/${facilityId}/appointments/${appointmentId}/`,
      { headers },
    );
    expect(appointment.ok(), await appointment.text()).toBe(true);
    expect(await appointment.json()).toMatchObject({
      patient: { id: patientId },
      note: reason,
      status: "booked",
    });
    const bookings = await request.get(
      `${getApiUrl()}/api/v1/facility/${facilityId}/appointments/`,
      {
        headers,
        params: {
          resource_type: "healthcare_service",
          resource_ids: service.healthcareServiceId,
          patient: patientId,
        },
      },
    );
    expect(bookings.ok(), await bookings.text()).toBe(true);
    expect(await bookings.json()).toMatchObject({
      count: 1,
      results: [{ id: appointmentId }],
    });
  },
);
