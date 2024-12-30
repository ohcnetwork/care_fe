import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import CircularProgress from "@/components/Common/CircularProgress";
import DoctorNote from "@/components/Facility/DoctorNote";
import {
  PatientNoteStateType,
  PatientNotesModel,
} from "@/components/Facility/models";

import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";

import routes from "@/Utils/request/api";
import { callApi } from "@/Utils/request/query";

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
  const { state, setState, thread, setReplyTo, setReload, patientId, reload } =
    props;

  const { data, isLoading, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ["notes", patientId, thread],
    queryFn: async ({ pageParam = 0, signal }) => {
      const response = await callApi(routes.getPatientNotes, {
        pathParams: { patientId },
        queryParams: { thread, offset: pageParam },
        signal,
      });

      return {
        results: response?.results ?? [],
        nextPage: pageParam + RESULTS_PER_PAGE_LIMIT,
        totalResults: response?.count ?? 0,
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      const currentResults = allPages.flatMap((page) => page.results).length;
      if (currentResults < lastPage.totalResults) {
        return lastPage.nextPage;
      }
      return undefined;
    },
    initialPageParam: 0,
  });

  useEffect(() => {
    if (data?.pages) {
      const allNotes = data.pages.flatMap((page) => page.results);

      const notesMap = new Map(allNotes.map((note) => [note.id, note]));

      const deduplicatedNotes = Array.from(notesMap.values());

      setState((prevState: any) => ({
        ...prevState,
        notes: deduplicatedNotes,
      }));
    }
  }, [data]);

  if (isLoading || reload) {
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
