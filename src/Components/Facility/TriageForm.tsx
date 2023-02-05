import { Card, CardContent, InputLabel, Modal } from "@material-ui/core";

import loadable from "@loadable/component";
import moment from "moment";
import { useCallback, useReducer, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  createTriageForm,
  getTriageDetails,
  getAnyFacility,
  getTriageInfo,
} from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { TextInputField } from "../Common/HelperInputFields";
import { PatientStatsModel } from "./models";
import { goBack } from "../../Utils/utils";
import ButtonV2 from "../Common/components/ButtonV2";
import DateInputV2 from "../Common/DateInputV2";
import { Cancel, Submit } from "../Common/components/ButtonV2";
const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

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
                ? moment(res.data.entry_date).toDate()
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
          } else if (
            moment(state.form.entry_date).format("YYYY-MM-DD") >
            new Date().toLocaleDateString("en-ca")
          ) {
            errors[field] = "Date cannot be in future";
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

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setOpenModalForExistingTriage(false);
    const validForm = validateForm();
    if (validForm) {
      const data = {
        entry_date: `${moment(state.form.entry_date).format("YYYY-MM-DD")}`,
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
        e.target.id === "triageConfirm" ||
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

  const handleChange = (e: any) => {
    const form = { ...state.form };
    form[e.target.name] = e.target.value;
    dispatch({ type: "set_form", form });
  };

  const handleDateChange = (date: any, key: string) => {
    if (moment(date).isValid()) {
      // ensuring that the date is not in future
      if (
        moment(date).format("YYYY-MM-DD") >
        new Date().toLocaleDateString("en-ca")
      ) {
        Notification.Error({ msg: "Date can't be in future" });
        return;
      }
      const form = { ...state.form };
      form[key] = date;
      dispatch({ type: "set_form", form });
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  const borderColor = state.errors["entry_date"]
    ? "border-red-500"
    : "border-gray-200";

  return (
    <div className="px-2">
      <PageTitle
        title={headerText}
        crumbsReplacements={{
          [facilityId]: { name: facilityName },
          [id || "????"]: {
            name: moment(state.form.entry_date).format("YYYY-MM-DD"),
          },
        }}
      />

      <Modal
        open={openModalForExistingTriage}
        aria-labelledby="Triage Check"
        aria-describedby=""
        className=""
      >
        <div className="h-screen w-full absolute flex items-center justify-center bg-modal">
          <div className="bg-white rounded shadow p-8 m-4 max-h-full text-center flex flex-col max-w-lg w-2/3 min-w-max-content">
            <div className="mb-4">
              <i className="fa-solid fa-triangle-exclamation text-red-500 fa-4x"></i>
              <h1 className="sm:text-xl text-sm">
                A Triage already exist on this date
              </h1>
              <p className="text-base">
                If you wish to proceed then the existing triage will be over
                written!
              </p>
            </div>
            <div></div>
            <div className="flex flex-col-reverse md:flex-row gap-2 mt-4 justify-end">
              <ButtonV2
                variant="secondary"
                onClick={() => {
                  setOpenModalForExistingTriage(false);
                }}
              >
                Cancel
              </ButtonV2>
              <ButtonV2
                variant="danger"
                id="triageConfirm"
                onClick={(e) => {
                  handleSubmit(e);
                }}
              >
                Proceed
              </ButtonV2>
            </div>
          </div>
        </div>
      </Modal>

      <div className="mt-4">
        <Card>
          <form onSubmit={(e) => handleSubmit(e)}>
            <CardContent>
              <div className="max-w-[250px] pb-4">
                <InputLabel>Entry Date</InputLabel>
                <div className="flex-auto">
                  <DateInputV2
                    className={`bg-gray-50 ${borderColor}`}
                    value={state.form.entry_date}
                    max={new Date()}
                    onChange={(date) => handleDateChange(date, "entry_date")}
                    position="RIGHT"
                    placeholder="Entry Date"
                  />
                </div>
                {state.errors.entry_date &&
                  state.errors.entry_date.length > 0 && (
                    <div className="text-sm text-red-500">
                      {state.errors.entry_date}
                    </div>
                  )}
              </div>
              <div className="mt-2 grid gap-4 grid-cols-1 md:grid-cols-2">
                <div>
                  <InputLabel id="num-patients-visited-label">
                    Patients Visited in Triage
                  </InputLabel>
                  <TextInputField
                    name="num_patients_visited"
                    variant="outlined"
                    margin="dense"
                    type="number"
                    InputLabelProps={{
                      shrink: !!state.form.num_patients_visited,
                    }}
                    value={state.form.num_patients_visited}
                    onChange={handleChange}
                    errors={state.errors.num_patients_visited}
                  />
                </div>
                <div>
                  <InputLabel id="num-patients-home-quarantine-label">
                    Patients in Home Quarantine
                  </InputLabel>
                  <TextInputField
                    name="num_patients_home_quarantine"
                    variant="outlined"
                    margin="dense"
                    type="number"
                    InputLabelProps={{
                      shrink: !!state.form.num_patients_home_quarantine,
                    }}
                    value={state.form.num_patients_home_quarantine}
                    onChange={handleChange}
                    errors={state.errors.num_patients_home_quarantine}
                  />
                </div>
                <div>
                  <InputLabel id="num-patients-isolation-label">
                    Suspected Isolated
                  </InputLabel>
                  <TextInputField
                    name="num_patients_isolation"
                    variant="outlined"
                    margin="dense"
                    type="number"
                    InputLabelProps={{
                      shrink: !!state.form.num_patients_isolation,
                    }}
                    value={state.form.num_patients_isolation}
                    onChange={handleChange}
                    errors={state.errors.num_patients_isolation}
                  />
                </div>
                <div>
                  <InputLabel id="num-patient-referred-label">
                    Patients Referred
                  </InputLabel>
                  <TextInputField
                    name="num_patient_referred"
                    variant="outlined"
                    margin="dense"
                    type="number"
                    InputLabelProps={{
                      shrink: !!state.form.num_patient_referred,
                    }}
                    value={state.form.num_patient_referred}
                    onChange={handleChange}
                    errors={state.errors.num_patient_referred}
                  />
                </div>
                <div>
                  <InputLabel id="num-patient-referred-label">
                    Confirmed Positive
                  </InputLabel>
                  <TextInputField
                    name="num_patient_confirmed_positive"
                    variant="outlined"
                    margin="dense"
                    type="number"
                    InputLabelProps={{
                      shrink: !!state.form.num_patient_confirmed_positive,
                    }}
                    value={state.form.num_patient_confirmed_positive}
                    onChange={handleChange}
                    errors={state.errors.num_patient_confirmed_positive}
                  />
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-2 justify-between mt-4">
                <Cancel onClick={() => goBack()} />
                <Submit onClick={handleSubmit} label={buttonText} />
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
};
