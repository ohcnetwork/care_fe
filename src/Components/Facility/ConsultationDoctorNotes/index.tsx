import { useState } from "react";
import * as Notification from "../../../Utils/Notifications.js";
import Page from "../../Common/components/Page";
// import ButtonV2 from "../../Common/components/ButtonV2";
// import CareIcon from "../../../CAREUI/icons/CareIcon";
// import { NonReadOnlyUsers } from "../../../Utils/AuthorizeFor";
import { useMessageListener } from "../../../Common/hooks/useMessageListener";
import PatientConsultationNotesList from "../PatientConsultationNotesList.js";
import { PatientNoteStateType, PaitentNotesReplyModel } from "../models.js";
import routes from "../../../Redux/api.js";
import request from "../../../Utils/request/request.js";
import useQuery from "../../../Utils/request/useQuery.js";
import useKeyboardShortcut from "use-keyboard-shortcut";
import { classNames, isAppleDevice } from "../../../Utils/utils.js";
// import AutoExpandingTextInputFormField from "../../Form/FormFields/AutoExpandingTextInputFormField.js";
import { PATIENT_NOTES_THREADS } from "../../../Common/constants.js";
import useAuthUser from "../../../Common/hooks/useAuthUser.js";
import DoctorNoteReplyPreviewCard from "../DoctorNoteReplyPreviewCard.js";
import Switch from "../../../CAREUI/interactive/Switch.js";
import PatientNotesDetailedView from "../PatientNotesDetailedView.js";
import RichTextEditor from "../../Common/RichTextEditor.js";

interface ConsultationDoctorNotesProps {
  patientId: string;
  facilityId: string;
  consultationId: string;
  noteId?: string;
}

const ConsultationDoctorNotes = (props: ConsultationDoctorNotesProps) => {
  const { patientId, facilityId, consultationId, noteId } = props;

  const authUser = useAuthUser();
  const [thread, setThread] = useState(
    authUser.user_type === "Nurse"
      ? PATIENT_NOTES_THREADS.Nurses
      : PATIENT_NOTES_THREADS.Doctors,
  );

  // const [patientActive, setPatientActive] = useState(true);
  const [noteField, setNoteField] = useState("");
  const [reload, setReload] = useState(false);
  const [facilityName, setFacilityName] = useState("");
  const [patientName, setPatientName] = useState("");
  // const [focused, setFocused] = useState(false);
  const [reply_to, setReplyTo] = useState<PaitentNotesReplyModel | undefined>(
    undefined,
  );
  const [mode, setMode] = useState<"comments" | "replies">("comments");

  const initialData: PatientNoteStateType = {
    notes: [],
    cPage: 1,
    totalPages: 1,
    facilityId: facilityId,
    patientId: patientId,
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
      pathParams: {
        patientId: patientId,
      },
      body: {
        note: noteField,
        thread,
        consultation: consultationId,
        reply_to: reply_to?.id,
      },
    });

    if (res?.status === 201) {
      Notification.Success({ msg: "Note added successfully" });
      setState({ ...state, cPage: 1 });
      setNoteField("");
      setReload(true);
      setReplyTo(undefined);
    }
  };

  useQuery(routes.getPatient, {
    pathParams: { id: patientId },
    onResponse: ({ data }) => {
      if (data) {
        // setPatientActive(data.is_active ?? true);
        setPatientName(data.name ?? "");
        setFacilityName(data.facility_object?.name ?? "");
      }
    },
  });

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

  useKeyboardShortcut(
    [isAppleDevice ? "Meta" : "Shift", "Enter"],
    () => {
      // if (focused) {
      onAddNote();
      // }
    },
    {
      ignoreInputFields: false,
    },
  );

  if (noteId) {
    return (
      <PatientNotesDetailedView
        patientId={patientId}
        facilityId={facilityId}
        consultationId={consultationId}
        noteId={noteId}
        thread={thread}
      />
    );
  }

  return (
    <Page
      title="Discussion Notes"
      className="relative flex h-screen flex-col"
      crumbsReplacements={{
        [facilityId]: { name: facilityName },
        [patientId]: { name: patientName },
      }}
      backUrl={`/facility/${facilityId}/patient/${patientId}`}
    >
      <div className="absolute right-20 top-20 flex items-center">
        <Switch
          tabs={{
            comments: "Thread View",
            replies: "Default View",
          }}
          selected={mode}
          onChange={(tab) => setMode(tab)}
        />
      </div>
      <div className="relative mx-3 my-2 flex grow flex-col rounded-lg border border-gray-300 bg-white p-2 sm:mx-10 sm:my-5 sm:p-5">
        <div className="absolute inset-x-0 top-0 flex bg-gray-200 text-sm shadow-md">
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
        <PatientConsultationNotesList
          state={state}
          setState={setState}
          reload={reload}
          setReload={setReload}
          thread={thread}
          setReplyTo={setReplyTo}
          mode={mode}
        />
        <DoctorNoteReplyPreviewCard
          parentNote={reply_to}
          cancelReply={() => setReplyTo(undefined)}
        >
          <div className="mx-4 flex items-center">
            <RichTextEditor
              initialMarkdown={noteField}
              onChange={setNoteField}
              onAddNote={onAddNote}
            />
            {/* <ButtonV2
              onClick={onAddNote}
              border={false}
              className="absolute right-2"
              ghost
              size="small"
              disabled={!patientActive}
              authorizeFor={NonReadOnlyUsers}
            >
              <CareIcon icon="l-message" className="text-lg" />
            </ButtonV2> */}
          </div>
        </DoctorNoteReplyPreviewCard>
      </div>
    </Page>
  );
};

export default ConsultationDoctorNotes;
