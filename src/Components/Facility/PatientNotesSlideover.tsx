import { useState, useEffect, Dispatch, SetStateAction } from "react";
import * as Notification from "../../Utils/Notifications.js";
import { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { classNames, isAppleDevice } from "../../Utils/utils";
import ButtonV2 from "../Common/components/ButtonV2";
import { make as Link } from "../Common/components/Link.bs";
import { useMessageListener } from "../../Common/hooks/useMessageListener";
import PatientConsultationNotesList from "./PatientConsultationNotesList";
import request from "../../Utils/request/request";
import routes from "../../Redux/api";
import { PatientNoteStateType } from "./models";
import useKeyboardShortcut from "use-keyboard-shortcut";
import AutoExpandingTextInputFormField from "../Form/FormFields/AutoExpandingTextInputFormField.js";
import * as Sentry from "@sentry/browser";
import useAuthUser from "../../Common/hooks/useAuthUser";

interface PatientNotesProps {
  patientId: string;
  facilityId: string;
  consultationId: string;
  setShowPatientNotesPopup: Dispatch<SetStateAction<boolean>>;
}

export default function PatientNotesSlideover(props: PatientNotesProps) {
  const [show, setShow] = useState(true);
  const [patientActive, setPatientActive] = useState(true);
  const [reload, setReload] = useState(false);
  const [focused, setFocused] = useState(false);

  const { username } = useAuthUser();

  const intialSubscriptionState = async () => {
    try {
      const res = await request(routes.getUserPnconfig, {
        pathParams: { username },
      });
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      if (!subscription && !res.data?.pf_endpoint) {
        Notification.Warn({
          msg: "Please subscribe to notifications to get live updates on doctor notes.",
        });
      } else if (subscription?.endpoint !== res.data?.pf_endpoint) {
        Notification.Warn({
          msg: "Please subscribe to notifications on this device to get live updates on doctor notes.",
        });
      }
    } catch (error) {
      Sentry.captureException(error);
    }
  };

  useEffect(() => {
    intialSubscriptionState();
  }, []);

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
    localStorage.getItem(localStorageKey) || ""
  );

  const onAddNote = async () => {
    const payload = {
      note: noteField,
      consultation: consultationId,
    };
    if (!/\S+/.test(noteField)) {
      Notification.Error({
        msg: "Note Should Contain At Least 1 Character",
      });
      return;
    }
    const { res } = await request(routes.addPatientNote, {
      pathParams: { patientId: patientId },
      body: payload,
    });
    if (res?.status === 201) {
      Notification.Success({ msg: "Note added successfully" });
      setNoteField("");
      setState({ ...state, cPage: 1 });
      setReload(true);
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

  useKeyboardShortcut(
    [isAppleDevice ? "Meta" : "Shift", "Enter"],
    () => {
      if (focused) {
        onAddNote();
      }
    },
    {
      ignoreInputFields: false,
    }
  );

  const notesActionIcons = (
    <div className="flex gap-1">
      {show && (
        <Link
          className="size-8 flex cursor-pointer items-center justify-center rounded bg-primary-800 text-gray-100 text-opacity-70 hover:bg-primary-700 hover:text-opacity-100"
          href={`/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/notes`}
        >
          <CareIcon className="care-l-window-maximize text-lg transition-all delay-150 duration-300 ease-out" />
        </Link>
      )}
      <div
        id="expand_doctor_notes"
        className={classNames(
          "flex h-8 w-8 cursor-pointer items-center justify-center rounded bg-primary-800 text-gray-100 text-opacity-70 hover:bg-primary-700 hover:text-opacity-100",
          show && "rotate-180"
        )}
        onClick={() => setShow(!show)}
      >
        <CareIcon className="care-l-angle-up text-lg transition-all delay-150 duration-300 ease-out" />
      </div>
      <div
        className="size-8 flex cursor-pointer items-center justify-center rounded bg-primary-800 text-gray-100 text-opacity-70 hover:bg-primary-700 hover:text-opacity-100"
        onClick={() => setShowPatientNotesPopup(false)}
      >
        <CareIcon className="care-l-times text-lg transition-all delay-150 duration-300 ease-out" />
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
          ? "right-0 h-screen w-screen sm:h-fit sm:w-[400px]"
          : "right-8 w-[250px]"
      )}
    >
      {!show ? (
        <div
          className="flex w-full cursor-pointer items-center justify-around rounded-t-md bg-primary-800 p-2 text-white"
          onClick={() => setShow(!show)}
        >
          <span className="font-semibold">{"Doctor's Notes"}</span>
          {notesActionIcons}
        </div>
      ) : (
        <div className="flex h-screen w-full -translate-y-0 flex-col text-clip border-2 border-b-0 border-primary-800 bg-white pb-3 transition-all sm:h-[500px] sm:rounded-t-md ">
          {/* Doctor Notes Header */}
          <div className="flex w-full items-center justify-between bg-primary-800 p-2 px-4 text-white">
            <span className="font-semibold">{"Doctor's Notes"}</span>
            {notesActionIcons}
          </div>
          {/* Doctor Notes Body */}
          <PatientConsultationNotesList
            state={state}
            setState={setState}
            reload={reload}
            setReload={setReload}
            disableEdit={!patientActive}
          />
          <div className="relative mx-4 flex items-center">
            <AutoExpandingTextInputFormField
              id="doctor_notes_textarea"
              maxHeight={160}
              rows={1}
              name="note"
              value={noteField}
              onChange={(e) => setNoteField(e.value)}
              className="grow"
              errorClassName="hidden"
              placeholder="Type your Note"
              disabled={!patientActive}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
            <ButtonV2
              id="add_doctor_note_button"
              onClick={onAddNote}
              border={false}
              className="absolute right-2"
              ghost
              size="small"
              disabled={!patientActive}
              authorizeFor={NonReadOnlyUsers}
            >
              <CareIcon className="care-l-message text-lg" />
            </ButtonV2>
          </div>
        </div>
      )}
    </div>
  );
}
