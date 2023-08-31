import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { consentActions } from "../../Redux/actions";
import { ConsentModel } from "./types/consent";
import dayjs from "dayjs";
import { ABDM_CONSENT_PURPOSE } from "../../Common/constants";
import CareIcon from "../../CAREUI/icons/CareIcon";
import ButtonV2 from "../Common/components/ButtonV2";
import * as Notification from "../../Utils/Notifications.js";
import Loading from "../Common/Loading";

interface IProps {
  patientId: string;
}

function ConsentCard({ consent }: { consent: ConsentModel }) {
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
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            {dayjs(consent.created_date).fromNow()}
          </p>
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
          <h5 className="font-semibold leading-6 text-gray-900">
            {consent.status}
          </h5>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            {dayjs(consent.modified_date).fromNow()}
          </p>
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
            className="mt-1 max-w-2xl text-sm text-gray-700 hover:text-gray-900"
          >
            <CareIcon className="care-l-refresh" /> check status
          </ButtonV2>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center border-t border-gray-200 bg-gray-50 px-4 py-5 sm:gap-4">
        {consent.hi_types.map((hiType) => {
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
    </div>
  );
}

export default function ABDMRecordsTab({ patientId }: IProps) {
  const [records, setRecords] = useState<ConsentModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch<any>();

  useEffect(() => {
    const fetchRecords = async () => {
      setIsLoading(true);
      const response = await dispatch(
        consentActions.list({
          patient: patientId,
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
    <div className="flex flex-col gap-6">
      {records.map((record) => {
        return <ConsentCard key={record.id} consent={record} />;
      })}
    </div>
  );
}
