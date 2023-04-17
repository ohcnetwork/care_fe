import { useEffect, useState } from "react";
import CareIcon from "../../CAREUI/icons/CareIcon";
import AutoCompleteAsync from "../Form/AutoCompleteAsync";
import SelectMenuV2 from "../Form/SelectMenuV2";
import ToolTip from "../Common/utils/Tooltip";
import { PrescriptionDropdown } from "../Common/prescription-builder/PrescriptionDropdown";
import medicines_list from "../Common/prescription-builder/assets/medicines.json";
import { UserModel } from "../Users/models";
import ButtonV2, { Cancel, Submit } from "../Common/components/ButtonV2";
import { useDispatch } from "react-redux";
import {
  addPrescription,
  deletePrescription,
  updatePrescription,
} from "../../Redux/actions";
import { statusType } from "../../Common/utils";
import _ from "lodash";
import ConfirmDialogV2 from "../Common/ConfirmDialogV2";
import moment from "moment";
import DialogModal from "../Common/Dialog";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";

export const medicines = medicines_list;

const FREQUENCY = [
  { name: "Imediately", value: "STAT" },
  { name: "Once daily", value: "OD" },
  { name: "Night only", value: "HS" },
  { name: "Twice daily", value: "BD" },
  { name: "8th hourly", value: "TID" },
  { name: "6th hourly", value: "QID" },
  { name: "4th hourly", value: "Q4H" },
  { name: "Alternate day", value: "QOD" },
  { name: "Once a week", value: "QWK" },
];
export const ROUTES = [
  {
    name: "Oral",
    value: "ORAL",
  },
  {
    name: "IV",
    value: "IV",
  },
  {
    name: "IM",
    value: "IM",
  },
  {
    name: "S/C",
    value: "SC",
  },
];
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
  discontinued_date: string;
  created_date: string;
  modified_date: string;
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
        + Add Prescription
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [discontinueDialog, setDiscontinueDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPrescription(props.prescription);
  }, [props.prescription]);

  const handleSubmit = () => {
    if (prescription.external_id) {
      handleSave();
    } else {
      handleCreate();
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const res = await dispatchAction(
      updatePrescription(
        props.consultation,
        prescription.external_id,
        prescription
      )
    );
    if (res && res.data && res.status !== 400) {
      props.refreshPrescriptions({ aborted: false });
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);
    const res = await dispatchAction(
      deletePrescription(props.consultation, prescription.external_id)
    );
    if (res && res.status !== 400) {
      props.refreshPrescriptions({ aborted: false });
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    setLoading(true);
    const res = await dispatchAction(
      addPrescription(props.consultation, prescription)
    );
    if (res && res.data && res.status !== 400) {
      props.refreshPrescriptions({ aborted: false });
    }
    setLoading(false);
  };

  return (
    <div>
      <ConfirmDialogV2
        title="Delete Prescription"
        description="Are you sure you want to delete this prescription? You can set it as discontinued if the prescription is still valid."
        action="Confirm"
        variant="danger"
        show={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
      />
      <div
        className={`border-2 border-gray-500 mb-2 border-dashed border-spacing-2 p-3 rounded-md text-sm text-gray-600 ${
          prescription.discontinued ? "bg-gray-200 opacity-80" : ""
        }`}
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
              <ButtonV2 type="button" onClick={handleSubmit} loading={loading}>
                <CareIcon className="care-l-check w-4 h-4" />
                {prescription.external_id ? "Save" : "Create"}
              </ButtonV2>
            )}
            {prescription.external_id && (
              <>
                <ButtonV2
                  type="button"
                  variant="danger"
                  onClick={() => setShowDeleteDialog(true)}
                  loading={loading}
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
          <>
            <div className="flex gap-2 flex-col md:flex-row items-center md:mb-4">
              <div className="w-full">
                <div className="mb-2">
                  Medicine
                  <span className="font-bold text-danger-500">{" *"}</span>
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
                  onChange={(medicine) =>
                    setPrescription({ ...prescription, medicine })
                  }
                  showNOptions={medicines.length}
                  className="-mt-1"
                />
              </div>
              <div className="flex gap-2">
                <div className="w-[100px]">
                  <div className="mb-1">Route</div>
                  <SelectMenuV2
                    placeholder="Route"
                    options={ROUTES}
                    value={prescription.route}
                    onChange={(route) =>
                      setPrescription({ ...prescription, route: route || "" })
                    }
                    optionLabel={(option) => option.name}
                    optionValue={(option) => option.value}
                    required={false}
                    showChevronIcon={false}
                    className="mt-[2px]"
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
                          <SelectMenuV2
                            placeholder="Unit"
                            options={units}
                            value={prescription.dosage?.split(" ")[1] || "mg"}
                            onChange={(unit) =>
                              setPrescription({
                                ...prescription,
                                dosage: prescription.dosage
                                  ? prescription.dosage.split(" ")[0] +
                                    " " +
                                    unit
                                  : "0 mg",
                              })
                            }
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
                <div className="mb-1">
                  Indicator
                  <span className="font-bold text-danger-500">{" *"}</span>
                </div>
                <input
                  type="text"
                  className="cui-input-base"
                  value={prescription.indicator}
                  placeholder="Indicator"
                  onChange={(e) => {
                    setPrescription({
                      ...prescription,
                      indicator: e.target.value,
                    });
                  }}
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
                        setPrescription({
                          ...prescription,
                          max_dosage:
                            value +
                            " " +
                            (prescription.max_dosage?.split(" ")[1] || "mg"),
                        });
                      }}
                      required
                    />
                    <div className="w-[80px] shrink-0">
                      <SelectMenuV2
                        placeholder="Unit"
                        options={units}
                        value={prescription.max_dosage?.split(" ")[1] || "mg"}
                        onChange={(unit) =>
                          setPrescription({
                            ...prescription,
                            max_dosage: prescription.max_dosage
                              ? prescription.max_dosage.split(" ")[0] +
                                " " +
                                unit
                              : "0 mg",
                          })
                        }
                        optionLabel={(option) => option}
                        required={false}
                        showChevronIcon={false}
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
                    options={[1, 2, 3, 6, 12, 24]}
                    value={prescription.min_hours_between_doses || 0}
                    onChange={(min_time) =>
                      min_time &&
                      (min_time > 0
                        ? setPrescription({
                            ...prescription,
                            min_hours_between_doses: min_time,
                          })
                        : 0)
                    }
                    optionLabel={(option) => option}
                    required={false}
                  />
                  <div className="ml-2">Hrs.</div>
                </div>
              </div>
            </div>
          </>
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
                    options={ROUTES}
                    value={prescription.route}
                    onChange={(route) =>
                      setPrescription({ ...prescription, route: route || "" })
                    }
                    optionLabel={(option) => option.name}
                    optionValue={(option) => option.value}
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
                    options={FREQUENCY}
                    value={prescription.frequency}
                    onChange={(freq) =>
                      setPrescription({
                        ...prescription,
                        frequency: freq || "",
                      })
                    }
                    optionLabel={(option) => option.name}
                    optionValue={(option) => option.value}
                    optionIcon={(option) => (
                      <ToolTip
                        className="-right-2 bottom-[calc(100%+1px)] max-w-[100px]"
                        position="CUSTOM"
                        text={<span>{option.value}</span>}
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
        <div className="flex items-center justify-between gap-4">
          <div className="text-xs mt-4 flex gap-4">
            {prescription.external_id && (
              <>
                <div>
                  Last updated:{" "}
                  <b>{moment(prescription.modified_date).format("lll")}</b>
                  <br />
                  Created:{" "}
                  <b>{moment(prescription.created_date).format("lll")}</b>
                  <br />
                  By: <b>{prescription.prescribed_by.username}</b>
                </div>
                {prescription.discontinued && (
                  <div>
                    {prescription.discontinued_date && (
                      <>
                        Discontinued on:{" "}
                        <b>
                          {moment(prescription.discontinued_date).format("lll")}
                        </b>
                      </>
                    )}
                    <br />
                    Discontinue Reason:{" "}
                    <b>{prescription.discontinued_reason}</b>
                  </div>
                )}
              </>
            )}
          </div>
          <div>
            <div className="shrink-0 flex flex-col gap-2 text-xs items-center md:mt-3 cursor-pointer">
              Discontinued
              <input
                type="checkbox"
                className="inline-block rounded-md w-[18px] h-[18px]"
                checked={prescription.discontinued}
                onChange={(e) => {
                  !prescription.discontinued
                    ? setDiscontinueDialog(true)
                    : setPrescription({
                        ...prescription,
                        discontinued: e.target.checked,
                      });
                }}
              />
            </div>
          </div>
        </div>
      </div>
      <DialogModal
        title={
          <div>
            <p>Discontinue Medication?</p>
          </div>
        }
        show={discontinueDialog}
        onClose={() => {
          setDiscontinueDialog(false);
          setPrescription({
            ...prescription,
            discontinued: false,
          });
        }}
        className="md:max-w-3xl"
      >
        <div className="mt-6 flex flex-col">
          <TextAreaFormField
            label="Reason to discontinue"
            name="reason"
            value={prescription.discontinued_reason}
            onChange={(e) => {
              setPrescription({
                ...prescription,
                discontinued_reason: e.value,
              });
            }}
          />
        </div>
        <div className="flex flex-col md:flex-row gap-2 pt-4 md:justify-end">
          <Cancel
            onClick={() => {
              setDiscontinueDialog(false);
              setPrescription({
                ...prescription,
                discontinued: false,
              });
            }}
          />
          <Submit
            onClick={() => {
              setPrescription({
                ...prescription,
                discontinued: true,
              });
              setDiscontinueDialog(false);
            }}
            label="Discontinue"
            autoFocus
          />
        </div>
      </DialogModal>
    </div>
  );
}
