import { useTranslation } from "react-i18next";

import { RadioInput } from "@/components/Form/FormFields/RadioFormField";
import { DailyRoundsModel } from "@/components/Patient/models";

type Value = DailyRoundsModel["ventilator_mode"];

type Props = {
  value: Value;
  onChange: (value: Value) => void;
};

export default function VentilatorModeSelector(props: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2 pl-2 pt-4">
      <label>{t("VENTILATOR_MODE__CMV")}</label>
      <div className="ml-1 border-l-4 border-secondary-200 pl-1">
        <Option value="VCV" props={props} />
        <Option value="PCV" props={props} />
      </div>
      <label>{t("VENTILATOR_MODE__SIMV")}</label>
      <div className="ml-1 border-l-4 border-secondary-200 pl-1">
        <Option value="VC_SIMV" props={props} />
        <Option value="PC_SIMV" props={props} />
      </div>

      <Option value="PSV" props={props} />
    </div>
  );
}

const Option = ({ props, value }: { props: Props; value: Value }) => {
  const { t } = useTranslation();
  return (
    <div className="py-1 pl-2">
      <RadioInput
        name="ventilator_mode"
        id={`ventilator-mode-option-${value}`}
        value={value}
        checked={props.value === value}
        onChange={(e) => props.onChange(e.target.value as Value)}
        label={t(`VENTILATOR_MODE__${value}`)}
      />
    </div>
  );
};
