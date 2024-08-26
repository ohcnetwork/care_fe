import { useTranslation } from "react-i18next";
import routes from "../../Redux/api";
import useQuery from "../../Utils/request/useQuery";
import ButtonV2 from "../Common/components/ButtonV2";
import Loading from "../Common/Loading";
import Card from "../../CAREUI/display/Card";
import React from "react";
import { ABGAnalysisFields } from "./Sections/ABGAnalysis";
import {
  classNames,
  properRoundOf,
  rangeValueDescription,
  ValueDescription,
} from "../../Utils/utils";
import { VentilatorFields } from "./Sections/RespiratorySupport/Ventilator";
import PressureSore from "./Sections/PressureSore/PressureSore";
import { IOBalanceSections } from "./Sections/IOBalance";
import PainChart from "./components/PainChart";
import { meanArterialPressure } from "../Common/BloodPressureFormField";

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
          variant="secondary"
          href={`/facility/${props.facilityId}/patient/${props.patientId}/consultation/${props.consultationId}`}
        >
          {t("back_to_consultation")}
        </ButtonV2>
      </div>

      <Card className="md:rounded-xl lg:p-8">
        <h2 className="mb-3 text-black">Consultation Updates</h2>

        <Section title="General">
          {/* <EncounterSymptomsCard /> */}
          <Detail
            label="Physical Examination Info"
            value={data.physical_examination_info}
          />
          <Detail label="Other Details" value={data.other_details} />
        </Section>

        <Section title="Neurological Monitoring">
          <Detail
            label="Level of Consciousness"
            value={tOption("CONSCIOUSNESS_LEVEL", "consciousness_level")}
          />
          <div className="grid gap-x-4 gap-y-2 py-2 md:grid-cols-2">
            {(["left", "right"] as const).map((dir) => (
              <div className="rounded border border-secondary-300 bg-secondary-100 p-3">
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

        <Section title="Vitals">
          {data.bp && (
            <div className="mb-2 max-w-96 space-y-1 rounded border border-secondary-300 bg-secondary-100 p-3">
              <h5>Blood Pressure</h5>
              <RangeDetail
                label="Systolic"
                value={data.bp.systolic}
                max={400}
                unit="mmHg"
                valueDescriptions={rangeValueDescription({
                  low: 99,
                  high: 139,
                })}
              />
              <RangeDetail
                label="Diastolic"
                value={data.bp.diastolic}
                max={400}
                unit="mmHg"
                valueDescriptions={rangeValueDescription({ low: 49, high: 89 })}
              />
              <Detail
                label="Mean"
                value={data.bp && meanArterialPressure(data.bp)}
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
          <h4 className="py-4">Pain Scale</h4>
          <PainChart pain={data.pain_scale_enhanced ?? []} />
        </Section>

        {!!IOBalanceSections.flatMap((s) =>
          s.fields.flatMap((f) => data[f.key] ?? []),
        ).length && (
          <Section title="I/O Balance">
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
                    value={care.description}
                  />
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section title="Pressure Sore">
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

const Section = (props: { title: string; children: React.ReactNode }) => {
  return (
    <section
      id={props.title.toLowerCase().replaceAll(" ", "-")}
      className="border-b border-b-secondary-400 py-6"
    >
      <h3 className="pb-4">{props.title}</h3>
      {props.children}
    </section>
  );
};

const Detail = (props: {
  label: React.ReactNode;
  value?: string | number | boolean;
  suffix?: React.ReactNode;
}) => {
  let value = props.value;
  value = value === "" ? undefined : value;
  value = value === true ? "Yes" : value;
  value = value === false ? "No" : value;

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
