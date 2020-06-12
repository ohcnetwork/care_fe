import { Button, Card, CardContent, InputLabel } from "@material-ui/core";
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import moment from 'moment';
import React, { useCallback, useReducer, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { createTriageForm, getTriageDetails } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { DateInputField, TextInputField } from "../Common/HelperInputFields";
import { Loading } from "../Common/Loading";
import PageTitle from "../Common/PageTitle";
import { PatientStatsModel } from "./models";


const initForm: any = {
  inventory_name: "",
  inventory_description: "",
  inventory_stock: "",
  inventory_min_stock: "",
};

const initialState = {
  form: { ...initForm },
  errors: { ...initForm }
};

const triageFormReducer = (state = initialState, action: any) => {
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

const goBack = () => {
  window.history.go(-1);
};

export const AddInventoryForm = () => {
  const dispatchAction: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);



  const handleSubmit = async (e: any) => {
    e.preventDefault();
  };

  const handleChange = (e: any) => {
 //handlechange
};


  if (isLoading) {
    return <Loading />;
  }

  return (<div>
    <PageTitle title="Add Inventory" />
    <div className="mt-4">
      <Card>
        <form onSubmit={e => handleSubmit(e)}>
          <CardContent>
            <div className="mt-2 grid gap-4 grid-cols-1 md:grid-cols-2">
              <div>
                <InputLabel id="inventory_name_label">Inventory Name</InputLabel>
                <TextInputField
                    name="inventory_name"
                    variant="outlined"
                    margin="dense"
                    type="number"
                    value=""
                    onChange={handleChange}
                    errors=""
                />
              </div>
              <div>
                <InputLabel id="inventory_description_label">Inventory Description</InputLabel>
                <TextInputField
                  name="inventory_description"
                  variant="outlined"
                  margin="dense"
                  type="number"
                  value=""
                  onChange={handleChange}
                  errors=""
                />
              </div>
              <div>
                <InputLabel id="available_stock_label">Available Stock</InputLabel>
                <TextInputField
                  name="available_stock"
                  variant="outlined"
                  margin="dense"
                  type="number"
                  value=""
                  onChange={handleChange}
                  errors=""
                />
              </div>
              <div>
                <InputLabel id="min_stock_label">Minimum Stock Required</InputLabel>
                <TextInputField
                  name="min_stock"
                  variant="outlined"
                  margin="dense"
                  type="number"
                  value=""
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
              >Cancel</Button>
              <Button
                color="primary"
                variant="contained"
                type="submit"
                style={{ marginLeft: "auto" }}
                startIcon={<CheckCircleOutlineIcon></CheckCircleOutlineIcon>}
                onClick={e => handleSubmit(e)}
              >Add Inventory</Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  </div>);
};
