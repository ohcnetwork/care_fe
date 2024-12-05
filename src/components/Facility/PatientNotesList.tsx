import { useEffect } from "react";

import CircularProgress from "@/components/Common/CircularProgress";
import DoctorNote from "@/components/Facility/DoctorNote";
import {
  PatientNoteStateType,
  PatientNotesModel,
} from "@/components/Facility/models";

import routes from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
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
  const { state, setState, thread, setReplyTo } = props;

  const {
    items: notes,
    loading,
    fetchNextPage,
    refetch,
    currentPage,
    totalPages,
    setCurrentPage,
  } = useInfiniteQuery<PaginatedResponse<PatientNotesModel>, PatientNotesModel>(
    routes.getPatientNotes,
    {
      key: `patient-notes-${props.patientId}-${thread}`,
      deduplicateBy: (note) => note.id,
      query: {
        thread,
      },
      pathParams: {
        patientId: props.patientId,
      },
    },
  );

  useEffect(() => {
    setState((prevState: any) => ({
      ...prevState,
      notes,
      cPage: currentPage,
      totalPages: totalPages,
    }));
  }, [notes, setState]);

  useEffect(() => {
    setCurrentPage(1);
  }, [thread]);

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
      setReload={refetch}
      setReplyTo={setReplyTo}
    />
  );
};

export default PatientNotesList;
