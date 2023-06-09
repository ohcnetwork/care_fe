import loadable from "@loadable/component";
import { useCallback, useReducer, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import Card from "../../CAREUI/display/Card";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  getItems,
  postInventory,
  getAnyFacility,
  getInventorySummary,
} from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import Page from "../Common/components/Page";
import { FieldLabel } from "../Form/FormFields/FormField";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import TextFormField from "../Form/FormFields/TextFormField";
import { InventoryItemsModel } from "./models";
import { Cancel, Submit } from "../Common/components/ButtonV2";
import useAppHistory from "../../Common/hooks/useAppHistory";
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
  const { goBack } = useAppHistory();
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
  const [optionLabelId, setOptionLabelId] = useState("");

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
    console.log(optionLabelId);
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
    form[e.name] = e.value;
    setOptionLabelId(form);
    dispatch({ type: "set_form", form });
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Page
      title={"Manage Inventory"}
      backUrl={`/facility/${facilityId}/inventory`}
      crumbsReplacements={{ [facilityId]: { name: facilityName } }}
    >
      <div className="mt-4">
        <Card>
          <form onSubmit={handleSubmit}>
            <div className="mt-2 grid gap-4 grid-cols-1 md:grid-cols-2">
              <div>
                <FieldLabel id="inventory_name_label">
                  Inventory Name
                </FieldLabel>
                <SelectFormField
                  name="id"
                  onChange={handleChange}
                  value={state.form.id}
                  options={data.map((e) => {
                    return { id: e.id, name: e.name };
                  })}
                  optionValue={(optionLabelId) => optionLabelId.id}
                  optionLabel={(inventory) => inventory.name}
                />
              </div>
              <div>
                <FieldLabel id="inventory_description_label">
                  Status:
                </FieldLabel>
                <SelectFormField
                  name="isIncoming"
                  onChange={handleChange}
                  value={state.form.isIncoming}
                  options={[
                    { id: true, name: "Add Stock" },
                    { id: false, name: "Use Stock" },
                  ]}
                  optionValue={(optionLabelId) => optionLabelId.id}
                  optionLabel={(inventory) => inventory.name}
                  error={stockError}
                />
              </div>
              <div>
                <FieldLabel id="quantity">Quantity</FieldLabel>
                <TextFormField
                  name="quantity"
                  value={state.form.quantity}
                  onChange={handleChange}
                />
              </div>
              <div>
                <FieldLabel id="unit">Unit</FieldLabel>
                <SelectFormField
                  name="unit"
                  onChange={handleChange}
                  value={state.form.unit}
                  options={currentUnit || []}
                  optionValue={(optionLabelId: any) => optionLabelId.id}
                  optionLabel={(inventory) => inventory.name}
                />
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-2 justify-between mt-4">
              <Cancel onClick={() => goBack()} />
              <Submit onClick={handleSubmit} label="Add/Update Inventory" />
            </div>
          </form>
        </Card>
      </div>
    </Page>
  );
};
