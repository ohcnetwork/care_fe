import * as Notification from "../../Utils/Notifications.js";
import { Cancel, Submit } from "../Common/components/ButtonV2";
import { useReducer, useState } from "react";
import { DupPatientModel } from "./models";
import { OptionsType } from "../../Common/constants";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import { navigate } from "raviger";
import request from "../../Utils/request/request.js";
import routes from "../../Redux/api.js";
import TextFormField from "../Form/FormFields/TextFormField.js";
import { FieldChangeEvent } from "../Form/FormFields/Utils.js";

interface Props {
  patientList: Array<DupPatientModel>;
  handleOk: () => void;
  handleCancel: () => void;
  facilityId: string;
}

const initForm = {
  patient: "",
  year_of_birth: null,
};

const initError = Object.assign(
  {},
  ...Object.keys(initForm).map((k) => ({ [k]: "" })),
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
  const [isLoading, setIsLoading] = useState(false);
  const [state, dispatch] = useReducer(patientFormReducer, initialState);
  const patientOptions: Array<OptionsType> = patientList.map((patient) => {
    return {
      id: patient.patient_id as unknown as number,
      text: `${patient.name} (${patient.gender})`,
    };
  });

  const maxYear = new Date().getFullYear();

  const handleChange = (e: FieldChangeEvent<unknown>) => {
    if (
      e.name === "year_of_birth" &&
      parseInt((e.value as string) || "0") > maxYear
    ) {
      dispatch({
        type: "set_error",
        errors: {
          ...state.errors,
          [e.name]: `Cannot be greater than ${maxYear}`,
        },
      });
      return;
    }
    dispatch({
      type: "set_form",
      form: { ...state.form, [e.name]: e.value },
    });
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
        case "year_of_birth":
          if (!state.form[field]) {
            errors[field] = "This field is required";
            invalidForm = true;
          }

          if (parseInt(state.form[field] || "0") > maxYear) {
            errors[field] = `Cannot be greater than ${maxYear}`;
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

  const handleSubmit = async () => {
    const validForm = validateForm();
    if (validForm) {
      setIsLoading(true);
      const { res, data } = await request(routes.transferPatient, {
        body: {
          facility: facilityId,
          year_of_birth: state.form.year_of_birth,
        },
        pathParams: {
          id: state.form.patient,
        },
      });
      setIsLoading(false);
      if (res?.ok && data) {
        dispatch({ type: "set_form", form: initForm });
        handleOk();

        const patientName =
          patientOptions.find((p) => p.id === state.form.patient)?.text || "";
        Notification.Success({
          msg: `Patient ${patientName} transferred successfully`,
        });
        const newFacilityId =
          data && data.facility_object && data.facility_object.id;
        if (newFacilityId) {
          navigate(
            `/facility/${newFacilityId}/patient/${data.patient}/consultation`,
          );
        } else {
          navigate("/facility");
        }
      }
    }
  };

  return (
    <div>
      <div>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <p className="leading-relaxed">
              Note: Date of birth must match the patient to process the transfer
              request.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SelectFormField
              id="patient"
              name="patient"
              required
              label="Patient"
              labelClassName="text-sm"
              placeholder="Select patient"
              options={patientOptions}
              optionLabel={(patient) => patient.text}
              optionValue={(patient) => patient.id}
              value={state.form.patient}
              onChange={handleChange}
              error={state.errors.patient}
            />
            <TextFormField
              required
              type="number"
              id="year_of_birth"
              name="year_of_birth"
              label="Year of birth"
              labelClassName="text-sm"
              value={state.form.year_of_birth}
              min="1900"
              max={maxYear}
              onChange={handleChange}
              placeholder="Enter year of birth"
              error={state.errors.year_of_birth}
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-between gap-2 pt-4 md:flex-row">
        <Cancel onClick={handleCancel} disabled={isLoading} />
        <Submit
          id="submit-transferpatient"
          disabled={isLoading}
          onClick={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          label="Transfer Suspect / Patient"
        />
      </div>
    </div>
  );
};

export default TransferPatientDialog;
