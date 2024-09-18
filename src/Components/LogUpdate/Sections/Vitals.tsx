import { useTranslation } from "react-i18next";
import {
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  properRoundOf,
  rangeValueDescription,
} from "../../../Utils/utils";
import { meanArterialPressure } from "../../Common/BloodPressureFormField";

import RadioFormField from "../../Form/FormFields/RadioFormField";
import RangeFormField from "../../Form/FormFields/RangeFormField";
import TextAreaFormField from "../../Form/FormFields/TextAreaFormField";
import { FieldChangeEvent } from "../../Form/FormFields/Utils";
import PainChart from "../components/PainChart";
import { LogUpdateSectionMeta, LogUpdateSectionProps } from "../utils";
import { HEARTBEAT_RHYTHM_CHOICES } from "../../../Common/constants";

const Vitals = ({ log, onChange }: LogUpdateSectionProps) => {
  const { t } = useTranslation();
  const handleBloodPressureChange = (event: FieldChangeEvent<number>) => {
    const bp = {
      ...(log.bp ?? {}),
      [event.name]: event.value,
    };
    bp.mean = meanArterialPressure(bp);
    onChange({ bp });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <h2 className="text-lg">{t("blood_pressure")}</h2>
        <span>
          {t("map_acronym")}:{" "}
          {(log.bp?.mean && properRoundOf(log.bp.mean)) || "--"}
        </span>
      </div>
      <RangeFormField
        label={t("systolic")}
        name="systolic"
        onChange={handleBloodPressureChange}
        value={log.bp?.systolic}
        min={0}
        max={250}
        step={1}
        unit="mmHg"
        valueDescriptions={rangeValueDescription({ low: 99, high: 139 })}
      />
      <RangeFormField
        label={t("diastolic")}
        name="diastolic"
        onChange={handleBloodPressureChange}
        value={log.bp?.diastolic}
        min={30}
        max={180}
        step={1}
        unit="mmHg"
        valueDescriptions={rangeValueDescription({ low: 49, high: 89 })}
      />
      <hr />
      <RangeFormField
        label={t("ventilator_spo2")}
        name="ventilator_spo2"
        onChange={(c) => onChange({ ventilator_spo2: c.value })}
        value={log.ventilator_spo2}
        min={0}
        max={100}
        step={1}
        unit="%"
        valueDescriptions={rangeValueDescription({ low: 89 })}
      />
      <RangeFormField
        label={t("LOG_UPDATE_FIELD_LABEL__temperature")}
        name="temperature"
        onChange={(c) => onChange({ temperature: c.value })}
        value={log.temperature}
        min={95}
        max={106}
        step={0.1}
        valueDescriptions={rangeValueDescription({ low: 97.4, high: 99.6 })}
        units={[
          { label: "°F" },
          {
            label: "°C",
            conversionFn: fahrenheitToCelsius,
            inversionFn: celsiusToFahrenheit,
          },
        ]}
      />
      <RangeFormField
        label={t("LOG_UPDATE_FIELD_LABEL__resp")}
        name="resp"
        onChange={(c) => onChange({ resp: c.value })}
        value={log.resp}
        min={0}
        max={150}
        step={1}
        unit="bpm"
        valueDescriptions={rangeValueDescription({ low: 11, high: 16 })}
      />
      <hr />
      <div>
        <h2 className="text-lg">{t("pain")}</h2>
        <span className="text-secondary-800">
          {t("pain_chart_description")}
        </span>
      </div>
      <PainChart
        pain={log.pain_scale_enhanced ?? []}
        onChange={(pain_scale_enhanced) => onChange({ pain_scale_enhanced })}
      />
      <hr />
      <RangeFormField
        label={t("LOG_UPDATE_FIELD_LABEL__pulse")}
        name="pulse"
        onChange={(c) => onChange({ pulse: c.value })}
        value={log.pulse}
        min={0}
        max={200}
        step={1}
        unit="bpm"
        valueDescriptions={[
          {
            till: 40,
            className: "text-red-500",
            text: t("bradycardia"),
          },
          {
            till: 100,
            className: "text-green-500",
            text: t("normal"),
          },
          {
            className: "text-red-500",
            text: t("tachycardia"),
          },
        ]}
      />
      <RadioFormField
        label={t("LOG_UPDATE_FIELD_LABEL__rhythm")}
        name="heartbeat-rythm"
        options={HEARTBEAT_RHYTHM_CHOICES}
        optionLabel={(c) => t(`HEARTBEAT_RHYTHM__${c}`)}
        optionValue={(c) => c}
        value={log.rhythm}
        onChange={(c) => onChange({ rhythm: c.value ?? undefined })}
      />
      <TextAreaFormField
        label={t("LOG_UPDATE_FIELD_LABEL__rhythm_detail")}
        name="rhythm_detail"
        value={log.rhythm_detail}
        onChange={(c) => onChange({ rhythm_detail: c.value })}
      />
    </div>
  );
};

Vitals.meta = {
  title: "Vitals",
  icon: "l-heartbeat",
} as const satisfies LogUpdateSectionMeta;

export default Vitals;
