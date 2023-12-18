import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { getPatient, addPatientNote } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { useDispatch } from "react-redux";
import { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { classNames } from "../../Utils/utils";
import TextFormField from "../Form/FormFields/TextFormField";
import ButtonV2 from "../Common/components/ButtonV2";
import { make as Link } from "../Common/components/Link.bs";
import { useMessageListener } from "../../Common/hooks/useMessageListener";
import PatientConsultationNotesList from "./PatientConsultationNotesList";

interface PatientNotesProps {
  patientId: string;
  facilityId: string;
  consultationId: string;
  setShowPatientNotesPopup: Dispatch<SetStateAction<boolean>>;
}

export default function PatientNotesSlideover(props: PatientNotesProps) {
  const [show, setShow] = useState(true);
  const [patientActive, setPatientActive] = useState(true);
  const [noteField, setNoteField] = useState("");
  const [reload, setReload] = useState(false);

  const dispatch = useDispatch();

  const initialData: StateType = {
    notes: [],
    cPage: 1,
    totalPages: 1,
  };
  const [state, setState] = useState(initialData);

  const { facilityId, patientId, consultationId, setShowPatientNotesPopup } =
    props;

  const onAddNote = () => {
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
    dispatch(addPatientNote(patientId, payload)).then(() => {
      Notification.Success({ msg: "Note added successfully" });
      setNoteField("");
      setState({ ...state, cPage: 1 });
      setReload(true);
    });
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
        const res = await dispatch(getPatient({ id: patientId }));
        if (res.data) {
          setPatientActive(res.data.is_active);
        }
      }
    }
    fetchPatientName();
  }, [dispatch, patientId]);

  const notesActionIcons = (
    <div className="flex gap-1">
      {show && (
        <Link
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded bg-primary-800 text-gray-100 text-opacity-70 hover:bg-primary-700 hover:text-opacity-100"
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
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded bg-primary-800 text-gray-100 text-opacity-70 hover:bg-primary-700 hover:text-opacity-100"
        onClick={() => setShowPatientNotesPopup(false)}
      >
        <CareIcon className="care-l-times text-lg transition-all delay-150 duration-300 ease-out" />
      </div>
    </div>
  );

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
            facilityId={facilityId}
            patientId={patientId}
            reload={reload}
            setReload={setReload}
          />
          <div className="relative mx-4 flex items-center">
            <TextFormField
              id="doctor_notes_textarea"
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
