import { useQuery } from "@tanstack/react-query";
import { t } from "i18next";
import { useEffect, useState } from "react";
import useKeyboardShortcut from "use-keyboard-shortcut";

import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2 from "@/components/Common/ButtonV2";
import Page from "@/components/Common/Page";
import DoctorNoteReplyPreviewCard from "@/components/Facility/DoctorNoteReplyPreviewCard";
import PatientConsultationNotesList from "@/components/Facility/PatientConsultationNotesList";
import {
  PaitentNotesReplyModel,
  PatientNoteStateType,
} from "@/components/Facility/models";
import AutoExpandingTextInputFormField from "@/components/Form/FormFields/AutoExpandingTextInputFormField";
import { useAddPatientNote } from "@/components/Patient/Utils";

import useAuthUser from "@/hooks/useAuthUser";
import { useMessageListener } from "@/hooks/useMessageListener";

import { PATIENT_NOTES_THREADS } from "@/common/constants";

import { NonReadOnlyUsers } from "@/Utils/AuthorizeFor";
import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { classNames, isAppleDevice, keysOf } from "@/Utils/utils";

interface ConsultationDoctorNotesProps {
  patientId: string;
  facilityId: string;
  consultationId: string;
}

const ConsultationDoctorNotes = (props: ConsultationDoctorNotesProps) => {
  const { patientId, facilityId, consultationId } = props;

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
  const [focused, setFocused] = useState(false);
  const [reply_to, setReplyTo] = useState<PaitentNotesReplyModel | undefined>(
    undefined,
  );

  const initialData: PatientNoteStateType = {
    notes: [],
    facilityId: facilityId,
    patientId: patientId,
  };
  const [state, setState] = useState(initialData);

  const { mutate: addNote } = useAddPatientNote({
    patientId,
    thread,
    consultationId,
  });

  const onAddNote = () => {
    if (!/\S+/.test(noteField)) {
      Notification.Error({
        msg: "Note Should Contain At Least 1 Character",
      });
      return;
    }
    setReplyTo(undefined);
    setNoteField("");
    addNote({
      note: noteField,
      reply_to: reply_to?.id,
      thread,
      consultation: consultationId,
    });
  };

  const { data } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: query(routes.getPatient, {
      pathParams: { patientId },
    }),
  });

  useEffect(() => {
    setPatientActive(data?.is_active ?? true);
    setPatientName(data?.name ?? "");
    setFacilityName(data?.facility_object?.name ?? "");
  }, [data]);

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
    },
  );

  return (
    <Page
      title="Discussion Notes"
      className="flex h-screen flex-col"
      crumbsReplacements={{
        [facilityId]: { name: facilityName },
        [patientId]: { name: patientName },
      }}
      backUrl={`/facility/${facilityId}/patient/${patientId}`}
    >
      <div className="relative mx-3 my-2 flex grow flex-col overflow-hidden rounded-lg border border-secondary-300 bg-white p-2 sm:mx-10 sm:my-5 sm:p-5">
        <div className="absolute inset-x-0 top-0 z-10 flex bg-secondary-200 text-sm shadow-md">
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
              onClick={() => {
                if (thread !== PATIENT_NOTES_THREADS[current]) {
                  setThread(PATIENT_NOTES_THREADS[current]);
                  setState(initialData);
                  setReplyTo(undefined);
                  setNoteField("");
                }
              }}
            >
              {t(`patient_notes_thread__${current}`)}
            </button>
          ))}
        </div>
        <PatientConsultationNotesList
          key={`patient-notes-${patientId}-${thread}`}
          state={state}
          setState={setState}
          reload={reload}
          setReload={setReload}
          thread={thread}
          setReplyTo={setReplyTo}
        />
        <DoctorNoteReplyPreviewCard
          parentNote={reply_to}
          cancelReply={() => setReplyTo(undefined)}
        >
          <div className="relative mx-4 flex items-center">
            <AutoExpandingTextInputFormField
              id="doctor_consultation_notes"
              maxHeight={160}
              rows={2}
              name="note"
              value={noteField}
              onChange={(e) => setNoteField(e.value)}
              className="w-full grow"
              innerClassName="pr-10"
              errorClassName="hidden"
              placeholder={t("notes_placeholder")}
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
        </DoctorNoteReplyPreviewCard>
      </div>
    </Page>
  );
};

export default ConsultationDoctorNotes;
