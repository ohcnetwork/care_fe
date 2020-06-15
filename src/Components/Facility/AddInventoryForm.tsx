import { Button, Card, CardContent, InputLabel } from "@material-ui/core";
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import moment from 'moment';
import React, { useCallback, useReducer, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { getItems } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { DateInputField, TextInputField } from "../Common/HelperInputFields";
import { Loading } from "../Common/Loading";
import PageTitle from "../Common/PageTitle";
import { InventoryItemsModel } from "./models";


// const initForm: any = {
//   inventory_id: "",
//   inventory_description: "",
//   inventory_stock: "",
//   inventory_min_stock: "",
// };
const initForm = {
  id: "",
  quantity: "",
  unit: "",
  isIncoming: true,
};
const initialState = {
  form: { ...initForm }
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

export const AddInventoryForm = (props: any) => {
  const [state, dispatch] = useReducer(triageFormReducer, initialState);
  const { facilityId } = props;
  const dispatchAction: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState<Array<InventoryItemsModel>>([]);
  const [totalCount, setTotalCount] = useState(0);

  const limit = 14;


  const [form, setForm] = useState(initForm);
  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatchAction(getItems({ limit, offset }));
      if (!status.aborted) {
        if (res && res.data) {
          setData(res.data.results);
          setTotalCount(res.data.count);
        }
        setIsLoading(false);
      }
    },
    [dispatchAction, offset]
  );
  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [fetchData]
  );
  console.log("dataaaa", data);
  const handleSubmit = async (e: any) => {
    e.preventDefault();
  };

  const handleChange = (e: any) => {
    //handlechange
    // const { value, name } = e.target;
    // setForm({ ...form, [name]: value });
    let form = { ...state.form };
    form[e.target.name] = e.target.value;
    dispatchAction({ type: "set_form", form });
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
                <select
                  className="appearance-none focus:shadow-outline w-full py-1 px-5 py-1 text-gray-700 bg-gray-200 rounded"
                  name="id"
                  value={form.id}
                  onChange={handleChange}>
                  {...data.map((e) => (
                    <option value={e.id} key={e.name}>{e.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <InputLabel id="inventory_description_label">Status:</InputLabel>
                <select
                  className="appearance-none focus:shadow-outline w-full py-1 px-5 py-1 text-gray-700 bg-gray-200 rounded"
                  name="isIncoming">
                  <option value="true" >Incoming</option>
                  <option value="false">Outgoing</option>
                </select>
              </div>
              <div>
                <InputLabel id="quantity">Quantity</InputLabel>
                <TextInputField
                  name="quantity"
                  variant="outlined"
                  margin="dense"
                  type="number"
                  value={form.quantity}
                  onChange={handleChange}
                  errors=""
                />
              </div>
              <div>
                <InputLabel id="min_stock_label">Unit</InputLabel>
                <select
                  className="appearance-none focus:shadow-outline w-full py-1 px-5 py-1 text-gray-700 bg-gray-200 rounded"
                  name="id"
                  value={form.id}
                  onChange={handleChange}>
                  {/* {...data.map((e) => (
                    <option value={e.default_unit[id]} key={e.name}>{e.default_unit[name]}</option>
                  ))} */}
                </select>
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
