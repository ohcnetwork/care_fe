import { useState } from "react";
import { useDispatch } from "react-redux";
import { navigate } from "raviger";
import { TextField, Modal } from "@material-ui/core";
import { useTranslation } from "react-i18next";

import { sendNotificationMessages } from "../../Redux/actions";
import { FACILITY_FEATURE_TYPES, KASP_STRING } from "../../Common/constants";
import ButtonV2 from "../Common/components/ButtonV2";
import * as Notification from "../../Utils/Notifications.js";
import { getFacilityFeatureIcon } from "./FacilityHome";

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
      <div className="block rounded-lg overflow-clip bg-white shadow h-full hover:border-primary-500">
        <div className="flex h-full">
          <div className="group md:flex hidden w-1/4 self-stretch shrink-0 bg-gray-300 items-center justify-center relative z-0">
            {(facility.read_cover_image_url && (
              <img
                src={facility.read_cover_image_url}
                alt={facility.name}
                className="w-full h-full object-cover"
              />
            )) || (
              <i className="fas fa-hospital text-4xl block text-gray-500" />
            )}
          </div>
          <div className="h-full w-full grow">
            <div className="group md:hidden flex w-full self-stretch shrink-0 bg-gray-300 items-center justify-center relative z-0">
              {(facility.read_cover_image_url && (
                <img
                  src={facility.read_cover_image_url}
                  alt={facility.name}
                  className="w-full max-h-40 sm:max-h-52 object-cover"
                />
              )) || (
                <i className="fas fa-hospital text-4xl block text-gray-500 p-10" />
              )}
            </div>

            <div className="h-fit md:h-full flex flex-col justify-between w-full">
              <div className="pl-4 md:pl-2 pr-4 py-2 w-full ">
                <div className="flow-root">
                  {facility.kasp_empanelled && (
                    <div className="float-right mt-2 inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium leading-5 bg-yellow-100 text-yellow-800">
                      {KASP_STRING}
                    </div>
                  )}
                  <div className="float-left font-bold text-xl capitalize">
                    {facility.name}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap mt-2">
                  <div className="px-2.5 py-0.5 rounded-md font-medium text-sm leading-5 bg-blue-100 text-blue-800 flex items-center">
                    {facility.facility_type}
                  </div>
                  {facility.features?.map(
                    (feature: number, i: number) =>
                      FACILITY_FEATURE_TYPES.some((f) => f.id === feature) && (
                        <div
                          key={i}
                          className="bg-primary-100 text-primary-600 px-2.5 py-0.5 rounded-md font-medium text-sm leading-5 flex gap-2 items-center"
                          title={
                            FACILITY_FEATURE_TYPES.filter(
                              (f) => f.id === feature
                            )[0]?.name
                          }
                        >
                          {getFacilityFeatureIcon(feature)}
                          {
                            FACILITY_FEATURE_TYPES.filter(
                              (f) => f.id === feature
                            )[0]?.name
                          }
                        </div>
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
                  className="text-sm font-medium tracking-widest"
                >
                  {facility.phone_number || "-"}
                </a>
              </div>
              <div className="bg-gray-50 border-t px-2 md:px-6 py-3 flex-none flex justify-between w-full flex-wrap gap-2">
                <div>
                  {userType !== "Staff" ? (
                    <ButtonV2
                      className="flex gap-3 bg-white"
                      name="facility-notify"
                      shadow
                      border
                      ghost
                      onClick={() => setNotifyModalFor(facility.id)}
                    >
                      <i className="far fa-comment-dots"></i>
                      Notify
                    </ButtonV2>
                  ) : (
                    <></>
                  )}
                  <Modal
                    open={notifyModalFor === facility.id}
                    onClose={() => setNotifyModalFor(undefined)}
                    aria-labelledby="Notify This Facility"
                    aria-describedby="Type a message and notify this facility"
                    className=""
                  >
                    <div className="h-screen w-full absolute flex items-center justify-center bg-modal">
                      <form
                        onSubmit={(event) => {
                          event.preventDefault();
                          handleNotifySubmit(notifyModalFor);
                        }}
                        className="bg-white rounded shadow p-8 m-4 max-h-full text-center flex flex-col max-w-lg w-2/3 min-w-max-content"
                      >
                        <div className="mb-4">
                          <h1 className="text-2xl">Notify: {facility.name}</h1>
                        </div>
                        <div>
                          <TextField
                            id="NotifyModalMessageInput"
                            rows={6}
                            multiline
                            required
                            className="w-full border p-2 max-h-64"
                            onChange={(e) => setNotifyMessage(e.target.value)}
                            placeholder="Type your message..."
                            variant="outlined"
                          />
                        </div>
                        <div className="flex flex-col-reverse md:flex-row gap-2 mt-4 justify-end">
                          <button
                            type="button"
                            className="btn-danger btn mr-2 w-full md:w-auto"
                            onClick={() => setNotifyModalFor(undefined)}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="btn-primary btn mr-2 w-full md:w-auto"
                          >
                            Send Notification
                          </button>
                        </div>
                      </form>
                    </div>
                  </Modal>
                </div>
                <div className="flex gap-2 ">
                  <ButtonV2
                    className="flex gap-3 bg-white"
                    name="facility-details"
                    shadow
                    border
                    ghost
                    onClick={() => navigate(`/facility/${facility.id}`)}
                  >
                    <i className="fas fa-hospital"></i>
                    {t("Facility")}
                  </ButtonV2>
                  <ButtonV2
                    className="flex gap-3 bg-white"
                    name="facility-patients"
                    shadow
                    border
                    ghost
                    onClick={() =>
                      navigate(`/facility/${facility.id}/patients`)
                    }
                  >
                    <i className="fas fa-user-injured"></i>
                    {t("Patients")}
                  </ButtonV2>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
