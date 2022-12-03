import { Button, Card, CardContent, InputLabel } from "@material-ui/core";
import loadable from "@loadable/component";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import { useCallback, useReducer, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  updateMinQuantity,
  getAnyFacility,
  getMinQuantityOfItem,
} from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { TextInputField } from "../Common/HelperInputFields";
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

export const UpdateMinQuantity = (props: any) => {
  const [state, dispatch] = useReducer(inventoryFormReducer, initialState);
  const { facilityId, inventoryId, itemId } = props;
  const dispatchAction: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  // Given that setOffset is not being used, pagination might not be working
  const [_offset, _setOffset] = useState(0);
  const [data, setData] = useState(" ");
  const [facilityName, setFacilityName] = useState("");

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatchAction(
        getMinQuantityOfItem(facilityId, inventoryId)
      );
      if (!status.aborted) {
        if (res && res.data) {
          setData(res.data.item_object.name);
          const form = { ...state.form, quantity: res.data.min_quantity };
          dispatch({ type: "set_form", form });
        }
        setIsLoading(false);
      }
    },
    [dispatchAction, facilityId, inventoryId]
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

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    const data: any = {
      min_quantity: Number(state.form.quantity),
      item: Number(itemId),
    };

    const res = await dispatchAction(
      updateMinQuantity(data, { facilityId, inventoryId })
    );
    setIsLoading(false);
    if (res && res.data) {
      Notification.Success({
        msg: "Minimum quantity updated successfully",
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
  console.log(facilityId, inventoryId, state, data);
  return (
    <div className="px-2 pb-2">
      <PageTitle
        title="Update Minimum Quantity"
        crumbsReplacements={{
          [facilityId]: { name: facilityName },
          [itemId]: { name: data },
          [inventoryId]: {
            name: "Min Quantity",
            uri: `/facility/${facilityId}/inventory/min_quantity/list`,
          },
          update: { style: "text-gray-100 pointer-events-none" },
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
                  <TextInputField
                    name="id"
                    variant="outlined"
                    margin="dense"
                    type="string"
                    value={data}
                    errors=""
                  />
                </div>

                <div>
                  <InputLabel id="quantity">Item Min Quantity</InputLabel>
                  <TextInputField
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
                <Button
                  color="default"
                  variant="contained"
                  type="button"
                  className="w-full sm:w-fit mt-2"
                  onClick={() => goBack()}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  variant="contained"
                  className="w-full sm:w-fit mt-2"
                  type="submit"
                  style={{ marginLeft: "auto" }}
                  startIcon={<CheckCircleOutlineIcon></CheckCircleOutlineIcon>}
                  onClick={(e) => handleSubmit(e)}
                >
                  SET{" "}
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
};
