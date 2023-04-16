import { useEffect, useState } from "react";
import CareIcon from "../../CAREUI/icons/CareIcon";
import AutoCompleteAsync from "../Form/AutoCompleteAsync";
import SelectMenuV2 from "../Form/SelectMenuV2";
import ToolTip from "../Common/utils/Tooltip";
import { PrescriptionDropdown } from "../Common/prescription-builder/PrescriptionDropdown";
import medicines_list from "../Common/prescription-builder/assets/medicines.json";
import { UserModel } from "../Users/models";
import ButtonV2 from "../Common/components/ButtonV2";
import { useDispatch } from "react-redux";
import { addPrescription } from "../../Redux/actions";
import { statusType } from "../../Common/utils";
import _ from "lodash";

export const medicines = medicines_list;

const frequency = ["Stat", "od", "hs", "bd", "tid", "qid", "q4h", "qod", "qwk"];
const frequencyTips = {
  Stat: "Immediately",
  od: "once daily",
  hs: "Night only",
  bd: "Twice daily",
  tid: "8th hourly",
  qid: "6th hourly",
  q4h: "4th hourly",
  qod: "Alternate day",
  qwk: "Once a week",
};
export const routes = ["Oral", "IV", "IM", "S/C"];
export const units = ["mg", "g", "ml", "drops", "ampule", "tsp"];

type BasePrescriptionType = {
  external_id: string;
  medicine: string;
  route: string;
  dosage: string;
  notes: string;
  meta: any;
  prescribed_by: UserModel;
  discontinued: boolean;
  discontinued_reason: string;
  discontinued_data: string;
  created_date: string;
  modified_data: string;
};

type NormalPrescription = {
  frequency: string;
  days: number;
  is_prn: false;
};

type PRNPrescription = {
  indicator: string;
  max_dosage: string;
  min_hours_between_doses: number;
  is_prn: true;
};

export type PrescriptionType = BasePrescriptionType &
  (NormalPrescription | PRNPrescription);

const baseEmptyValues = {
  medicine: "",
  route: "",
  dosage: "0 mg",
  notes: "",
  meta: {},
};

const normalEmptyValues = {
  frequency: "od",
  days: 1,
  is_prn: false,
};

const PRNEmptyValues = {
  indicator: "",
  max_dosage: "0 mg",
  min_hours_between_doses: 0,
  is_prn: true,
};

export default function PrescriptionBuilder(props: {
  consultation: string;
  prescriptions: PrescriptionType[];
  type: "normal" | "prn";
  fetchPrescriptions: (status: statusType) => Promise<void>;
}) {
  const { consultation, prescriptions, type, fetchPrescriptions } = props;

  const pres = prescriptions.filter(
    (prescription) => prescription.is_prn === (type === "prn")
  );
  const [addPrescriptionForm, setAddPrescriptionForm] = useState(false);

  const emptyValues = {
    ...baseEmptyValues,
    ...(type === "normal" ? normalEmptyValues : PRNEmptyValues),
  };

  const refreshPrescriptions = (status: statusType) => {
    setAddPrescriptionForm(false);
    fetchPrescriptions(status);
  };

  return (
    <div className="mt-2">
      {pres.map((prescription, i) => (
        <PrescriptionForm
          prescription={prescription}
          key={i}
          consultation={consultation}
          refreshPrescriptions={refreshPrescriptions}
        />
      ))}
      {addPrescriptionForm && (
        <PrescriptionForm
          prescription={{
            ...(emptyValues as any),
          }}
          consultation={consultation}
          refreshPrescriptions={refreshPrescriptions}
        />
      )}
      <button
        type="button"
        onClick={() => {
          setAddPrescriptionForm(!addPrescriptionForm);
        }}
        className="shadow-sm mt-4 bg-gray-200 w-full font-bold block px-4 py-2 text-sm leading-5 text-left text-gray-700 hover:bg-gray-300 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900"
      >
        + Add Medicine
      </button>
    </div>
  );
}

export function PrescriptionForm(props: {
  prescription: PrescriptionType;
  consultation: string;
  refreshPrescriptions: (status: statusType) => void;
}) {
  const [prescription, setPrescription] = useState(props.prescription);
  const dispatchAction: any = useDispatch();

  useEffect(() => {
    setPrescription(props.prescription);
  }, [props.prescription]);

  const handleSubmit = () => {
    if (prescription.external_id) {
      console.log("update");
    } else {
      handleCreate();
    }
  };

  const handleDelete = () => {
    console.log("delete");
  };

  const handleCreate = async () => {
    const res = await dispatchAction(
      addPrescription(props.consultation, prescription)
    );
    if (res && res.data && res.status !== 400) {
      props.refreshPrescriptions({ aborted: false });
    }
  };

  return (
    <div>
      <div
        className={
          "border-2 border-gray-500 mb-2 border-dashed border-spacing-2 p-3 rounded-md text-sm text-gray-600"
        }
      >
        <div className="flex flex-wrap md:flex-row md:gap-4 gap-2 items-center mb-2 justify-between">
          <div>
            {prescription.external_id && (
              <>
                <div className="text-xs">Prescription ID</div>
                <h4 className="text-sm font-medium text-gray-700">
                  {prescription.external_id}
                </h4>
              </>
            )}
          </div>
          <div>
            {_.isEqual(props.prescription, prescription) || (
              <ButtonV2 type="button" onClick={handleSubmit}>
                <CareIcon className="care-l-check w-4 h-4" />
                {prescription.external_id ? "Save" : "Create"}
              </ButtonV2>
            )}
            {prescription.external_id && (
              <>
                <ButtonV2
                  type="button"
                  variant="danger"
                  onClick={handleDelete}
                  className="ml-2"
                >
                  <CareIcon className="care-l-trash-alt w-4 h-4" />
                  Delete
                </ButtonV2>
              </>
            )}
          </div>
        </div>
        {prescription.is_prn ? (
          <></>
        ) : (
          <>
            <div className="flex gap-2 flex-col md:flex-row md:mb-4">
              <div className="w-full">
                <div className="mb-1">
                  Medicine <span className="font-bold text-red-600">*</span>
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
                  onChange={(medicine) => {
                    setPrescription({
                      ...prescription,
                      medicine: medicine,
                    });
                  }}
                  showNOptions={medicines.length}
                />
              </div>
              <div className="flex gap-2">
                <div>
                  <div className="mb-1">Route</div>
                  <SelectMenuV2
                    placeholder="Route"
                    options={routes}
                    value={prescription.route}
                    onChange={(route) =>
                      setPrescription({ ...prescription, route: route || "" })
                    }
                    optionLabel={(option) => option}
                    required={false}
                    className="mt-[6px]"
                  />
                </div>
                <div>
                  <div className="mb-1">
                    Frequency <span className="font-bold text-red-600">*</span>
                  </div>
                  <SelectMenuV2
                    placeholder="Frequency"
                    options={frequency}
                    value={prescription.frequency.toLowerCase()}
                    onChange={(freq) =>
                      setPrescription({
                        ...prescription,
                        frequency: freq?.toUpperCase() || "",
                      })
                    }
                    optionLabel={(option) => option}
                    optionIcon={(option) => (
                      <ToolTip
                        className="-right-2 bottom-[calc(100%+1px)] max-w-[100px]"
                        position="CUSTOM"
                        text={
                          <span>
                            {
                              frequencyTips[
                                option as keyof typeof frequencyTips
                              ]
                            }
                          </span>
                        }
                      >
                        <i className="fa-solid fa-circle-info"></i>
                      </ToolTip>
                    )}
                    showIconWhenSelected={false}
                    required={false}
                    className="mt-[6px] w-[150px]"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-2 flex-col md:flex-row">
              <div className="w-full md:w-[260px] flex gap-2 shrink-0">
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
                        setPrescription({
                          ...prescription,
                          dosage:
                            value +
                            " " +
                            (prescription.dosage?.split(" ")[1] || "mg"),
                        });
                      }}
                      required
                    />
                    <div className="w-[80px] shrink-0">
                      <PrescriptionDropdown
                        placeholder="Unit"
                        options={units}
                        value={prescription.dosage?.split(" ")[1] || "mg"}
                        setValue={(unit) => {
                          setPrescription({
                            ...prescription,
                            dosage: prescription.dosage
                              ? prescription.dosage.split(" ")[0] + " " + unit
                              : "0 mg",
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="w-[70px] shrink-0">
                  <div className="mb-1">Days</div>
                  <input
                    type="number"
                    className="cui-input-base py-2"
                    value={prescription.days}
                    placeholder="Days"
                    min={0}
                    onChange={(e) => {
                      let value = parseInt(e.target.value);
                      if (value < 0) {
                        value = 0;
                      }
                      setPrescription({
                        ...prescription,
                        days: value,
                      });
                    }}
                    required
                  />
                </div>
              </div>

              <div className="w-full">
                <div className="mb-1">Notes</div>
                <input
                  type="text"
                  className="cui-input-base py-2"
                  value={prescription.notes}
                  placeholder="Notes"
                  onChange={(e) => {
                    setPrescription({
                      ...prescription,
                      notes: e.target.value,
                    });
                  }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
