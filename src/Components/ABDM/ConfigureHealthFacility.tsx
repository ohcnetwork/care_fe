import { lazy, useCallback, useEffect, useReducer, useState } from "react";
import { useDispatch } from "react-redux";

import { healthFacilityActions } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { navigate } from "raviger";
import { Cancel, Submit } from "../Common/components/ButtonV2";
import TextFormField from "../Form/FormFields/TextFormField";
import { classNames } from "../../Utils/utils";
const Loading = lazy(() => import("../Common/Loading"));

const initForm = {
  health_facility: null,
  hf_id: "",
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

export const ConfigureHealthFacility = (props: any) => {
  const [state, dispatch] = useReducer(FormReducer, initialState);
  const { facilityId } = props;
  const dispatchAction: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (facilityId) {
      setIsLoading(true);
      const res = await dispatchAction(healthFacilityActions.read(facilityId));

      if (res?.status === 200 && res?.data) {
        const formData = {
          ...state.form,
          hf_id: res.data.hf_id,
          health_facility: res.data,
        };
        dispatch({ type: "set_form", form: formData });
      }

      setIsLoading(false);
    }
  }, [dispatchAction, facilityId]);

  useEffect(() => {
    fetchData();
  }, [dispatch, fetchData]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);

    if (!state.form.hf_id) {
      dispatch({
        type: "set_error",
        errors: { hf_id: ["Health Facility Id is required"] },
      });
      setIsLoading(false);
      return;
    }

    let res = null;
    if (state.form.health_facility) {
      res = await dispatchAction(
        healthFacilityActions.partialUpdate(facilityId, {
          hf_id: state.form.hf_id,
        })
      );
    } else if (state.form.hf_id === state.form.health_facility?.hf_id) {
      res = await dispatchAction(
        healthFacilityActions.registerService(facilityId)
      );

      if (res?.status === 200 && res?.data) {
        if (res.data?.registered) {
          dispatch({
            type: "set_form",
            form: {
              ...state.form,
              health_facility: {
                ...state.form?.health_facility,
                registered: res.data.registered,
              },
            },
          });

          return;
        }
      }

      Notification.Error({
        msg: "Service registration failed, please try again later",
      });
      return;
    } else {
      res = await dispatchAction(
        healthFacilityActions.create({
          facility: facilityId,
          hf_id: state.form.hf_id,
        })
      );
    }

    setIsLoading(false);
    if (res && res.data) {
      Notification.Success({
        msg: "Health Facility config updated successfully",
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
    <div className="cui-card mt-4">
      <form onSubmit={(e) => handleSubmit(e)}>
        <div className="mt-2 grid grid-cols-1 gap-4">
          <div>
            <TextFormField
              name="hf_id"
              label="Health Facility Id"
              trailing={
                <p
                  className={classNames(
                    "tooltip cursor-pointer text-sm",
                    state.form.health_facility?.registered
                      ? "text-primary-600 hover:text-primary-800"
                      : "text-warning-600 hover:text-warning-800"
                  )}
                >
                  {state.form.health_facility?.registered ? (
                    <>
                      <div className="tooltip-text tooltip-top -left-48 flex flex-col gap-4">
                        <span className="text-gray-100">
                          The ABDM health facility is successfully linked with
                          care{" "}
                          <strong>and registered as a service in bridge</strong>
                        </span>
                        <span className="text-green-100">
                          No Action Required.
                        </span>
                      </div>
                      Registered
                    </>
                  ) : (
                    <>
                      <div className="tooltip-text tooltip-top -left-48 flex flex-col gap-4">
                        <span className="text-gray-100">
                          The ABDM health facility is successfully linked with
                          care{" "}
                          <strong>
                            but not registered as a service in bridge
                          </strong>
                        </span>
                        <span className="text-warning-100">
                          Click on <strong>Link Health Facility</strong> to
                          register the service
                        </span>
                      </div>
                      Not Registered
                    </>
                  )}
                </p>
              }
              required
              value={state.form.hf_id}
              onChange={(e) => handleChange(e)}
              error={state.errors?.hf_id}
            />
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Cancel onClick={() => navigate(`/facility/${facilityId}`)} />
          <Submit
            onClick={handleSubmit}
            disabled={
              state.form.hf_id === state.form.health_facility?.hf_id &&
              state.form.health_facility?.registered
            }
            label="Link Health Facility"
          />
        </div>
      </form>
    </div>
  );
};
