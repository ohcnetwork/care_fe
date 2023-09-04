import ConfirmDialog from "../Common/ConfirmDialog";
import Card from "../../CAREUI/display/Card";

import CareIcon from "../../CAREUI/icons/CareIcon";
import { useCallback, useReducer, useState, useEffect, lazy } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  createTriageForm,
  getTriageDetails,
  getAnyFacility,
  getTriageInfo,
} from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import TextFormField from "../Form/FormFields/TextFormField";
import { PatientStatsModel } from "./models";
import { Cancel, Submit } from "../Common/components/ButtonV2";
import useAppHistory from "../../Common/hooks/useAppHistory";
import DateFormField from "../Form/FormFields/DateFormField";
import { FieldChangeEvent } from "../Form/FormFields/Utils";
const Loading = lazy(() => import("../Common/Loading"));
import Page from "../Common/components/Page";
import dayjs from "dayjs";
import { dateQueryString } from "../../Utils/utils";

interface triageFormProps extends PatientStatsModel {
  facilityId: number;
  id?: number;
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

export const TriageForm = (props: triageFormProps) => {
  const { goBack } = useAppHistory();
  const dispatchTriageData: any = useDispatch();
  const dispatchAction: any = useDispatch();
  const { facilityId, id } = props;
  const [state, dispatch] = useReducer(triageFormReducer, initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [facilityName, setFacilityName] = useState("");
  const [patientStatsData, setPatientStatsData] = useState<
    Array<PatientStatsModel>
  >([]);
  const [openModalForExistingTriage, setOpenModalForExistingTriage] =
    useState<boolean>(false);
  const headerText = !id ? "Add Triage" : "Edit Triage";
  const buttonText = !id ? "Save Triage" : "Update Triage";

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      if (id) {
        // Edit Form functionality
        const res = await dispatchAction(
          getTriageDetails({ facilityId: facilityId, id: id })
        );
        if (!status.aborted && res && res.data) {
          dispatch({
            type: "set_form",
            form: {
              entry_date: res.data.entry_date
                ? dayjs(res.data.entry_date).toDate()
                : null,
              num_patients_visited: res.data.num_patients_visited,
              num_patients_home_quarantine:
                res.data.num_patients_home_quarantine,
              num_patients_isolation: res.data.num_patients_isolation,
              num_patient_referred: res.data.num_patient_referred,
              num_patient_confirmed_positive:
                res.data.num_patient_confirmed_positive,
            },
          });
        }
      }
      setIsLoading(false);
    },
    [dispatchAction, facilityId, id]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [dispatch, fetchData, id]
  );

  // this will fetch all triage data of the facility
  const fetchTriageData = useCallback(
    async (status: statusType) => {
      const [triageRes] = await Promise.all([
        dispatchTriageData(getTriageInfo({ facilityId })),
      ]);
      if (!status.aborted) {
        if (
          triageRes &&
          triageRes.data &&
          triageRes.data.results &&
          triageRes.data.results.length
        ) {
          setPatientStatsData(triageRes.data.results);
        }
      }
    },
    [dispatchTriageData, facilityId]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchTriageData(status);
    },
    [dispatch, fetchTriageData]
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

  const validateForm = () => {
    const errors = { ...initForm };
    let invalidForm = false;
    Object.keys(state.form).forEach((field, _) => {
      switch (field) {
        case "entry_date":
          if (!state.form[field]) {
            errors[field] = "Field is required";
            invalidForm = true;
          }
          return;
        default:
          return;
      }
    });
    if (invalidForm) {
      dispatch({ type: "set_error", errors });
      return false;
    }
    dispatch({ type: "set_error", errors });
    return true;
  };
  const isTriageExist = (data: any) => {
    if (
      patientStatsData.filter(
        (triageData) => triageData.entry_date === data.entry_date
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
          state.form.num_patients_home_quarantine
        ),
        num_patients_isolation: Number(state.form.num_patients_isolation),
        num_patient_referred: Number(state.form.num_patient_referred),
        num_patient_confirmed_positive: Number(
          state.form.num_patient_confirmed_positive
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
        const res = await dispatchAction(
          createTriageForm(data, { facilityId })
        );
        setIsLoading(false);
        if (res && res.data) {
          dispatch({ type: "set_form", form: initForm });
          if (id) {
            Notification.Success({
              msg: "Triage updated successfully",
            });
          } else {
            Notification.Success({
              msg: "Triage created successfully",
            });
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

  if (isLoading) {
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
              <CareIcon className="care-l-exclamation-triangle text-xl text-red-500" />
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
              <div className="max-w-[250px] pb-4">
                <DateFormField
                  required
                  name="entry_date"
                  label="Entry Date"
                  value={state.form.entry_date}
                  disableFuture
                  onChange={handleFormFieldChange}
                  position="LEFT"
                  placeholder="Entry Date"
                  error={state.errors.entry_date}
                />
              </div>
              <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
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
              <div className="mt-4 flex flex-col justify-between gap-2 md:flex-row">
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
