import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Radio,
  Box,
  RadioGroup,
  InputLabel,
} from "@material-ui/core";
import { useState } from "react";
import { Cancel, Submit } from "../Common/components/ButtonV2";
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
    <Dialog open={true} maxWidth={"sm"}>
      <DialogTitle
        className=" font-semibold text-3xl"
        id="font-semibold text-3xl"
      >
        Patient Records Found
      </DialogTitle>
      <DialogContent>
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
          <div>
            <InputLabel className="mb-2">
              Please select one option to continue or click cancel
            </InputLabel>
            <RadioGroup
              name="confirm_action"
              value={action}
              onChange={(e: any) => setAction(e.target.value)}
            >
              <Box display="flex" flexDirection="column">
                <FormControlLabel
                  value="transfer"
                  control={<Radio />}
                  className="bg-primary-500 text-white mb-2 pr-2 py-2 rounded-md w-full ml-0"
                  label="Admit the patient record to your facility by adding the date of birth"
                />
                <FormControlLabel
                  value="close"
                  control={<Radio />}
                  className="bg-red-500 text-white mb-2 pr-2 py-2 rounded-md w-full ml-0"
                  label="I confirm that the suspect / patient i want to create is not on the list."
                />
                <p>
                  Please contact your district care coordinator, the shifting
                  facility or the patient themselves if you are not sure about
                  the patient's date of birth.
                </p>
              </Box>
            </RadioGroup>
          </div>
        </div>
      </DialogContent>
      <DialogActions className="justify-between flex flex-col md:flex-row md:px-6">
        <Cancel
          onClick={handleCancel}
          label={`Cancel ${isNew ? "Registration" : "Update"}`}
        />
        <Submit
          onClick={() => handleOk(action)}
          disabled={!action}
          label="Continue"
        />
      </DialogActions>
    </Dialog>
  );
};

export default DuplicatePatientDialog;
