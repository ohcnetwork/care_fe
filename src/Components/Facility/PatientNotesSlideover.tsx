import { useState, useEffect } from "react";
import { getPatient, addPatientNote } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { useDispatch } from "react-redux";
import PatientNotesList from "./PatientNotesList";
import AuthorizedChild from "../../CAREUI/misc/AuthorizedChild";
import { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";
import CareIcon from "../../CAREUI/icons/CareIcon";

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
      className={`fixed right-0 sm:right-20 bottom-0 ${
        show ? "w-3/12 min-w-[400px]" : "w-1/6 min-w-[250px]"
      }`}
    >
      {!show ? (
        <div className="flex justify-around items-center w-full p-2 rounded-t-md bg-primary-800 text-white">
          <span className="font-semibold">Doctor&apos;s Notes</span>
          <div
            className={`flex items-center justify-center w-8 h-8 cursor-pointer rounded text-gray-100 text-opacity-70 hover:text-opacity-100 bg-primary-800 hover:bg-primary-700 ${
              show ? "rotate-180" : ""
            }`}
            onClick={() => setShow(!show)}
          >
            <i className="fa-solid fa-chevron-up transition-all duration-300 delay-150 ease-out" />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-t-md w-full h-[500px] flex flex-col border-2 border-primary-800 transition-all -translate-y-0 ">
          {/* Doctor Notes Header */}
          <div className="flex justify-between items-center w-full p-2 px-4 rounded-t-md bg-primary-800 text-white">
            <span className="font-semibold">Doctor&apos;s Notes</span>
            <div
              className={`flex items-center justify-center w-8 h-8 cursor-pointer rounded text-gray-100 text-opacity-70 hover:text-opacity-100 bg-primary-800 hover:bg-primary-700 ${
                show ? "rotate-180" : ""
              }`}
              onClick={() => setShow(!show)}
            >
              <i className="fa-solid fa-chevron-up transition-all duration-300 delay-150 ease-out" />
            </div>
          </div>
          {/* Doctor Notes Body */}
          <PatientNotesList
            facilityId={facilityId}
            patientId={patientId}
            reload={reload}
            setReload={setReload}
          />
          <AuthorizedChild authorizeFor={NonReadOnlyUsers}>
            {({ isAuthorized }) => (
              <div className="mx-4 h-fit relative">
                <input
                  placeholder="Type your Note"
                  className=" inline-block w-full border border-gray-500 rounded-lg p-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  value={noteField}
                  onChange={(e) => setNoteField(e.target.value)}
                  disabled={!patientActive || !isAuthorized}
                />
                <button
                  className="absolute top-2.5 right-2.5 text-primary-500"
                  onClick={onAddNote}
                  disabled={!patientActive || !isAuthorized}
                >
                  <CareIcon className="care-l-message" />
                </button>
              </div>
            )}
          </AuthorizedChild>
        </div>
      )}
    </div>
  );
}
