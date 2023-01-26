import { useState } from "react";
import AutoCompleteAsync from "../../Form/AutoCompleteAsync";
import SelectMenuV2 from "../../Form/SelectMenuV2";
import { medicines, routes, units } from "./PrescriptionBuilder";
import CareIcon from "../../../CAREUI/icons/CareIcon";

export type PRNPrescriptionType = {
  medicine?: string;
  route?: string;
  dosage?: string;
  indicator?: string;
  max_dosage?: string;
  min_time?: number;
};

export const PRNEmptyValues = {
  medicine: "",
  route: "",
  dosage: "0 mg",
  max_dosage: "0 mg",
  indicator: "",
  min_time: 0,
};

const DOSAGE_HRS = [1, 2, 3, 6, 12, 24];

export interface PrescriptionBuilderProps<T> {
  prescriptions: T[];
  setPrescriptions: React.Dispatch<React.SetStateAction<T[]>>;
}

export default function PRNPrescriptionBuilder(
  props: PrescriptionBuilderProps<PRNPrescriptionType>
) {
  const { prescriptions, setPrescriptions } = props;

  const setItem = (object: PRNPrescriptionType, i: number) => {
    setPrescriptions(
      prescriptions.map((prescription, index) =>
        index === i ? object : prescription
      )
    );
  };

  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  return (
    <div className="mt-2">
      {prescriptions.map((prescription, i) => {
        const setMedicine = (medicine: string) => {
          setItem(
            {
              ...prescription,
              medicine,
            },
            i
          );
        };

        const setRoute = (route: string) => {
          setItem(
            {
              ...prescription,
              route,
            },
            i
          );
        };

        const setDosageUnit = (unit: string) => {
          setItem(
            {
              ...prescription,
              dosage: prescription.dosage
                ? prescription.dosage.split(" ")[0] + " " + unit
                : "0 mg",
            },
            i
          );
        };

        const setMaxDosageUnit = (unit: string) => {
          setItem(
            {
              ...prescription,
              max_dosage: prescription.max_dosage
                ? prescription.max_dosage.split(" ")[0] + " " + unit
                : "0 mg",
            },
            i
          );
        };

        const setMinTime = (min_time: number) => {
          setItem(
            {
              ...prescription,
              min_time,
            },
            i
          );
        };

        return (
          <div
            key={i}
            className={`border-2 ${
              activeIdx === i ? "border-primary-500" : "border-gray-500"
            } mb-2 border-dashed border-spacing-2 p-3 rounded-md text-sm text-gray-600`}
          >
            <div className="flex flex-wrap md:flex-row md:gap-4 gap-2 items-center mb-2">
              <h4 className="text-base font-medium text-gray-700">
                Prescription No. {i + 1}
              </h4>
              <button
                type="button"
                className="h-full flex justify-center items-center gap-1.5 text-gray-100 rounded-md text-sm transition hover:bg-red-600 px-3 py-1 bg-red-500"
                onClick={() => {
                  setPrescriptions(
                    prescriptions.filter((prescription, index) => i != index)
                  );
                }}
              >
                Delete Prescription
                <CareIcon className="care-l-trash-alt w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2 flex-col md:flex-row items-center md:mb-4">
              <div className="w-full">
                <div className="mb-2">
                  Medicine<span className="font-bold text-danger-500">{" *"}</span>
                </div>
                <AutoCompleteAsync
                  placeholder="Medicine"
                  selected={prescription.medicine}
                  fetchData={(search) => {
                    return Promise.resolve(
                      medicines.filter((medicine: string) =>
                        medicine.toLowerCase().includes(search.toLowerCase())
                      )
                    );
                  }}
                  optionLabel={(option) => option}
                  onChange={setMedicine}
                  showNOptions={medicines.length}
                  className="-mt-1"
                  onFocus={() => setActiveIdx(i)}
                  onBlur={() => setActiveIdx(null)}
                />
              </div>
              <div className="flex gap-2">
                <div className="w-[100px]">
                  <div className="mb-1">Route</div>
                  <SelectMenuV2
                    placeholder="Route"
                    options={routes}
                    value={prescription.route}
                    onChange={(route) => setRoute(route || "")}
                    optionLabel={(option) => option}
                    required={false}
                    showChevronIcon={false}
                    className="mt-[2px]"
                    onFocus={() => setActiveIdx(i)}
                    onBlur={() => setActiveIdx(null)}
                  />
                </div>
                <div>
                  <div className="w-full md:w-[160px] flex gap-2 shrink-0">
                    <div>
                      <div className="mb-1">Dosage</div>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          className="cui-input-base py-0"
                          value={prescription.dosage?.split(" ")[0]}
                          placeholder="Dosage"
                          min={0}
                          onChange={(e) => {
                            let value = parseFloat(e.target.value);
                            if (value < 0) {
                              value = 0;
                            }
                            setItem(
                              {
                                ...prescription,
                                dosage:
                                  value +
                                  " " +
                                  (prescription.dosage?.split(" ")[1] || "mg"),
                              },
                              i
                            );
                          }}
                          required
                          onFocus={() => setActiveIdx(i)}
                          onBlur={() => setActiveIdx(null)}
                        />
                        <div className="w-[80px] shrink-0">
                          <SelectMenuV2
                            placeholder="Unit"
                            options={units}
                            value={prescription.dosage?.split(" ")[1] || "mg"}
                            onChange={(dosage) => setDosageUnit(dosage || "")}
                            optionLabel={(option) => option}
                            required={false}
                            showChevronIcon={false}
                            onFocus={() => setActiveIdx(i)}
                            onBlur={() => setActiveIdx(null)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-2 flex-col md:flex-row">
              <div className="w-full">
                <div className="mb-1">
                  Indicator<span className="font-bold text-danger-500">{" *"}</span>
                </div>
                <input
                  type="text"
                  className="cui-input-base"
                  value={prescription.indicator}
                  placeholder="Indicator"
                  onChange={(e) => {
                    setItem(
                      {
                        ...prescription,
                        indicator: e.target.value,
                      },
                      i
                    );
                  }}
                  onFocus={() => setActiveIdx(i)}
                  onBlur={() => setActiveIdx(null)}
                />
              </div>
              <div className="w-full md:w-[170px] flex gap-2 shrink-0">
                <div>
                  <div className="mb-1">Max Dosage in 24 hrs.</div>

                  <div className="flex gap-1">
                    <input
                      type="number"
                      className="cui-input-base py-2"
                      value={prescription.max_dosage?.split(" ")[0]}
                      placeholder="Dosage"
                      min={0}
                      onChange={(e) => {
                        let value = parseFloat(e.target.value);
                        if (value < 0) {
                          value = 0;
                        }
                        setItem(
                          {
                            ...prescription,
                            max_dosage:
                              value +
                              " " +
                              (prescription.max_dosage?.split(" ")[1] || "mg"),
                          },
                          i
                        );
                      }}
                      required
                      onFocus={() => setActiveIdx(i)}
                      onBlur={() => setActiveIdx(null)}
                    />
                    <div className="w-[80px] shrink-0">
                      <SelectMenuV2
                        placeholder="Unit"
                        options={units}
                        value={prescription.max_dosage?.split(" ")[1] || "mg"}
                        onChange={(dosage) => setMaxDosageUnit(dosage || "")}
                        optionLabel={(option) => option}
                        required={false}
                        showChevronIcon={false}
                        onFocus={() => setActiveIdx(i)}
                        onBlur={() => setActiveIdx(null)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-[160px] shrink-0">
                <div className="mb-1">Min. time btwn. 2 doses</div>
                <div className="flex items-center">
                  <SelectMenuV2
                    placeholder="hours"
                    options={DOSAGE_HRS}
                    value={prescription.min_time || 0}
                    onChange={(min_time) =>
                      min_time && (min_time > 0 ? setMinTime(min_time) : 0)
                    }
                    optionLabel={(option) => option}
                    required={false}
                    onFocus={() => setActiveIdx(i)}
                    onBlur={() => setActiveIdx(null)}
                  />
                  <div className="ml-2">Hrs.</div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => {
          setPrescriptions([...prescriptions, PRNEmptyValues]);
        }}
        className="shadow-sm mt-4 bg-gray-200 w-full font-bold block px-4 py-2 text-sm leading-5 text-left text-gray-700 hover:bg-gray-300 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900"
      >
        + Add Prescription
      </button>
    </div>
  );
}
