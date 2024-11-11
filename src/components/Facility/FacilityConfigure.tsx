import { t } from "i18next";
import { navigate } from "raviger";
import { useReducer, useState } from "react";

import { ConfigureHealthFacility } from "@/components/ABDM/ConfigureHealthFacility";
import { Submit } from "@/components/Common/ButtonV2";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import TextFormField from "@/components/Form/FormFields/TextFormField";
import { FieldChangeEvent } from "@/components/Form/FormFields/Utils";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useQuery from "@/Utils/request/useQuery";

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

interface IProps {
  facilityId: string;
}

export const FacilityConfigure = (props: IProps) => {
  const [state, dispatch] = useReducer(FormReducer, initialState);
  const { facilityId } = props;
  const [isLoading, setIsLoading] = useState(false);

  const { loading } = useQuery(routes.getPermittedFacility, {
    pathParams: { id: facilityId },
    onResponse: (res) => {
      if (res.data) {
        const formData = {
          name: res.data.name,
          state: res.data.state,
          district: res.data.district,
          local_body: res.data.local_body,
          ward: res.data.ward,
          middleware_address: res.data.middleware_address,
        };
        dispatch({ type: "set_form", form: formData });
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
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
        /^(?!https?:\/\/)[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)*\.[a-zA-Z]{2,}$/,
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

    const data = {
      ...state.form,
      middleware_address: state.form.middleware_address,
    };

    const { res, error } = await request(routes.partialUpdateFacility, {
      pathParams: { id: facilityId },
      body: data,
    });

    setIsLoading(false);
    if (res?.ok) {
      Notification.Success({
        msg: t("update_facility_middleware_success"),
      });
      navigate(`/facility/${facilityId}`);
    } else {
      Notification.Error({
        msg: error?.detail ?? "Something went wrong",
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

  if (isLoading || loading) {
    return <Loading />;
  }

  return (
    <Page
      title="Configure Facility"
      crumbsReplacements={{
        [facilityId]: { name: state.form.name },
      }}
      className="w-full overflow-x-hidden"
    >
      <div className="mx-auto max-w-3xl">
        <div className="cui-card mt-4">
          <form onSubmit={handleSubmit}>
            <div className="mt-2 grid grid-cols-1 gap-4">
              <div>
                <TextFormField
                  name="middleware_address"
                  label="Facility Middleware Address"
                  required
                  value={state.form.middleware_address}
                  onChange={handleChange}
                  error={state.errors?.middleware_address}
                />
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Submit onClick={handleSubmit} label="Update" />
            </div>
          </form>
        </div>

        <ConfigureHealthFacility facilityId={facilityId} />
      </div>
    </Page>
  );
};
