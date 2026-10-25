import { t } from "i18next";

import { callApi } from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { formatDateTime } from "@/Utils/utils";
import consentApi from "@/types/consent/consentApi";
import allergyIntoleranceApi from "@/types/emr/allergyIntolerance/allergyIntoleranceApi";
import diagnosisApi from "@/types/emr/diagnosis/diagnosisApi";
import diagnosticReportApi from "@/types/emr/diagnosticReport/diagnosticReportApi";
import encounterApi from "@/types/emr/encounter/encounterApi";
import immunizationApi from "@/types/emr/immunization/immunizationApi";
import observationApi from "@/types/emr/observation/observationApi";
import referralApi from "@/types/emr/referral/referralApi";
import {
  ReferralResourceCreate,
  ReferralResourceType,
} from "@/types/emr/referral/referralResource";
import serviceRequestApi from "@/types/emr/serviceRequest/serviceRequestApi";
import { FileType } from "@/types/files/file";
import fileApi from "@/types/files/fileApi";
import questionnaireResponseApi from "@/types/questionnaire/questionnaireResponseApi";
import scheduleApi from "@/types/scheduling/scheduleApi";

export interface ReferralResourceCandidate {
  id: string;
  title: string;
  detail?: string;
  metadata?: ReferralResourceCreate["metadata"];
}

export const REFERRAL_CANDIDATE_PAGE_SIZE = 15;
interface CandidateOptions {
  resourceType: ReferralResourceType | "encounter" | "consent";
  patientId: string;
  facilityId: string;
  offset: number;
  parentId?: string;
  fileType?: FileType;
  signal: AbortSignal;
}

function page<T>(
  data: PaginatedResponse<T>,
  convert: (item: T) => ReferralResourceCandidate,
) {
  return { count: data.count, results: data.results.map(convert) };
}

export async function loadReferralCandidates({
  resourceType,
  patientId,
  facilityId,
  offset,
  parentId,
  fileType,
  signal,
}: CandidateOptions) {
  const opts = {
    signal,
    silent: true,
    queryParams: { limit: REFERRAL_CANDIDATE_PAGE_SIZE, offset },
    pathParams: { patientId },
  };
  switch (resourceType) {
    case "encounter":
      return page(
        await callApi(encounterApi.list, {
          ...opts,
          queryParams: {
            ...opts.queryParams,
            patient: patientId,
            ordering: "-created_date",
          },
        }),
        (item) => ({
          id: item.id,
          title: item.facility.name,
          detail: formatDateTime(item.period.start),
        }),
      );
    case "consent":
      return page(await callApi(consentApi.list, opts), (item) => ({
        id: item.id,
        title: item.note || "",
        detail: formatDateTime(String(item.date)),
      }));
    case "condition":
      return page(await callApi(diagnosisApi.listDiagnosis, opts), (item) => ({
        id: item.id,
        title: item.code.display,
        detail: `${t(item.clinical_status)} · ${formatDateTime(item.created_date)}`,
      }));
    case "allergy_intolerance":
      return page(
        await callApi(allergyIntoleranceApi.getAllergy, opts),
        (item) => ({
          id: item.id,
          title: item.code.display,
          detail: t(item.clinical_status),
        }),
      );
    case "diagnostic_report":
      return page(
        await callApi(diagnosticReportApi.listDiagnosticReports, {
          ...opts,
          pathParams: { patient_external_id: patientId },
        }),
        (item) => ({
          id: item.id,
          title: item.code?.display || item.category?.display,
          detail: item.conclusion || t(item.status),
        }),
      );
    case "observation":
      return page(await callApi(observationApi.list, opts), (item) => ({
        id: item.id,
        title: item.main_code?.display || item.alternate_coding?.text || "",
        detail: [
          item.value?.coding?.display ?? item.value?.value,
          item.value?.unit?.display,
          formatDateTime(item.effective_datetime),
        ]
          .filter((value) => value != null && value !== "")
          .join(" · "),
      }));
    case "immunization":
      return page(await callApi(immunizationApi.list, opts), (item) => ({
        id: item.id,
        title: item.code.display,
        detail: item.occurrence
          ? formatDateTime(item.occurrence)
          : t(item.status),
      }));
    case "questionnaire_response":
      return page(
        await callApi(questionnaireResponseApi.list, opts),
        (item) => ({
          id: item.id,
          title: item.questionnaire?.title || "",
          detail: formatDateTime(item.created_date),
        }),
      );
    case "service_request":
      return page(
        await callApi(serviceRequestApi.listServiceRequest, {
          ...opts,
          pathParams: { facilityId },
          queryParams: { ...opts.queryParams, patient: patientId },
        }),
        (item) => ({
          id: item.id,
          title: item.title || item.code?.display,
          detail: [
            item.do_not_perform ? t("do not perform") : undefined,
            t(item.status),
            formatDateTime(item.created_date),
          ]
            .filter(Boolean)
            .join(" · "),
        }),
      );
    case "specimen": {
      const request = await callApi(serviceRequestApi.retrieveServiceRequest, {
        signal,
        silent: true,
        pathParams: { facilityId, serviceRequestId: parentId! },
      });
      const results = (request.specimens ?? []).map((item) => ({
        id: item.id,
        title: item.specimen_type?.display || item.accession_identifier,
        detail: [item.accession_identifier, t(item.status)]
          .filter(Boolean)
          .join(" · "),
      }));
      return { results, count: results.length };
    }
    case "file_upload": {
      const files = await callApi(fileApi.list, {
        ...opts,
        queryParams: {
          ...opts.queryParams,
          file_type: fileType,
          associating_id: parentId,
        },
      });
      return page(
        {
          ...files,
          results: files.results.filter(
            (item) => item.upload_completed && !item.is_archived,
          ),
        },
        (item) => ({
          id: item.id,
          title: item.name,
          detail: `${item.extension} · ${formatDateTime(item.created_date)}`,
        }),
      );
    }
    case "appointment":
      return page(
        await callApi(scheduleApi.appointments.getAppointments, {
          ...opts,
          queryParams: { ...opts.queryParams, facility: facilityId },
        }),
        (item) => ({
          id: item.id,
          title:
            item.token_slot.availability.schedule.name ||
            item.token_slot.availability.name,
          detail: `${formatDateTime(item.token_slot.start_datetime)} · ${t(item.status)}`,
          metadata: {
            facility_id: item.facility.id,
            facility_name: item.facility.name,
          },
        }),
      );
    case "referral":
      return page(
        await callApi(referralApi.list, {
          ...opts,
          queryParams: { ...opts.queryParams, patient: patientId },
        }),
        (item) => ({
          id: item.id,
          title: item.title,
          detail: `${item.availability_name} · ${t(`referral_status_${item.status}`)}`,
        }),
      );
  }
}
