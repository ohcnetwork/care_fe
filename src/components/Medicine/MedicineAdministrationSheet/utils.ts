import { MedicationRequest } from "@/types/emr/medicationRequest";

export function computeActivityBounds(prescriptions: MedicationRequest[]) {
  // get start by finding earliest of all presciption's created_date
  const start = new Date(
    prescriptions.reduce(
      (earliest, curr) =>
        earliest < curr.authored_on ? earliest : curr.authored_on,
      prescriptions[0]?.authored_on ?? new Date(),
    ),
  );

  /**
   * TODO: get end by finding latest of all prescription's last administration time: Get the last administration time of each prescription from the backend and wire the below logic
    prescriptions
      .filter((prescription) => prescription.last_administration?.created_date)
      .reduce(
        (latest, curr) =>
          curr.last_administration?.created_date &&
          curr.last_administration?.created_date > latest
            ? curr.last_administration?.created_date
            : latest,
        prescriptions[0]?.created_date ?? new Date(),
      ),
   */
  const end = new Date();

  // floor start to 00:00 of the day
  start.setHours(0, 0, 0, 0);

  // ceil end to 00:00 of the next day
  end.setDate(end.getDate() + 1);
  end.setHours(0, 0, 0, 0);

  return { start, end };
}

export function isMedicationDiscontinued(medicationRequest: MedicationRequest) {
  return ["completed", "ended", "stopped", "cancelled"].includes(
    medicationRequest.status!,
  );
}
