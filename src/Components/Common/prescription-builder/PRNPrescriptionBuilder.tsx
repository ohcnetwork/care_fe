import AutoCompleteAsync from "../../Form/AutoCompleteAsync";
import SelectMenuV2 from "../../Form/SelectMenuV2";
import { medicines, routes, units } from "./PrescriptionBuilder";

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
            className="border-b border-b-gray-500 border-dashed py-2 text-xs text-gray-600"
          >
            <div className="flex gap-2 flex-col md:flex-row items-center">
              <div className="w-full">
                Medicine
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
                />
              </div>
              <div className="flex gap-2">
                <div className="w-[100px]">
                  Route
                  <SelectMenuV2
                    placeholder="Route"
                    options={routes}
                    value={prescription.route}
                    onChange={(route) => setRoute(route || "")}
                    optionLabel={(option) => option}
                    required={false}
                    showChevronIcon={false}
                    className="mt-[2px]"
                  />
                </div>
                <div>
                  <div className="w-full md:w-[160px] flex gap-2 shrink-0">
                    <div>
                      Dosage
                      <div className="flex gap-1 mt-[2px] h-12">
                        <input
                          type="number"
                          className="text-gray-700 bg-gray-200 w-full focus:border-primary-400 block border rounded px-4 text-sm"
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
                Indicator
                <input
                  type="text"
                  className="border w-full focus:ring-primary-500 focus:border-primary-500 block border-gray-400 rounded py-3 px-4 text-sm bg-gray-100 hover:bg-gray-200 focus:outline-none focus:bg-white"
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
                />
              </div>
              <div className="w-full md:w-[160px] flex gap-2 shrink-0">
                <div>
                  Max Dosage in 24 hrs.
                  <div className="flex gap-1">
                    <input
                      type="number"
                      className="w-full focus:ring-primary-500 focus:border-primary-500 block border border-gray-400 rounded py-2 px-4 text-sm bg-gray-100 hover:bg-gray-200 focus:outline-none focus:bg-white"
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
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-[160px] shrink-0">
                Min. time btwn. 2 doses
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
                  />
                  <div className="ml-2">Hrs.</div>
                </div>
              </div>

              <button
                type="button"
                className="text-gray-400 text-base transition hover:text-red-500"
                onClick={() => {
                  setPrescriptions(
                    prescriptions.filter((prescription, index) => i != index)
                  );
                }}
              >
                <i className="fas fa-trash" />
              </button>
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
