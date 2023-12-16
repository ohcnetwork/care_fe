import { useState, useEffect } from "react";
import * as Notification from "../../Utils/Notifications.js";
import CareIcon from "../../CAREUI/icons/CareIcon";
import TextFormField from "../Form/FormFields/TextFormField";
import ButtonV2 from "../Common/components/ButtonV2";
import { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";
import PatientNotesList from "../Facility/PatientNotesList";
import Page from "../Common/components/Page";
import { useMessageListener } from "../../Common/hooks/useMessageListener";
import { StateType } from "../Facility/models";
import request from "../../Utils/request/request";
import routes from "../../Redux/api";

interface PatientNotesProps {
  patientId: any;
  facilityId: any;
}

const PatientNotes = (props: PatientNotesProps) => {
  const { patientId, facilityId } = props;

  const [patientActive, setPatientActive] = useState(true);
  const [noteField, setNoteField] = useState("");
  const [reload, setReload] = useState(false);
  const [facilityName, setFacilityName] = useState("");
  const [patientName, setPatientName] = useState("");

  const initialData: StateType = { notes: [], cPage: 0, totalPages: 1 };
  const [state, setState] = useState(initialData);

  const onAddNote = async () => {
    const payload = {
      note: noteField,
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
      setReload(!reload);
      setState({ ...state, cPage: 1 });
    }
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
      <div className="mx-3 my-2 flex grow flex-col rounded-lg bg-white p-2 sm:mx-10 sm:my-5 sm:p-5">
        <PatientNotesList
          state={state}
          setState={setState}
          patientId={patientId}
          facilityId={facilityId}
          reload={reload}
          setReload={setReload}
        />

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
            <CareIcon className="care-l-message text-lg" />
          </ButtonV2>
        </div>
      </div>
    </Page>
  );
};

export default PatientNotes;
