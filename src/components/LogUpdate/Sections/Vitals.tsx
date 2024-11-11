import { useTranslation } from "react-i18next";

import { meanArterialPressure } from "@/components/Common/BloodPressureFormField";
import RadioFormField from "@/components/Form/FormFields/RadioFormField";
import RangeFormField from "@/components/Form/FormFields/RangeFormField";
import TextAreaFormField from "@/components/Form/FormFields/TextAreaFormField";
import PainChart from "@/components/LogUpdate/components/PainChart";
import {
  LogUpdateSectionMeta,
  LogUpdateSectionProps,
} from "@/components/LogUpdate/utils";
import { BloodPressure } from "@/components/Patient/models";

import { HEARTBEAT_RHYTHM_CHOICES } from "@/common/constants";

import {
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  rangeValueDescription,
} from "@/Utils/utils";

const Vitals = ({ log, onChange }: LogUpdateSectionProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <h2 className="text-lg">{t("LOG_UPDATE_FIELD_LABEL__bp")}</h2>
        <span>
          {t("map_acronym")}: {meanArterialPressure(log.bp)?.toFixed() ?? "--"}{" "}
          mmHg
        </span>
      </div>
      <BPAttributeEditor attribute="systolic" log={log} onChange={onChange} />
      <BPAttributeEditor attribute="diastolic" log={log} onChange={onChange} />
      <hr />
      <RangeFormField
        label={t("LOG_UPDATE_FIELD_LABEL__ventilator_spo2")}
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

const BPAttributeEditor = ({
  attribute,
  log,
  onChange,
}: LogUpdateSectionProps & { attribute: "systolic" | "diastolic" }) => {
  const { t } = useTranslation();

  return (
    <RangeFormField
      name={attribute}
      label={t(attribute)}
      onChange={(event) => {
        const bp = { systolic: log.bp?.systolic, diastolic: log.bp?.diastolic };
        bp[event.name as keyof BloodPressure] = event.value;
        onChange({
          bp: Object.values(bp).filter(Boolean).length ? bp : undefined,
        });
      }}
      value={log.bp?.[attribute] ?? undefined}
      min={0}
      max={400}
      sliderMin={30}
      sliderMax={270}
      step={0.1}
      unit="mmHg"
      valueDescriptions={rangeValueDescription(
        attribute === "systolic"
          ? { low: 99, high: 139 }
          : { low: 49, high: 89 },
      )}
      hideUnitInLabel
    />
  );
};

Vitals.meta = {
  title: "Vitals",
  icon: "l-heartbeat",
} as const satisfies LogUpdateSectionMeta;

export default Vitals;
