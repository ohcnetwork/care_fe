import { useState } from "react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";
import { FACILITY_FEATURE_TYPES } from "../../Common/constants";
import ButtonV2, { Cancel, Submit } from "../Common/components/ButtonV2";
import * as Notification from "../../Utils/Notifications.js";
import Chip from "../../CAREUI/display/Chip";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { formatPhoneNumber, parsePhoneNumber } from "../../Utils/utils";
import DialogModal from "../Common/Dialog";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import useConfig from "../../Common/hooks/useConfig";
import request from "../../Utils/request/request";
import routes from "../../Redux/api";
import { getBedTypes } from "../../Common/constants";
import useQuery from "../../Utils/request/useQuery";
import { Occupany_badge } from "./Facilitybedoccupancybadge";
export const FacilityCard = (props: { facility: any; userType: any }) => {
  const { facility, userType } = props;
  const { kasp_string } = useConfig();
  const config = useConfig();
  const capacityQuery = useQuery(routes.getCapacity, {
    pathParams: { facilityId: `${facility.id}` },
  });

  const { t } = useTranslation();
  const [notifyModalFor, setNotifyModalFor] = useState(undefined);
  const [notifyMessage, setNotifyMessage] = useState("");
  const [notifyError, setNotifyError] = useState("");
  const icu_occupancy = {
    usedICU: 0,
    VacantICU: 0,
    tooltip: "ICU bed type/ Number of ICU beds registered",
    badge_title: "ICU Occupancy",
  };
  const total_occupancy = {
    occupied: facility.patient_count,
    total: facility.total_count,
    tooltip:
      "Total patients marked as admitted in consultation/ Total no. of registered bed",
    badge_title: "Occupancy",
  };

  const handleNotifySubmit = async (id: any) => {
    if (notifyMessage.trim().length >= 1) {
      setNotifyError("");
      const { res } = await request(routes.sendNotificationMessages, {
        body: {
          facility: id,
          message: notifyMessage,
        },
      });
      if (res?.ok) {
        Notification.Success({
          msg: "Facility Notified",
        });
        setNotifyModalFor(undefined);
      } else {
        Notification.Error({ msg: "Something went wrong..." });
      }
    } else {
      setNotifyError("Message cannot be empty");
    }
  };

  getBedTypes(config).forEach((x) => {
    const res = capacityQuery.data?.results.find((data) => {
      return data.room_type === x.id;
    });
    if (
      res &&
      res.current_capacity !== undefined &&
      res.total_capacity !== undefined &&
      (res.room_type === 20 || res.room_type === 10)
    ) {
      icu_occupancy.VacantICU = icu_occupancy.VacantICU + res.current_capacity;
      icu_occupancy.usedICU = icu_occupancy.usedICU + res.total_capacity;
    }
  });
  return (
    <div key={`usr_${facility.id}`} className="w-full">
      <div className="block h-full overflow-hidden rounded-lg bg-white shadow hover:border-primary-500">
        <div className="flex h-full">
          <div className="h-full w-full grow">
            <Link
              href={`/facility/${facility.id}`}
              className="group relative z-0 flex w-full min-w-[15%] items-center justify-center self-stretch bg-gray-300 min-[425px]:hidden"
            >
              {(facility.read_cover_image_url && (
                <img
                  src={facility.read_cover_image_url}
                  alt={facility.name}
                  className="h-full max-h-32 w-full object-cover"
                />
              )) || (
                <CareIcon
                  icon="l-hospital"
                  className="block text-7xl text-gray-500"
                />
              )}
            </Link>

            <div className="flex h-fit w-full flex-col flex-wrap justify-between md:h-full">
              <div className="w-full p-4">
                <div className="flex gap-5">
                  <Link
                    href={`/facility/${facility.id}`}
                    className="group relative z-0 hidden h-[150px] min-h-[150px] w-[150px] min-w-[150px] items-center justify-center self-stretch rounded-md bg-gray-300 min-[425px]:flex"
                  >
                    {(facility.read_cover_image_url && (
                      <img
                        src={facility.read_cover_image_url}
                        alt={facility.name}
                        className="h-full w-full rounded-md object-cover"
                      />
                    )) || (
                      <CareIcon
                        icon="l-hospital"
                        className="block text-5xl text-gray-500"
                      />
                    )}
                  </Link>
                  <div className="flow-root grow">
                    {facility.kasp_empanelled && (
                      <div className="float-right ml-2 mt-2 inline-flex items-center rounded-md bg-yellow-100 px-2.5 py-0.5 text-sm font-medium leading-5 text-yellow-800">
                        {kasp_string}
                      </div>
                    )}
                    <div
                      className="flex flex-wrap items-center justify-between"
                      id="facility-name-card"
                    >
                      <Link
                        href={`/facility/${facility.id}`}
                        className="float-left text-xl font-bold capitalize text-inherit hover:text-inherit"
                      >
                        {facility.name}
                      </Link>
                      <ButtonV2
                        id="view-cns-button"
                        href={`/facility/${facility.id}/cns`}
                        border
                        ghost
                      >
                        <CareIcon
                          icon="l-monitor-heart-rate"
                          className="text-lg"
                        />
                        <span>View CNS</span>
                      </ButtonV2>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Chip
                        text={facility.facility_type}
                        variant="custom"
                        className="bg-blue-100 text-blue-900"
                        hideBorder
                        size="small"
                      />
                      {facility.features?.map(
                        (feature: number) =>
                          FACILITY_FEATURE_TYPES.some(
                            (f) => f.id === feature,
                          ) && (
                            <Chip
                              hideBorder
                              key={feature}
                              text={
                                FACILITY_FEATURE_TYPES.filter(
                                  (f) => f.id === feature,
                                )[0]?.name
                              }
                              size="small"
                              startIcon={
                                FACILITY_FEATURE_TYPES.filter(
                                  (f) => f.id === feature,
                                )[0]?.icon
                              }
                            />
                          ),
                      )}
                    </div>

                    <div className="mt-2 flex justify-between">
                      <div className="flex flex-col">
                        <div className="font-semibold">
                          {facility.local_body_object?.name}
                        </div>
                      </div>
                    </div>
                    <a
                      href={`tel:${facility.phone_number}`}
                      className="text-sm font-semibold tracking-wider"
                    >
                      {formatPhoneNumber(
                        parsePhoneNumber(facility.phone_number as string) ??
                          "-",
                      )}
                    </a>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap border-t bg-gray-50 px-2 py-1 md:px-3">
                {/* <div className="flex justify-between py-2"> */}
                <div className="flex w-full flex-wrap justify-between gap-2 py-2">
                  <div className="flex flex-wrap gap-2">
                    <Occupany_badge
                      occupied={total_occupancy.occupied}
                      total={total_occupancy.total}
                      tooltip={total_occupancy.tooltip}
                      title={total_occupancy.badge_title}
                    />
                    <Occupany_badge
                      occupied={icu_occupancy.usedICU}
                      total={icu_occupancy.VacantICU}
                      tooltip={icu_occupancy.tooltip}
                      title={icu_occupancy.badge_title}
                    />

                    <DialogModal
                      show={notifyModalFor === facility.id}
                      title={
                        <span className="flex justify-center text-2xl">
                          Notify: {facility.name}
                        </span>
                      }
                      onClose={() => setNotifyModalFor(undefined)}
                    >
                      <form
                        onSubmit={(event) => {
                          event.preventDefault();
                          handleNotifySubmit(notifyModalFor);
                        }}
                        className="flex w-full flex-col bg-white text-center"
                      >
                        <TextAreaFormField
                          id="NotifyModalMessageInput"
                          name="message"
                          rows={5}
                          className="pb-2 pt-4"
                          onChange={(e) => setNotifyMessage(e.value)}
                          placeholder="Type your message..."
                          error={notifyError}
                        />
                        <div className="flex flex-col-reverse justify-between gap-2 md:flex-row">
                          <Cancel
                            onClick={() => setNotifyModalFor(undefined)}
                          />
                          <Submit label="Notify" />
                        </div>
                      </form>
                    </DialogModal>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["DistrictAdmin", "StateAdmin"].includes(userType) && (
                      <ButtonV2
                        id="facility-notify"
                        ghost
                        border
                        className="h-[38px]"
                        onClick={(_) => setNotifyModalFor(facility.id)}
                      >
                        <CareIcon icon="l-megaphone" className="text-lg" />
                        <span className="hidden md:block">Notify</span>
                      </ButtonV2>
                    )}
                    <ButtonV2
                      href={`/facility/${facility.id}`}
                      id="facility-details"
                      border
                      ghost
                      className="h-[38px]"
                    >
                      <CareIcon icon="l-hospital" className="text-lg" />
                      <span className="hidden md:inline">
                        {t("view_faciliy")}
                      </span>
                    </ButtonV2>
                    <ButtonV2
                      href={`/patients?facility=${facility.id}`}
                      id="facility-patients"
                      border
                      ghost
                    >
                      <CareIcon icon="l-user-injured" className="text-lg" />
                      {t("view_patients")}
                    </ButtonV2>
                    {/* </div> */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
