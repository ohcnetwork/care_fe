import { useState, useEffect } from "react";
import * as Notification from "../../Utils/Notifications.js";
import CareIcon from "../../CAREUI/icons/CareIcon";
import TextFormField from "../Form/FormFields/TextFormField";
import ButtonV2 from "../Common/components/ButtonV2";
import { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";
import PatientNotesList from "../Facility/PatientNotesList";
import Page from "../Common/components/Page";
import { useMessageListener } from "../../Common/hooks/useMessageListener";
import { PatientNoteStateType, PatientNotesModel } from "../Facility/models";
import request from "../../Utils/request/request";
import routes from "../../Redux/api";
import { PATIENT_NOTES_THREADS } from "../../Common/constants.js";
import useAuthUser from "../../Common/hooks/useAuthUser.js";
import { classNames } from "../../Utils/utils.js";
import DoctorNoteReplyPreviewCard from "../Facility/DoctorNoteReplyPreviewCard.js";

interface PatientNotesProps {
  patientId: string;
  facilityId: string;
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
  const [reply_to, setReplyTo] = useState<PatientNotesModel>();

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

    const { res, data } = await request(routes.addPatientNote, {
      pathParams: { patientId: patientId },
      body: {
        note: noteField,
        thread,
        reply_to: reply_to?.id,
      },
    });
    if (res?.status === 201) {
      Notification.Success({ msg: "Note added successfully" });
      setNoteField("");
      setReload(!reload);
      setState({ ...state, cPage: 1 });
      setReplyTo(undefined);
    }
    return data?.id;
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
      <div className="relative mx-3 my-2 flex grow flex-col rounded-lg border border-gray-300 bg-white p-2 sm:mx-10 sm:my-5 sm:p-5">
        <div className="absolute inset-x-0 top-0 z-10 flex bg-gray-200 text-sm shadow-md">
          {Object.values(PATIENT_NOTES_THREADS).map((current) => (
            <button
              key={current}
              className={classNames(
                "flex flex-1 justify-center border-b-2 py-2",
                thread === current
                  ? "border-primary-500 font-bold text-gray-800"
                  : "border-gray-300 text-gray-800",
              )}
              onClick={() => setThread(current)}
            >
              {
                {
                  10: "Doctor's Discussions",
                  20: "Nurse's Discussions",
                }[current]
              }
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
          setReplyTo={setReplyTo}
        />
        <DoctorNoteReplyPreviewCard
          parentNote={reply_to}
          cancelReply={() => setReplyTo(undefined)}
        >
          <div className="relative mx-4 flex items-center">
            <TextFormField
              name="note"
              value={noteField}
              onChange={(e) => setNoteField(e.value)}
              className="grow"
              type="text"
              errorClassName="hidden"
              placeholder="Type your Note"
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
        </DoctorNoteReplyPreviewCard>
      </div>
    </Page>
  );
};

export default PatientNotes;
