import { useState, useEffect } from "react";
import { getPatient, addPatientNote } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { useDispatch } from "react-redux";
import PatientNotesList from "./PatientNotesList";
import { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { classNames } from "../../Utils/utils";
import TextFormField from "../Form/FormFields/TextFormField";
import ButtonV2 from "../Common/components/ButtonV2";

interface PatientNotesProps {
  patientId: any;
  facilityId: any;
}

export default function PatientNotesSlideover(props: PatientNotesProps) {
  const [show, setShow] = useState(false);
  const [patientActive, setPatientActive] = useState(true);
  const [noteField, setNoteField] = useState("");
  const [reload, setReload] = useState(false);

  const dispatch = useDispatch();

  const { facilityId, patientId } = props;

  const onAddNote = () => {
    const payload = {
      note: noteField,
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
      setReload(!reload);
    });
  };

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

  return (
    <div
      className={classNames(
        "fixed right-0 sm:right-20 bottom-0",
        show ? "w-[400px]" : "w-[250px]"
      )}
    >
      {!show ? (
        <div className="flex justify-around items-center w-full p-2 rounded-t-md bg-primary-800 text-white">
          <span className="font-semibold">Doctor&apos;s Notes</span>
          <div
            className={classNames(
              "flex items-center justify-center w-8 h-8 cursor-pointer rounded text-gray-100 text-opacity-70 hover:text-opacity-100 bg-primary-800 hover:bg-primary-700",
              show ? "rotate-180" : ""
            )}
            onClick={() => setShow(!show)}
          >
            <CareIcon className="care-l-angle-up text-lg transition-all duration-300 delay-150 ease-out" />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-t-md w-full h-[500px] flex flex-col border-2 border-b-0 pb-3 border-primary-800 transition-all overflow-clip -translate-y-0 ">
          {/* Doctor Notes Header */}
          <div className="flex justify-between items-center w-full p-2 px-4 bg-primary-800 text-white">
            <span className="font-semibold">Doctor&apos;s Notes</span>
            <div
              className={classNames(
                "flex items-center justify-center w-8 h-8 cursor-pointer rounded text-gray-100 text-opacity-70 hover:text-opacity-100 bg-primary-800 hover:bg-primary-700",
                show ? "rotate-180" : ""
              )}
              onClick={() => setShow(!show)}
            >
              <CareIcon className="care-l-angle-up text-lg transition-all duration-300 delay-150 ease-out" />
            </div>
          </div>
          {/* Doctor Notes Body */}
          <PatientNotesList
            facilityId={facilityId}
            patientId={patientId}
            reload={reload}
            setReload={setReload}
          />
          <div className="flex items-center mx-4 relative">
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
              <CareIcon className="care-l-message text-lg" />
            </ButtonV2>
          </div>
        </div>
      )}
    </div>
  );
}
