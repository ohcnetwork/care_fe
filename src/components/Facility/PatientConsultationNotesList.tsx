import { Dispatch, SetStateAction, useEffect } from "react";

import CircularProgress from "@/components/Common/CircularProgress";
import DoctorNote from "@/components/Facility/DoctorNote";
import {
  PatientNoteStateType,
  PatientNotesModel,
} from "@/components/Facility/models";

import useSlug from "@/hooks/useSlug";

import routes from "@/Utils/request/api";
import { useInfiniteQuery } from "@/Utils/request/useInfiniteQuery";

interface PatientNotesProps {
  state: PatientNoteStateType;
  setState: Dispatch<SetStateAction<PatientNoteStateType>>;
  reload?: boolean;
  setReload?: (value: boolean) => void;
  disableEdit?: boolean;
  thread: PatientNotesModel["thread"];
  setReplyTo?: (value: PatientNotesModel | undefined) => void;
}

const PatientConsultationNotesList = (props: PatientNotesProps) => {
  const { state, setState, setReload, disableEdit, thread, setReplyTo } = props;

  const consultationId = useSlug("consultation") ?? "";

  const {
    items: notes,
    loading,
    fetchNextPage,
    hasMore,
  } = useInfiniteQuery<PatientNotesModel>(routes.getPatientNotes, {
    deduplicateBy: (note) => note.id,
    pathParams: {
      patientId: props.state.patientId || "",
    },
    query: {
      consultation: consultationId,
      thread,
    },
    prefetch: true,
  });

  useEffect(() => {
    setState((prevState: any) => ({
      ...prevState,
      notes,
    }));
  }, [notes, setState]);

  if (loading && !state.notes.length) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white">
        <CircularProgress />
      </div>
    );
  }

  return (
    <DoctorNote
      state={state}
      handleNext={fetchNextPage}
      setReload={setReload}
      disableEdit={disableEdit}
      setReplyTo={setReplyTo}
      hasMore={hasMore}
    />
  );
};

export default PatientConsultationNotesList;
