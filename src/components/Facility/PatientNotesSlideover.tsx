import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";
import AuthorizedChild from "@/CAREUI/misc/AuthorizedChild";

import DiscussionNotesEditor from "@/components/Common/DiscussionNotesEditor";
import DoctorNoteReplyPreviewCard from "@/components/Facility/DoctorNoteReplyPreviewCard";
import PatientNotesList from "@/components/Facility/PatientNotesList";
import {
  PatientNoteStateType,
  PatientNotesReplyModel,
} from "@/components/Facility/models";

import useAuthUser from "@/hooks/useAuthUser";
import { useMessageListener } from "@/hooks/useMessageListener";
import useNotificationSubscriptionState from "@/hooks/useNotificationSubscriptionState";

import {
  PATIENT_NOTES_THREADS,
  RESULTS_PER_PAGE_LIMIT,
} from "@/common/constants";

import { NonReadOnlyUsers } from "@/Utils/AuthorizeFor";
import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import request from "@/Utils/request/request";
import { classNames, keysOf } from "@/Utils/utils";

interface PatientNotesProps {
  patientId: string;
  facilityId: string;
  consultationId: string;
  setShowPatientNotesPopup: Dispatch<SetStateAction<boolean>>;
}

export default function PatientNotesSlideover(props: PatientNotesProps) {
  const authUser = useAuthUser();
  const { t } = useTranslation();
  const notificationSubscriptionState = useNotificationSubscriptionState();
  const [thread, setThread] = useState(
    authUser.user_type === "Nurse"
      ? PATIENT_NOTES_THREADS.Nurses
      : PATIENT_NOTES_THREADS.Doctors,
  );
  const [show, setShow] = useState(true);
  const [patientActive, setPatientActive] = useState(true);
  const [reply_to, setReplyTo] = useState<PatientNotesReplyModel | undefined>(
    undefined,
  );

  const slideoverRef = useRef<HTMLDivElement>(null);

  const { facilityId, patientId, consultationId, setShowPatientNotesPopup } =
    props;

  const initialData: PatientNoteStateType = {
    notes: [],
    cPage: 1,
    totalPages: 1,
    patientId: patientId,
    facilityId: facilityId,
  };
  const [state, setState] = useState(initialData);

  const localStorageKey = `patientNotesNoteField_${consultationId}`;
  const [noteField, setNoteField] = useState(
    localStorage.getItem(localStorageKey) || "",
  );

  const {
    data: notesData,
    isLoading,
    isRefetching,
    refetch: refetchNotes,
  } = useQuery({
    queryKey: [routes.getPatientNotes.path, patientId, state.cPage, thread],
    queryFn: query(routes.getPatientNotes, {
      pathParams: { patientId },
      queryParams: {
        offset: String((state.cPage - 1) * RESULTS_PER_PAGE_LIMIT),
        thread,
      },
    }),
  });

  useEffect(() => {
    if (notesData) {
      setState((prevState) => ({
        ...prevState,
        notes:
          prevState.cPage === 1
            ? notesData.results
            : [...prevState.notes, ...notesData.results],
        totalPages: Math.ceil(notesData.count / RESULTS_PER_PAGE_LIMIT),
      }));
    }
  }, [notesData, state.cPage]);

  const { data: patientData } = useQuery({
    queryKey: [routes.getPatient.path, patientId],
    queryFn: query(routes.getPatient, {
      pathParams: { id: patientId },
    }),
    enabled: !!patientId,
  });

  useEffect(() => {
    if (patientData) {
      setPatientActive(patientData.is_active ?? true);
    }
  }, [patientData]);

  useEffect(() => {
    if (notificationSubscriptionState === "unsubscribed") {
      Notification.Warn({
        msg: "Please subscribe to notifications to get live updates on discussion notes.",
      });
    } else if (notificationSubscriptionState === "subscribed_on_other_device") {
      Notification.Warn({
        msg: "Please subscribe to notifications on this device to get live updates on discussion notes.",
      });
    }
  }, [notificationSubscriptionState]);

  const onAddNote = async () => {
    if (!/\S+/.test(noteField)) {
      Notification.Error({
        msg: "Note Should Contain At Least 1 Character",
      });
      return;
    }

    try {
      const { res, data } = await request(routes.addPatientNote, {
        pathParams: { patientId: patientId },
        body: {
          note: noteField,
          consultation: consultationId,
          thread,
          reply_to: reply_to?.id,
        },
      });

      if (res?.status === 201) {
        Notification.Success({ msg: "Note added successfully" });
        setNoteField("");
        setState({ ...state, cPage: 1 });
        setReplyTo(undefined);
      } else {
        Notification.Error({ msg: "Failed to add note. Please try again." });
      }
      return data?.id;
    } catch (error) {
      Notification.Error({ msg: "An error occurred while adding the note." });
      return undefined;
    }
  };

  useMessageListener((data) => {
    const message = data?.message;
    if (
      (message?.from == "patient/doctor_notes/create" ||
        message?.from == "patient/doctor_notes/edit") &&
      message?.facility_id == facilityId &&
      message?.patient_id == patientId
    ) {
      refetchNotes();
    }
  });

  useEffect(() => {
    localStorage.setItem(localStorageKey, noteField);
  }, [noteField, localStorageKey]);

  const notesActionIcons = (
    <div className="flex gap-1">
      {show && (
        <Link
          className="tooltip flex h-8 w-8 cursor-pointer items-center justify-center rounded bg-primary-800 text-secondary-100 text-opacity-70 hover:bg-primary-700 hover:text-opacity-100"
          href={`/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/notes`}
        >
          <CareIcon
            icon="l-window-maximize"
            className="tooltip text-lg transition-all delay-150 duration-300 ease-out"
          />
          <span className="tooltip-text tooltip-bottom -translate-x-[4.9rem] text-xs">
            {t("full_screen")}
          </span>
        </Link>
      )}
      <div
        id="expand_doctor_notes"
        className={classNames(
          "tooltip flex h-8 w-8 cursor-pointer items-center justify-center rounded bg-primary-800 text-secondary-100 text-opacity-70 hover:bg-primary-700 hover:text-opacity-100",
        )}
        onClick={() => setShow(!show)}
      >
        <CareIcon
          icon={show ? "l-angle-down" : "l-angle-up"}
          className="tooltip text-lg transition-all delay-150 duration-300 ease-out"
        />
        <span
          className={classNames(
            "tooltip-text text-xs",
            show ? "tooltip-bottom -translate-x-16" : "tooltip-top",
          )}
        >
          {t("minimize")}
        </span>
      </div>
      <div
        className="tooltip flex h-8 w-8 cursor-pointer items-center justify-center rounded bg-primary-800 text-secondary-100 text-opacity-70 hover:bg-primary-700 hover:text-opacity-100"
        onClick={() => setShowPatientNotesPopup(false)}
      >
        <CareIcon
          icon="l-times"
          className="tooltip text-lg transition-all delay-150 duration-300 ease-out"
        />
        <span
          className={classNames(
            "tooltip-text text-xs",
            show ? "tooltip-bottom -translate-x-11" : "tooltip-top",
          )}
        >
          {t("close")}
        </span>
      </div>
    </div>
  );

  return (
    <div
      ref={slideoverRef}
      className={classNames(
        "fixed bottom-0 z-20 sm:right-8",
        show
          ? "right-0 h-screen w-screen sm:h-fit sm:w-[430px]"
          : "right-8 w-[250px]",
      )}
    >
      {!show ? (
        <div
          className="flex w-full cursor-pointer items-center justify-around rounded-t-md bg-primary-800 p-2 text-white"
          onClick={() => setShow(!show)}
        >
          <span className="font-semibold">Discussion Notes</span>
          {notesActionIcons}
        </div>
      ) : (
        <div className="flex h-screen w-full -translate-y-0 flex-col text-clip border-2 border-b-0 border-primary-800 bg-white transition-all sm:h-[550px] sm:rounded-t-md">
          <div className="flex w-full items-center justify-between bg-primary-800 p-2 px-4 text-white">
            <span className="font-semibold">Discussion Notes</span>
            {notesActionIcons}
          </div>
          <div className="flex bg-primary-800 text-sm">
            {keysOf(PATIENT_NOTES_THREADS).map((current) => (
              <button
                id={`patient-note-tab-${current}`}
                key={current}
                className={classNames(
                  "flex flex-1 justify-center border-b-4 py-1",
                  thread === PATIENT_NOTES_THREADS[current]
                    ? "border-primary-500 font-medium text-white"
                    : "border-primary-800 text-white/70",
                )}
                onClick={() => setThread(PATIENT_NOTES_THREADS[current])}
              >
                {t(`patient_notes_thread__${current}`)}
              </button>
            ))}
          </div>
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
            refetch={refetchNotes}
            disableEdit={!patientActive}
            setReplyTo={setReplyTo}
            isLoading={isLoading || isRefetching}
          />
          {patientActive && (
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
                    isAuthorized={isAuthorized}
                    onRefetch={refetchNotes}
                    maxRows={10}
                    className="mt-2"
                    parentRef={slideoverRef}
                  />
                </DoctorNoteReplyPreviewCard>
              )}
            </AuthorizedChild>
          )}
        </div>
      )}
    </div>
  );
}
