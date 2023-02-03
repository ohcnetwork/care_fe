import { useState } from "react";
import { Cancel, Submit } from "../Common/components/ButtonV2";
import DialogModal from "../Common/Dialog";
import { FieldLabel } from "../Form/FormFields/FormField";
import { DupPatientModel } from "./models";

interface Props {
  patientList: Array<DupPatientModel>;
  handleOk: (action: string) => void;
  handleCancel: () => void;
  isNew: boolean;
}

const tdClass = "border border-gray-400 p-2 text-left";

const DuplicatePatientDialog = (props: Props) => {
  const { patientList, handleOk, handleCancel, isNew } = props;
  const [action, setAction] = useState("");

  return (
    <DialogModal
      title={<FieldLabel className="text-lg">Patient Records Found</FieldLabel>}
      show={true}
      onClose={handleCancel}
      className="w-3/4 md:w-1/2"
    >
      <div className="grid gap-4 grid-cols-1">
        <div>
          <p className="leading-relaxed text-sm">
            It appears that there are patient records that contain the same
            phone number as the one you just entered. (
            <span className="font-bold">{patientList[0].phone_number}</span>)
          </p>
        </div>
        <div>
          <div className="max-h-[200px] overflow-auto rounded border border-y-gray-400">
            <table className="w-full relative border-collapse">
              <thead>
                <tr className="border-separate">
                  {["Patient Name and ID", "Gender"].map((heading, i) => (
                    <th
                      key={i}
                      className={tdClass + " sticky top-0 bg-white/90"}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {patientList.map((patient, i) => {
                  return (
                    <tr key={i}>
                      <td className={tdClass}>
                        <div className="font-semibold">{patient.name}</div>
                        <div className="text-xs break-words">
                          ID : {patient.patient_id}
                        </div>
                      </td>
                      <td className={tdClass}>{patient.gender}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center mb-2">
            <label
              className="flex bg-primary-500 text-white mb-2 pr-2 py-2 rounded-md w-full ml-0"
              htmlFor="transfer"
            >
              <input
                type="radio"
                className="m-3"
                id="transfer"
                name="confirm_action"
                value="transfer"
                onChange={(e) => setAction(e.target.value)}
              />
              <p>
                Admit the patient record to your facility by adding the date of
                birth
              </p>
            </label>
          </div>

          <div className="flex items-center mb-2">
            <label
              className="flex bg-red-500 text-white mb-2 pr-2 py-2 rounded-md w-full ml-0"
              htmlFor="close"
            >
              <input
                type="radio"
                id="close"
                className="m-3"
                name="confirm_action"
                value="close"
                onChange={(e) => setAction(e.target.value)}
              />
              <p>
                I confirm that the suspect / patient I want to create is not on
                the list.
              </p>
            </label>
          </div>

          <p>
            Please contact your district care coordinator, the shifting facility
            or the patient themselves if you are not sure about the patient's
            date of birth.
          </p>
        </div>
      </div>
      <div className="mt-4 flex justify-between flex-col sm:flex-row">
        <Cancel
          onClick={handleCancel}
          className="mb-2 sm:mb-0"
          label={`Cancel ${isNew ? "Registration" : "Update"}`}
        />
        <Submit
          onClick={() => handleOk(action)}
          disabled={!action}
          label="Continue"
        />
      </div>
    </DialogModal>
  );
};

export default DuplicatePatientDialog;
