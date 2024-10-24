import { useState } from "react";
import * as Notification from "../../../Utils/Notifications.js";
import Page from "../../Common/components/Page";
import { useMessageListener } from "@/common/hooks/useMessageListener";
import PatientConsultationNotesList from "../PatientConsultationNotesList.js";
import { PatientNoteStateType, PaitentNotesReplyModel } from "../models.js";
import routes from "../../../Redux/api.js";
import request from "../../../Utils/request/request.js";
import useQuery from "../../../Utils/request/useQuery.js";
import { classNames } from "../../../Utils/utils.js";
import { keysOf } from "../../../Utils/utils.js";
import { PATIENT_NOTES_THREADS } from "@/common/constants.js";
import useAuthUser from "@/common/hooks/useAuthUser.js";
import DoctorNoteReplyPreviewCard from "../DoctorNoteReplyPreviewCard.js";
import RichTextEditor from "@/components/Common/RichTextEditor";
import PatientNotesDetailedView from "../PatientNotesDetailedView.js";
import Tabs from "@/components/Common/components/Tabs";
import { useTranslation } from "react-i18next";

interface ConsultationDoctorNotesProps {
  patientId: string;
  facilityId: string;
  consultationId: string;
}

const ConsultationDoctorNotes = (props: ConsultationDoctorNotesProps) => {
  const { patientId, facilityId, consultationId } = props;
  const { t } = useTranslation();
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
  const [reply_to, setReplyTo] = useState<PaitentNotesReplyModel | undefined>(
    undefined,
  );
  const [mode, setMode] = useState<"thread-view" | "default-view">(
    "default-view",
  );
  const [threadViewNote, setThreadViewNote] = useState("");

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

    const { res, data } = await request(routes.addPatientNote, {
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

    return data?.id;
  };

  useQuery(routes.getPatient, {
    pathParams: { id: patientId },
    onResponse: ({ data }) => {
      if (data) {
        setPatientActive(data.is_active ?? true);
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
      <div className="right-8 top-0 max-sm:my-1 sm:mx-2 md:absolute">
        <Tabs
          className="mt-1 w-full gap-8 lg:w-full"
          tabs={[
            { text: "Thread View", value: "thread-view" },
            { text: "Default View", value: "default-view" },
          ]}
          currentTab={mode}
          onTabChange={(tab) => setMode(tab as "thread-view" | "default-view")}
        />
      </div>
      <div className="relative flex h-full flex-col overflow-hidden rounded-lg border border-secondary-300 bg-white">
        <div className="sticky top-0 z-10 flex bg-secondary-200 text-sm shadow-md">
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
        <div className="flex flex-1 overflow-hidden">
          <div
            className={classNames(
              "flex flex-1 flex-col",
              threadViewNote && "max-sm:hidden",
            )}
          >
            <PatientConsultationNotesList
              state={state}
              setState={setState}
              reload={reload}
              setReload={setReload}
              thread={thread}
              setReplyTo={setReplyTo}
              mode={mode}
              setThreadViewNote={setThreadViewNote}
            />
            <div className="mt-2">
              <DoctorNoteReplyPreviewCard
                parentNote={reply_to}
                cancelReply={() => setReplyTo(undefined)}
              >
                <RichTextEditor
                  initialMarkdown={noteField}
                  onChange={setNoteField}
                  onAddNote={onAddNote}
                  isAuthorized={patientActive}
                  onRefetch={() => setReload(true)}
                />
              </DoctorNoteReplyPreviewCard>
            </div>
          </div>

          {threadViewNote && (
            <PatientNotesDetailedView
              patientId={patientId}
              consultationId={consultationId}
              noteId={threadViewNote}
              thread={thread}
              setThreadViewNote={setThreadViewNote}
            />
          )}
        </div>
      </div>
    </Page>
  );
};

export default ConsultationDoctorNotes;
