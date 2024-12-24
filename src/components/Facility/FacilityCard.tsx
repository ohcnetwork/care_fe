import careConfig from "@careConfig";
import { Link } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import Chip from "@/CAREUI/display/Chip";
import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { TooltipComponent, TooltipProvider } from "@/components/ui/tooltip";

import { Avatar } from "@/components/Common/Avatar";
import { Cancel, Submit } from "@/components/Common/ButtonV2";
import DialogModal from "@/components/Common/Dialog";
import { FacilityModel } from "@/components/Facility/models";
import TextAreaFormField from "@/components/Form/FormFields/TextAreaFormField";

import { FACILITY_FEATURE_TYPES } from "@/common/constants";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import { formatPhoneNumber, parsePhoneNumber } from "@/Utils/utils";

export const FacilityCard = (props: {
  facility: FacilityModel;
  userType: string;
}) => {
  const { facility, userType } = props;

  const { t } = useTranslation();
  const [notifyModalFor, setNotifyModalFor] = useState<string>();
  const [notifyMessage, setNotifyMessage] = useState("");
  const [notifyError, setNotifyError] = useState("");

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
        setNotifyMessage("");
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
      <div className="block h-full overflow-hidden rounded-lg border border-secondary-300 bg-white transition-all hover:border-secondary-400">
        <div className="flex h-full">
          <div className="h-full w-full grow">
            <Link
              href={`/facility/${facility.id}`}
              className="group relative z-0 flex w-full min-w-[15%] items-center justify-center self-stretch min-[425px]:hidden"
            >
              <Avatar
                name={facility.name || ""}
                imageUrl={facility.read_cover_image_url}
                className="m-4 mb-0 md:m-0"
              />
            </Link>

            <div className="mx-auto flex h-fit w-full max-w-full flex-col flex-wrap justify-between md:h-full lg:max-w-3xl">
              <div className="w-full p-4">
                <div className="flex flex-col gap-5 sm:flex-row">
                  <Link
                    href={`/facility/${facility.id}`}
                    className="hidden h-[150px] min-h-[150px] w-[150px] min-w-[150px] sm:block"
                  >
                    <Avatar
                      name={facility.name || ""}
                      imageUrl={facility.read_cover_image_url}
                    />
                  </Link>
                  <div className="flow-root grow">
                    {facility.kasp_empanelled && (
                      <div className="float-right ml-2 mt-2 inline-flex items-center rounded-md bg-yellow-100 px-2.5 py-0.5 text-sm font-medium leading-5 text-yellow-800">
                        {careConfig.kasp.string}
                      </div>
                    )}
                    <div
                      className="flex flex-wrap items-center justify-between"
                      id="facility-name-card"
                    >
                      <div>
                        <Link
                          href={`/facility/${facility.id}`}
                          className="text-xl font-bold capitalize text-inherit hover:text-inherit"
                        >
                          {facility.name}
                        </Link>
                        <TooltipProvider>
                          <TooltipComponent
                            content={t("live_patients_total_beds")}
                            className="text-sm px-3 py-3 max-w-[300px]"
                          >
                            <div
                              data-test-id="occupancy-badge"
                              className={`relative flex items-center gap-1 text-sm ${
                                (facility.patient_count || 0) /
                                  (facility.bed_count || 0) >
                                0.85
                                  ? "justify-center rounded-md border border-red-600 bg-red-500 p-1 font-bold text-white"
                                  : "text-secondary-700"
                              }`}
                            >
                              <CareIcon icon="l-bed" />
                              <dt data-test-id="occupancy-badge-text">
                                {t("occupancy")}: {facility.patient_count} /{" "}
                                {facility.bed_count}
                              </dt>
                            </div>
                          </TooltipComponent>
                        </TooltipProvider>
                      </div>
                      <Button
                        id="view-cns-button"
                        asChild
                        className="mt-2 sm:mt-0"
                        variant={"outline_primary"}
                      >
                        <Link href={`/facility/${facility.id}/cns`}>
                          <CareIcon
                            icon="l-monitor-heart-rate"
                            className="text-lg mr-1"
                          />
                          <span>{t("view_cns")}</span>
                        </Link>
                      </Button>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1">
                      <Chip
                        text={facility.facility_type || ""}
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
              <div className="flex flex-wrap border-t border-t-secondary-300 bg-secondary-50 px-2 py-1 md:px-3">
                {/* <div className="flex justify-between py-2"> */}
                <div className="flex w-full flex-wrap justify-between gap-2 py-2">
                  <div className="flex flex-wrap gap-2">
                    <DialogModal
                      show={notifyModalFor === facility.id}
                      title={
                        <span
                          className="flex justify-center text-2xl"
                          id="notify-facility-name"
                        >
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
                          value={notifyMessage}
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
                      <TooltipProvider>
                        <TooltipComponent
                          content={t("notify")}
                          side="top"
                          className="sm:hidden text-sm px-3 py-3 max-w-[300px]"
                        >
                          <Button
                            id="facility-notify"
                            variant={"outline_primary"}
                            className="h-[38px]"
                            onClick={(_) => setNotifyModalFor(facility.id)}
                            aria-label={t("notify")}
                            role="button"
                          >
                            <CareIcon
                              icon="l-megaphone"
                              className="text-lg mr-1"
                            />
                            <span className="hidden sm:inline">
                              {t("notify")}
                            </span>
                          </Button>
                        </TooltipComponent>
                      </TooltipProvider>
                    )}
                    <TooltipProvider>
                      <TooltipComponent
                        content={t("view_facility")}
                        side="top"
                        className="sm:hidden text-sm px-3 py-3 max-w-[300px]"
                      >
                        <Button
                          id="facility-details"
                          variant={"outline_primary"}
                          className="tooltip h-[38px]"
                          aria-label={t("view_facility")}
                          asChild
                        >
                          <Link href={`/facility/${facility.id}`}>
                            <CareIcon
                              icon="l-hospital"
                              className="text-lg mr-1"
                            />
                            <span className="hidden sm:inline">
                              {t("view_facility")}
                            </span>
                          </Link>
                        </Button>
                      </TooltipComponent>
                    </TooltipProvider>
                    <TooltipProvider>
                      <TooltipComponent
                        content={t("view_patients")}
                        side="top"
                        className="sm:hidden text-sm px-3 py-3 max-w-[300px]"
                      >
                        <Button
                          id="facility-patients"
                          variant={"outline_primary"}
                          aria-label={t("view_patients")}
                          asChild
                          className="tooltip h-[38px]"
                        >
                          <Link href={`/patients?facility=${facility.id}`}>
                            <CareIcon
                              icon="l-user-injured"
                              className="text-lg mr-1"
                            />
                            <span className="hidden sm:inline">
                              {t("view_patients")}
                            </span>
                          </Link>
                        </Button>
                      </TooltipComponent>
                    </TooltipProvider>
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
