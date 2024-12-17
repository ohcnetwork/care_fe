import { t } from "i18next";
import { useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2 from "@/components/Common/ButtonV2";
import DoctorNoteReplyPreviewCard from "@/components/Facility/DoctorNoteReplyPreviewCard";
import PatientNotesList from "@/components/Facility/PatientNotesList";
import {
  PatientNoteStateType,
  PatientNotesModel,
} from "@/components/Facility/models";
import AutoExpandingTextInputFormField from "@/components/Form/FormFields/AutoExpandingTextInputFormField";
import { PatientProps } from "@/components/Patient/PatientDetailsTab";

import useAuthUser from "@/hooks/useAuthUser";
import { useMessageListener } from "@/hooks/useMessageListener";

import { PATIENT_NOTES_THREADS } from "@/common/constants";

import { NonReadOnlyUsers } from "@/Utils/AuthorizeFor";
import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import { classNames, keysOf } from "@/Utils/utils";

const PatientNotes = (props: PatientProps) => {
  const { patientData, id: patientId, facilityId } = props;

  const authUser = useAuthUser();
  const [thread, setThread] = useState(
    authUser.user_type === "Nurse"
      ? PATIENT_NOTES_THREADS.Nurses
      : PATIENT_NOTES_THREADS.Doctors,
  );

  const [noteField, setNoteField] = useState("");
  const [reload, setReload] = useState(false);
  const [reply_to, setReplyTo] = useState<PatientNotesModel | undefined>(
    undefined,
  );

  const initialData: PatientNoteStateType = {
    notes: [],
    cPage: 1,
    totalPages: 1,
  };
  const [state, setState] = useState(initialData);

  const onAddNote = async () => {
    if (!/\S+/.test(noteField)) {
      Notification.Error({
        msg: "Note Should Contain At Least 1 Character",
      });
      return;
    }

    try {
      const { res } = await request(routes.addPatientNote, {
        pathParams: { patientId: patientId },
        body: {
          note: noteField,
          thread,
          reply_to: reply_to?.id,
        },
      });
      if (res?.status === 201) {
        setNoteField("");
        setReload(!reload);
        setState({ ...state, cPage: 1 });
        setReplyTo(undefined);
        Notification.Success({ msg: "Note added successfully" });
      }
    } catch (error) {
      Notification.Error({
        msg: "Failed to add note. Please try again.",
      });
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

  return (
    <div className="flex h-screen flex-col">
      <div className="relative mx-3 my-2 flex grow flex-col rounded-lg border border-secondary-300 bg-white p-2 sm:mx-10 sm:my-5 sm:p-5">
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
              onClick={() => setThread(PATIENT_NOTES_THREADS[current])}
            >
              {t(`patient_notes_thread__${current}`)}
            </button>
          ))}
        </div>
        <PatientNotesList
          state={state}
          setState={setState}
          patientId={patientId}
          facilityId={facilityId}
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
              maxHeight={160}
              rows={2}
              name="note"
              value={noteField}
              onChange={(e) => setNoteField(e.value)}
              className="w-full grow"
              errorClassName="hidden"
              innerClassName="pr-10"
              placeholder={t("notes_placeholder")}
              disabled={!patientData.is_active}
            />
            <ButtonV2
              onClick={onAddNote}
              border={false}
              className="absolute right-2"
              ghost
              size="small"
              disabled={!patientData.is_active}
              authorizeFor={NonReadOnlyUsers}
            >
              <CareIcon icon="l-message" className="text-lg" />
            </ButtonV2>
          </div>
        </DoctorNoteReplyPreviewCard>
      </div>
    </div>
  );
};

export default PatientNotes;
