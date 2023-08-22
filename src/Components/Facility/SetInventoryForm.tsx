import { useCallback, useReducer, useState, useEffect, lazy } from "react";
import { useDispatch } from "react-redux";

import { statusType, useAbortableEffect } from "../../Common/utils";
import { getItems, setMinQuantity, getAnyFacility } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { InventoryItemsModel } from "./models";
import { Cancel, Submit } from "../Common/components/ButtonV2";
import useAppHistory from "../../Common/hooks/useAppHistory";
import Page from "../Common/components/Page";
import Card from "../../CAREUI/display/Card";
import { FieldChangeEvent } from "../Form/FormFields/Utils";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import TextFormField from "../Form/FormFields/TextFormField";
const Loading = lazy(() => import("../Common/Loading"));

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
  const { goBack } = useAppHistory();
  const [state, dispatch] = useReducer(inventoryFormReducer, initialState);
  const { facilityId } = props;
  const dispatchAction: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
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

  const handleChange = ({ name, value }: FieldChangeEvent<unknown>) => {
    dispatch({ type: "set_form", form: { ...state.form, [name]: value } });
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Page
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
      backUrl={`/facility/${facilityId}/inventory/min_quantity/list`}
    >
      <Card className="mx-auto mt-10 max-w-3xl">
        <form onSubmit={(e) => handleSubmit(e)} className="mt-6 flex flex-col">
          <SelectFormField
            name="id"
            required
            label="Inventory Name"
            value={state.form.id}
            options={data}
            onChange={handleChange}
            optionValue={(item) => item.id}
            optionLabel={(item) => item.name}
          />

          <div className="flex gap-2">
            <TextFormField
              className="w-full"
              label="Minimum Quantity"
              required
              name="quantity"
              type="number"
              value={state.form.quantity}
              onChange={handleChange}
            />

            <TextFormField
              name="unit"
              label="Unit"
              value={currentUnit}
              onChange={handleChange}
              disabled
            />
          </div>

          <div className="mt-4 flex flex-col justify-end gap-2 sm:flex-row">
            <Cancel onClick={() => goBack()} />
            <Submit label="Set" />
          </div>
        </form>
      </Card>
    </Page>
  );
};
