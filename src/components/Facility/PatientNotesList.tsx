import { useEffect } from "react";

import CircularProgress from "@/components/Common/CircularProgress";
import DoctorNote from "@/components/Facility/DoctorNote";
import {
  PatientNoteStateType,
  PatientNotesModel,
} from "@/components/Facility/models";

import routes from "@/Utils/request/api";
import { useTanStackInfiniteQueryInstead } from "@/Utils/request/useInfiniteQuery";

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
  const { state, setState, thread, setReplyTo, setReload } = props;

  const {
    data: notes,
    loading,
    fetchNextPage,
    hasNextPage,
  } = useTanStackInfiniteQueryInstead<PatientNotesModel>(
    routes.getPatientNotes,
    {
      query: {
        thread,
        offset: 0,
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
    }));
  }, [loading]);

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
      setReplyTo={setReplyTo}
      hasMore={hasNextPage}
    />
  );
};

export default PatientNotesList;
