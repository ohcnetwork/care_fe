import dayjs from "dayjs";
import { useReducer, useState } from "react";
import { useTranslation } from "react-i18next";

import Card from "@/CAREUI/display/Card";
import CareIcon from "@/CAREUI/icons/CareIcon";

import { Cancel, Submit } from "@/components/Common/ButtonV2";
import ConfirmDialog from "@/components/Common/ConfirmDialog";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import { PatientStatsModel } from "@/components/Facility/models";
import DateFormField from "@/components/Form/FormFields/DateFormField";
import TextFormField from "@/components/Form/FormFields/TextFormField";
import { FieldChangeEvent } from "@/components/Form/FormFields/Utils";

import useAppHistory from "@/hooks/useAppHistory";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useQuery from "@/Utils/request/useQuery";
import { dateQueryString, scrollTo } from "@/Utils/utils";

interface Props extends PatientStatsModel {
  facilityId: string;
  id?: string;
}

const initForm: any = {
  entry_date: null,
  num_patients_visited: "",
  num_patients_home_quarantine: "",
  num_patients_isolation: "",
  num_patient_referred: "",
  num_patient_confirmed_positive: "",
};

const initialState = {
  form: { ...initForm },
  errors: { ...initForm },
};

const triageFormReducer = (state = initialState, action: any) => {
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

export const TriageForm = ({ facilityId, id }: Props) => {
  const { t } = useTranslation();
  const { goBack } = useAppHistory();
  const [state, dispatch] = useReducer(triageFormReducer, initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [openModalForExistingTriage, setOpenModalForExistingTriage] =
    useState<boolean>(false);
  const headerText = !id ? "Add Triage" : "Edit Triage";
  const buttonText = !id ? "Save Triage" : "Update Triage";

  const triageDetailsQuery = useQuery(routes.getTriageDetails, {
    pathParams: { facilityId, id: id! },
    prefetch: !!id,
    onResponse: ({ data }) => {
      if (!data) return;
      dispatch({
        type: "set_form",
        form: {
          ...data,
          entry_date: data.entry_date ? dayjs(data.entry_date).toDate() : null,
        },
      });
    },
  });

  const patientStatsQuery = useQuery(routes.getTriage, {
    pathParams: { facilityId },
  });

  const patientStatsData = patientStatsQuery.data?.results ?? [];

  const facilityQuery = useQuery(routes.getAnyFacility, {
    pathParams: { id: facilityId },
  });
  const facilityName = facilityQuery.data?.name ?? "";

  const validateForm = () => {
    const errors = { ...initForm };
    let invalidForm = false;
    Object.keys(state.form).forEach((field, _) => {
      switch (field) {
        case "entry_date":
          if (!state.form[field]) {
            errors[field] = t("field_required");
            invalidForm = true;
          }
          return;
        case "num_patients_visited":
        case "num_patients_home_quarantine":
        case "num_patients_isolation":
        case "num_patient_referred":
        case "num_patient_confirmed_positive":
          if (state.form[field] != null && state.form[field] < 0) {
            errors[field] = "Value must be greater than or equal to 0";
            invalidForm = true;
          }
          return;

        default:
          return;
      }
    });
    if (invalidForm) {
      dispatch({ type: "set_error", errors });
      const firstError = Object.keys(errors).find((e) => errors[e]);
      if (firstError) {
        scrollTo(firstError);
      }
      return false;
    }
    dispatch({ type: "set_error", errors });
    return true;
  };
  const isTriageExist = (data: any) => {
    if (
      patientStatsData.filter(
        (triageData) => triageData.entry_date === data.entry_date,
      ).length === 1
    ) {
      return true;
    }
    return false;
  };

  const handleSubmit = async () => {
    setOpenModalForExistingTriage(false);
    const validForm = validateForm();
    if (validForm) {
      const data = {
        entry_date: dateQueryString(state.form.entry_date),
        num_patients_visited: Number(state.form.num_patients_visited),
        num_patients_home_quarantine: Number(
          state.form.num_patients_home_quarantine,
        ),
        num_patients_isolation: Number(state.form.num_patients_isolation),
        num_patient_referred: Number(state.form.num_patient_referred),
        num_patient_confirmed_positive: Number(
          state.form.num_patient_confirmed_positive,
        ),
      };
      //proceed if the triage does not exist or proceed has allowed to proceed after seeing the modal or it's a edit feature of the same date
      if (
        !isTriageExist(data) ||
        openModalForExistingTriage ||
        buttonText === "Update Triage"
      ) {
        setOpenModalForExistingTriage(false);
        setIsLoading(true);
        const { res } = await request(routes.createTriage, {
          pathParams: { facilityId },
          body: data,
        });
        setIsLoading(false);
        if (res?.ok) {
          dispatch({ type: "set_form", form: initForm });
          if (id) {
            Notification.Success({ msg: "Triage updated successfully" });
          } else {
            Notification.Success({ msg: "Triage created successfully" });
          }
          goBack();
        }
      } else {
        setOpenModalForExistingTriage(true);
      }
    }
  };

  const handleFormFieldChange = (event: FieldChangeEvent<unknown>) => {
    dispatch({
      type: "set_form",
      form: { ...state.form, [event.name]: event.value },
    });
  };

  if (
    isLoading ||
    facilityQuery.loading ||
    triageDetailsQuery.loading ||
    patientStatsQuery.loading
  ) {
    return <Loading />;
  }

  return (
    <div>
      <Page
        title={headerText}
        crumbsReplacements={{
          [facilityId]: { name: facilityName },
          [id || "????"]: {
            name: dateQueryString(state.form.entry_date),
          },
        }}
        backUrl={`/facility/${facilityId}`}
      >
        <ConfirmDialog
          title={
            <div className="flex gap-2">
              <CareIcon
                icon="l-exclamation-triangle"
                className="text-xl text-red-500"
              />
              <p>A Triage already exist on this date</p>
            </div>
          }
          description="A Triage already exist on this date,  If you wish to proceed then the existing triage will be over
          written!"
          variant="danger"
          show={openModalForExistingTriage}
          onClose={() => setOpenModalForExistingTriage(false)}
          className="w-[48rem]"
          action="Proceed"
          onConfirm={handleSubmit}
        />

        <div className="mt-4">
          <Card>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
            >
              <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="pb-4">
                  <DateFormField
                    required
                    name="entry_date"
                    label="Entry Date"
                    value={state.form.entry_date}
                    disableFuture
                    onChange={handleFormFieldChange}
                    placeholder="Entry Date"
                    error={state.errors.entry_date}
                  />
                </div>
                <div>
                  <TextFormField
                    name="num_patients_visited"
                    type="number"
                    label="Patients Visited in Triage"
                    value={state.form.num_patients_visited}
                    onChange={handleFormFieldChange}
                    error={state.errors.num_patients_visited}
                  />
                </div>
                <div>
                  <TextFormField
                    name="num_patients_home_quarantine"
                    type="number"
                    label="Patients in Home Quarantine"
                    value={state.form.num_patients_home_quarantine}
                    onChange={handleFormFieldChange}
                    error={state.errors.num_patients_home_quarantine}
                  />
                </div>
                <div>
                  <TextFormField
                    name="num_patients_isolation"
                    type="number"
                    label="Suspected Isolated"
                    value={state.form.num_patients_isolation}
                    onChange={handleFormFieldChange}
                    error={state.errors.num_patients_isolation}
                  />
                </div>
                <div>
                  <TextFormField
                    name="num_patient_referred"
                    type="number"
                    label="Patients Referred"
                    value={state.form.num_patient_referred}
                    onChange={handleFormFieldChange}
                    error={state.errors.num_patient_referred}
                  />
                </div>
                <div>
                  <TextFormField
                    name="num_patient_confirmed_positive"
                    type="number"
                    label="Confirmed Positive"
                    value={state.form.num_patient_confirmed_positive}
                    onChange={handleFormFieldChange}
                    error={state.errors.num_patient_confirmed_positive}
                  />
                </div>
              </div>
              <div className="mt-4 flex flex-col justify-end gap-2 md:flex-row">
                <Cancel onClick={() => goBack()} />
                <Submit label={buttonText} />
              </div>
            </form>
          </Card>
        </div>
      </Page>
    </div>
  );
};
