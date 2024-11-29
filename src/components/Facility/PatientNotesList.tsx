import { useEffect } from "react";

import CircularProgress from "@/components/Common/CircularProgress";
import DoctorNote from "@/components/Facility/DoctorNote";
import {
  PatientNoteStateType,
  PatientNotesModel,
} from "@/components/Facility/models";

import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";

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
  const { state, setState, thread, setReplyTo, reload, setReload } = props;

  const { pages, loading, fetchNextPage, refetch, setCurrentPage } =
    useInfiniteQuery<PaginatedResponse<PatientNotesModel>>(
      routes.getPatientNotes,
      {
        key: `patient-notes-${props.patientId}-${thread}`,
        getNextPageParam: (cPage: number): number =>
          (cPage - 1) * RESULTS_PER_PAGE_LIMIT,
        getTotalPages: ({ data }) =>
          data ? Math.ceil(data.count / RESULTS_PER_PAGE_LIMIT) : 0,
        query: {
          thread,
        },
        pathParams: {
          patientId: props.patientId,
        },
      },
    );

  useEffect(() => {
    if (pages.length > 0 && pages[0]?.data?.results) {
      const notesMap = pages
        .flatMap((page) => page.data?.results)
        .filter((note): note is PatientNotesModel => note !== undefined)
        .reduce(
          (acc, note) => acc.set(note.id, note),
          new Map<string, PatientNotesModel>(),
        );

      const notesArray = Array.from(notesMap.values());

      setState((prevState: any) => ({
        ...prevState,
        notes: notesArray, // Array of notes without duplicates
        totalPages: Math.ceil(pages[0].data!.count / RESULTS_PER_PAGE_LIMIT),
        cPage: Math.ceil(notesArray.length / RESULTS_PER_PAGE_LIMIT),
      }));
    }
  }, [pages, setState, reload]);

  useEffect(() => {
    setCurrentPage(1);
  }, [thread]);

  useEffect(() => {
    if (reload) {
      refetch().finally(() => setReload(false));
    }
  }, [reload]);

  if (loading && !pages.length) {
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
