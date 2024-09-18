import { useTranslation } from "react-i18next";
import { NURSING_CARE_PROCEDURES } from "../../../Common/constants";
import { classNames } from "../../../Utils/utils";
import CheckBoxFormField from "../../Form/FormFields/CheckBoxFormField";
import TextAreaFormField from "../../Form/FormFields/TextAreaFormField";
import { LogUpdateSectionMeta, LogUpdateSectionProps } from "../utils";

const NursingCare = ({ log, onChange }: LogUpdateSectionProps) => {
  const { t } = useTranslation();
  const nursing = log.nursing || [];

  return (
    <div className="flex flex-col">
      {NURSING_CARE_PROCEDURES.map((procedure, i) => {
        const obj = nursing.find((n) => n.procedure === procedure);

        return (
          <div
            key={i}
            className={classNames(
              "overflow-hidden rounded-lg shadow-none transition-all duration-200 ease-in-out",
              obj &&
                "border border-secondary-400 bg-secondary-100 focus-within:shadow-md",
            )}
          >
            <div className="px-4 pt-4">
              <CheckBoxFormField
                label={t(`NURSING_CARE_PROCEDURE__${procedure}`)}
                name={`${procedure}__enabled`}
                value={!!obj}
                onChange={(e) => {
                  if (e.value) {
                    onChange({
                      nursing: [...nursing, { procedure, description: "" }],
                    });
                  } else {
                    onChange({
                      nursing: nursing.filter((n) => n.procedure !== procedure),
                    });
                  }
                }}
                errorClassName="hidden"
              />
            </div>
            {obj && (
              <div className="p-4">
                <TextAreaFormField
                  name={`${procedure}__description`}
                  value={obj.description}
                  onChange={(val) =>
                    onChange({
                      nursing: nursing.map((n) =>
                        n.procedure === procedure
                          ? { ...n, description: val.value }
                          : n,
                      ),
                    })
                  }
                  placeholder="Description"
                  errorClassName="hidden"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

NursingCare.meta = {
  title: "Nursing Care",
  icon: "l-user-nurse",
} as const satisfies LogUpdateSectionMeta;

export default NursingCare;
