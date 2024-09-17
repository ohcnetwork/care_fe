import { useState, useEffect } from "react";
import * as Notification from "../../Utils/Notifications.js";
import CareIcon from "../../CAREUI/icons/CareIcon";
import ButtonV2 from "../Common/components/ButtonV2";
import { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";
import PatientNotesList from "../Facility/PatientNotesList";
import Page from "../Common/components/Page";
import { useMessageListener } from "../../Common/hooks/useMessageListener";
import { PatientNoteStateType } from "../Facility/models";
import request from "../../Utils/request/request";
import routes from "../../Redux/api";
import { PATIENT_NOTES_THREADS } from "../../Common/constants.js";
import useAuthUser from "../../Common/hooks/useAuthUser.js";
import { classNames, keysOf } from "../../Utils/utils.js";
import AutoExpandingTextInputFormField from "../Form/FormFields/AutoExpandingTextInputFormField.js";
import { t } from "i18next";

interface PatientNotesProps {
  patientId: any;
  facilityId: any;
}

const PatientNotes = (props: PatientNotesProps) => {
  const { patientId, facilityId } = props;

  const authUser = useAuthUser();
  const [thread, setThread] = useState(
    authUser.user_type === "Nurse"
      ? PATIENT_NOTES_THREADS.Nurses
      : PATIENT_NOTES_THREADS.Doctors,
  );

  const [patientActive, setPatientActive] = useState(true);
  const [noteField, setNoteField] = useState("");
  const [reload, setReload] = useState(false);
  const [facilityName, setFacilityName] = useState("");
  const [patientName, setPatientName] = useState("");

  const initialData: PatientNoteStateType = {
    notes: [],
    cPage: 1,
    totalPages: 1,
  };
  const [state, setState] = useState(initialData);

  const onAddNote = async () => {
    if (!/\S+/.test(noteField)) {
      Notification.Error({
        msg: "Note Should Contain At Least 1 Character",
      });
      return;
    }

    const { res } = await request(routes.addPatientNote, {
      pathParams: { patientId: patientId },
      body: {
        note: noteField,
        thread,
      },
    });
    if (res?.status === 201) {
      Notification.Success({ msg: "Note added successfully" });
      setNoteField("");
      setReload(!reload);
      setState({ ...state, cPage: 1 });
    }
  };

  useEffect(() => {
    async function fetchPatientName() {
      if (patientId) {
        const { data } = await request(routes.getPatient, {
          pathParams: { id: patientId },
        });
        if (data) {
          setPatientActive(data.is_active ?? true);
          setPatientName(data.name ?? "");
          setFacilityName(data.facility_object?.name ?? "");
        }
      }
    }
    fetchPatientName();
  }, [patientId]);

  useMessageListener((data) => {
    const message = data?.message;
    if (
      (message?.from == "patient/doctor_notes/create" ||
        message?.from == "patient/doctor_notes/edit") &&
      message?.facility_id == facilityId &&
      message?.patient_id == patientId
    ) {
      setReload(true);
    }
  });

  return (
    <Page
      title="Patient Notes"
      className="flex h-screen flex-col"
      crumbsReplacements={{
        [facilityId]: { name: facilityName },
        [patientId]: { name: patientName },
      }}
      backUrl={`/facility/${facilityId}/patient/${patientId}`}
    >
      <div className="relative mx-3 my-2 flex grow flex-col rounded-lg border border-secondary-300 bg-white p-2 sm:mx-10 sm:my-5 sm:p-5">
        <div className="absolute inset-x-0 top-0 flex bg-secondary-200 text-sm shadow-md">
          {keysOf(PATIENT_NOTES_THREADS).map((current) => (
            <button
              id={`patient-note-tab-${current}`}
              key={current}
              className={classNames(
                "flex flex-1 justify-center border-b-2 py-2",
                thread === PATIENT_NOTES_THREADS[current]
                  ? "border-primary-500 font-bold text-secondary-800"
                  : "border-secondary-300 text-secondary-800",
              )}
              onClick={() => setThread(PATIENT_NOTES_THREADS[current])}
            >
              {t(`patient_notes_thread__${current}`)}
            </button>
          ))}
        </div>
        <PatientNotesList
          state={state}
          setState={setState}
          patientId={patientId}
          facilityId={facilityId}
          reload={reload}
          setReload={setReload}
          thread={thread}
        />

        <div className="relative mx-4 flex items-center">
          <AutoExpandingTextInputFormField
            maxHeight={160}
            rows={2}
            name="note"
            value={noteField}
            onChange={(e) => setNoteField(e.value)}
            className="w-full grow"
            errorClassName="hidden"
            innerClassName="pr-10"
            placeholder={t("notes_placeholder")}
            disabled={!patientActive}
          />
          <ButtonV2
            onClick={onAddNote}
            border={false}
            className="absolute right-2"
            ghost
            size="small"
            disabled={!patientActive}
            authorizeFor={NonReadOnlyUsers}
          >
            <CareIcon icon="l-message" className="text-lg" />
          </ButtonV2>
        </div>
      </div>
    </Page>
  );
};

export default PatientNotes;
