import careConfig from "@careConfig";
import { Link, navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import RecordMeta from "@/CAREUI/display/RecordMeta";
import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";

import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import CommentSection from "@/components/Shifting/ShiftingCommentsSection";

import {
  SHIFTING_CHOICES_PEACETIME,
  SHIFTING_CHOICES_WARTIME,
} from "@/common/constants";

import routes from "@/Utils/request/api";
import useTanStackQueryInstead from "@/Utils/request/useQuery";
import { formatName } from "@/Utils/utils";

import { ShiftDetailsUpdate } from "./ShiftDetailsUpdate";

export default function ShiftDetails(props: { id: string }) {
  const { t } = useTranslation();
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);

  const shiftStatusOptions = careConfig.wartimeShifting
    ? SHIFTING_CHOICES_WARTIME
    : SHIFTING_CHOICES_PEACETIME;

  const { data, loading } = useTanStackQueryInstead(routes.getShiftDetails, {
    pathParams: { id: props.id },
  });

  const showFacilityCard = (facilityData: any) => {
    return (
      <div className="mt-2 h-full text-left rounded-lg shadow bg-white p-4 text-gray-700">
        <table className="w-full">
          <tbody>
            <tr>
              <td className="font-semibold pb-2 w-1/4">{t("name")} :</td>
              <td className="pb-2 w-3/4 truncate">
                {facilityData?.name || "--"}
              </td>
            </tr>
            <tr>
              <td className="font-semibold py-2 w-1/4">
                {t("facility_type")} :
              </td>
              <td className="py-2 w-3/4 truncate">
                {facilityData?.facility_type?.name || "--"}
              </td>
            </tr>
            <tr>
              <td className="font-semibold py-2 w-1/4">{t("district")} :</td>
              <td className="py-2 w-3/4 truncate">
                {facilityData?.district_object?.name || "--"}
              </td>
            </tr>
            <tr>
              <td className="font-semibold py-2 w-1/4">{t("local_body")} :</td>
              <td className="py-2 w-3/4 truncate">
                {facilityData?.local_body_object?.name || "--"}
              </td>
            </tr>
            <tr>
              <td className="font-semibold pt-2 w-1/4">{t("state")} :</td>
              <td className="pt-2 w-3/4 truncate">
                {facilityData?.state_object?.name || "--"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="lg:mx-9">
      <Page
        title={t("shifting_details")}
        crumbsReplacements={{
          [props.id]: { name: data?.patient_object?.name },
        }}
        backUrl="/shifting/board"
      >
        {data?.assigned_to_object && (
          <div className="relative rounded-lg bg-primary-200 shadow my-3">
            <div className="mx-auto max-w-screen-xl p-3 sm:px-6 lg:px-8">
              <div className="pr-16 sm:px-16 sm:text-center">
                <p className="font-bold text-primary-800">
                  <span className="inline">
                    {t("assigned_to")}: {formatName(data.assigned_to_object)} -{" "}
                    {data.assigned_to_object.user_type}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        <ShiftDetailsUpdate
          id={data?.external_id || ""}
          open={isSlideOverOpen}
          setOpen={setIsSlideOverOpen}
        />

        <div>
          <div className="flex flex-col lg:flex-row justify-between mt-2 rounded-lg border p-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-8 w-full lg:w-auto">
              <div className="border-b-2 pb-2 lg:border-b-0 lg:border-r-2 lg:pr-4 lg:pb-0">
                <div className="text-sm font-medium leading-5 text-secondary-700">
                  {t("created")} on
                </div>
                <div className="mt-1 whitespace-pre-wrap text-sm leading-5 text-gray-700 font-semibold">
                  <RecordMeta
                    time={data?.created_date}
                    user={data?.created_by_object}
                    inlineUser={true}
                    inlineClassName={"flex-wrap"}
                  />
                </div>
              </div>

              <div className="mt-2 lg:mt-0">
                <div className="text-sm font-medium leading-5 text-secondary-700">
                  {t("last_edited")}
                </div>
                <div className="mt-1 whitespace-pre-wrap text-sm leading-5 text-gray-700 font-semibold">
                  <RecordMeta
                    time={data?.modified_date}
                    user={data?.last_edited_by_object}
                    inlineUser={true}
                    inlineClassName={"flex-wrap"}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 mt-4 lg:mt-0 w-full lg:w-auto text-sm items-stretch lg:items-center">
              <div className="relative group w-full sm:w-auto flex">
                <button
                  className={`w-full px-4 py-2 rounded-lg sm:w-auto underline ${
                    ["COMPLETED", "CANCELLED"].includes(data?.status || "")
                      ? "cursor-not-allowed bg-secondary-100"
                      : "hover:text-primary-700 text-primary-600"
                  }`}
                  disabled={["COMPLETED", "CANCELLED"].includes(
                    data?.status || "",
                  )}
                  onClick={() => setIsSlideOverOpen(true)}
                >
                  {t("update_status_details")}
                </button>
                {["COMPLETED", "CANCELLED"].includes(data?.status || "") && (
                  <div className="absolute left-1/2 top-full mt-1 -translate-x-1/2 w-max text-xs bg-gray-700 text-white p-2 rounded-md shadow-lg hidden group-hover:block">
                    A shifting request, once {data?.status.toLowerCase()} cannot
                    be updated
                  </div>
                )}
              </div>

              <div className="w-full sm:w-auto flex lg:justify-start">
                <button
                  className="w-full sm:w-auto underline hover:text-primary-700 text-primary-600 flex items-center justify-center lg:justify-start px-4 py-2"
                  onClick={() =>
                    navigate(`/shifting/${props.id}/referral-letter`)
                  }
                >
                  <CareIcon icon="l-file-alt" className="mr-2 text-base" />
                  {t("referral_letter")}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 h-full rounded-lg bg-white p-4 text-sm text-gray-600 shadow ">
            <div className="flex flex-wrap justify-between mb-3">
              <div className="w-full md:w-auto">
                <span className="font-semibold text-lg leading-relaxed mr-2">
                  {t("patient_name")} :
                </span>
                <span className="text-gray-900 text-lg font-semibold leading-5">
                  {data?.patient_object?.name}
                </span>
              </div>
              <div className="w-full md:w-auto mt-2 md:mt-0">
                <Link
                  className="underline text-blue-700 font-semibold leading-5"
                  href={`/patient/${data?.patient_object?.id}`}
                >
                  {"View Patient details"}
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              <div>
                <span className="font-semibold leading-relaxed">Status : </span>

                <Badge variant="alert">
                  {shiftStatusOptions.find(
                    (option) => data?.status === option.text,
                  )?.label || data?.status}
                </Badge>
              </div>
              <div>
                <span className="font-semibold leading-relaxed">
                  {t("is_up_shift")} :
                </span>
                <Badge
                  variant={data?.is_up_shift ? "warning_outline" : "secondary"}
                  className="ml-1"
                >
                  {data?.is_up_shift ? t("yes") : t("no")}
                </Badge>
              </div>

              <div>
                <span className="font-semibold leading-relaxed">
                  {t("is_emergency")} :
                </span>
                <Badge
                  variant={data?.emergency ? "danger" : "secondary"}
                  className="ml-1"
                >
                  {data?.emergency ? t("yes") : t("no")}
                </Badge>
              </div>

              <div className="md:text-right">
                <span className="font-semibold leading-relaxed">
                  {t("patient_category")} :
                </span>

                <Badge variant="warning_outline" className="ml-1">
                  {data?.patient_object.last_consultation?.last_daily_round
                    ?.patient_category ??
                    data?.patient_object.last_consultation?.category}
                </Badge>
              </div>
              <div className="grid grid-cols-2 col-span-1 sm:col-span-4 md:col-span-4">
                <div className=" md:col-span-1 col-span-2">
                  <span className="font-semibold leading-relaxed">
                    {t("contact_person_at_the_facility")} :
                  </span>
                  <span className="ml-1 text-gray-900 font-semibold leading-5">
                    {data?.refering_facility_contact_name || "--"}
                  </span>
                </div>
                <div className="md:text-right">
                  <span className="font-semibold leading-relaxed">
                    {t("phone_number_at_current_facility")} :
                  </span>
                  <span className="ml-1 text-gray-900 font-semibold leading-5">
                    {data?.refering_facility_contact_number ? (
                      <a href={`tel:${data.refering_facility_contact_number}`}>
                        {data.refering_facility_contact_number}
                      </a>
                    ) : (
                      "--"
                    )}
                  </span>
                </div>
              </div>

              {careConfig.kasp.enabled && (
                <div>
                  <span className="font-semibold leading-relaxed">
                    {careConfig.kasp.fullString} :
                  </span>
                  <span className="badge badge-pill badge-warning px-2 py-1 ml-1">
                    {data?.is_kasp ? t("yes") : t("no")}
                  </span>
                </div>
              )}
              {careConfig.wartimeShifting && (
                <>
                  <div>
                    <span className="font-semibold leading-relaxed">
                      {t("vehicle_preference")} :
                    </span>
                    <span className="ml-1 text-gray-900 font-semibold leading-5">
                      {data?.vehicle_preference ||
                        data?.preferred_vehicle_choice}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold leading-relaxed">
                      {t("facility_preference")} :
                    </span>
                    <span className="ml-1 text-gray-900 font-semibold leading-5">
                      {data?.assigned_facility_type || "--"}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold leading-relaxed">
                      {t("severity_of_breathlessness")} :
                    </span>
                    <span className="ml-1 text-gray-900 font-semibold leading-5">
                      {data?.breathlessness_level || "--"}
                    </span>
                  </div>
                </>
              )}

              {careConfig.wartimeShifting && (
                <div>
                  <span className="font-semibold leading-relaxed">
                    {t("shifting_approving_facility")}:
                  </span>
                  <span className="ml-1 text-gray-900 font-semibold leading-5">
                    {data?.shifting_approving_facility_object?.name || "--"}
                  </span>
                </div>
              )}

              <div className="col-span-1 sm:col-span-2 md:col-span-4">
                <span className="font-semibold leading-relaxed">
                  {t("reason")} :
                </span>
                <span className="ml-1 text-gray-900 font-semibold leading-5">
                  {data?.reason || "--"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid-cols-2 gap-x-14 text-sm md:grid text-secondary-800">
          <div className="col-span-1">
            <div
              className="pb-12 block relative cursor-pointer border-l-2 px-4 border-l-secondary-300 
               mt-2 hover:border-primary-500 transition-all before:absolute before:-left-[7px] before:top-0 before:w-3 before:aspect-square before:bg-secondary-400 before:rounded-full hover:before:bg-primary-500 before:transition-all"
            >
              <h4 className="mt-8 text-lg">
                {t("details_of_origin_facility")}
              </h4>

              {showFacilityCard(data?.origin_facility_object)}
            </div>
            <div className="pb-12 block relative cursor-pointer border-l-2 px-4 border-l-secondary-300 hover:border-primary-500 transition-all before:absolute before:-left-[7px] before:top-0 before:w-3 before:aspect-square before:bg-secondary-400 before:rounded-full hover:before:bg-primary-500 before:transition-all">
              <h4 className="text-lg">{t("ambulance_details")}</h4>

              <div className="mt-2 h-full rounded-lg bg-white p-4 text-gray-700 shadow">
                <table className="w-full text-left">
                  <tbody>
                    <tr>
                      <td className="font-semibold text-left pb-2 w-1/2">
                        {t("ambulance_driver_name")} :
                      </td>
                      <td className="pb-2 w-1/2">
                        {data?.ambulance_driver_name || "--"}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-left py-2 w-1/2">
                        {t("ambulance_phone_number")} :
                      </td>
                      <td className="py-2 w-1/2">
                        {data?.ambulance_phone_number ? (
                          <a href={`tel:${data?.ambulance_phone_number}`}>
                            {data?.ambulance_phone_number}
                          </a>
                        ) : (
                          "--"
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-left pt-2 w-1/2">
                        {t("ambulance_number")} :
                      </td>
                      <td className="pt-2 w-1/2">
                        {data?.ambulance_number || "--"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {!data?.assigned_facility_external && (
              <div className="pb-8 block relative cursor-pointer border-l-2 px-4 border-l-secondary-300 hover:border-primary-500 transition-all before:absolute before:-left-[7px] before:top-0 before:w-3 before:aspect-square before:bg-secondary-400 before:rounded-full hover:before:bg-primary-500 before:transition-all">
                <h4 className="text-lg">{t("details_of_assigned_facility")}</h4>
                {showFacilityCard(data?.assigned_facility_object)}
              </div>
            )}
            {careConfig.wartimeShifting && (
              <div className="pb-8 block relative cursor-pointer border-l-2 px-4 border-l-secondary-300 hover:border-primary-500 transition-all before:absolute before:-left-[7px] before:top-0 before:w-3 before:aspect-square before:bg-secondary-400 before:rounded-full hover:before:bg-primary-500 before:transition-all">
                <h4 className="mt-8">
                  {t("details_of_shifting_approving_facility")}
                </h4>
                {showFacilityCard(data?.shifting_approving_facility_object)}
              </div>
            )}
          </div>
          <div className="col-span-1">
            <div className="mb-10 ">
              <h4 className="mt-8 text-lg">{t("comments")}</h4>
              <CommentSection id={props.id} />
            </div>
          </div>
        </div>
      </Page>
    </div>
  );
}
