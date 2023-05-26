import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { sendNotificationMessages } from "../../Redux/actions";
import { FACILITY_FEATURE_TYPES } from "../../Common/constants";
import ButtonV2, { Cancel, Submit } from "../Common/components/ButtonV2";
import * as Notification from "../../Utils/Notifications.js";
import Chip from "../../CAREUI/display/Chip";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { parsePhoneNumber } from "libphonenumber-js";
import DialogModal from "../Common/Dialog";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import useConfig from "../../Common/hooks/useConfig";

export const FacilityCard = (props: { facility: any; userType: any }) => {
  const { facility, userType } = props;
  const { kasp_string } = useConfig();

  const { t } = useTranslation();
  const dispatchAction: any = useDispatch();
  const [notifyModalFor, setNotifyModalFor] = useState(undefined);
  const [notifyMessage, setNotifyMessage] = useState("");

  const handleNotifySubmit = async (id: any) => {
    const data = {
      facility: id,
      message: notifyMessage,
    };
    if (data.message.trim().length >= 1) {
      const res = await dispatchAction(sendNotificationMessages(data));
      if (res && res.status == 204) {
        Notification.Success({
          msg: "Facility Notified",
        });
        setNotifyModalFor(undefined);
      } else {
        Notification.Error({ msg: "Something went wrong..." });
      }
    } else {
      Notification.Error({
        msg: "Notification should contain atleast 1 character.",
      });
    }
  };

  return (
    <div key={`usr_${facility.id}`} className="w-full">
      <div className="block rounded-lg h-full bg-white shadow hover:border-primary-500">
        <div className="flex h-full">
          <Link
            href={`/facility/${facility.id}`}
            className="group md:flex hidden w-1/4 self-stretch bg-gray-300 items-center justify-center relative z-0"
          >
            {(facility.read_cover_image_url && (
              <img
                src={facility.read_cover_image_url}
                alt={facility.name}
                className="object-cover w-full h-full"
              />
            )) || (
              <i className="fas fa-hospital text-4xl block text-gray-500" />
            )}
          </Link>
          <div className="h-full w-full grow">
            <Link
              href={`/facility/${facility.id}`}
              className="group md:hidden flex w-full self-stretch bg-gray-300 items-center justify-center relative z-0"
            >
              {(facility.read_cover_image_url && (
                <img
                  src={facility.read_cover_image_url}
                  alt={facility.name}
                  className="w-full h-full max-h-32 object-cover"
                />
              )) || (
                <i className="fas fa-hospital text-4xl block text-gray-500 p-10" />
              )}
            </Link>

            <div className="flex flex-col justify-between w-full h-fit md:h-full">
              <div className="px-4 py-4 w-full">
                <div className="flow-root">
                  {facility.kasp_empanelled && (
                    <div className="float-right mt-2 inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium leading-5 bg-yellow-100 text-yellow-800">
                      {kasp_string}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/facility/${facility.id}`}
                      className="float-left font-bold text-xl capitalize text-inherit hover:text-inherit"
                    >
                      {facility.name}
                    </Link>
                    <ButtonV2
                      href={`/facility/${facility.id}/cns`}
                      border
                      ghost
                    >
                      <CareIcon className="care-l-monitor-heart-rate text-lg" />
                      <span>View CNS</span>
                    </ButtonV2>
                  </div>
                  <div className="flex gap-1 flex-wrap mt-2">
                    <Chip
                      text={facility.facility_type}
                      color="blue"
                      hideBorder
                      size="small"
                    />
                    {facility.features?.map(
                      (feature: number, i: number) =>
                        FACILITY_FEATURE_TYPES.some(
                          (f) => f.id === feature
                        ) && (
                          <Chip
                            hideBorder
                            key={i}
                            text={
                              FACILITY_FEATURE_TYPES.filter(
                                (f) => f.id === feature
                              )[0]?.name
                            }
                            color="primary"
                            size="small"
                            startIcon={
                              FACILITY_FEATURE_TYPES.filter(
                                (f) => f.id === feature
                              )[0]?.icon
                            }
                          />
                        )
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
                    className="font-semibold tracking-wider text-sm"
                  >
                    {parsePhoneNumber(
                      facility.phone_number as string,
                      "IN"
                    ).formatInternational() || "-"}
                  </a>
                </div>
              </div>
              <div className="bg-gray-50 border-t px-2 md:px-3 py-1 flex-none">
                <div className="flex py-2 justify-between">
                  <div className="flex justify-between w-full flex-wrap gap-2">
                    <div className="flex gap-2">
                      <div
                        className={`flex items-center tooltip justify-center rounded-md text-xl h-[38px] w-fit px-2 ml-auto ${
                          facility.patient_count / facility.bed_count > 0.85
                            ? "bg-red-500 button-danger-border"
                            : "bg-primary-100 button-primary-border"
                        }`}
                      >
                        <span className="tooltip-text tooltip-right -translate-y-2">
                          Live Patients / Total beds
                        </span>{" "}
                        <CareIcon
                          className={`care-l-bed text-${
                            facility.patient_count / facility.bed_count > 0.85
                              ? "white"
                              : "primary-600"
                          } mr-2`}
                        />{" "}
                        <dt
                          className={`text-sm font-semibold text-${
                            facility.patient_count / facility.bed_count > 0.85
                              ? "white"
                              : "gray-700"
                          } my-1`}
                        >
                          Occupancy: {facility.patient_count} /{" "}
                          {facility.bed_count}{" "}
                        </dt>{" "}
                      </div>
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
                          className="bg-white text-center flex flex-col w-full"
                        >
                          <TextAreaFormField
                            id="NotifyModalMessageInput"
                            name="message"
                            required
                            rows={5}
                            className="pt-4 pb-2"
                            onChange={(e) => setNotifyMessage(e.value)}
                            placeholder="Type your message..."
                          />
                          <div className="flex flex-col-reverse md:flex-row gap-2 justify-between">
                            <Cancel
                              onClick={() => setNotifyModalFor(undefined)}
                            />
                            <Submit label="Notify" />
                          </div>
                        </form>
                      </DialogModal>
                    </div>
                    <div className="flex gap-2">
                      {userType !== "Staff" ? (
                        <ButtonV2
                          id="facility-notify"
                          ghost
                          border
                          className="h-[38px]"
                          onClick={(_) => setNotifyModalFor(facility.id)}
                        >
                          <CareIcon className="care-l-megaphone text-lg" />
                          <span className="md:block hidden">Notify</span>
                        </ButtonV2>
                      ) : (
                        <></>
                      )}
                      <ButtonV2
                        href={`/facility/${facility.id}`}
                        id="facility-details"
                        border
                        ghost
                        className="h-[38px]"
                      >
                        <CareIcon className="care-l-hospital text-lg" />
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
                        <CareIcon className="care-l-user-injured text-lg" />
                        {t("view_patients")}
                      </ButtonV2>
                    </div>
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
