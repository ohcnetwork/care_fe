import { lazy, useReducer, useState } from "react";
import * as Notification from "../../Utils/Notifications.js";
import { navigate } from "raviger";
import { Cancel, Submit } from "../Common/components/ButtonV2";
import TextFormField from "../Form/FormFields/TextFormField";
import { classNames } from "../../Utils/utils";
import useQuery from "../../Utils/request/useQuery";
import routes from "../../Redux/api";
import request from "../../Utils/request/request";
import { FieldChangeEvent } from "../Form/FormFields/Utils.js";
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
  const [isLoading, setIsLoading] = useState(false);

  const { loading } = useQuery(routes.abha.getHealthFacility, {
    pathParams: { facility_id: facilityId },
    silent: true,
    onResponse(res) {
      if (res.data) {
        dispatch({
          type: "set_form",
          form: {
            ...state.form,
            health_facility: res.data,
            hf_id: res.data.hf_id,
          },
        });
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
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

    let response = null;
    let responseData = null;
    if (state.form.health_facility) {
      const { res, data } = await request(
        routes.abha.partialUpdateHealthFacility,
        {
          pathParams: {
            facility_id: facilityId,
          },
          body: {
            hf_id: state.form.hf_id,
          },
        }
      );
      response = res;
      responseData = data;
    } else if (state.form.hf_id === state.form.health_facility?.hf_id) {
      const { res, data } = await request(
        routes.abha.registerHealthFacilityAsService,
        {
          pathParams: {
            facility_id: facilityId,
          },
        }
      );
      response = res;
      responseData = data;

      if (response?.status === 200 && responseData) {
        if (responseData?.registered) {
          dispatch({
            type: "set_form",
            form: {
              ...state.form,
              health_facility: {
                ...state.form?.health_facility,
                registered: responseData.registered,
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
      const { res, data } = await request(routes.abha.createHealthFacility, {
        body: {
          facility: facilityId,
          hf_id: state.form.hf_id,
        },
      });
      response = res;
      responseData = data;
    }

    setIsLoading(false);
    if (response && responseData) {
      Notification.Success({
        msg: "Health Facility config updated successfully",
      });
      navigate(`/facility/${facilityId}`);
    } else {
      if (responseData)
        Notification.Error({
          msg: "Something went wrong: " + (responseData.detail || ""),
        });
    }
    setIsLoading(false);
  };

  const handleChange = (e: FieldChangeEvent<string>) => {
    dispatch({
      type: "set_form",
      form: { ...state.form, [e.name]: e.value },
    });
  };

  if (loading || isLoading) {
    return <Loading />;
  }

  return (
    <div className="cui-card mt-4">
      <form onSubmit={handleSubmit}>
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
              onChange={handleChange}
              error={state.errors?.hf_id}
            />
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
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
