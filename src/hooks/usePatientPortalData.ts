import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useMemo } from "react";

import { usePatientContext } from "@/hooks/usePatientUser";

import query from "@/Utils/request/query";
import {
  ApiRoute,
  PaginatedResponse,
  QueryParams,
} from "@/Utils/request/types";
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
 * Status filtering is server-side too, so a list only ever holds the rows the
 * screen is showing; the statuses are part of the query key so switching a
 * filter refetches instead of slicing a cached superset.
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

const PORTAL_PAGE_SIZE = 20;

/**
 * Shared paging for the OTP list endpoints, which are ordered newest-first
 * server-side — so pages append in display order and the accumulated list is
 * never re-sorted, which would reorder rows mid-scroll.
 */
function usePortalInfiniteList<TItem>({
  queryKey,
  route,
  queryParams,
  enabled,
}: {
  queryKey: unknown[];
  route: ApiRoute<PaginatedResponse<TItem>>;
  queryParams: QueryParams;
  enabled: boolean;
}) {
  const { headers } = useAuthHeaders();

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey,
      // Silent: deployments whose backend predates the portal endpoints would
      // otherwise toast "Not Found" on every screen that shows a record
      // summary. The empty state covers it.
      queryFn: ({ pageParam, signal }) =>
        query(route, {
          headers,
          queryParams: {
            ...queryParams,
            limit: PORTAL_PAGE_SIZE,
            offset: pageParam,
          },
          silent: true,
        })({ signal }),
      initialPageParam: 0,
      getNextPageParam: (lastPage, allPages) => {
        const offset = allPages.length * PORTAL_PAGE_SIZE;
        return offset < lastPage.count ? offset : null;
      },
      enabled,
    });

  return useMemo(
    () => ({
      isLoading,
      count: data?.pages[0]?.count ?? 0,
      items: data?.pages.flatMap((page) => page.results) ?? [],
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
    }),
    [data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage],
  );
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

export function usePatientPrescriptions({
  status,
  enabled = true,
}: {
  status?: PrescriptionStatus[];
  enabled?: boolean;
} = {}) {
  const { selectedPatient } = usePatientContext();
  const { token, phoneNumber } = useAuthHeaders();
  // The backend's multi-select filters read a comma separated list, not
  // repeated query params.
  const statusParam = status?.join(",");

  const { items, ...pagination } = usePortalInfiniteList({
    queryKey: [
      "portal-prescriptions",
      phoneNumber,
      selectedPatient?.id,
      statusParam,
    ],
    route: patientPortalApi.listPrescriptions,
    queryParams: { patient: selectedPatient?.id, status: statusParam },
    enabled: enabled && !!token && !!selectedPatient?.id,
  });

  return { ...pagination, prescriptions: items };
}

/** A report is readable by the patient once the lab has finalised it. */
const READY_REPORT_STATUSES = [
  DiagnosticReportStatus.final,
  DiagnosticReportStatus.modified,
];

export const PROCESSING_REPORT_STATUSES = [
  DiagnosticReportStatus.registered,
  DiagnosticReportStatus.partial,
  DiagnosticReportStatus.preliminary,
];

export const ACTIVE_PRESCRIPTION_STATUSES = [PrescriptionStatus.active];

export const PAST_PRESCRIPTION_STATUSES = [
  PrescriptionStatus.completed,
  PrescriptionStatus.cancelled,
];

export function usePatientDiagnosticReports({
  status,
  enabled = true,
}: {
  status?: DiagnosticReportStatus[];
  enabled?: boolean;
} = {}) {
  const { selectedPatient } = usePatientContext();
  const { token, phoneNumber } = useAuthHeaders();
  const statusParam = status?.join(",");

  const { items, ...pagination } = usePortalInfiniteList({
    queryKey: [
      "portal-diagnostic-reports",
      phoneNumber,
      selectedPatient?.id,
      statusParam,
    ],
    route: patientPortalApi.listDiagnosticReports,
    queryParams: { patient: selectedPatient?.id, status: statusParam },
    enabled: enabled && !!token && !!selectedPatient?.id,
  });

  return { ...pagination, reports: items };
}

/**
 * The prescriptions and reports produced by one visit.
 *
 * Both OTP list endpoints accept an `encounter` filter, and the appointment
 * payload carries `associated_encounter` once the patient has been seen — so a
 * visit's records are fetched server-side rather than guessed at by matching
 * dates, which grouped every record created on a day onto every visit that day.
 *
 * The encounter arrives with the appointment, so the queries stay idle until it
 * is known; an upcoming visit has no encounter and nothing to show.
 */
export function usePatientEncounterRecords(encounter?: string) {
  const { token, phoneNumber } = useAuthHeaders();
  const enabled = !!token && !!encounter;

  const {
    items: prescriptions,
    isLoading: isLoadingPrescriptions,
    ...prescriptionPages
  } = usePortalInfiniteList({
    queryKey: ["portal-encounter-prescriptions", phoneNumber, encounter],
    route: patientPortalApi.listPrescriptions,
    queryParams: { encounter },
    enabled,
  });

  const {
    items: reports,
    isLoading: isLoadingReports,
    ...reportPages
  } = usePortalInfiniteList({
    queryKey: ["portal-encounter-diagnostic-reports", phoneNumber, encounter],
    route: patientPortalApi.listDiagnosticReports,
    queryParams: { encounter, status: READY_REPORT_STATUSES.join(",") },
    enabled,
  });

  return {
    isLoading: enabled && (isLoadingPrescriptions || isLoadingReports),
    prescriptions,
    reports,
    prescriptionPages,
    reportPages,
  };
}

export { READY_REPORT_STATUSES };
