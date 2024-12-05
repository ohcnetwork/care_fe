import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import AuthorizedChild from "@/CAREUI/misc/AuthorizedChild";

import DiscussionNotesEditor from "@/components/Common/DiscussionNotesEditor";
import Tabs from "@/components/Common/Tabs";
import DoctorNoteReplyPreviewCard from "@/components/Facility/DoctorNoteReplyPreviewCard";
import PatientNotesDetailedView from "@/components/Facility/PatientNotesDetailedView";
import PatientNotesList from "@/components/Facility/PatientNotesList";
import {
  PatientNoteStateType,
  PatientNotesModel,
} from "@/components/Facility/models";

import useAuthUser from "@/hooks/useAuthUser";
import { useMessageListener } from "@/hooks/useMessageListener";

import {
  PATIENT_NOTES_THREADS,
  RESULTS_PER_PAGE_LIMIT,
} from "@/common/constants";

import { NonReadOnlyUsers } from "@/Utils/AuthorizeFor";
import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useQuery from "@/Utils/request/useQuery";
import { classNames, keysOf } from "@/Utils/utils";

interface PatientNotesProps {
  patientId: string;
  facilityId: string;
  consultationId?: string;
  className?: string;
  allowThreadView?: boolean;
}

const PatientNotesListComponent = (props: PatientNotesProps) => {
  const {
    patientId,
    facilityId,
    consultationId,
    allowThreadView = true,
  } = props;
  const { t } = useTranslation();
  const authUser = useAuthUser();
  const [thread, setThread] = useState(
    authUser.user_type === "Nurse"
      ? PATIENT_NOTES_THREADS.Nurses
      : PATIENT_NOTES_THREADS.Doctors,
  );

  const [patientActive, setPatientActive] = useState(true);
  const [noteField, setNoteField] = useState("");
  const [reply_to, setReplyTo] = useState<PatientNotesModel | undefined>(
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

  const { refetch, loading } = useQuery(routes.getPatientNotes, {
    pathParams: { patientId },
    query: {
      consultation: consultationId,
      offset: (state.cPage - 1) * RESULTS_PER_PAGE_LIMIT,
      thread,
    },
    onResponse: ({ data }) => {
      if (data) {
        setState((prevState) => ({
          ...prevState,
          notes:
            prevState.cPage === 1
              ? data.results
              : [...prevState.notes, ...data.results],
          totalPages: Math.ceil(data.count / RESULTS_PER_PAGE_LIMIT),
        }));
      }
    },
  });

  useEffect(() => {
    setThreadViewNote("");
    setState((prev) => ({ ...prev, notes: [], cPage: 1 }));
  }, [thread]);

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
      setReplyTo(undefined);
    } else {
      Notification.Error({ msg: "Failed to add note. Please try again." });
    }

    return data?.id;
  };

  useQuery(routes.getPatient, {
    pathParams: { id: patientId },
    onResponse: ({ data }) => {
      if (data) {
        setPatientActive(data.is_active ?? true);
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
      refetch();
    }
  });

  return (
    <div className="flex h-full flex-col">
      {allowThreadView && (
        <div className="right-8 top-0 max-sm:mb-2 sm:mx-2 md:absolute">
          <Tabs
            className="mt-1 w-full gap-8 lg:w-full"
            tabs={[
              { text: "Thread View", value: "thread-view" },
              { text: "Default View", value: "default-view" },
            ]}
            currentTab={mode}
            onTabChange={(tab) =>
              setMode(tab as "thread-view" | "default-view")
            }
          />
        </div>
      )}
      <div className="relative flex flex-1 flex-col overflow-hidden rounded-lg border border-secondary-300 bg-white">
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
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <div
            className={classNames(
              "flex flex-1 flex-col min-h-0 w-full",
              threadViewNote && "max-sm:hidden sm:w-[calc(100%-500px)]",
            )}
          >
            <PatientNotesList
              state={state}
              handleNext={() => {
                if (state.cPage < state.totalPages) {
                  setState((prevState) => ({
                    ...prevState,
                    cPage: prevState.cPage + 1,
                  }));
                }
              }}
              refetch={refetch}
              disableEdit={!patientActive}
              setReplyTo={setReplyTo}
              mode={mode}
              setThreadViewNote={setThreadViewNote}
              isLoading={loading}
            />
            <div className="mt-2">
              <AuthorizedChild authorizeFor={NonReadOnlyUsers}>
                {({ isAuthorized }) => (
                  <DoctorNoteReplyPreviewCard
                    parentNote={reply_to}
                    cancelReply={() => setReplyTo(undefined)}
                  >
                    <DiscussionNotesEditor
                      initialNote={noteField}
                      onChange={setNoteField}
                      onAddNote={onAddNote}
                      isAuthorized={isAuthorized && patientActive}
                      onRefetch={refetch}
                      maxRows={10}
                      className="mt-2"
                    />
                  </DoctorNoteReplyPreviewCard>
                )}
              </AuthorizedChild>
            </div>
          </div>

          {threadViewNote && (
            <div className="flex w-full sm:w-[500px] min-h-0 max-sm:fixed max-sm:inset-0 max-sm:z-50 sm:border-l sm:border-secondary-300">
              <PatientNotesDetailedView
                patientId={patientId}
                consultationId={consultationId}
                noteId={threadViewNote}
                thread={thread}
                setThreadViewNote={setThreadViewNote}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientNotesListComponent;
