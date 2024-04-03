import { useState } from "react";
import * as Notification from "../../../Utils/Notifications.js";
import Page from "../../Common/components/Page";
import ButtonV2 from "../../Common/components/ButtonV2";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import { NonReadOnlyUsers } from "../../../Utils/AuthorizeFor";
import { useMessageListener } from "../../../Common/hooks/useMessageListener";
import PatientConsultationNotesList from "../PatientConsultationNotesList.js";
import { PatientNoteStateType } from "../models.js";
import routes from "../../../Redux/api.js";
import request from "../../../Utils/request/request.js";
import useQuery from "../../../Utils/request/useQuery.js";
import useKeyboardShortcut from "use-keyboard-shortcut";
import { isAppleDevice } from "../../../Utils/utils.js";
import AutoExpandingTextInputFormField from "../../Form/FormFields/AutoExpandingTextInputFormField.js";

interface ConsultationDoctorNotesProps {
  patientId: string;
  facilityId: string;
  consultationId: string;
}

const ConsultationDoctorNotes = (props: ConsultationDoctorNotesProps) => {
  const { patientId, facilityId, consultationId } = props;

  const [patientActive, setPatientActive] = useState(true);
  const [noteField, setNoteField] = useState("");
  const [reload, setReload] = useState(false);
  const [facilityName, setFacilityName] = useState("");
  const [patientName, setPatientName] = useState("");
  const [focused, setFocused] = useState(false);

  const initialData: PatientNoteStateType = {
    notes: [],
    cPage: 1,
    totalPages: 1,
    facilityId: facilityId,
    patientId: patientId,
  };
  const [state, setState] = useState(initialData);

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
      pathParams: {
        patientId: patientId,
      },
      body: payload,
    });

    if (res?.status === 201) {
      Notification.Success({ msg: "Note added successfully" });
      setState({ ...state, cPage: 1 });
      setNoteField("");
      setReload(true);
    }
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

  return (
    <Page
      title="Doctor Notes"
      className="flex h-screen flex-col"
      crumbsReplacements={{
        [facilityId]: { name: facilityName },
        [patientId]: { name: patientName },
      }}
      backUrl={`/facility/${facilityId}/patient/${patientId}`}
    >
      <div className="mx-3 my-2 flex grow flex-col rounded-lg bg-white p-2 sm:mx-10 sm:my-5 sm:p-5">
        <PatientConsultationNotesList
          state={state}
          setState={setState}
          reload={reload}
          setReload={setReload}
        />

        <div className="relative mx-4 flex items-center">
          <AutoExpandingTextInputFormField
            id="doctor_consultation_notes"
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
            onClick={onAddNote}
            border={false}
            className="absolute right-2"
            ghost
            size="small"
            disabled={!patientActive}
            authorizeFor={NonReadOnlyUsers}
          >
            <CareIcon icon="l-message" className="text-lg" />
          </ButtonV2>
        </div>
      </div>
    </Page>
  );
};

export default ConsultationDoctorNotes;
