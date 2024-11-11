import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2 from "@/components/Common/ButtonV2";
import LogUpdateCardAttribute from "@/components/Facility/Consultations/DailyRounds/LogUpdateCardAttribute";
import { ConsultationModel } from "@/components/Facility/models";
import { DailyRoundsModel } from "@/components/Patient/models";

import { useSlugs } from "@/hooks/useSlug";

interface Props {
  round: DailyRoundsModel;
  consultationData: ConsultationModel;
}
const DefaultLogUpdateCard = ({ round, ...props }: Props) => {
  const [facilityId, patientId, consultationId] = useSlugs(
    "facility",
    "patient",
    "consultation",
  );
  const { t } = useTranslation();

  const consultationUrl = `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}`;

  return (
    <div
      className="flex w-full flex-col gap-4 rounded-lg border border-secondary-400 p-4 @container"
      id="dailyround-entry"
    >
      <LogUpdateCardAttribute
        attributeKey={"rounds_type"}
        attributeValue={
          t(
            `ROUNDS_TYPE__${round.rounds_type}`,
          ) as DailyRoundsModel["rounds_type"]
        }
      />
      <LogUpdateCardAttribute
        attributeKey="patient_category"
        attributeValue={round.patient_category}
      />
      <LogUpdateCardAttribute
        attributeKey="physical_examination_info"
        attributeValue={round.physical_examination_info}
      />
      <LogUpdateCardAttribute
        attributeKey="other_details"
        attributeValue={round.other_details}
      />
      <div className="mt-2 flex w-full flex-col items-center gap-2 md:w-auto 2xl:flex-row">
        <ButtonV2
          variant="secondary"
          border
          ghost
          size="small"
          className="w-full"
          href={
            ["NORMAL", "TELEMEDICINE", "DOCTORS_LOG"].includes(
              round.rounds_type!,
            )
              ? `${consultationUrl}/daily-rounds/${round.id}`
              : `${consultationUrl}/daily_rounds/${round.id}`
          }
        >
          <CareIcon icon="l-eye" className="text-lg" />
          <span>{t("view_details")}</span>
        </ButtonV2>
        <ButtonV2
          id="update-log"
          variant="secondary"
          disabled={!!props.consultationData?.discharge_date}
          border
          ghost
          size="small"
          className="w-full"
          href={
            [
              "NORMAL",
              "TELEMEDICINE",
              "DOCTORS_LOG",
              "COMMUNITY_NURSES_LOG",
            ].includes(round.rounds_type!)
              ? `${consultationUrl}/daily-rounds/${round.id}/update`
              : `${consultationUrl}/daily_rounds/${round.id}/update`
          }
        >
          <CareIcon icon="l-pen" className="text-lg" />
          <span>{t("update_log")}</span>
        </ButtonV2>
      </div>
    </div>
  );
};

export default DefaultLogUpdateCard;
