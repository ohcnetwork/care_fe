import { useEffect, useState } from "react";
import { RESULTS_PER_PAGE_LIMIT } from "../../Common/constants";
import CircularProgress from "../Common/components/CircularProgress";
import PatientNoteCard from "./PatientNoteCard";
import InfiniteScroll from "react-infinite-scroll-component";
import useQuery from "../../Utils/request/useQuery";
import routes from "../../Redux/api";
import { PatientNotesModel } from "./models";

interface PatientNotesProps {
  patientId: any;
  facilityId: any;
  reload?: boolean;
  setReload?: any;
}

interface StateType {
  notes: PatientNotesModel[];
  cPage: number;
  totalPages: number;
}

const pageSize = RESULTS_PER_PAGE_LIMIT;

const PatientNotesList: React.FC<
  PatientNotesProps & { consultationId: string }
> = ({ consultationId, ...props }) => {
  const { reload, setReload } = props;
  // console.log(props);

  const initialData: StateType = { notes: [], cPage: 1, totalPages: 1 };
  const [state, setState] = useState(initialData);
  const [isLoading, setIsLoading] = useState(true);

  useQuery(routes.getPatientNotes, {
    pathParams: {
      patientId: props.patientId,
    },
    query: {
      consultation: consultationId,
      offset: (state.cPage - 1) * RESULTS_PER_PAGE_LIMIT,
    },
    prefetch: reload,
    onResponse: ({ res, data }) => {
      setIsLoading(true);
      if (res?.status === 200 && data) {
        setState((prevState: any) => ({
          ...prevState,
          notes: [...prevState.notes, ...data.results],
          totalPages: Math.ceil(data.count / pageSize),
        }));
        setReload(false);
      }
      setIsLoading(false);
    },
  });

  useEffect(() => {
    setReload(true);
  }, []);

  const handleNext = () => {
    if (state.cPage < state.totalPages) {
      setState((prevState: any) => ({
        ...prevState,
        cPage: prevState.cPage + 1,
      }));
      setReload(true);
    }
  };

  if (isLoading && !state.notes.length) {
    return (
      <div className=" flex h-[400px] w-full items-center justify-center bg-white">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div
      className="m-2 flex h-[390px] grow flex-col-reverse overflow-auto bg-white"
      id="patient-notes-list"
    >
      {state.notes.length ? (
        <InfiniteScroll
          next={handleNext}
          hasMore={state.cPage < state.totalPages}
          loader={
            <div className="flex items-center justify-center">
              <CircularProgress />
            </div>
          }
          className="flex h-full flex-col-reverse p-2"
          inverse={true}
          dataLength={state.notes.length}
          scrollableTarget="patient-notes-list"
        >
          {state.notes.map((note: any) => (
            <PatientNoteCard note={note} key={note.id} />
          ))}
        </InfiniteScroll>
      ) : (
        <div className="mt-2 flex items-center justify-center text-2xl font-bold text-gray-500">
          No Notes Found
        </div>
      )}
    </div>
  );
};

export default PatientNotesList;
