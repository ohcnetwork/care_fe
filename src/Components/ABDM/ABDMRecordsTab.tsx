import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { consentActions } from "../../Redux/actions";
import { ConsentArtefactModel, ConsentRequestModel } from "./types/consent";
import dayjs from "dayjs";
import { ABDM_CONSENT_PURPOSE } from "../../Common/constants";
import CareIcon from "../../CAREUI/icons/CareIcon";
import ButtonV2 from "../Common/components/ButtonV2";
import * as Notification from "../../Utils/Notifications.js";
import Loading from "../Common/Loading";
import { classNames } from "../../Utils/utils";
import { Link } from "raviger";

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
          <h5 className="font-semibold leading-6 text-gray-900">
            {artefact.hip}
          </h5>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            created {dayjs(artefact.created_date).fromNow()}
          </p>
        </div>
        <div className="flex flex-col items-center">
          <h6 className="mt-1 leading-6 text-gray-700">{artefact.status}</h6>
          <h6 className="mt-1 leading-6 text-gray-700">
            {dayjs(artefact.from_time).format("MMM DD YYYY")} -{" "}
            {dayjs(artefact.to_time).format("MMM DD YYYY")}
          </h6>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            expires in {dayjs(artefact.expiry).fromNow()}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center border-t border-gray-200 px-4 py-5 sm:gap-4">
        {artefact.hi_types.map((hiType) => {
          return (
            <div
              key={hiType}
              className="flex items-center justify-center rounded-full bg-gray-600 px-4 py-1.5 text-xs font-medium text-white"
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
  const dispatch = useDispatch<any>();

  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
      <div className="flex flex-col items-center justify-between gap-4 px-4 py-5 sm:flex-row sm:gap-0 sm:px-6">
        <div className="flex flex-col items-center">
          <h5 className="font-semibold leading-6 text-gray-900">
            {
              ABDM_CONSENT_PURPOSE.find((p) => p.value === consent.purpose)
                ?.label
            }
          </h5>
          <h6 className="mt-1 leading-6 text-gray-700">
            {consent.requester.first_name} {consent.requester.last_name}
          </h6>
        </div>
        <div className="flex flex-col items-center">
          <h6 className="mt-1 leading-6 text-gray-700">
            {dayjs(consent.from_time).format("MMM DD YYYY")} -{" "}
            {dayjs(consent.to_time).format("MMM DD YYYY")}
          </h6>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            expires in {dayjs(consent.expiry).fromNow()}
          </p>
        </div>
        <div className="flex flex-col items-center">
          <ButtonV2
            onClick={async () => {
              const res = await dispatch(consentActions.status(consent.id));

              if (res.status === 200) {
                Notification.Success({
                  msg: "Checking Status!",
                });
              } else {
                Notification.Error({
                  msg:
                    res?.data?.error?.message ?? "Error while checking status!",
                });
              }
            }}
            ghost
            className="max-w-2xl text-sm text-gray-700 hover:text-gray-900"
          >
            <CareIcon className="care-l-refresh" /> check status
          </ButtonV2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            created {dayjs(consent.created_date).fromNow()}
          </p>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            modified {dayjs(consent.modified_date).fromNow()}
          </p>
        </div>
      </div>
      {consent.consent_artefacts?.length ? (
        <div className="flex flex-wrap items-center justify-center border-t border-gray-200 bg-gray-50 px-4 py-5 sm:gap-4">
          {consent.consent_artefacts?.map((artefact) => (
            <ConsentArtefactCard key={artefact.id} artefact={artefact} />
          ))}
        </div>
      ) : (
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-5 sm:gap-4">
          <p className="text-center text-sm text-gray-800">
            {consent.status === "REQUESTED"
              ? "Waiting for the Patient to approve the consent request"
              : "Patient has rejected the consent request"}
          </p>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-center border-t border-gray-200 px-4 py-5 sm:gap-4">
        {consent.hi_types.map((hiType) => {
          return (
            <div
              key={hiType}
              className={classNames(
                "flex items-center justify-center rounded-full px-4 py-1.5 text-xs font-medium text-white",
                consent.consent_artefacts?.length
                  ? "bg-gray-400"
                  : "bg-gray-600"
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
  const [records, setRecords] = useState<ConsentRequestModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch<any>();

  useEffect(() => {
    const fetchRecords = async () => {
      setIsLoading(true);
      const response = await dispatch(
        consentActions.list({
          patient: patientId,
          ordering: "-created_date",
        })
      );

      if (response.status === 200 && response?.data?.results) {
        setRecords(response.data.results);
      }

      setIsLoading(false);
    };

    fetchRecords();
  }, [dispatch, patientId]);

  if (isLoading) {
    <Loading />;
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      {records.map((record) => {
        return <ConsentRequestCard key={record.id} consent={record} />;
      })}
    </div>
  );
}
