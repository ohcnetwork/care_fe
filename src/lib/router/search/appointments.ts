import { z } from "zod";

import {
  paginationSearch,
  searchAppPath,
  searchBoolean,
  searchDate,
  searchString,
} from "@/lib/router/search/fields";

/**
 * The appointment list (`AppointmentsPage`) and its print page
 * (`PrintAppointments`), of a practitioner, a location or a healthcare
 * service. The list opens the print page with its own query string.
 */
export const appointmentListSearch = z.object({
  ...paginationSearch,
  /** Comma-separated user ids. */
  practitioners: searchString(),
  slot: searchString(),
  date_from: searchDate(),
  date_to: searchDate(),
  /** An `AppointmentStatus`, or comma-separated statuses of a group. */
  status: searchString(),
  /** Comma-separated tag ids. */
  tags: searchString(),
  tags_behavior: searchString(),
  patient: searchString(),
  patient_name: searchString(),
  autoRefresh: searchBoolean(),
});

/**
 * The appointment page (`AppointmentDetail`), under a patient, a location or
 * a healthcare service.
 */
export const appointmentShowSearch = z.object({
  /** Set by the book appointment sheet after it books the appointment. */
  showSuccess: searchBoolean(),
  /** Set when a queue token opens the appointment. Opens the encounter form. */
  from_queue: searchBoolean(),
  /**
   * The referral that the appointment is booked for, and the page that
   * opened it. `useAppointmentReferral` reads them.
   */
  referralId: searchString(),
  referralSourceUrl: searchAppPath(),
});

/** The book appointment sheet, on the patient pages and in a referral. */
export const bookAppointmentSheetSearch = z.object({
  /** Opens the sheet. Set by patient registration and referrals. */
  open_schedule: searchBoolean(),
});

/**
 * The patient select and patient registration pages of a public booking.
 * The schedule page sets the slot and the reason.
 */
export const publicAppointmentPatientSearch = z.object({
  slotId: searchString(),
  reason: searchString(),
});
