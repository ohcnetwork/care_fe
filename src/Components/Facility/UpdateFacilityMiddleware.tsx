import { Card, CardContent } from "@material-ui/core";
import { useCallback, useReducer, useState } from "react";
import { useDispatch } from "react-redux";
import loadable from "@loadable/component";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  getPermittedFacility,
  partialUpdateFacility,
} from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { navigate } from "raviger";
import ButtonV2 from "../Common/components/ButtonV2";
import TextInputFieldV2 from "../Common/components/TextInputFieldV2";
const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

const initForm = {
  name: "",
  state: 0,
  district: 0,
  localbody: 0,
  ward: 0,
  middleware_address: "",
};
const initialState = {
  form: { ...initForm },
};

const FormReducer = (state = initialState, action: any) => {
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

export const UpdateFacilityMiddleware = (props: any) => {
  const [state, dispatch] = useReducer(FormReducer, initialState);
  const { facilityId } = props;
  const dispatchAction: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(
    async (status: statusType) => {
      if (facilityId) {
        setIsLoading(true);
        const res = await dispatchAction(getPermittedFacility(facilityId));
        if (!status.aborted && res.data) {
          const formData = {
            name: res.data.name,
            state: res.data.state,
            district: res.data.district,
            local_body: res.data.local_body,
            ward: res.data.ward,
            middleware_address: res.data.middleware_address,
          };
          dispatch({ type: "set_form", form: formData });
        } else {
          navigate(`/facility/${facilityId}`);
        }
        setIsLoading(false);
      }
    },
    [dispatchAction, facilityId]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [dispatch, fetchData]
  );

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    const data: any = {
      ...state.form,
      middleware_address: state.form.middleware_address,
    };

    const res = await dispatchAction(partialUpdateFacility(facilityId, data));
    setIsLoading(false);
    if (res && res.data) {
      Notification.Success({
        msg: "Facility updated successfully",
      });
      navigate(`/facility/${facilityId}`);
    } else {
      if (res?.data)
        Notification.Error({
          msg: "Something went wrong: " + (res.data.detail || ""),
        });
    }
    setIsLoading(false);
  };

  const handleChange = (e: any) => {
    dispatch({
      type: "set_form",
      form: { ...state.form, [e.target.name]: e.target.value },
    });
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="px-2 pb-2">
      <PageTitle
        title="Update Middleware"
        crumbsReplacements={{
          [facilityId]: { name: state.form.name },
        }}
      />
      <div className="mt-4">
        <Card>
          <form onSubmit={(e) => handleSubmit(e)}>
            <CardContent>
              <div className="mt-2 grid gap-4 grid-cols-1 md:grid-cols-2">
                <div>
                  <TextInputFieldV2
                    name="middleware_address"
                    label="Facility Middleware Address"
                    value={state.form.middleware_address}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="sm:flex sm:justify-between mt-4">
                <div>
                  <ButtonV2
                    variant="secondary"
                    onClick={() => navigate(`/facility/${facilityId}`)}
                  >
                    Cancel
                  </ButtonV2>
                </div>
                <div>
                  <ButtonV2 variant="primary" onClick={(e) => handleSubmit(e)}>
                    Update
                  </ButtonV2>
                </div>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
};
