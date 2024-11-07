import { useReducer, useState } from "react";

import ButtonV2 from "@/components/Common/ButtonV2";
import DialogModal from "@/components/Common/Dialog";
import TextFormField from "@/components/Form/FormFields/TextFormField";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useQuery from "@/Utils/request/useQuery";

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

export const MinQuantityRequiredModal = (props: any) => {
  const [state, dispatch] = useReducer(inventoryFormReducer, initialState);
  const { facilityId, inventoryId, itemId, show, handleClose, handleUpdate } =
    props;
  const [isLoading, setIsLoading] = useState(true);

  const { data: minimumQuantityItemData } = useQuery(
    routes.getMinQuantityItem,
    {
      pathParams: {
        facilityId,
        inventoryId,
      },
      prefetch: !!facilityId && !!inventoryId,
      onResponse: async ({ res, data }) => {
        setIsLoading(true);
        if (res?.ok && data) {
          const form = { ...state.form, quantity: data.min_quantity };
          dispatch({ type: "set_form", form });
        }
        setIsLoading(false);
      },
    },
  );

  const { data: facilityObject } = useQuery(routes.getAnyFacility, {
    pathParams: { id: facilityId },
    prefetch: !!facilityId,
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    const { res, data } = await request(routes.updateMinQuantity, {
      pathParams: {
        facilityId,
        inventoryId,
      },
      body: {
        min_quantity: Number(state.form.quantity),
        item: Number(itemId),
      },
    });
    setIsLoading(false);
    if (res?.ok && data) {
      Notification.Success({
        msg: "Minimum quantity updated successfully",
      });
    }
    handleUpdate();
  };

  const handleChange = (e: { name: string; value: string }) => {
    const form = { ...state.form };
    form[e.name] = e.value;
    dispatch({ type: "set_form", form });
  };

  return (
    <DialogModal
      show={show}
      onClose={handleClose}
      title="Update Minimum Quantity"
    >
      {isLoading ? (
        <div className="flex items-center justify-center p-4">
          <div role="status">
            <svg
              aria-hidden="true"
              className="mr-2 h-8 w-8 animate-spin fill-primary text-secondary-200 dark:text-secondary-600"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="currentColor"
              />
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentFill"
              />
            </svg>
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      ) : (
        <div>
          {" "}
          <div className="mb-4">
            <p className="mt-1 text-sm text-secondary-500">
              Set the minimum quantity for{" "}
              <strong>{minimumQuantityItemData?.item_object.name}</strong> in{" "}
              <strong> {facilityObject?.name}</strong>
            </p>
          </div>
          <div className="mb-4">
            <TextFormField
              name="quantity"
              label="Minimum Quantity"
              type="number"
              value={state.form.quantity}
              onChange={(e) =>
                handleChange({ name: "quantity", value: e.value })
              }
            />
          </div>
          <div className="flex justify-end">
            <ButtonV2
              variant="primary"
              onClick={handleSubmit}
              className="mr-2"
              id="save-update-minimumquanitity"
            >
              Update
            </ButtonV2>
            <ButtonV2 variant="secondary" onClick={handleClose}>
              Cancel
            </ButtonV2>
          </div>
        </div>
      )}
    </DialogModal>
  );
};
