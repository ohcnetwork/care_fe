import { useState } from "react";
import { LegacySelectField } from "../Common/HelperInputFields";
import { useTranslation } from "react-i18next";
import { FieldLabel } from "../Form/FormFields/FormField";

export const ExternalResultLocalbodySelector = (props: any) => {
  const [localBody, setLocalBody] = useState(0);
  const { t } = useTranslation();
  const selectedLocalBody = props.lsgs?.find(
    (item: any) => item.id == localBody
  );

  const wards = selectedLocalBody?.wards;
  return (
    <div className="pb-2">
      <div className="space-y-1">
        <label
          id="listbox-label"
          className="block text-sm leading-5 font-medium text-gray-700"
        >
          {t("assigned_to")}
        </label>

        <div className="md:col-span-2">
          <FieldLabel id="local_body-label" required={true}>
            {t("local_body")}
          </FieldLabel>
          <LegacySelectField
            name="local_body"
            variant="outlined"
            margin="dense"
            value={localBody}
            options={props.lsgs}
            optionValue="name"
            onChange={(e) => {
              setLocalBody(e.target.value);
            }}
          />
        </div>
        <div className="md:col-span-2">
          <FieldLabel id="ward-label" required={true}>
            {t("Ward")}
          </FieldLabel>
          {wards && (
            <LegacySelectField
              name="ward"
              variant="outlined"
              margin="dense"
              options={wards
                ?.sort((a: any, b: any) => a.number - b.number)
                .map((e: any) => {
                  return { id: e.id, name: e.number + ": " + e.name };
                })}
              optionValue="name"
            />
          )}
        </div>
      </div>
    </div>
  );
};
