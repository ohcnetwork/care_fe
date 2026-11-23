import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import PrintLoading from "@/CAREUI/misc/PrintLoading";
import TypstPrintPreview from "@/CAREUI/misc/TypstPrintPreview";

import { Switch } from "@/components/ui/switch";

import { useQueryParams } from "@/lib/router/queryParams";
import { appointmentListSearch } from "@/lib/router/search/appointments";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import type { DetailsTablePrintContent } from "@/print/detailsTable";
import { buildGeneratedFooter } from "@/print/patientDetails";
import { getPatientIdentifiers } from "@/types/emr/patient/patient";
import patientApi from "@/types/emr/patient/patientApi";
import { PrintTemplateType } from "@/types/facility/printTemplate";
import { PatientIdentifierUse } from "@/types/patient/patientIdentifierConfig/patientIdentifierConfig";
import {
  formatScheduleResourceName,
  SchedulableResourceType,
} from "@/types/scheduling/schedule";
import scheduleApis from "@/types/scheduling/scheduleApi";
import { renderTokenNumber } from "@/types/tokens/token/token";
import query from "@/Utils/request/query";
import {
  dateQueryString,
  formatDateTime,
  formatPatientAge,
} from "@/Utils/utils";

type PrintAppointmentsProps = {
  facilityId: string;
  resourceType: SchedulableResourceType;
  resourceId?: string;
};

export function PrintAppointments({
  facilityId,
  resourceType,
  resourceId,
}: PrintAppointmentsProps) {
  const { t } = useTranslation();
  const { facility } = useCurrentFacility();
  const [qParams] = useQueryParams(appointmentListSearch);

  const practitioners = qParams.practitioners
    ? qParams.practitioners.split(",")
    : [];
  const [sortByTokenNo, setSortByTokenNo] = useState(false);
  const { data: appointmentsData, isLoading } = useQuery({
    queryKey: [
      "print-appointments",
      facilityId,
      qParams.practitioners,
      qParams.slot,
      qParams.date_from,
      qParams.date_to,
      qParams.status,
      qParams.tags,
      qParams.patient,
      resourceType,
    ],
    queryFn: query.paginated(scheduleApis.appointments.list, {
      pathParams: { facilityId },
      queryParams: {
        status: qParams.status ?? "booked",
        slot: qParams.slot,
        user: qParams.practitioners ?? undefined,
        date_after: qParams.date_from,
        date_before: qParams.date_to ?? dateQueryString(new Date()),
        tags: qParams.tags,
        resource_type: resourceType,
        resource_ids: qParams.practitioners ?? resourceId,
        patient: qParams.patient,
      },
    }),
  });

  const { data: selectedPatient } = useQuery({
    queryKey: ["patient-details", qParams.patient],
    queryFn: query(patientApi.get, {
      pathParams: { id: qParams.patient! },
    }),
    enabled: !!qParams.patient,
  });

  if (isLoading) {
    return <PrintLoading />;
  }

  const appointments = sortByTokenNo
    ? [...(appointmentsData?.results ?? [])].sort((a, b) => {
        if (!a.token && !b.token) return 0;
        if (!a.token) return 1;
        if (!b.token) return -1;
        return a.token.number - b.token.number;
      })
    : (appointmentsData?.results ?? []);

  const showPractitioner = practitioners.length > 1;

  const content: DetailsTablePrintContent = {
    heading: t("appointments"),
    patient: null,
    patient_label: "",
    details: {
      left: [
        ...(qParams.date_from && qParams.date_to
          ? [
              {
                label: t("date_range"),
                value: `${format(new Date(qParams.date_from), "dd MMM yyyy")} - ${format(new Date(qParams.date_to), "dd MMM yyyy")}`,
              },
            ]
          : []),
        ...(qParams.patient
          ? [{ label: t("patient"), value: selectedPatient?.name ?? null }]
          : []),
        ...(practitioners.length === 1 && appointments[0]
          ? [
              {
                label: t("practitioner", { count: 1 }),
                value: formatScheduleResourceName(appointments[0]),
              },
            ]
          : []),
      ],
      right: [
        {
          label: t("generated_on"),
          value: format(new Date(), "dd MMM, yyyy h:mm a"),
        },
        {
          label: t("total_appointments"),
          value: String(appointmentsData?.count ?? 0),
        },
      ],
    },
    title: null,
    note: null,
    table_title: null,
    table: {
      header: [
        t("patient"),
        ...(showPractitioner ? [t("practitioner", { count: 1 })] : []),
        t("appointment_time"),
        t("token_no"),
        t("status"),
      ],
      rows: appointments.map((appointment) => [
        [
          appointment.patient.name,
          [
            `${formatPatientAge(appointment.patient, true)}, ${t(`GENDER__${appointment.patient.gender}`)}`,
            ...getPatientIdentifiers(appointment.patient, {
              use: PatientIdentifierUse.official,
            }).map(
              (identifier) =>
                `(${identifier.config.config.display}: ${identifier.value})`,
            ),
          ].join(" "),
        ].join("\n"),
        ...(showPractitioner ? [formatScheduleResourceName(appointment)] : []),
        [
          formatDateTime(
            appointment.token_slot.start_datetime,
            "ddd, DD MMM YYYY",
          ),
          formatDateTime(appointment.token_slot.start_datetime, "hh:mm a"),
        ].join("\n"),
        appointment.token ? renderTokenNumber(appointment.token) : "--",
        t(appointment.status),
      ]),
    },
    footer: buildGeneratedFooter(t),
  };

  return (
    <TypstPrintPreview
      template="details-table"
      title={t("appointments")}
      content={content}
      facility={facility}
      templateSlug={PrintTemplateType.appointments}
      toolbar={
        <div className="flex flex-wrap items-center justify-start gap-4 rounded-md border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-2">
            <Switch
              id="sort-by-token"
              checked={sortByTokenNo}
              onCheckedChange={setSortByTokenNo}
            />
            <label htmlFor="sort-by-token" className="cursor-pointer text-sm">
              {t("sort_by_token_no")}
            </label>
          </div>
        </div>
      }
    />
  );
}

export default PrintAppointments;
