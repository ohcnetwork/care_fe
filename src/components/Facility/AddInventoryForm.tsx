import { useEffect, useReducer, useState } from "react";

import Card from "@/CAREUI/display/Card";

import { Cancel, Submit } from "@/components/Common/ButtonV2";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import { FieldLabel } from "@/components/Form/FormFields/FormField";
import { SelectFormField } from "@/components/Form/FormFields/SelectFormField";
import TextFormField from "@/components/Form/FormFields/TextFormField";

import useAppHistory from "@/hooks/useAppHistory";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useQuery from "@/Utils/request/useQuery";

const initForm = {
  id: "",
  quantity: "",
  unit: "",
  isIncoming: undefined,
};

const initError = Object.assign(
  {},
  ...Object.keys(initForm).map((k) => ({ [k]: "" })),
);

const initialState = {
  form: { ...initForm },
  errors: { ...initError },
};

const inventoryFormReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case "set_form": {
      return {
        ...state,
        form: action.form,
      };
    }
    case "set_errors": {
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
  const [isLoading, setIsLoading] = useState(false);
  const [offset, _setOffset] = useState(0);
  const [stockError, setStockError] = useState("");
  const [currentUnit, setCurrentUnit] = useState<any>();

  const limit = 14;

  const { data } = useQuery(routes.getItems, {
    query: {
      limit,
      offset,
    },
  });

  const { data: inventory } = useQuery(routes.getInventorySummary, {
    pathParams: {
      facility_external_id: facilityId,
    },
    query: {
      limit,
      offset,
    },
    prefetch: facilityId !== undefined,
  });

  const { data: facilityObject } = useQuery(routes.getAnyFacility, {
    pathParams: { id: facilityId },
    prefetch: !!facilityId,
  });

  useEffect(() => {
    // set the default units according to the item
    const item = data?.results.find(
      (item) => item.id === Number(state.form.id),
    );
    if (item) {
      dispatch({
        type: "set_form",
        form: { ...state.form, unit: item.default_unit?.id },
      });
      setCurrentUnit(item.allowed_units);
    }
  }, [state.form.id]);

  const defaultUnitConverter = (unitData: any) => {
    const unitName = data?.results[
      Number(unitData.item - 1)
    ].allowed_units?.filter(
      (u: any) => Number(u.id) === Number(unitData.unit),
    )[0].name;
    if (unitName === "Dozen") {
      return Number(unitData.quantity) * 12;
    }
    if (unitName === "gram") {
      return Number(unitData.quantity) / 1000;
    }
    return Number(unitData.quantity);
  };

  // this function determines whether the stock which user has demanded to use is available or not !

  const stockValidation = (data: any) => {
    if (inventory && inventory.results.length) {
      // get the stock cont of item selected
      const stockBefore = inventory.results.filter(
        (inventoryItem: any) =>
          Number(inventoryItem.item_object.id) === Number(data.item),
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
    } else if (inventory && inventory.results.length === 0) {
      setStockError("No Stock Available !");
      setIsLoading(false);
      return false;
    }
  };

  const validateForm = () => {
    const errors = { ...initError };
    let invalidForm = false;

    Object.keys(state.form).forEach((field) => {
      switch (field) {
        case "id":
          if (!state.form[field]) {
            errors[field] = "Please select an item";
            invalidForm = true;
          }
          return;
        case "quantity":
          if (!state.form[field]?.length) {
            errors[field] = "Please select a quantity";
            invalidForm = true;
          } else if (state.form[field] <= 0) {
            errors[field] = "Quantity must be more than 0";
            invalidForm = true;
          }
          return;
        case "unit":
          if (!state.form[field]) {
            errors[field] = "Please select a unit";
            invalidForm = true;
          }
          return;
        case "isIncoming":
          if (state.form[field] == undefined) {
            errors[field] = "Please select an option";
            invalidForm = true;
          }
          return;
      }
    });

    if (invalidForm) {
      dispatch({ type: "set_errors", errors });
      return false;
    }
    dispatch({ type: "set_errors", errors });
    return true;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const validated = validateForm();
    if (!validated) return;
    setIsLoading(true);
    const data = {
      quantity: Number(state.form.quantity),
      is_incoming: Boolean(state.form.isIncoming),
      item: Number(state.form.id),
      unit: Number(state.form.unit),
    };
    // if user has selected "Add stock" or "stockValidation" function is true
    if (data.is_incoming || stockValidation(data)) {
      // if user has selected grams as unit then convert it to kg
      if (data.unit === 5) {
        data.quantity = data.quantity / 1000;
        data.unit = 6;
      }
      await request(routes.createInventory, {
        body: data,
        pathParams: { facilityId },
        onResponse: ({ res, data }) => {
          if (res?.ok && data) {
            if (data.is_incoming) {
              Notification.Success({
                msg: "Inventory created successfully",
              });
            } else {
              Notification.Success({
                msg: "Inventory use stock updated successfully",
              });
            }

            goBack();
          }
        },
      });
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  };

  const handleChange = (e: any) => {
    const form = { ...state.form };
    form[e.name] = e.value;
    dispatch({ type: "set_form", form });
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Page
      title={"Manage Inventory"}
      backUrl={`/facility/${facilityId}/inventory`}
      crumbsReplacements={{
        [facilityId]: { name: facilityObject ? facilityObject.name : "" },
      }}
    >
      <div className="mt-4">
        <Card>
          <form onSubmit={handleSubmit}>
            <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <FieldLabel id="inventory_name_label">
                  Inventory Name
                </FieldLabel>
                <SelectFormField
                  name="id"
                  onChange={handleChange}
                  value={state.form.id}
                  options={(data?.results ?? []).map((e) => {
                    return { id: e.id, name: e.name };
                  })}
                  optionValue={(inventory) => inventory.id}
                  optionLabel={(inventory) => inventory.name}
                  error={state.errors.id}
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
                    { id: 1, name: "Add Stock" },
                    { id: 0, name: "Use Stock" },
                  ]}
                  optionValue={(inventory) => inventory.id}
                  optionLabel={(inventory) => inventory.name}
                  error={stockError || state.errors.isIncoming}
                />
              </div>
              <div>
                <FieldLabel id="quantity">Quantity</FieldLabel>
                <TextFormField
                  name="quantity"
                  value={state.form.quantity}
                  onChange={handleChange}
                  error={state.errors.quantity}
                />
              </div>
              <div>
                <FieldLabel id="unit">Unit</FieldLabel>
                <SelectFormField
                  name="unit"
                  onChange={handleChange}
                  value={state.form.unit}
                  options={currentUnit || []}
                  optionValue={(inventory) => inventory.id}
                  optionLabel={(inventory: any) => inventory.name}
                  error={state.errors.unit}
                />
              </div>
            </div>
            <div className="cui-form-button-group">
              <Cancel onClick={() => goBack()} />
              <Submit onClick={handleSubmit} label="Add/Update Inventory" />
            </div>
          </form>
        </Card>
      </div>
    </Page>
  );
};
