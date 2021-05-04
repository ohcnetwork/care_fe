import { Button, Card, CardContent, InputLabel } from "@material-ui/core";
import loadable from '@loadable/component';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import React, { useCallback, useReducer, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { getItems, postInventory } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { SelectField, TextInputField } from "../Common/HelperInputFields";
const Loading = loadable( () => import("../Common/Loading"));
import { InventoryItemsModel } from "./models";
const PageTitle = loadable( () => import("../Common/PageTitle"));

const initForm = {
  id: "",
  quantity: "",
  unit: "",
  isIncoming: false,
};
const initialState = {
  form: { ...initForm }
};

const inventoryFormReducer = (state = initialState, action: any) => {
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
  const [state, dispatch] = useReducer(inventoryFormReducer, initialState);
  const { facilityId } = props;
  const dispatchAction: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState<Array<InventoryItemsModel>>([]);
  const [currentUnit, setCurrentUnit] = useState<any>();

  const limit = 14;

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatchAction(getItems({ limit, offset }));
      if (!status.aborted) {
        if (res && res.data) {
          setData(res.data.results);
          dispatch({ type: "set_form", form: { ...state.form, id: res.data.results[0]?.id } });
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

  useEffect(() => {
    // set the default units according to the item
    const item = data.find(item => item.id === Number(state.form.id));
    if (item) {
      dispatch({ type: "set_form", form: { ...state.form, unit: item.default_unit?.id } });
      setCurrentUnit(item.allowed_units);
    }
  }, [state.form.id])

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    const data = {
      quantity: Number(state.form.quantity),
      is_incoming: Boolean(state.form.isIncoming),
      item: Number(state.form.id),
      unit: Number(state.form.unit),
    };

    const res = await dispatchAction(postInventory(data, { facilityId }));
    setIsLoading(false);
    if (res && res.data) {
      Notification.Success({
        msg: "Inventory created successfully"
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
    <PageTitle title="Add Inventory" />
    <div className="mt-4">
      <Card>
        <form onSubmit={e => handleSubmit(e)}>
          <CardContent>
            <div className="mt-2 grid gap-4 grid-cols-1 md:grid-cols-2">
              <div>
                <InputLabel id="inventory_name_label">Inventory Name</InputLabel>
                <SelectField
                  name="id"
                  variant="standard"
                  value={state.form.id}
                  options={data.map((e) => { return { id: e.id, name: e.name } })}
                  onChange={handleChange}
                  optionKey="id"
                  optionValue="name"
                />
              </div>
              <div>
                <InputLabel id="inventory_description_label">Status:</InputLabel>
                <SelectField
                  name="isIncoming"
                  variant="standard"
                  value={state.form.isIncoming}
                  options={[{ id: true, value: "Add Stock" }, { id: false, value: "Use Stock" }]}
                  onChange={handleChange}
                  optionKey="id"
                  optionValue="value"
                />
              </div>
              <div>
                <InputLabel id="quantity">Quantity</InputLabel>
                <TextInputField
                  name="quantity"
                  variant="outlined"
                  margin="dense"
                  type="float"
                  value={state.form.quantity}
                  onChange={handleChange}
                  errors=""
                />
              </div>
              <div>
                <InputLabel id="unit">Unit</InputLabel>
                <SelectField
                  className="pt-3"
                  name="unit"
                  variant="standard"
                  value={state.form.unit}
                  options={currentUnit || []}
                  onChange={handleChange}
                  optionKey="id"
                  optionValue="name"
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
