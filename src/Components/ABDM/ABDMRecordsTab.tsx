import { ConsentArtefactModel, ConsentRequestModel } from "./types/consent";
import dayjs from "dayjs";
import { ABDM_CONSENT_PURPOSE } from "../../Common/constants";
import CareIcon from "../../CAREUI/icons/CareIcon";
import ButtonV2 from "../Common/components/ButtonV2";
import * as Notification from "../../Utils/Notifications";
import Loading from "../Common/Loading";
import { classNames, formatName } from "../../Utils/utils";
import { Link } from "raviger";
import routes from "../../Redux/api";
import request from "../../Utils/request/request";
import useQuery from "../../Utils/request/useQuery";

interface IConsentArtefactCardProps {
  artefact: ConsentArtefactModel;
}

function ConsentArtefactCard({ artefact }: IConsentArtefactCardProps) {
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
            created {dayjs(artefact.created_date).fromNow()}
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
            expires in {dayjs(artefact.expiry).fromNow()}
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
              {hiType}
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
  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
      <div className="flex flex-col items-center justify-between gap-4 px-4 py-5 sm:flex-row sm:gap-0 sm:px-6">
        <div className="flex flex-col items-center">
          <h5 className="font-semibold leading-6 text-secondary-900">
            {
              ABDM_CONSENT_PURPOSE.find((p) => p.value === consent.purpose)
                ?.label
            }
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
            expires in {dayjs(consent.expiry).fromNow()}
          </p>
        </div>
        <div className="flex flex-col items-center">
          <ButtonV2
            onClick={async () => {
              const { res, error } = await request(
                routes.abha.checkConsentStatus,
                {
                  pathParams: { id: consent.id },
                },
              );

              if (res?.status === 200) {
                Notification.Success({
                  msg: "Checking Status!",
                });
              } else {
                Notification.Error({
                  msg: error?.message ?? "Error while checking status!",
                });
              }
            }}
            ghost
            className="max-w-2xl text-sm text-secondary-700 hover:text-secondary-900"
          >
            <CareIcon icon="l-refresh" /> check status
          </ButtonV2>
          <p className="mt-1 max-w-2xl text-sm text-secondary-500">
            created {dayjs(consent.created_date).fromNow()}
          </p>
          <p className="mt-1 max-w-2xl text-sm text-secondary-500">
            modified {dayjs(consent.modified_date).fromNow()}
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
              ? "Waiting for the Patient to approve the consent request"
              : "Patient has rejected the consent request"}
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
              {hiType}
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
  const { data, loading } = useQuery(routes.abha.listConsents, {
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
        <p className="font-semibold text-secondary-600">No Records found</p>
        <p className="text-sm text-secondary-600">
          Raise a consent request to fetch patient records over ABDM
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
