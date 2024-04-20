import PatientCategoryBadge from "../../../Common/PatientCategoryBadge";
import {
  BloodPressure,
  DailyRoundsModel,
  DailyRoundsOutput,
} from "../../../Patient/models";
import { PatientCategory } from "../../models";

interface Props<T extends keyof DailyRoundsModel> {
  attributeKey: T;
  attributeValue: DailyRoundsModel[T];
}

const LogUpdateCardAttribute = <T extends keyof DailyRoundsModel>({
  attributeKey,
  attributeValue,
}: Props<T>) => {
  switch (attributeKey) {
    // case "id":
    // case "external_id":
    // case "created_by":
    // case "created_date":
    // case "modified_date":
    // case "last_edited_by":
    // case "taken_at":
    // case "review_interval":
    // case "deprecated_covid_category":
    // case "meta":
    // case "consultation":
    //   return <div className="hidden" />;

    case "patient_category":
      return (
        <div className="flex flex-col items-center gap-2 md:flex-row">
          <AttributeLabel attributeKey={attributeKey} />
          <PatientCategoryBadge category={attributeValue as PatientCategory} />
        </div>
      );

    case "bp":
      return (
        <div className="flex flex-col items-center gap-2 md:flex-row">
          <AttributeLabel attributeKey={attributeKey} />
          <span className="text-sm font-semibold text-gray-700">
            {(attributeValue as BloodPressure).systolic}/
            {(attributeValue as BloodPressure).diastolic} mmHg
          </span>
        </div>
      );

    case "output":
      return (
        <div className="flex flex-col gap-2 md:flex-row">
          <AttributeLabel attributeKey={attributeKey} />
          <span className="flex flex-wrap gap-x-2 gap-y-1 text-sm text-gray-700">
            {(attributeValue as DailyRoundsOutput[]).map((output) => (
              <span className="font-semibold" key={output.name}>
                {output.name}: {output.quantity}
              </span>
            ))}
          </span>
        </div>
      );

    default:
      return (
        <div className="flex flex-col items-center gap-2 md:flex-row">
          <AttributeLabel attributeKey={attributeKey} />
          <span className="text-sm font-semibold text-gray-700">
            {typeof attributeValue === "object"
              ? JSON.stringify(attributeValue)
              : attributeValue}
          </span>
        </div>
      );
  }
};

export default LogUpdateCardAttribute;

const AttributeLabel = (props: { attributeKey: string }) => {
  return (
    <span className="text-xs uppercase text-gray-700">
      {props.attributeKey.replaceAll("_", " ")}
    </span>
  );
};
