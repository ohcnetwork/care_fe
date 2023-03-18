import {
  // Card,
  // CardContent,
  // Dialog,
  DialogActions,
  // DialogContent,
  // DialogTitle,
  // InputLabel,
} from "@material-ui/core";
import { navigate } from "raviger";
import moment from "moment";
import React, { useReducer, useState } from "react";
import { useDispatch } from "react-redux";
import { transferPatient } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
// import {
//   DateInputField,
//   ErrorHelperText,
//   SelectField,
// } from "../Common/HelperInputFields";
import { DupPatientModel } from "./models";
import { OptionsType } from "../../Common/constants";
import { Cancel, Submit } from "../Common/components/ButtonV2";
import DateFormField from "../Form/FormFields/DateFormField";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import { FieldLabel } from "../Form/FormFields/FormField";
// import DialogModal from "../Common/Dialog";

interface Props {
  patientList: Array<DupPatientModel>;
  handleOk: () => void;
  handleCancel: () => void;
  facilityId: number;
}

const initForm: any = {
  patient: "",
  date_of_birth: null,
};

const initError = Object.assign(
  {},
  ...Object.keys(initForm).map((k) => ({ [k]: "" }))
);

const initialState = {
  form: { ...initForm },
  errors: { ...initError },
};

const patientFormReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case "set_form": {
      return {
        ...state,
        form: action.form,
      };
    }
    case "set_error": {
      return {
        ...state,
        errors: action.errors,
      };
    }
    default:
      return state;
  }
};

const TransferPatientDialog = (props: Props) => {
  const { patientList, handleOk, handleCancel, facilityId } = props;
  const dispatchAction: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [state, dispatch] = useReducer(patientFormReducer, initialState);
  const patientOptions: Array<OptionsType> = patientList.map((patient) => {
    return {
      id: patient.patient_id,
      text: `${patient.name} (${patient.gender})`,
    };
  });

  const handleChange = (e: any) => {
    const form = { ...state.form };
    // form[e.target.name] = e.target.value;
    console.log(e.name);
    console.log(e.value);
    form[e.name] = e.value;
    dispatch({ type: "set_form", form });
  };

  const handleDateChange = (date: any, field: string) => {
    if (moment(date).isValid()) {
      const form = { ...state.form };
      console.log(moment(date.value).format("YYYY-MM-DD"));
      console.log(date);
      console.log(field);
      console.log(date.value);
      console.log(date.value.toISOString());
      console.log(moment(date.value.toISOString()).format("YYYY-MM-DD"));
      // form[field] = moment(date).format("YYYY-MM-DD");
      dispatch({ type: "set_form", form });
    }
  };

  const validateForm = () => {
    const errors = { ...initError };
    let invalidForm = false;
    Object.keys(state.form).forEach((field) => {
      switch (field) {
        case "patient":
          if (!state.form[field]) {
            errors[field] = "Please select the suspect/patient";
            invalidForm = true;
          }
          return;
        case "date_of_birth":
          if (!state.form[field]) {
            errors[field] = "Please enter date in YYYY/MM/DD format";
            invalidForm = true;
          }
          return;
        default:
          return;
      }
    });
    dispatch({ type: "set_error", errors });
    return !invalidForm;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const validForm = validateForm();
    if (validForm) {
      setIsLoading(true);
      const data = {
        date_of_birth: moment(state.form.date_of_birth).format("YYYY-MM-DD"),
        facility: facilityId,
      };
      const res = await dispatchAction(
        transferPatient(data, { id: state.form.patient })
      );
      setIsLoading(false);
      if (res && res.data && res.status === 200) {
        dispatch({ type: "set_form", form: initForm });
        handleOk();
        Notification.Success({
          msg: `Patient ${res.data.patient} transferred successfully`,
        });
        const newFacilityId =
          res.data && res.data.facility_object && res.data.facility_object.id;
        if (newFacilityId) {
          navigate(
            `/facility/${newFacilityId}/patient/${res.data.patient}/consultation`
          );
        } else {
          navigate("/facility");
        }
      }
    }
  };

  return (
    <div>
      {/* <Card elevation={2} className="mb-8 rounded overflow-visible">
      <CardContent> */}
      {/* <h1 className="font-bold text-purple-500 text-left text-xl mb-4">
        Patient Transfer Form
      </h1> */}
      {/* <DialogModal
      title="Patient Transfer Form"
      show={true}
      onClose={handleCancel}
      className="w-3/4 md:w-1/2"
    > */}
      {/* <DialogTitle id="test-sample-title">Patient Transfer Form</DialogTitle> */}
      <div>
        <div className="grid gap-4 grid-cols-1">
          <div>
            <p className="leading-relaxed">
              Note: Date of birth must match the patient to process the transfer
              request.
            </p>
          </div>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div>
              {/* <InputLabel>Patient*</InputLabel>
              <SelectField
                name="patient"
                variant="outlined"
                margin="dense"
                showEmpty={true}
                value={state.form.patient}
                options={patientOptions}
                onChange={handleChange}
                errors={state.errors.patient}
              /> */}
              <FieldLabel className="text-sm">Patient</FieldLabel>
              <SelectFormField
                id="patient"
                name="patient"
                required
                options={patientOptions}
                optionLabel={(patient) => patient.text}
                optionValue={(patient) => patient.text}
                value={state.form.patient}
                onChange={handleChange}
                error={state.errors.patient}
              />
              {/* <ErrorHelperText error={state.errors.patient} /> */}
            </div>
            <div>
              {/* <InputLabel>Date of birth*</InputLabel>
              <DateInputField
                fullWidth={true}
                value={state.form.date_of_birth}
                onChange={(date) => handleDateChange(Date(date), "date_of_birth")}
                errors={state.errors.date_of_birth}
                inputVariant="outlined"
                margin="dense"
                openTo="year"
                disableFuture={true}
              /> */}
              <DateFormField
                required
                name="date_of_birth"
                label="Date of birth"
                value={state.form.date_of_birth}
                disableFuture
                onChange={(date) => handleDateChange(date, "date_of_birth")}
                position="LEFT"
                placeholder="Entry Date"
                error={state.errors.date_of_birth}
              />
            </div>
          </div>
        </div>
      </div>
      <DialogActions className="justify-between flex flex-col md:flex-row gap-2">
        <Cancel onClick={handleCancel} disabled={isLoading} />
        <Submit
          disabled={isLoading}
          onClick={handleSubmit}
          label="Transfer Suspect / Patient"
        />
      </DialogActions>
      {/* </DialogModal> */}
    </div>
  );
};

export default TransferPatientDialog;
