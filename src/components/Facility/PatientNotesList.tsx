import { useEffect } from "react";

import CircularProgress from "@/components/Common/CircularProgress";
import DoctorNote from "@/components/Facility/DoctorNote";
import {
  PatientNoteStateType,
  PatientNotesModel,
} from "@/components/Facility/models";

import routes from "@/Utils/request/api";
import { useInfiniteQuery } from "@/Utils/request/useInfiniteQuery";

interface PatientNotesProps {
  state: PatientNoteStateType;
  setState: any;
  patientId: string;
  facilityId: string;
  reload?: boolean;
  setReload?: any;
  thread: PatientNotesModel["thread"];
  setReplyTo?: (reply_to: PatientNotesModel | undefined) => void;
}
const PatientNotesList = (props: PatientNotesProps) => {
  const { state, setState, thread, setReplyTo, reload, setReload } = props;

  const {
    items: notes,
    loading,
    fetchNextPage,
    refetch,
    hasMore,
  } = useInfiniteQuery<PatientNotesModel>(routes.getPatientNotes, {
    deduplicateBy: (note) => note.id,
    query: {
      thread,
      offset: 0,
    },
    pathParams: {
      patientId: props.patientId,
    },
  });

  useEffect(() => {
    setState((prevState: any) => ({
      ...prevState,
      notes,
    }));
  }, [notes, setState]);

  useEffect(() => {
    if (reload) {
      refetch().then(() => setReload?.(false));
    }
  }, [reload]);

  if ((loading && reload) || !state.notes.length) {
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
      setReload={refetch}
      setReplyTo={setReplyTo}
      hasMore={hasMore}
    />
  );
};

export default PatientNotesList;
