import { compareAsc } from "date-fns";

import { SlotAvailability } from "@/components/Schedule/types";

export const groupSlotsByAvailability = (slots: SlotAvailability[]) => {
  const result: {
    availability: SlotAvailability["availability"];
    slots: Omit<SlotAvailability, "availability">[];
  }[] = [];

  for (const slot of slots) {
    const availability = slot.availability;
    const existing = result.find(
      (r) => r.availability.name === availability.name,
    );
    if (existing) {
      existing.slots.push(slot);
    } else {
      result.push({ availability, slots: [slot] });
    }
  }

  // sort slots by start time
  result.forEach(({ slots }) =>
    slots.sort((a, b) => compareAsc(a.start_datetime, b.start_datetime)),
  );

  // sort availability by first slot start time
  result.sort((a, b) =>
    compareAsc(a.slots[0].start_datetime, b.slots[0].start_datetime),
  );

  return result;
};
