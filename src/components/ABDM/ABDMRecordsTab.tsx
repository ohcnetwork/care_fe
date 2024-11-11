import dayjs from "dayjs";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import {
  ConsentArtefactModel,
  ConsentRequestModel,
} from "@/components/ABDM/types/consent";
import ButtonV2 from "@/components/Common/ButtonV2";
import Loading from "@/components/Common/Loading";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useQuery from "@/Utils/request/useQuery";
import { classNames, formatName } from "@/Utils/utils";

interface IConsentArtefactCardProps {
  artefact: ConsentArtefactModel;
}

function ConsentArtefactCard({ artefact }: IConsentArtefactCardProps) {
  const { t } = useTranslation();

  return (
    <Link
      href={`/abdm/health-information/${artefact.id}`}
      className="w-full cursor-pointer overflow-hidden bg-white shadow sm:rounded-lg"
    >
      <div className="flex flex-col items-center justify-between gap-4 px-4 py-5 sm:flex-row sm:gap-0 sm:px-6">
        <div className="flex flex-col items-center">
          <h5 className="font-semibold leading-6 text-secondary-900">
            {artefact.hip}
          </h5>
          <p className="mt-1 max-w-2xl text-sm text-secondary-500">
            {t("created_on")} {dayjs(artefact.created_date).fromNow()}
          </p>
        </div>
        <div className="flex flex-col items-center">
          <h6 className="mt-1 leading-6 text-secondary-700">
            {artefact.status}
          </h6>
          <h6 className="mt-1 leading-6 text-secondary-700">
            {dayjs(artefact.from_time).format("MMM DD YYYY")} -{" "}
            {dayjs(artefact.to_time).format("MMM DD YYYY")}
          </h6>
          <p className="mt-1 max-w-2xl text-sm text-secondary-500">
            {t("expires_on")} {dayjs(artefact.expiry).fromNow()}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center border-t border-secondary-200 px-4 py-5 sm:gap-4">
        {artefact.hi_types.map((hiType) => {
          return (
            <div
              key={hiType}
              className="flex items-center justify-center rounded-full bg-secondary-600 px-4 py-1.5 text-xs font-medium text-white"
            >
              {t(`consent__hi_type__${hiType}`)}
            </div>
          );
        })}
      </div>
    </Link>
  );
}

interface IConsentRequestCardProps {
  consent: ConsentRequestModel;
}

function ConsentRequestCard({ consent }: IConsentRequestCardProps) {
  const { t } = useTranslation();

  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
      <div className="flex flex-col items-center justify-between gap-4 px-4 py-5 sm:flex-row sm:gap-0 sm:px-6">
        <div className="flex flex-col items-center">
          <h5 className="font-semibold leading-6 text-secondary-900">
            {t(`consent__purpose__${consent.purpose}`)}
          </h5>
          <h6 className="mt-1 leading-6 text-secondary-700">
            {formatName(consent.requester)}
          </h6>
        </div>
        <div className="flex flex-col items-center">
          <h6 className="mt-1 leading-6 text-secondary-700">
            {dayjs(consent.from_time).format("MMM DD YYYY")} -{" "}
            {dayjs(consent.to_time).format("MMM DD YYYY")}
          </h6>
          <p className="mt-1 max-w-2xl text-sm text-secondary-500">
            {t("expires_on")} {dayjs(consent.expiry).fromNow()}
          </p>
        </div>
        <div className="flex flex-col items-center">
          <ButtonV2
            onClick={async () => {
              const { res, data } = await request(
                routes.abdm.consent.checkStatus,
                {
                  body: {
                    consent_request: consent.id,
                  },
                },
              );

              if (res?.status === 202) {
                Notification.Success({
                  msg: data?.detail ?? t("checking_consent_status"),
                });
                Notification.Warn({
                  msg: t("async_operation_warning"),
                });
              }
            }}
            ghost
            className="max-w-2xl text-sm text-secondary-700 hover:text-secondary-900"
          >
            <CareIcon icon="l-refresh" /> {t("check_status")}
          </ButtonV2>
          <p className="mt-1 max-w-2xl text-sm text-secondary-500">
            {t("created_on")} {dayjs(consent.created_date).fromNow()}
          </p>
          <p className="mt-1 max-w-2xl text-sm text-secondary-500">
            {t("modified_on")} {dayjs(consent.modified_date).fromNow()}
          </p>
        </div>
      </div>
      {consent.consent_artefacts?.length ? (
        <div className="flex flex-wrap items-center justify-center border-t border-secondary-200 bg-secondary-50 px-4 py-5 sm:gap-4">
          {consent.consent_artefacts?.map((artefact) => (
            <ConsentArtefactCard key={artefact.id} artefact={artefact} />
          ))}
        </div>
      ) : (
        <div className="border-t border-secondary-200 bg-secondary-50 px-4 py-5 sm:gap-4">
          <p className="text-center text-sm text-secondary-800">
            {consent.status === "REQUESTED"
              ? t("consent_request_waiting_approval")
              : t("consent_request_rejected")}
          </p>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-center border-t border-secondary-200 px-4 py-5 sm:gap-4">
        {consent.hi_types.map((hiType) => {
          return (
            <div
              key={hiType}
              className={classNames(
                "flex items-center justify-center rounded-full px-4 py-1.5 text-xs font-medium text-white",
                consent.consent_artefacts?.length
                  ? "bg-secondary-400"
                  : "bg-secondary-600",
              )}
            >
              {t(`consent__hi_type__${hiType}`)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface IProps {
  patientId: string;
}

export default function ABDMRecordsTab({ patientId }: IProps) {
  const { t } = useTranslation();

  const { data, loading } = useQuery(routes.abdm.consent.list, {
    query: {
      patient: patientId,
      ordering: "-created_date",
    },
  });

  if (loading) {
    <Loading />;
  }

  if (!data?.results.length) {
    return (
      <div className="mt-12 flex flex-col items-center justify-center gap-2.5">
        <p className="font-semibold text-secondary-600">
          {t("no_records_found")}
        </p>
        <p className="text-sm text-secondary-600">
          {t("raise_consent_request")}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      {data?.results.map((record) => {
        return <ConsentRequestCard key={record.id} consent={record} />;
      })}
    </div>
  );
}
