import { Prescription } from "@/components/Medicine/models";

export function computeActivityBounds(prescriptions: Prescription[]) {
  // get start by finding earliest of all presciption's created_date
  const start = new Date(
    prescriptions.reduce(
      (earliest, curr) =>
        earliest < curr.created_date ? earliest : curr.created_date,
      prescriptions[0]?.created_date ?? new Date(),
    ),
  );

  // get end by finding latest of all presciption's last administration time
  const end = new Date(
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
  );

  // floor start to 00:00 of the day
  start.setHours(0, 0, 0, 0);

  // ceil end to 00:00 of the next day
  end.setDate(end.getDate() + 1);
  end.setHours(0, 0, 0, 0);

  return { start, end };
}
