import { lazy, useCallback, useReducer, useState } from "react";
import { useDispatch } from "react-redux";

import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  getPermittedFacility,
  partialUpdateFacility,
} from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { navigate } from "raviger";
import { Cancel, Submit } from "../Common/components/ButtonV2";
import TextFormField from "../Form/FormFields/TextFormField";
import Page from "../Common/components/Page";
const Loading = lazy(() => import("../Common/Loading"));

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
  errors: {},
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
    if (!state.form.middleware_address) {
      dispatch({
        type: "set_error",
        errors: { middleware_address: ["Middleware Address is required"] },
      });
      setIsLoading(false);
      return;
    }
    if (
      state.form.middleware_address.match(
        /^(?!https?:\/\/)[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)*\.[a-zA-Z]{2,}$/
      ) === null
    ) {
      dispatch({
        type: "set_error",
        errors: {
          middleware_address: ["Invalid Middleware Address"],
        },
      });
      setIsLoading(false);
      return;
    }
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
      form: { ...state.form, [e.name]: e.value },
    });
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Page
      title="Update Middleware"
      crumbsReplacements={{
        [facilityId]: { name: state.form.name },
      }}
      className="mx-auto max-w-3xl"
    >
      <div className="cui-card mt-4">
        <form onSubmit={(e) => handleSubmit(e)}>
          <div className="mt-2 grid grid-cols-1 gap-4">
            <div>
              <TextFormField
                name="middleware_address"
                label="Facility Middleware Address"
                value={state.form.middleware_address}
                onChange={(e) => handleChange(e)}
                error={state.errors?.middleware_address}
              />
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Cancel onClick={() => navigate(`/facility/${facilityId}`)} />
            <Submit onClick={handleSubmit} label="Update" />
          </div>
        </form>
      </div>
    </Page>
  );
};
