import careConfig from "@careConfig";
import dayjs from "dayjs";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { ShiftingModel } from "@/components/Facility/models";

import useAuthUser from "@/hooks/useAuthUser";

import { classNames, formatDateTime, formatName } from "@/Utils/utils";

export default function ShiftingBlock(props: {
  shift: ShiftingModel;
  onTransfer: () => unknown;
}) {
  const { shift, onTransfer } = props;
  const { t } = useTranslation();
  const authUser = useAuthUser();

  return (
    <div className="flex h-full flex-col justify-between gap-4">
      <div>
        <div className="flex justify-between p-4">
          <div>
            <div className="text-xl font-bold capitalize">
              {shift.patient_object.name}
            </div>
            <div className="text-sm text-secondary-700">
              {shift.patient_object.age} old
            </div>
          </div>
          <div>
            {shift.emergency && (
              <span className="inline-block shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium leading-4 text-red-800">
                {t("emergency")}
              </span>
            )}
          </div>
        </div>
        <dl className="flex flex-wrap gap-1">
          {(
            [
              {
                title: "phone_number",
                icon: "l-mobile-android",
                data: shift.patient_object.phone_number,
              },
              {
                title: "origin_facility",
                icon: "l-plane-departure",
                data: shift.origin_facility_object.name,
              },
              {
                title: "shifting_approving_facility",
                icon: "l-user-check",
                data: careConfig.wartimeShifting
                  ? shift.shifting_approving_facility_object?.name
                  : undefined,
              },
              {
                title: "assigned_facility",
                icon: "l-plane-arrival",
                data:
                  shift.assigned_facility_external ||
                  shift.assigned_facility_object?.name ||
                  t("yet_to_be_decided"),
              },
              {
                title: "last_modified",
                icon: "l-stopwatch",
                data: formatDateTime(shift.modified_date),
                className: dayjs()
                  .subtract(2, "hours")
                  .isBefore(shift.modified_date)
                  ? "text-secondary-900"
                  : "rounded bg-red-500 border border-red-600 text-white w-full font-bold",
              },
              {
                title: "patient_address",
                icon: "l-home",
                data: shift.patient_object.address,
              },
              {
                title: "assigned_to",
                icon: "l-user",
                data: shift.assigned_to_object
                  ? formatName(shift.assigned_to_object) +
                    " - " +
                    shift.assigned_to_object.user_type
                  : undefined,
              },
              {
                title: "patient_state",
                icon: "l-map-marker",
                data: shift.patient_object.state_object?.name,
              },
            ] as const
          )
            .filter((d) => d.data)
            .map((datapoint, i) => (
              <div
                className={classNames(
                  "mx-2 flex items-center gap-2 px-2 py-1",
                  "className" in datapoint ? datapoint.className : "",
                )}
                key={i}
              >
                <dt title={t(datapoint.title)} className={""}>
                  <CareIcon icon={datapoint.icon} className="text-xl" />
                </dt>
                <dd className="text-sm font-semibold">{datapoint.data}</dd>
              </div>
            ))}
        </dl>
      </div>
      <div className="flex flex-col gap-2 px-4 pb-4">
        <Link
          href={`/shifting/${shift.external_id}`}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-secondary-300 bg-secondary-200 p-2 text-sm font-semibold text-inherit transition-all hover:bg-secondary-300"
        >
          <CareIcon icon="l-eye" className="text-lg" /> {t("all_details")}
        </Link>

        {shift.status === "COMPLETED" && shift.assigned_facility && (
          <>
            <button
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-secondary-300 bg-secondary-200 p-2 text-sm font-semibold text-inherit transition-all hover:bg-secondary-300"
              disabled={
                !shift.patient_object.allow_transfer ||
                !(
                  ["DistrictAdmin", "StateAdmin"].includes(
                    authUser.user_type,
                  ) ||
                  authUser.home_facility_object?.id === shift.assigned_facility
                )
              }
              onClick={onTransfer}
            >
              {t("transfer_to_receiving_facility")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
