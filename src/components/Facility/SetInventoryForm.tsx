import { useEffect, useReducer, useState } from "react";

import Card from "@/CAREUI/display/Card";

import { Cancel, Submit } from "@/components/Common/ButtonV2";
import Page from "@/components/Common/Page";
import { InventoryItemsModel } from "@/components/Facility/models";
import { SelectFormField } from "@/components/Form/FormFields/SelectFormField";
import TextFormField from "@/components/Form/FormFields/TextFormField";
import { FieldChangeEvent } from "@/components/Form/FormFields/Utils";

import useAppHistory from "@/hooks/useAppHistory";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useQuery from "@/Utils/request/useQuery";

const initForm = {
  id: "",
  quantity: "",
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
  const [data, setData] = useState<Array<InventoryItemsModel>>([]);
  const [currentUnit, setCurrentUnit] = useState<any>();

  const limit = 14;
  const offset = 0;

  useQuery(routes.getMinQuantity, {
    pathParams: {
      facilityId,
    },
    prefetch: !!facilityId,
    onResponse: async ({ data }) => {
      const existingItemIDs: number[] = [];

      if (data?.results) {
        data.results.map((item) => existingItemIDs.push(item.item_object.id));
      }

      await request(routes.getItems, {
        query: {
          limit,
          offset,
        },
        onResponse: ({ res, data }) => {
          if (res && data) {
            const filteredData = data.results.filter(
              (item) => !existingItemIDs.includes(item.id as number),
            );
            setData(filteredData);
            dispatch({
              type: "set_form",
              form: { ...state.form, id: filteredData[0]?.id },
            });
          }
        },
      });
    },
  });

  const { data: facilityObject } = useQuery(routes.getAnyFacility, {
    pathParams: { id: facilityId },
    prefetch: !!facilityId,
  });

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

  const validateForm = () => {
    const errors = { ...initError };
    let invalidForm = false;

    Object.keys(state.form).forEach((field) => {
      switch (field) {
        case "quantity":
          if (!state.form[field]?.length) {
            errors[field] = "Please select a quantity";
            invalidForm = true;
          } else if (state.form[field] < 0) {
            errors[field] = "Quantity can't be negative";
            invalidForm = true;
          }
          return;
      }
    });

    dispatch({ type: "set_error", errors });
    return !invalidForm;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const validated = validateForm();
    if (!validated) return;
    await request(routes.setMinQuantity, {
      pathParams: { facilityId },
      body: {
        min_quantity: Number(state.form.quantity),
        item: Number(state.form.id),
      },
      onResponse: ({ res }) => {
        if (res?.ok) {
          Notification.Success({
            msg: "Minimum quantiy updated successfully",
          });
        }
        goBack();
      },
    });
  };

  const handleChange = ({ name, value }: FieldChangeEvent<unknown>) => {
    dispatch({ type: "set_form", form: { ...state.form, [name]: value } });
  };

  return (
    <Page
      title="Set Minimum Quantity"
      crumbsReplacements={{
        [facilityId]: { name: facilityObject?.name },
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
              error={state.errors.quantity}
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
