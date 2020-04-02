import { Button, Card, CardContent, InputLabel } from "@material-ui/core";
import { navigate } from "hookrouter";
import React, { useReducer, useState } from "react";
import { useDispatch } from "react-redux";
import { createSampleTest } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { CheckboxField, MultilineInputField } from "../Common/HelperInputFields";
import { Loading } from "../Common/Loading";
import PageTitle from "../Common/PageTitle";

const initForm: any = {
  isFastTrack: false,
  fast_track: "",
  notes: ""
};

const initialState = {
  form: { ...initForm },
  errors: { ...initForm }
};

const sampleTestFormReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case "set_form": {
      return {
        ...state,
        form: action.form
      };
    }
    case "set_error": {
      return {
        ...state,
        errors: action.errors
      };
    }
    default:
      return state;
  }
};

export const SampleTest = (props: any) => {
  const dispatchAction: any = useDispatch();
  const { facilityId, patientId } = props;
  const [state, dispatch] = useReducer(sampleTestFormReducer, initialState);
  const [isLoading, setIsLoading] = useState(false);

  const headerText = "Request Sample";
  const buttonText = "Confirm your request to send sample for testing";

  const validateForm = () => {
    let errors = { ...initForm };
    let invalidForm = false;
    Object.keys(state.form).forEach((field, i) => {
      switch (field) {
        case "fast_track":
          if (state.form.isFastTrack && !state.form[field]) {
            errors[field] = "Field is required";
            invalidForm = true;
          }
          break;
        default:
          return;
      }
    });
    if (invalidForm) {
      dispatch({ type: "set_error", errors });
      return false;
    }
    dispatch({ type: "set_error", errors });
    return true;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const validForm = validateForm();
    if (validForm) {
      setIsLoading(true);
      const data = {
        fast_track: state.form.isFastTrack ? state.form.fast_track : undefined,
        notes: state.form.notes ? state.form.notes : undefined,
        facility: facilityId, 
        patient: patientId,
      };
      const res = await dispatchAction(createSampleTest(data, { patientId }));
      setIsLoading(false);
      if (res && res.data) {
        dispatch({ type: "set_form", form: initForm });
        Notification.Success({
          msg: "Sample test created successfully"
        });
        navigate(`/facility/${facilityId}/patient/${patientId}`);
      }
    }
  };

  const handleChange = (e: any) => {
    let form = { ...state.form };
    form[e.target.name] = e.target.value;
    dispatch({ type: "set_form", form });
  };

  const handleCheckboxFieldChange = (e: any) => {
    const form = { ...state.form };
    const { checked, name } = e.target;
    form[name] = checked;
    dispatch({ type: "set_form", form });
  };

  // const handleCancel = () => {
  //   navigate(`/facility/${facilityId}/patient/${patientId}`);
  // };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div>
      <PageTitle title={headerText} />
      <div className="mt-4">
        <Card>
          <form onSubmit={e => handleSubmit(e)}>
            <CardContent>
              <CheckboxField
                checked={state.form.isFastTrack}
                onChange={handleCheckboxFieldChange}
                name="isFastTrack"
                label="Is fast-track testing required?"
              />
            </CardContent>

            {state.form.isFastTrack && (<CardContent>
              <InputLabel id="med-history-details-label">
                Provide reasons for fast-track testing
              </InputLabel>
              <MultilineInputField
                rows={5}
                name="fast_track"
                variant="outlined"
                margin="dense"
                type="text"
                InputLabelProps={{ shrink: !!state.form.fast_track }}
                value={state.form.fast_track}
                onChange={handleChange}
                errors={state.errors.fast_track}
              />
            </CardContent>)}

            <CardContent>
              <InputLabel id="med-history-details-label">
                Notes (Optional)
              </InputLabel>
              <MultilineInputField
                rows={5}
                name="notes"
                variant="outlined"
                margin="dense"
                type="text"
                InputLabelProps={{ shrink: !!state.form.notes }}
                value={state.form.notes}
                onChange={handleChange}
                errors={state.errors.notes}
              />
            </CardContent>

            <CardContent>
              <Button
                fullWidth
                color="primary"
                variant="contained"
                type="submit"
                onClick={e => handleSubmit(e)}
              >
                {buttonText}
              </Button>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
};
