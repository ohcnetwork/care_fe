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
import { classNames } from "../../Utils/utils";

export const FacilityCard = (props: { facility: any; userType: any }) => {
  const { facility, userType } = props;
  const { kasp_string } = useConfig();

  const { t } = useTranslation();
  const dispatchAction: any = useDispatch();
  const [notifyModalFor, setNotifyModalFor] = useState(undefined);
  const [notifyMessage, setNotifyMessage] = useState("");
  const [notifyError, setNotifyError] = useState("");

  const handleNotifySubmit = async (id: any) => {
    const data = {
      facility: id,
      message: notifyMessage,
    };
    if (data.message.trim().length >= 1) {
      setNotifyError("");
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
      setNotifyError("Message cannot be empty");
    }
  };

  return (
    <div key={`usr_${facility.id}`} className="w-full">
      <div className="block h-full rounded-lg bg-white shadow hover:border-primary-500">
        <div className="flex h-full">
          <Link
            href={`/facility/${facility.id}`}
            className="group relative z-0 hidden w-1/4 items-center justify-center self-stretch bg-gray-300 md:flex"
          >
            {(facility.read_cover_image_url && (
              <img
                src={facility.read_cover_image_url}
                alt={facility.name}
                className="h-full w-full object-cover"
              />
            )) || (
              <i className="fas fa-hospital block text-4xl text-gray-500" />
            )}
          </Link>
          <div className="h-full w-full grow">
            <Link
              href={`/facility/${facility.id}`}
              className="group relative z-0 flex w-full items-center justify-center self-stretch bg-gray-300 md:hidden"
            >
              {(facility.read_cover_image_url && (
                <img
                  src={facility.read_cover_image_url}
                  alt={facility.name}
                  className="h-full max-h-32 w-full object-cover"
                />
              )) || (
                <i className="fas fa-hospital block p-10 text-4xl text-gray-500" />
              )}
            </Link>

            <div className="flex h-fit w-full flex-col justify-between md:h-full">
              <div className="w-full p-4">
                <div className="flow-root">
                  {facility.kasp_empanelled && (
                    <div className="float-right ml-2 mt-2 inline-flex items-center rounded-md bg-yellow-100 px-2.5 py-0.5 text-sm font-medium leading-5 text-yellow-800">
                      {kasp_string}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/facility/${facility.id}`}
                      className="float-left text-xl font-bold capitalize text-inherit hover:text-inherit"
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
                          (f) => f.id === feature
                        ) && (
                          <Chip
                            hideBorder
                            key={feature}
                            text={
                              FACILITY_FEATURE_TYPES.filter(
                                (f) => f.id === feature
                              )[0]?.name
                            }
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
                    className="text-sm font-semibold tracking-wider"
                  >
                    {parsePhoneNumber(
                      facility.phone_number as string,
                      "IN"
                    ).formatInternational() || "-"}
                  </a>
                </div>
              </div>
              <div className="flex-none border-t bg-gray-50 px-2 py-1 md:px-3">
                <div className="flex justify-between py-2">
                  <div className="flex w-full flex-wrap justify-between gap-2">
                    <div className="flex gap-2">
                      <div
                        className={`tooltip ml-auto flex h-[38px] w-fit items-center justify-center rounded-md px-2 text-xl ${
                          facility.patient_count / facility.bed_count > 0.85
                            ? "button-danger-border bg-red-500"
                            : "button-primary-border bg-primary-100"
                        }`}
                      >
                        <span className="tooltip-text tooltip-bottom md:tooltip-right -translate-y-2">
                          Live Patients / Total beds
                        </span>{" "}
                        <CareIcon
                          className={classNames(
                            "care-l-bed mr-2",
                            facility.patient_count / facility.bed_count > 0.85
                              ? "text-white"
                              : "text-primary-600"
                          )}
                        />{" "}
                        <dt
                          className={`my-1 text-sm font-semibold ${
                            facility.patient_count / facility.bed_count > 0.85
                              ? "text-white"
                              : "text-gray-700"
                          }`}
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
                          <span className="hidden md:block">Notify</span>
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
