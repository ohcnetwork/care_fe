import { useState } from "react";
import { Cancel, Submit } from "../Common/components/ButtonV2";
import DialogModal from "../Common/Dialog";
import { DupPatientModel } from "./models";

interface Props {
  patientList: Array<DupPatientModel>;
  handleOk: (action: string) => void;
  handleCancel: () => void;
  isNew: boolean;
}

const tdClass = "border border-secondary-400 p-2 text-left";

const DuplicatePatientDialog = (props: Props) => {
  const { patientList, handleOk, handleCancel, isNew } = props;
  const [action, setAction] = useState("");

  return (
    <DialogModal
      title="Patient Records Found"
      show={true}
      onClose={handleCancel}
      className="w-3/4 md:w-1/2"
    >
      <div className="grid grid-cols-1 gap-4">
        <div>
          <p className="text-sm leading-relaxed">
            It appears that there are patient records that contain the same
            phone number as the one you just entered. (
            <span className="font-bold">{patientList[0].phone_number}</span>)
          </p>
        </div>
        <div>
          <div className="max-h-[200px] overflow-auto rounded border border-y-secondary-400">
            <table className="relative w-full border-collapse">
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
                        <div className="font-semibold capitalize">
                          {patient.name}
                        </div>
                        <div className="break-words text-xs">
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
          <div className="mb-2 flex items-center">
            <label
              className="mb-2 ml-0 flex w-full rounded-md bg-primary-500 py-2 pr-2 text-white"
              htmlFor="transfer"
            >
              <input
                type="radio"
                className="m-3 text-green-600 focus:ring-2 focus:ring-green-500"
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

          <div className="mb-2 flex items-center">
            <label
              className="mb-2 ml-0 flex w-full rounded-md bg-red-500 py-2 pr-2 text-white"
              htmlFor="close"
            >
              <input
                type="radio"
                id="close"
                className="m-3 text-red-600 focus:ring-2 focus:ring-red-500"
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
      <div className="mt-4 flex flex-col justify-between sm:flex-row">
        <Cancel
          onClick={handleCancel}
          className="mb-2 sm:mb-0"
          label={`Cancel ${isNew ? "Registration" : "Update"}`}
        />
        <Submit
          id="submit-continue-button"
          onClick={() => handleOk(action)}
          disabled={!action}
          label="Continue"
        />
      </div>
    </DialogModal>
  );
};

export default DuplicatePatientDialog;
