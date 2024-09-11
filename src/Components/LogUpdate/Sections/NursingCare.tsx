import { useTranslation } from "react-i18next";
import { NURSING_CARE_PROCEDURES } from "../../../Common/constants";
import TextAreaFormField from "../../Form/FormFields/TextAreaFormField";
import { LogUpdateSectionMeta, LogUpdateSectionProps } from "../utils";
import { MultiSelectFormField } from "../../Form/FormFields/SelectFormField";

const NursingCare = ({ log, onChange }: LogUpdateSectionProps) => {
  const { t } = useTranslation();
  const nursing = log.nursing || [];

  return (
    <div className="flex flex-col">
      <MultiSelectFormField
        name="procedures"
        placeholder={t("procedures_select_placeholder")}
        value={nursing.map((p) => p.procedure)}
        onChange={({ value }) => {
          onChange({
            nursing: value.map((procedure) => ({
              procedure,
              description:
                nursing.find((p) => p.procedure === procedure)?.description ??
                "",
            })),
          });
        }}
        options={NURSING_CARE_PROCEDURES}
        optionLabel={(procedure) => t(`NURSING_CARE_PROCEDURE__${procedure}`)}
        optionValue={(o) => o}
        errorClassName="hidden"
      />
      {!!nursing.length && (
        <table className="mb-8 w-full border-collapse">
          <tbody>
            {nursing.map((obj) => (
              <tr>
                <td className="whitespace-nowrap border border-secondary-400 p-2 pr-16 text-left text-sm font-semibold">
                  {t(`NURSING_CARE_PROCEDURE__${obj.procedure}`)}
                </td>
                <td className="w-full border border-secondary-400">
                  <TextAreaFormField
                    name={`${obj.procedure}__description`}
                    value={obj.description}
                    onChange={(val) =>
                      onChange({
                        nursing: nursing.map((n) =>
                          n.procedure === obj.procedure
                            ? { ...n, description: val.value }
                            : n,
                        ),
                      })
                    }
                    rows={2}
                    placeholder={t("add_remarks")}
                    errorClassName="hidden"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

NursingCare.meta = {
  title: "Nursing Care",
  icon: "l-user-nurse",
} as const satisfies LogUpdateSectionMeta;

export default NursingCare;
