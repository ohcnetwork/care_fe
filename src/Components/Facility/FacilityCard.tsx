import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { sendNotificationMessages } from "../../Redux/actions";
import { FACILITY_FEATURE_TYPES, KASP_STRING } from "../../Common/constants";
import ButtonV2, { Cancel, Submit } from "../Common/components/ButtonV2";
import * as Notification from "../../Utils/Notifications.js";
import Chip from "../../CAREUI/display/Chip";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { parsePhoneNumber } from "libphonenumber-js";
import DialogModal from "../Common/Dialog";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";

export const FacilityCard = (props: { facility: any; userType: any }) => {
  const { facility, userType } = props;

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
      <div className="block rounded-lg max-h-56 overflow-clip bg-white shadow h-full hover:border-primary-500">
        <div className="flex h-full">
          <Link
            href={`/facility/${facility.id}`}
            className="group md:flex hidden w-1/4 self-stretch shrink-0 bg-gray-300 items-center justify-center relative z-0"
          >
            {(facility.read_cover_image_url && (
              <img
                src={facility.read_cover_image_url}
                alt={facility.name}
                className="w-full h-full object-cover"
              />
            )) || (
              <i className="fas fa-hospital text-4xl block text-gray-500" />
            )}
          </Link>
          <div className="h-full w-full grow">
            <Link
              href={`/facility/${facility.id}`}
              className="group md:hidden flex w-full self-stretch shrink-0 bg-gray-300 items-center justify-center relative z-0"
            >
              {(facility.read_cover_image_url && (
                <img
                  src={facility.read_cover_image_url}
                  alt={facility.name}
                  className="w-full h-full object-cover"
                />
              )) || (
                <i className="fas fa-hospital text-4xl block text-gray-500 p-10" />
              )}
            </Link>

            <div className="flex flex-col justify-between w-full h-fit md:h-full">
              <div className="px-4 py-4 w-full ">
                <div className="flow-root">
                  {facility.kasp_empanelled && (
                    <div className="float-right mt-2 inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium leading-5 bg-yellow-100 text-yellow-800">
                      {KASP_STRING}
                    </div>
                  )}
                  <Link
                    href={`/facility/${facility.id}`}
                    className="float-left font-bold text-xl capitalize text-inherit hover:text-inherit"
                  >
                    {facility.name}
                  </Link>
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
                      FACILITY_FEATURE_TYPES.some((f) => f.id === feature) && (
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
              <div className="bg-gray-50 border-t px-2 md:px-3 py-1 flex-none">
                <div className="flex py-2 justify-between">
                  <div className="flex justify-between w-full flex-wrap gap-2">
                    <div>
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
                    <div className="flex gap-2 ">
                      <ButtonV2
                        href={`/facility/${facility.id}`}
                        id="facility-details"
                        border
                        ghost
                        className="h-[38px]"
                      >
                        <CareIcon className="care-l-hospital text-lg" />
                        <span className="hidden md:inline">
                          {t("Facility")}
                        </span>
                      </ButtonV2>
                      <ButtonV2
                        href={`/patients?facility=${facility.id}`}
                        id="facility-patients"
                        border
                        ghost
                      >
                        <CareIcon className="care-l-user-injured text-lg" />
                        {t("Patients")}
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
