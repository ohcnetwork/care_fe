import { useTranslation } from "react-i18next";

import PatientCategoryBadge from "@/components/Common/PatientCategoryBadge";
import { PatientCategory } from "@/components/Facility/models";
import { DailyRoundsModel, NameQuantity } from "@/components/Patient/models";

interface Props<T extends keyof DailyRoundsModel> {
  attributeKey: T;
  attributeValue: DailyRoundsModel[T];
}

const LogUpdateCardAttribute = <T extends keyof DailyRoundsModel>({
  attributeKey,
  attributeValue,
}: Props<T>) => {
  const { t } = useTranslation();

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
          <span className="text-sm font-semibold text-secondary-700">
            {(attributeValue as DailyRoundsModel["bp"])?.systolic || "--"}/
            {(attributeValue as DailyRoundsModel["bp"])?.diastolic || "--"} mmHg
          </span>
        </div>
      );

    case "output":
      return (
        <div className="flex flex-col gap-2 md:flex-row">
          <AttributeLabel attributeKey={attributeKey} />
          <span className="flex flex-wrap gap-x-2 gap-y-1 text-sm text-secondary-700">
            {(attributeValue as NameQuantity[]).map((output) => (
              <span className="font-semibold" key={output.name}>
                {output.name}: {output.quantity}
              </span>
            ))}
          </span>
        </div>
      );

    case "rounds_type":
      return (
        <div className="flex flex-col items-center gap-2 md:flex-row">
          <AttributeLabel attributeKey={attributeKey} />
          <span className="text-sm font-semibold text-secondary-700">
            {t(attributeValue as string)}
          </span>
        </div>
      );

    default:
      return (
        <div className="flex flex-col items-center gap-2 md:flex-row">
          <AttributeLabel attributeKey={attributeKey} />
          <span className="text-sm font-semibold text-secondary-700">
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
    <span className="text-xs uppercase text-secondary-700">
      {props.attributeKey.replaceAll("_", " ")}
    </span>
  );
};
