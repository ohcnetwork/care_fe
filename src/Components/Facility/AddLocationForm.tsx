import { Button, Card, CardContent, InputLabel } from "@material-ui/core";
import loadable from "@loadable/component";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import React, { useReducer, useState } from "react";
import { useDispatch } from "react-redux";
import { createFacilityAssetLocation } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import {
  MultilineInputField,
  TextInputField,
} from "../Common/HelperInputFields";
const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

const initForm = {
  name: "",
  description: "",
};
const initialState = {
  form: { ...initForm },
};

const locationFormReducer = (state = initialState, action: any) => {
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

const goBack = () => {
  window.history.go(-1);
};

export const AddLocationForm = (props: any) => {
  const [state, dispatch] = useReducer(locationFormReducer, initialState);
  const { facilityId } = props;
  const dispatchAction: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    const data = {
      name: state.form.name,
      description: state.form.description,
    };

    const res = await dispatchAction(
      createFacilityAssetLocation(data, facilityId)
    );
    setIsLoading(false);
    if (res && res.status === 201) {
      Notification.Success({
        msg: "Location created successfully",
      });
    }
    goBack();
  };

  const handleChange = (e: any) => {
    let form = { ...state.form };
    form[e.target.name] = e.target.value;
    dispatch({ type: "set_form", form });
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="px-2">
      <PageTitle title="Add Location" />
      <div className="mt-4">
        <Card>
          <form onSubmit={(e) => handleSubmit(e)}>
            <CardContent>
              <div className="mt-2 grid gap-4 grid-cols-1 md:grid-cols-2">
                <div>
                  <InputLabel id="name">Name</InputLabel>
                  <TextInputField
                    name="name"
                    variant="outlined"
                    margin="dense"
                    type="text"
                    value={state.form.name}
                    onChange={handleChange}
                    errors=""
                  />
                </div>
                <div>
                  <InputLabel id="description">Description</InputLabel>
                  <MultilineInputField
                    rows={5}
                    name="description"
                    variant="outlined"
                    margin="dense"
                    type="float"
                    value={state.form.description}
                    onChange={handleChange}
                    errors=""
                  />
                </div>
              </div>
              <div className="flex justify-between mt-4">
                <Button
                  color="default"
                  variant="contained"
                  type="button"
                  onClick={goBack}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  variant="contained"
                  type="submit"
                  style={{ marginLeft: "auto" }}
                  startIcon={<CheckCircleOutlineIcon></CheckCircleOutlineIcon>}
                  onClick={(e) => handleSubmit(e)}
                >
                  Add Location
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
};
