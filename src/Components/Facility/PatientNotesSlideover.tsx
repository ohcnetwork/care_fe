import { useState, useEffect, Dispatch, SetStateAction } from "react";
import * as Notification from "../../Utils/Notifications.js";
import { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { classNames } from "../../Utils/utils";
import { useMessageListener } from "../../Common/hooks/useMessageListener";
import PatientConsultationNotesList from "./PatientConsultationNotesList";
import request from "../../Utils/request/request";
import routes from "../../Redux/api";
import { PatientNoteStateType, PaitentNotesReplyModel } from "./models";
import useAuthUser from "../../Common/hooks/useAuthUser";
import { PATIENT_NOTES_THREADS } from "../../Common/constants.js";
import DoctorNoteReplyPreviewCard from "./DoctorNoteReplyPreviewCard.js";
import useNotificationSubscriptionState from "../../Common/hooks/useNotificationSubscriptionState.js";
import RichTextEditor from "../Common/RichTextEditor/RichTextEditor";
import AuthorizedChild from "../../CAREUI/misc/AuthorizedChild.js";
import { Link } from "raviger";

interface PatientNotesProps {
  patientId: string;
  facilityId: string;
  consultationId: string;
  setShowPatientNotesPopup: Dispatch<SetStateAction<boolean>>;
}

export default function PatientNotesSlideover(props: PatientNotesProps) {
  const authUser = useAuthUser();
  const notificationSubscriptionState = useNotificationSubscriptionState();
  const [thread, setThread] = useState(
    authUser.user_type === "Nurse"
      ? PATIENT_NOTES_THREADS.Nurses
      : PATIENT_NOTES_THREADS.Doctors,
  );
  const [show, setShow] = useState(true);
  const [patientActive, setPatientActive] = useState(true);
  const [reload, setReload] = useState(false);
  const [reply_to, setReplyTo] = useState<PaitentNotesReplyModel | undefined>(
    undefined,
  );

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

  const initialData: PatientNoteStateType = {
    notes: [],
    cPage: 1,
    totalPages: 1,
    patientId: props.patientId,
    facilityId: props.facilityId,
  };
  const [state, setState] = useState(initialData);

  const { facilityId, patientId, consultationId, setShowPatientNotesPopup } =
    props;

  const localStorageKey = `patientNotesNoteField_${consultationId}`;
  const [noteField, setNoteField] = useState(
    localStorage.getItem(localStorageKey) || "",
  );

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
    }
    return data?.id;
  };

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

  useEffect(() => {
    async function fetchPatientName() {
      if (patientId) {
        const { data } = await request(routes.getPatient, {
          pathParams: { id: patientId },
        });
        if (data) {
          setPatientActive(data.is_active ?? true);
        }
      }
    }
    fetchPatientName();
  }, [patientId]);

  const notesActionIcons = (
    <div className="flex gap-1">
      {show && (
        <Link
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded bg-primary-800 text-secondary-100 text-opacity-70 hover:bg-primary-700 hover:text-opacity-100"
          href={`/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/notes`}
        >
          <CareIcon
            icon="l-window-maximize"
            className="text-lg transition-all delay-150 duration-300 ease-out"
          />
        </Link>
      )}
      <div
        id="expand_doctor_notes"
        className={classNames(
          "flex h-8 w-8 cursor-pointer items-center justify-center rounded bg-primary-800 text-secondary-100 text-opacity-70 hover:bg-primary-700 hover:text-opacity-100",
          show && "rotate-180",
        )}
        onClick={() => setShow(!show)}
      >
        <CareIcon
          icon="l-angle-up"
          className="text-lg transition-all delay-150 duration-300 ease-out"
        />
      </div>
      <div
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded bg-primary-800 text-secondary-100 text-opacity-70 hover:bg-primary-700 hover:text-opacity-100"
        onClick={() => setShowPatientNotesPopup(false)}
      >
        <CareIcon
          icon="l-times"
          className="text-lg transition-all delay-150 duration-300 ease-out"
        />
      </div>
    </div>
  );

  useEffect(() => {
    localStorage.setItem(localStorageKey, noteField);
  }, [noteField, localStorageKey]);

  return (
    <div
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
        <div className="flex h-screen w-full -translate-y-0 flex-col text-clip border-2 border-b-0 border-primary-800 bg-white pb-3 transition-all sm:h-[500px] sm:rounded-t-md">
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
          <PatientConsultationNotesList
            state={state}
            setState={setState}
            reload={reload}
            setReload={setReload}
            disableEdit={!patientActive}
            thread={thread}
            setReplyTo={setReplyTo}
          />
          {patientActive && (
            <AuthorizedChild authorizeFor={NonReadOnlyUsers}>
              {({ isAuthorized }) => (
                <DoctorNoteReplyPreviewCard
                  parentNote={reply_to}
                  cancelReply={() => setReplyTo(undefined)}
                >
                  <RichTextEditor
                    initialMarkdown={noteField}
                    onChange={setNoteField}
                    onAddNote={onAddNote}
                    isAuthorized={isAuthorized}
                    onRefetch={() => setReload(true)}
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
