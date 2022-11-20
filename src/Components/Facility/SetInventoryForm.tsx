import { Card, CardContent, InputLabel } from "@material-ui/core";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import { useCallback, useReducer, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import loadable from "@loadable/component";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { getItems, setMinQuantity, getAnyFacility } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { SelectField, TextInputField } from "../Common/HelperInputFields";
import { InventoryItemsModel } from "./models";
import { goBack } from "../../Utils/utils";
const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

const initForm = {
  id: "",
  quantity: "",
};
const initialState = {
  form: { ...initForm },
};

const inventoryFormReducer = (state = initialState, action: any) => {
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

export const SetInventoryForm = (props: any) => {
  const [state, dispatch] = useReducer(inventoryFormReducer, initialState);
  const { facilityId } = props;
  const dispatchAction: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  // const [offset, setOffset] = useState(0);
  const [data, setData] = useState<Array<InventoryItemsModel>>([]);
  const [currentUnit, setCurrentUnit] = useState<any>();
  const [facilityName, setFacilityName] = useState("");

  const limit = 14;
  const offset = 0;

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatchAction(getItems({ limit, offset }));
      if (!status.aborted) {
        if (res && res.data) {
          setData(res.data.results);
          dispatch({
            type: "set_form",
            form: { ...state.form, id: res.data.results[0]?.id },
          });
        }
        setIsLoading(false);
      }
    },
    [dispatchAction]
  );
  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [fetchData]
  );

  useEffect(() => {
    async function fetchFacilityName() {
      if (facilityId) {
        const res = await dispatchAction(getAnyFacility(facilityId));

        setFacilityName(res?.data?.name || "");
      } else {
        setFacilityName("");
      }
    }
    fetchFacilityName();
  }, [dispatchAction, facilityId]);

  useEffect(() => {
    // set the default units according to the item
    const item = data.find((item) => item.id === Number(state.form.id));
    if (item) {
      dispatch({
        type: "set_form",
        form: { ...state.form, unit: item.default_unit?.name },
      });
      setCurrentUnit(item.default_unit?.name);
    }
  }, [state.form.id]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    const data: any = {
      min_quantity: Number(state.form.quantity),
      item: Number(state.form.id),
    };

    const res = await dispatchAction(setMinQuantity(data, { facilityId }));
    setIsLoading(false);
    if (res && res.data) {
      Notification.Success({
        msg: "Minimum quantiy updated successfully",
      });
    }
    goBack();
  };

  const handleChange = (e: any) => {
    const form = { ...state.form };
    form[e.target.name] = e.target.value;
    dispatch({ type: "set_form", form });
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="px-2 pb-2">
      <PageTitle
        title="Set Minimum Quantity"
        crumbsReplacements={{
          [facilityId]: { name: facilityName },
          min_quantity: {
            name: "Min Quantity",
            uri: `/facility/${facilityId}/inventory/min_quantity/list`,
          },
          set: {
            style: "pointer-events-none",
          },
        }}
      />
      <div className="mt-4">
        <Card>
          <form onSubmit={(e) => handleSubmit(e)}>
            <CardContent>
              <div className="mt-2 grid gap-4 grid-cols-1 md:grid-cols-2">
                <div>
                  <InputLabel id="inventory_name_label">
                    Inventory Name
                  </InputLabel>
                  <SelectField
                    name="id"
                    variant="outlined"
                    margin="dense"
                    value={state.form.id}
                    options={data.map((e) => {
                      return { id: e.id, name: e.name };
                    })}
                    onChange={handleChange}
                    optionKey="id"
                    optionValue="name"
                  />
                </div>

                <div>
                  <InputLabel id="inventory_name_label">Unit</InputLabel>
                  <TextInputField
                    name="id"
                    variant="outlined"
                    margin="dense"
                    type="string"
                    value={currentUnit}
                    errors=""
                  />
                </div>

                <div className="md:col-span-2">
                  <InputLabel id="quantity">Item Min Quantity</InputLabel>
                  <TextInputField
                    fullWidth
                    name="quantity"
                    variant="outlined"
                    margin="dense"
                    type="number"
                    value={state.form.quantity}
                    onChange={handleChange}
                    errors=""
                  />
                </div>
              </div>
              <div className="sm:flex sm:justify-between mt-4">
                <div>
                  <button
                    color="default"
                    type="button"
                    onClick={() => goBack()}
                    className="w-full sm:w-fit rounded-md p-2 px-6 mt-2 bg-gray-400 hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
                <div>
                  <button
                    color="primary"
                    type="submit"
                    style={{ marginLeft: "auto" }}
                    className="w-full sm:w-fit rounded-md p-2 px-6 mt-2 bg-green-500 hover:bg-green-700 text-white"
                    onClick={(e) => handleSubmit(e)}
                  >
                    <CheckCircleOutlineIcon></CheckCircleOutlineIcon> SET
                  </button>
                </div>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
};
