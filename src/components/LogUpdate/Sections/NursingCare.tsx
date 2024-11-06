import { useTranslation } from "react-i18next";

import AutoExpandingTextInputFormField from "@/components/Form/FormFields/AutoExpandingTextInputFormField";
import AutocompleteMultiSelectFormField from "@/components/Form/FormFields/AutocompleteMultiselect";
import {
  LogUpdateSectionMeta,
  LogUpdateSectionProps,
} from "@/components/LogUpdate/utils";

import { NURSING_CARE_PROCEDURES } from "@/common/constants";

const NursingCare = ({ log, onChange }: LogUpdateSectionProps) => {
  const { t } = useTranslation();
  const nursing = log.nursing || [];

  return (
    <div className="flex flex-col">
      <AutocompleteMultiSelectFormField
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
        <table className="mb-8 mt-2 w-full border-collapse">
          <tbody>
            {nursing.map((obj) => (
              <tr key={obj.procedure}>
                <td className="whitespace-nowrap border border-r-2 border-secondary-400 border-r-secondary-300 bg-secondary-50 p-2 pr-4 text-left text-sm font-semibold md:pr-16">
                  {t(`NURSING_CARE_PROCEDURE__${obj.procedure}`)}
                </td>
                <td className="w-full border border-secondary-400">
                  <AutoExpandingTextInputFormField
                    innerClassName="border-none rounded-none"
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
                    rows={1}
                    maxHeight={160}
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
