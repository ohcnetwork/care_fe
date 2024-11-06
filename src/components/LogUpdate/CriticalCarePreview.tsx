import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";

import Card from "@/CAREUI/display/Card";

import { meanArterialPressure } from "@/components/Common/BloodPressureFormField";
import ButtonV2 from "@/components/Common/ButtonV2";
import Loading from "@/components/Common/Loading";
import { ABGAnalysisFields } from "@/components/LogUpdate/Sections/ABGAnalysis";
import { IOBalanceSections } from "@/components/LogUpdate/Sections/IOBalance";
import PressureSore from "@/components/LogUpdate/Sections/PressureSore/PressureSore";
import { VentilatorFields } from "@/components/LogUpdate/Sections/RespiratorySupport/Ventilator";
import PainChart from "@/components/LogUpdate/components/PainChart";
import { DailyRoundsModel } from "@/components/Patient/models";

import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";
import {
  ValueDescription,
  classNames,
  properRoundOf,
  rangeValueDescription,
} from "@/Utils/utils";

type Props = {
  facilityId: string;
  patientId: string;
  consultationId: string;
  id: string;
};

export default function CriticalCarePreview(props: Props) {
  const { t } = useTranslation();
  const { data } = useQuery(routes.getDailyReport, {
    pathParams: {
      consultationId: props.consultationId,
      id: props.id,
    },
  });

  if (!data) {
    return <Loading />;
  }

  const tOption = (prefix: string, key: keyof typeof data) => {
    const value = data[key];
    return value && t(`${prefix}__${value}`);
  };

  return (
    <div className="w-full transition-all duration-200 ease-in-out md:mx-auto md:max-w-5xl md:pt-8">
      <div className="py-4">
        <ButtonV2
          id="back-to-consultation"
          variant="secondary"
          href={`/facility/${props.facilityId}/patient/${props.patientId}/consultation/${props.consultationId}`}
        >
          {t("back_to_consultation")}
        </ButtonV2>
      </div>

      <Card className="md:rounded-xl lg:p-8">
        <h2 className="mb-3 flex flex-col gap-4 text-black md:flex-row md:items-center">
          <span>Consultation Updates</span>
          <div className="max-w-min whitespace-nowrap rounded-full border border-primary-300 bg-primary-100 px-2.5 py-1.5 text-sm font-semibold text-primary-500">
            <span>{t(`ROUNDS_TYPE__${data.rounds_type}`)}</span>
          </div>
        </h2>

        <Section title="General">
          <Detail label="Patient Category" value={data.patient_category} />
          <Detail
            label="Physical Examination Info"
            value={data.physical_examination_info}
          />
          <Detail label="Other Details" value={data.other_details} />
        </Section>

        <Section title="Routine">
          <ChoiceDetail data={data} name="sleep" />
          <ChoiceDetail data={data} name="bowel_issue" />
          <Section subSection title="Bladder">
            <ChoiceDetail data={data} name="bladder_drainage" />
            <ChoiceDetail data={data} name="bladder_issue" />
            <Detail
              label={t("LOG_UPDATE_FIELD_LABEL__is_experiencing_dysuria")}
              value={data.is_experiencing_dysuria}
            />
            <ChoiceDetail data={data} name="urination_frequency" />
          </Section>
          <Section subSection title="Nutrition">
            <ChoiceDetail data={data} name="nutrition_route" />
            <ChoiceDetail data={data} name="oral_issue" />
            <ChoiceDetail data={data} name="appetite" />
          </Section>
        </Section>

        <Section title="Neurological Monitoring">
          <Detail
            label="Level of Consciousness"
            value={tOption("CONSCIOUSNESS_LEVEL", "consciousness_level")}
          />
          {(data.left_pupil_light_reaction ||
            data.left_pupil_light_reaction_detail ||
            data.left_pupil_size ||
            data.left_pupil_size_detail ||
            data.right_pupil_light_reaction ||
            data.right_pupil_light_reaction_detail ||
            data.right_pupil_size ||
            data.right_pupil_size_detail) && (
            <div className="grid gap-x-4 gap-y-2 py-2 md:grid-cols-2">
              {(["left", "right"] as const).map((dir) => (
                <div
                  key={dir}
                  className="rounded border border-secondary-300 bg-secondary-100 p-3"
                >
                  <h5 className="capitalize">{dir} Pupil</h5>
                  <Detail
                    label="Size"
                    value={
                      data[`${dir}_pupil_size`] != null
                        ? data[`${dir}_pupil_size`] || "Cannot be assessed"
                        : undefined
                    }
                  />
                  {data[`${dir}_pupil_size`] === 0 && (
                    <Detail
                      label="Pupil size description"
                      value={data[`${dir}_pupil_size_detail`]}
                    />
                  )}
                  <Detail
                    label="Light Reaction"
                    value={tOption(
                      "PUPIL_REACTION",
                      `${dir}_pupil_light_reaction`,
                    )}
                  />
                  <Detail
                    label="Light Reaction Description"
                    value={data[`${dir}_pupil_light_reaction_detail`]}
                  />
                </div>
              ))}
            </div>
          )}
          <div className="space-y-1">
            <Detail label="Glasgow Eye Open" value={data.glasgow_eye_open} />
            <Detail
              label="Glasgow Verbal Response"
              value={data.glasgow_verbal_response}
            />
            <Detail
              label="Glasgow Motor Response"
              value={data.glasgow_motor_response}
            />
            <Detail
              label="Glasgow Total Calculated"
              value={data.glasgow_total_calculated}
            />
          </div>
          <h5 className="pt-2">Limb Response</h5>
          <div className="grid grid-cols-2 justify-items-center">
            {(
              [
                "upper_extremity_left",
                "upper_extremity_right",
                "lower_extremity_left",
                "lower_extremity_right",
              ] as const
            ).map((key) => (
              <div
                key={key}
                className="w-full border border-secondary-300 bg-secondary-100 px-2 py-6 text-center"
              >
                <Detail
                  label={
                    <span className="capitalize">
                      {key.replace("extremity", "").replaceAll("_", " ")}
                    </span>
                  }
                  value={tOption("LIMB_RESPONSE", `limb_response_${key}`)}
                />
              </div>
            ))}
          </div>
        </Section>

        <Section title="Arterial Blood Gas Analaysis">
          <ul className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {ABGAnalysisFields.map((field) => {
              const value = data[field.key];
              return (
                <li key={field.key}>
                  <RangeDetail
                    label={field.label}
                    value={value}
                    valueDescriptions={field.valueDescription}
                    max={field.max}
                    unit={field.unit}
                  />
                </li>
              );
            })}
          </ul>
        </Section>

        <Section title="Blood Sugar">
          <RangeDetail
            label="Blood Sugar Level"
            value={data.blood_sugar_level}
            valueDescriptions={rangeValueDescription({ low: 69, high: 110 })}
            max={700}
            unit="mg/dL"
          />
          <Detail label="Dosage" value={data.insulin_intake_dose} />
          <Detail
            label="Frequency"
            value={tOption(
              "INSULIN_INTAKE_FREQUENCY",
              "insulin_intake_frequency",
            )}
          />
        </Section>

        <Section title="Dialysis">
          <Detail
            label="Fluid Balance"
            value={data.dialysis_fluid_balance}
            suffix="ml/h"
          />
          <Detail
            label="Net Balance"
            value={data.dialysis_net_balance}
            suffix="ml/h"
          />
        </Section>

        <Section title="Vitals" show={!!data.pain_scale_enhanced?.length}>
          {data.bp && (
            <div className="mb-2 max-w-96 space-y-1 rounded border border-secondary-300 bg-secondary-100 p-3">
              <h5>Blood Pressure</h5>
              <RangeDetail
                label="Systolic"
                value={data.bp.systolic}
                max={250}
                unit="mmHg"
                valueDescriptions={rangeValueDescription({
                  low: 99,
                  high: 139,
                })}
              />
              <RangeDetail
                label="Diastolic"
                value={data.bp.diastolic}
                max={180}
                unit="mmHg"
                valueDescriptions={rangeValueDescription({ low: 49, high: 89 })}
              />
              <Detail
                label="Mean"
                value={meanArterialPressure(data.bp)?.toFixed()}
              />
            </div>
          )}
          <RangeDetail
            label={
              <span>
                SpO<sub>2</sub>
              </span>
            }
            value={data.ventilator_spo2}
            max={100}
            unit="%"
            valueDescriptions={rangeValueDescription({ low: 89 })}
          />
          <RangeDetail
            label="Temperature"
            value={data.temperature}
            max={106}
            unit="°F"
            valueDescriptions={rangeValueDescription({ low: 97.4, high: 99.6 })}
          />
          <RangeDetail
            label="Respiratory Rate"
            value={data.resp}
            max={150}
            unit="bpm"
            valueDescriptions={rangeValueDescription({ low: 11, high: 16 })}
          />
          <RangeDetail
            label="Pulse"
            value={data.pulse}
            unit="bpm"
            max={200}
            valueDescriptions={[
              {
                till: 40,
                className: "text-red-500",
                text: "Bradycardia",
              },
              {
                till: 100,
                className: "text-green-500",
                text: "Normal",
              },
              {
                className: "text-red-500",
                text: "Tachycardia",
              },
            ]}
          />
          <Detail
            label={t("LOG_UPDATE_FIELD_LABEL__rhythm")}
            value={data.rhythm && t(`HEARTBEAT_RHYTHM__${data.rhythm}`)}
          />
          <Detail
            label={t("LOG_UPDATE_FIELD_LABEL__rhythm_detail")}
            value={data.rhythm_detail}
          />
          {!!data.pain_scale_enhanced?.length && (
            <>
              <h4 className="py-4">Pain Scale</h4>
              <PainChart pain={data.pain_scale_enhanced ?? []} />
            </>
          )}
        </Section>

        {!!IOBalanceSections.flatMap((s) =>
          s.fields.flatMap((f) => data[f.key] ?? []),
        ).length && (
          <Section
            title="I/O Balance"
            show={IOBalanceSections.flatMap((s) =>
              s.fields.map((f) => f.key),
            ).some((field) => data[field]?.length)}
          >
            <div className="space-y-3">
              {IOBalanceSections.map(({ name, fields }) => (
                <div key={name} className="space-y-2">
                  <h5>{name}</h5>
                  <table className="border-collapse rounded bg-secondary-100 text-sm">
                    <thead className="border border-secondary-400">
                      <tr>
                        <th className="min-w-48 px-2 py-1 text-left">Name</th>
                        <th className="min-w-32 px-2 py-1 text-right">
                          Quantity
                        </th>
                      </tr>
                    </thead>
                    <tbody className="border border-secondary-400">
                      {fields.map((category) =>
                        data[category.key]?.map((row) => (
                          <tr>
                            <td className="px-2 py-1">
                              <span className="font-semibold">
                                {category.name}
                              </span>
                              : {row.name}
                            </td>
                            <td className="px-2 py-1 text-right">
                              {row.quantity} ml
                            </td>
                          </tr>
                        )),
                      )}
                    </tbody>
                    <tfoot className="border border-secondary-400 font-bold">
                      <tr>
                        <td className="px-2 py-1">Total {name}</td>
                        <td className="px-2 py-1 text-right">
                          {fields
                            .flatMap((f) =>
                              (data[f.key] || []).map((f) => f.quantity),
                            )
                            .reduce((a, b) => a + b, 0)}{" "}
                          ml
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ))}
              <Detail
                label="I/O Balance"
                value={IOBalanceSections.map((s) =>
                  s.fields
                    .flatMap((f) => (data[f.key] || []).map((f) => f.quantity))
                    .reduce((a, b) => a + b, 0),
                ).reduce((a, b) => a - b)}
                suffix="ml"
              />
            </div>
          </Section>
        )}

        {!!data.nursing?.length && (
          <Section title="Nursing Care">
            <ul>
              {data.nursing.map((care) => (
                <li key={care.procedure}>
                  <Detail
                    label={t(`NURSING_CARE_PROCEDURE__${care.procedure}`)}
                    value={care.description || t("no_remarks")}
                  />
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section
          title="Pressure Sore"
          show={!!(data.pressure_sore ?? []).length}
        >
          <PressureSore
            log={data}
            readonly
            onChange={() => {
              //
            }}
          />
        </Section>

        <Section title="Respiratory Support">
          <Detail
            label="Bilateral Air Entry"
            value={data.bilateral_air_entry}
          />
          <RangeDetail
            label={
              <span>
                EtCO<sub>2</sub>
              </span>
            }
            value={data.etco2}
            valueDescriptions={rangeValueDescription({ low: 34, high: 45 })}
            max={200}
            unit="mmHg"
          />

          <Detail
            label="Interface"
            value={tOption("RESPIRATORY_SUPPORT", "ventilator_interface")}
          />

          {data.ventilator_interface === "OXYGEN_SUPPORT" && (
            <>
              <Detail
                label="Oxygen Modality"
                value={tOption("OXYGEN_MODALITY", "ventilator_oxygen_modality")}
              />
              {data.ventilator_oxygen_modality === "HIGH_FLOW_NASAL_CANNULA" ? (
                <>
                  <RangeDetail
                    label="Flow Rate"
                    value={data.ventilator_oxygen_modality_flow_rate}
                    max={70}
                    unit=""
                    valueDescriptions={rangeValueDescription({
                      low: 34,
                      high: 60,
                    })}
                  />
                  <RangeDetail
                    label={
                      <span>
                        FiO<sub>2</sub>
                      </span>
                    }
                    value={data.ventilator_fio2}
                    max={100}
                    unit="%"
                    valueDescriptions={rangeValueDescription({ high: 60 })}
                  />
                </>
              ) : (
                <RangeDetail
                  label="Oxygen Flow Rate"
                  value={data.ventilator_oxygen_modality_oxygen_rate}
                  max={50}
                  unit=""
                  valueDescriptions={rangeValueDescription({
                    low: 4,
                    high: 10,
                  })}
                />
              )}
              <RangeDetail
                label={
                  <span>
                    SpO<sub>2</sub>
                  </span>
                }
                value={data.ventilator_spo2}
                max={100}
                unit="%"
                valueDescriptions={rangeValueDescription({ low: 89 })}
              />
            </>
          )}

          {(data.ventilator_interface === "INVASIVE" ||
            data.ventilator_interface === "NON_INVASIVE") && (
            <>
              <br />
              <Detail
                label="Ventilator Mode"
                value={tOption("VENTILATOR_MODE", "ventilator_mode")}
              />
              {VentilatorFields.map((field) => {
                const value = data[field.key];
                return (
                  <div className="pt-1">
                    <RangeDetail
                      label={field.label}
                      value={value}
                      valueDescriptions={field.valueDescription}
                      max={field.max}
                      unit={field.unit}
                    />
                  </div>
                );
              })}
            </>
          )}
        </Section>
      </Card>
    </div>
  );
}

type SectionContextType = {
  hasValue: () => void;
};

const sectionContext = React.createContext<SectionContextType | null>(null);

const Section = (props: {
  title: string;
  children: React.ReactNode;
  subSection?: boolean;
  show?: boolean;
}) => {
  const parentContext = React.useContext(sectionContext);
  const [hasValue, setHasValue] = React.useState(props.show ?? false);

  useEffect(() => {
    if (parentContext && hasValue) {
      parentContext.hasValue();
    }
  }, [parentContext, hasValue]);

  return (
    <sectionContext.Provider
      value={{
        hasValue: () => setHasValue(true),
      }}
    >
      <section
        id={props.title.toLowerCase().replaceAll(" ", "-")}
        className={classNames(
          props.subSection ? "py-6" : "border-b border-b-secondary-400 py-4",
          !hasValue && "hidden",
        )}
      >
        {props.subSection ? (
          <h5 className="pb-2">{props.title}</h5>
        ) : (
          <h3 className="pb-4">{props.title}</h3>
        )}
        {props.children}
      </section>
    </sectionContext.Provider>
  );
};

const Detail = (props: {
  label: React.ReactNode;
  value?: string | number | boolean | null;
  suffix?: React.ReactNode;
}) => {
  const context = React.useContext(sectionContext);

  let value = props.value;
  value = value === "" ? null : value;
  value = value === true ? "Yes" : value;
  value = value === false ? "No" : value;

  React.useEffect(() => {
    if (context && value != null) {
      context.hasValue();
    }
  }, [context, value]);

  if (value == null) {
    // Skip showing detail if attribute not filled.
    return null;
  }

  value = typeof value === "string" ? parseFloat(value) || value : value;
  value = typeof value === "number" ? properRoundOf(value) : value;

  return (
    <p>
      <span className="pr-1 font-semibold">{props.label}: </span>
      {value != null ? (
        <span>
          {value} {props.suffix}
        </span>
      ) : (
        <span className="text-secondary-700">--</span>
      )}
    </p>
  );
};

const ChoiceDetail = (props: {
  name: keyof DailyRoundsModel;
  data: DailyRoundsModel;
}) => {
  const { t } = useTranslation();
  const value = props.data[props.name];

  if (value == null) {
    return;
  }

  return (
    <Detail
      label={t(`LOG_UPDATE_FIELD_LABEL__${props.name}`)}
      value={t(`${props.name.toUpperCase()}__${value}`)}
    />
  );
};

const RangeDetail = (props: {
  label: React.ReactNode;
  value?: number;
  unit: React.ReactNode;
  max: number;
  valueDescriptions: ValueDescription[];
}) => {
  const valueDescription =
    props.value == null
      ? null
      : props.valueDescriptions.find(
          (vd) => (vd.till || props.max) >= (props.value || 0),
        );
  return (
    <Detail
      label={props.label}
      value={props.value}
      suffix={
        <span>
          {props.unit}{" "}
          <span
            className={classNames(
              "p-1 text-sm font-bold",
              valueDescription?.className,
            )}
          >
            {valueDescription?.text}
          </span>
        </span>
      }
    />
  );
};
