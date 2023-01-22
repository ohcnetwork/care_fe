import { Card, CardContent, InputLabel } from "@material-ui/core";
import loadable from "@loadable/component";
import { useCallback, useReducer, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  getItems,
  postInventory,
  getAnyFacility,
  getInventorySummary,
} from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { SelectField, TextInputField } from "../Common/HelperInputFields";
import { InventoryItemsModel } from "./models";
import { goBack } from "../../Utils/utils";
import { Cancel, Submit } from "../Common/components/ButtonV2";
import Page from "../Common/components/Page";
const Loading = loadable(() => import("../Common/Loading"));

const initForm = {
  id: "",
  quantity: "",
  unit: "",
  isIncoming: false,
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

export const AddInventoryForm = (props: any) => {
  const [state, dispatch] = useReducer(inventoryFormReducer, initialState);
  const { facilityId } = props;
  const dispatchAction: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [offset, _setOffset] = useState(0);
  const [stockError, setStockError] = useState("");
  const [inventory, setInventory] = useState<any>([]);
  const [data, setData] = useState<Array<InventoryItemsModel>>([]);
  const [currentUnit, setCurrentUnit] = useState<any>();
  const [facilityName, setFacilityName] = useState("");

  const limit = 14;

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
    [dispatchAction, offset]
  );
  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [fetchData]
  );

  const fetchInventoryData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatchAction(
        getInventorySummary(facilityId, { limit, offset })
      );
      if (!status.aborted) {
        if (res && res.data) {
          setInventory(res.data.results);
        }
        setIsLoading(false);
      }
    },
    [dispatchAction, facilityId]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchInventoryData(status);
    },
    [fetchInventoryData]
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
        form: { ...state.form, unit: item.default_unit?.id },
      });
      setCurrentUnit(item.allowed_units);
    }
  }, [state.form.id]);

  const defaultUnitConverter = (unitData: any) => {
    const unitName = data[Number(unitData.item - 1)].allowed_units?.filter(
      (u: any) => Number(u.id) === Number(unitData.unit)
    )[0].name;
    if (unitName === "Dozen") {
      return Number(unitData.quantity) * 12;
    }
    if (unitName === "Gram") {
      return Number(unitData.quantity) / 1000;
    }
    return Number(unitData.quantity);
  };

  // this function determines whether the stock which user has demanded to use is available or not !

  const stockValidation = (data: any) => {
    if (inventory && inventory.length) {
      // get the stock cont of item selected
      const stockBefore = inventory.filter(
        (inventoryItem: any) =>
          Number(inventoryItem.item_object.id) === Number(data.item)
      );
      // if stock count=0
      if (stockBefore.length === 0) {
        setStockError("No Stock Available ! Please Add Stock.");
        setIsLoading(false);
        return false;
      }
      // unit of item can be in any unit so convert to default unit for calculation
      const stockEnteredbyUserQuantity = defaultUnitConverter(data);
      // if stock entered by user is greater than stock present before
      if (stockEnteredbyUserQuantity > Number(stockBefore[0].quantity)) {
        setStockError("Stock Insufficient ! Please Add Stock.");
        setIsLoading(false);
        return false;
      }
      setStockError("");
      return true;
    } else if (inventory && inventory.length === 0) {
      setStockError("No Stock Available !");
      setIsLoading(false);
      return false;
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    const data = {
      quantity: Number(state.form.quantity),
      is_incoming: Boolean(state.form.isIncoming),
      item: Number(state.form.id),
      unit: Number(state.form.unit),
    };
    // if user has selected "Add stock" or "stockValidation" function is true
    if (data.is_incoming || stockValidation(data)) {
      const res = await dispatchAction(postInventory(data, { facilityId }));
      setIsLoading(false);

      if (res && res.data && (res.status === 200 || res.status === 201)) {
        Notification.Success({
          msg: "Inventory created successfully",
        });
        goBack();
      } else {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
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
    <Page
      title="Manage Inventory"
      crumbsReplacements={{ [facilityId]: { name: facilityName } }}
    >
      <div className="mt-4">
        <Card>
          <form onSubmit={handleSubmit}>
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
                  <InputLabel id="inventory_description_label">
                    Status:
                  </InputLabel>
                  <SelectField
                    name="isIncoming"
                    variant="outlined"
                    margin="dense"
                    value={state.form.isIncoming}
                    options={[
                      { id: true, value: "Add Stock" },
                      { id: false, value: "Use Stock" },
                    ]}
                    onChange={handleChange}
                    optionKey="id"
                    optionValue="value"
                    errors={stockError}
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
                    name="unit"
                    margin="dense"
                    variant="outlined"
                    value={state.form.unit}
                    options={currentUnit || []}
                    onChange={handleChange}
                    optionKey="id"
                    optionValue="name"
                  />
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-2 justify-between mt-4">
                <Cancel onClick={() => goBack()} />
                <Submit onClick={handleSubmit} label="Add/Update Inventory" />
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </Page>
  );
};
