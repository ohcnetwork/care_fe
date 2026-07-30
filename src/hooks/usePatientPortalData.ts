import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useMemo } from "react";

import { usePatientContext } from "@/hooks/usePatientUser";

import query from "@/Utils/request/query";
import { DiagnosticReportStatus } from "@/types/emr/diagnosticReport/diagnosticReport";
import patientPortalApi from "@/types/emr/patientPortal/patientPortalApi";
import { PrescriptionStatus } from "@/types/emr/prescription/prescription";
import PublicAppointmentApi from "@/types/scheduling/PublicAppointmentApi";
import {
  AppointmentFinalStatuses,
  PublicAppointment,
} from "@/types/scheduling/schedule";

/**
 * The OTP portal endpoints return records for every patient linked to the
 * signed-in number, so every list must be narrowed to the active profile.
 *
 * Prescriptions and diagnostic reports are scoped server-side via the `patient`
 * query param — their list payloads carry no patient reference, so filtering
 * client-side is not possible. Appointments carry a `patient` and are filtered
 * locally.
 *
 * The selected patient id is part of every query key: without it React Query
 * serves one patient's cached records to another after a switch.
 */
function useAuthHeaders() {
  const { tokenData } = usePatientContext();
  return {
    token: tokenData?.token,
    phoneNumber: tokenData?.phoneNumber,
    headers: { Authorization: `Bearer ${tokenData?.token}` },
  };
}

export function usePatientAppointments() {
  const { selectedPatient } = usePatientContext();
  const { token, phoneNumber, headers } = useAuthHeaders();

  const { data, isLoading } = useQuery({
    queryKey: ["appointment", phoneNumber, selectedPatient?.id],
    queryFn: query(PublicAppointmentApi.getAppointments, { headers }),
    enabled: !!token,
  });

  return useMemo(() => {
    const appointments = (data?.results ?? [])
      .filter((appointment) => appointment.patient.id === selectedPatient?.id)
      .sort(
        (a, b) =>
          new Date(a.token_slot.start_datetime).getTime() -
          new Date(b.token_slot.start_datetime).getTime(),
      );

    const isUpcoming = (appointment: PublicAppointment) =>
      dayjs(appointment.token_slot.start_datetime).isAfter(dayjs()) &&
      !AppointmentFinalStatuses.includes(appointment.status);

    const upcoming = appointments.filter(isUpcoming);

    return {
      isLoading,
      appointments,
      upcoming,
      // Most recent first — history reads backwards from today.
      history: appointments.filter((a) => !isUpcoming(a)).reverse(),
      nextAppointment: upcoming[0],
    };
  }, [data, isLoading, selectedPatient?.id]);
}

export function usePatientPrescriptions() {
  const { selectedPatient } = usePatientContext();
  const { token, phoneNumber, headers } = useAuthHeaders();

  const { data, isLoading } = useQuery({
    queryKey: ["portal-prescriptions", phoneNumber, selectedPatient?.id],
    // Silent: deployments whose backend predates the portal prescription
    // endpoint would otherwise toast "Not Found" on every screen that shows a
    // prescription summary. The empty state covers it.
    queryFn: query(patientPortalApi.listPrescriptions, {
      headers,
      queryParams: { patient: selectedPatient?.id },
      silent: true,
    }),
    enabled: !!token && !!selectedPatient?.id,
  });

  return useMemo(() => {
    const prescriptions = (data?.results ?? [])
      .slice()
      .sort(
        (a, b) =>
          new Date(b.created_date).getTime() -
          new Date(a.created_date).getTime(),
      );

    return {
      isLoading,
      prescriptions,
      active: prescriptions.filter(
        (p) => p.status === PrescriptionStatus.active,
      ),
      past: prescriptions.filter((p) => p.status !== PrescriptionStatus.active),
    };
  }, [data, isLoading, selectedPatient?.id]);
}

/** A report is readable by the patient once the lab has finalised it. */
const READY_REPORT_STATUSES = [
  DiagnosticReportStatus.final,
  DiagnosticReportStatus.modified,
];

export function usePatientDiagnosticReports() {
  const { selectedPatient } = usePatientContext();
  const { token, phoneNumber, headers } = useAuthHeaders();

  const { data, isLoading } = useQuery({
    queryKey: ["portal-diagnostic-reports", phoneNumber, selectedPatient?.id],
    // Silent for the same reason as prescriptions — see above.
    queryFn: query(patientPortalApi.listDiagnosticReports, {
      headers,
      queryParams: { patient: selectedPatient?.id },
      silent: true,
    }),
    enabled: !!token && !!selectedPatient?.id,
  });

  return useMemo(() => {
    const reports = (data?.results ?? [])
      .slice()
      .sort(
        (a, b) =>
          new Date(b.created_date).getTime() -
          new Date(a.created_date).getTime(),
      );

    return {
      isLoading,
      reports,
      ready: reports.filter((r) => READY_REPORT_STATUSES.includes(r.status)),
      processing: reports.filter(
        (r) => !READY_REPORT_STATUSES.includes(r.status),
      ),
    };
  }, [data, isLoading, selectedPatient?.id]);
}

export { READY_REPORT_STATUSES };
