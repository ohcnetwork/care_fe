import { useTranslation } from "react-i18next";
import RecordMeta from "../../../../CAREUI/display/RecordMeta";
import CareIcon from "../../../../CAREUI/icons/CareIcon";
import ButtonV2 from "../../../Common/components/ButtonV2";
import { DailyRoundsModel } from "../../../Patient/models";
import LogUpdateCardAttribute from "./LogUpdateCardAttribute";

interface Props {
  round: DailyRoundsModel;
  consultationData: any;
  onViewDetails: () => void;
  onUpdateLog?: () => void;
}

const getName = (item: any) => {
  return `${item?.first_name} ${item?.last_name} (${item?.user_type})`;
};

const DefaultLogUpdateCard = ({ round, ...props }: Props) => {
  const { t } = useTranslation();
  const telemedicine_doctor_update =
    round.created_by_telemedicine || round.last_updated_by_telemedicine;

  const by = props.consultationData.assigned_to_object || round.created_by;

  return (
    <div
      className={`flex w-full flex-col gap-4 rounded-lg p-4 shadow ${
        telemedicine_doctor_update ? "bg-purple-200" : "bg-white"
      }`}
    >
      <div className="flex flex-col items-start gap-1">
        <div className="flex w-min items-center gap-2 rounded-full border bg-gray-50 text-gray-500">
          <div className="rounded-full bg-gray-100 px-1.5 py-0.5">
            <CareIcon className="care-l-user-nurse text-lg" />
          </div>
          <span className="flex gap-1 whitespace-nowrap pr-3 text-sm tracking-wider">
            <span className="font-semibold">{`${by?.first_name} ${by?.last_name}`}</span>
            <span className="hidden font-medium md:block">
              ({by?.user_type})
            </span>
          </span>
        </div>
        <span className="flex gap-1 text-xs text-gray-700">
          {t("created")} <RecordMeta time={round.created_date} />
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {!telemedicine_doctor_update && round?.last_edited_by && (
          <LogUpdateCardAttribute
            attributeKey={"Updated By" as any}
            attributeValue={getName(round.last_edited_by)}
          />
        )}
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

        <div className="mt-2 flex flex-col space-x-0 space-y-2 md:flex-row md:space-x-2 md:space-y-0">
          <ButtonV2
            variant="secondary"
            border
            ghost
            onClick={props.onViewDetails}
          >
            <CareIcon className="care-l-eye text-lg" />
            <span>{t("view_details")}</span>
          </ButtonV2>
          {props.onUpdateLog && (
            <ButtonV2
              variant="secondary"
              border
              ghost
              className="tooltip"
              onClick={props.onUpdateLog}
            >
              <CareIcon className="care-l-pen text-lg" />
              <span>{t("update_log")}</span>
            </ButtonV2>
          )}
        </div>
      </div>
    </div>
  );
};

export default DefaultLogUpdateCard;
