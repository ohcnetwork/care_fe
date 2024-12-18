import careConfig from "@careConfig";
import { t } from "i18next";
import { QRCodeSVG } from "qrcode.react";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import Loading from "@/components/Common/Loading";
import { ConsultationModel } from "@/components/Facility/models";

import { GENDER_TYPES } from "@/common/constants";

import routes from "@/Utils/request/api";
import useTanStackQueryInstead from "@/Utils/request/useQuery";
import { formatDateTime, formatPatientAge } from "@/Utils/utils";

export const ReferralLetter = (id: any) => {
  const { data, loading } = useTanStackQueryInstead(routes.getShiftDetails, {
    pathParams: { id: id?.id },
  });

  const patientData = data?.patient_object;
  const consultation = data?.patient_object
    ?.last_consultation as ConsultationModel;

  const patientGender = GENDER_TYPES.find(
    (i) => i.id === patientData?.gender,
  )?.text;

  if (loading || !patientData) {
    return <Loading />;
  }

  return (
    <PrintPreview title={t("Patient Referral Letter")}>
      <Card className="shadow-none border-none">
        <CardHeader className="flex flex-col items-center space-y-4 sm:flex-row sm:justify-between sm:space-y-0">
          <CardTitle className="mx-auto my-auto text-lg font-bold sm:text-2xl">
            {t("referral_letter")}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {data && (
            <div>
              <div className="flex flex-col-reverse items-start justify-end sm:flex-row sm:items-center">
                {data?.is_kasp && (
                  <img
                    alt="logo"
                    src={careConfig.headerLogo?.dark}
                    className="max-h-12"
                  />
                )}
                <QRCodeSVG
                  value={`${window.location.origin}/shifting/${data.id}`}
                  size={120}
                  className="mt-4 sm:mt-0"
                />
              </div>

              <div className="mt-6 text-lg">
                <span className="font-semibold">{t("name_of_hospital")}: </span>
                {data?.is_kasp
                  ? t("district_program_management_supporting_unit")
                  : data.origin_facility_object?.name || "--"}
              </div>

              <div className="my-6 border-b-2"></div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 text-lg">
                <div>
                  <h3 className="mb-2 font-semibold">{t("patient_details")}</h3>
                  <p>
                    <span className="font-semibold leading-relaxed">
                      {t("name")}:{" "}
                    </span>
                    {patientData?.name}
                  </p>
                  <p>
                    <span className="font-semibold leading-relaxed">
                      {t("age")}:{" "}
                    </span>
                    {formatPatientAge(patientData, true)}
                  </p>
                  <p>
                    <span className="font-semibold leading-relaxed">
                      {t("gender")}:{" "}
                    </span>
                    {patientGender || "-"}
                  </p>
                  <p>
                    <span className="font-semibold leading-relaxed">
                      {t("phone")}:{" "}
                    </span>{" "}
                    {patientData?.phone_number || "-"}
                  </p>
                </div>

                <div className="text-lg">
                  <h3 className="mb-2  font-semibold">{t("address")}</h3>
                  <p className=" whitespace-pre-line">
                    {patientData?.address || "-"}
                  </p>
                  {patientData?.nationality === "India" && (
                    <>
                      <p>
                        {patientData?.ward_object?.name},{" "}
                        {patientData?.local_body_object?.name}
                      </p>
                      <p>{patientData?.district_object?.name || "-"}</p>
                      <p>{patientData?.state_object?.name}</p>
                    </>
                  )}
                </div>
              </div>

              <div className="my-6 border-b-2"></div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 text-lg">
                <div>
                  <p>
                    <span className="font-semibold  leading-relaxed">
                      {t("date_of_admission")}:{" "}
                    </span>
                    {formatDateTime(
                      consultation.encounter_date || consultation.created_date,
                    ) || "-"}
                  </p>
                  <p>
                    <span className="font-semibold leading-relaxed">
                      {t("unique_id")}:{" "}
                    </span>{" "}
                    {data.id}
                  </p>
                  <p>
                    <span className="font-semibold leading-relaxed">
                      {t("patient_no")}:{" "}
                    </span>{" "}
                    {consultation.patient_no || "-"}
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <p>
                    <span className="font-semibold leading-relaxed">
                      {t("date_of_positive_covid_19_swab")}:{" "}
                    </span>
                    {(patientData?.date_of_test &&
                      formatDateTime(patientData.date_of_test)) ||
                      "-"}
                  </p>
                  <p>
                    <span className="font-semibold leading-relaxed">
                      {t("covid_19_cat_gov")}:{" "}
                    </span>{" "}
                    {consultation.category || "-"}
                  </p>
                  <p>
                    <span className="font-semibold leading-relaxed">
                      {t("referred_to")}:{" "}
                    </span>
                    {data.assigned_facility_external ||
                      data.assigned_facility_object?.name ||
                      "--"}
                  </p>
                  <p>
                    <span className="font-semibold leading-relaxed">
                      {t("reason_for_referral")}:{" "}
                    </span>{" "}
                    {data.reason || "--"}
                  </p>
                  <p>
                    <span className="font-semibold leading-relaxed">
                      {t("treatment_summary")}:{" "}
                    </span>{" "}
                    {consultation.treatment_plan || "-"}
                  </p>
                </div>
              </div>

              <div className="my-6 border-b-2"></div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {t("approved_by_district_covid_control_room")}
                </p>
                <p className="text-sm">{t("auto_generated_for_care")}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </PrintPreview>
  );
};
