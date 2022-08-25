import {
  Button,
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
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import { WithStyles, withStyles } from "@material-ui/styles";
import { useState } from "react";
import { DupPatientModel } from "./models";

interface Props {
  patientList: Array<DupPatientModel>;
  handleOk: (action: string) => void;
  handleCancel: () => void;
  isNew: boolean;
}

const styles = {
  paper: {
    "max-width": "650px",
    "min-width": "400px",
  },
};

const tdClass = "border border-gray-400 p-2 text-left";

const DuplicatePatientDialog = (props: Props & WithStyles<typeof styles>) => {
  const { patientList, handleOk, handleCancel, classes, isNew } = props;
  const [action, setAction] = useState("");

  const text = isNew ? "registration" : "update";

  return (
    <Dialog
      open={true}
      classes={{
        paper: classes.paper,
      }}
    >
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
              It appears that there are patient records that contain the same phone number as the one you just entered. (
              <span className="font-bold">{patientList[0].phone_number}</span>)
            </p>
          </div>
          <div>
            <div className="max-h-[200px] overflow-auto rounded border border-y-gray-400">
              <table className="w-full relative border-collapse">
                <thead>
                  <tr className="border-separate">
                    {
                      ["Patient Name and ID", "Gender"].map((heading, i)=>(
                        <th key={i} className={tdClass + " sticky top-0 bg-white/90"}>
                          {heading}
                        </th>
                      ))
                    }
                  </tr>
                </thead>
                <tbody>
                  {
                    patientList.map((patient, i)=>{
                      return (
                        <tr key={i}>
                          <td className={tdClass}>
                            <div className="font-semibold">
                              {patient.name}
                            </div>
                            <div className="text-xs break-words">
                              ID : {patient.patient_id}
                            </div>
                          </td>
                          <td className={tdClass}>
                            {patient.gender}
                          </td>
                        </tr>

                      )
                    })
                  }
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
              style={{ padding: "0px 5px" }}
            >
              <Box display="flex" flexDirection="column">
                <FormControlLabel
                  value="transfer"
                  control={<Radio />}
                  className="bg-primary-500 text-white mb-2"
                  label="Admit the patient record to your facility by adding the date of birth"
                />
                <FormControlLabel
                  value="close"
                  control={<Radio />}
                  className="bg-red-500 text-white mb-2"
                  label="I confirm that the suspect / patient i want to create is not on the list."
                />
                <p>
                  Please contact your district care coordinator, the shifting
                  facility or the patient themselves if you are not sure about the patient's date of
                  birth.
                </p>
              </Box>
            </RadioGroup>
          </div>
        </div>
      </DialogContent>
      <DialogActions style={{ justifyContent: "space-between" }}>
        <Button
          className="capitalize"
          color="secondary"
          onClick={() => handleCancel()}
        >
          Cancel {text}
        </Button>
        <Button
          onClick={() => handleOk(action)}
          color="primary"
          variant="contained"
          disabled={!action}
          startIcon={<CheckCircleOutlineIcon>save</CheckCircleOutlineIcon>}
        >
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default withStyles(styles)(DuplicatePatientDialog);
