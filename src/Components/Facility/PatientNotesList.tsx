import { useCallback, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { getPatientNotes } from "../../Redux/actions";
import { RESULTS_PER_PAGE_LIMIT } from "../../Common/constants";
import CircularProgress from "../Common/components/CircularProgress";
import PatientNoteCard from "./PatientNoteCard";
import InfiniteScroll from "react-infinite-scroll-component";

interface PatientNotesProps {
  patientId: any;
  facilityId: any;
  reload?: boolean;
  setReload?: any;
}

const pageSize = RESULTS_PER_PAGE_LIMIT;

const PatientNotesList = (props: PatientNotesProps) => {
  const { facilityId, reload, setReload } = props;

  const dispatch: any = useDispatch();
  const initialData: any = { notes: [], cPage: 1, totalPages: 1 };
  const [state, setState] = useState(initialData);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(
    async (page = 1, status: statusType = { aborted: false }) => {
      setIsLoading(true);
      const res = await dispatch(
        getPatientNotes(props.patientId, pageSize, (page - 1) * pageSize)
      );
      if (!status.aborted) {
        if (res && res.data) {
          if (page === 1) {
            setState({
              notes: res.data?.results,
              cPage: page,
              totalPages: Math.ceil(res.data.count / pageSize),
            });
          } else {
            setState((prevState: any) => ({
              ...prevState,
              notes: [...prevState.notes, ...res.data.results],
              cPage: page,
              totalPages: Math.ceil(res.data.count / pageSize),
            }));
          }
        }
        setIsLoading(false);
      }
    },
    [props.patientId, dispatch]
  );

  useEffect(() => {
    if (reload) {
      fetchData(1);
      setReload(false);
    }
  }, [reload]);

  useAbortableEffect(
    (status: statusType) => {
      fetchData(1, status);
    },
    [fetchData]
  );

  const handleNext = () => {
    if (state.cPage < state.totalPages) {
      fetchData(state.cPage + 1);
      setState((prevState: any) => ({
        ...prevState,
        cPage: prevState.cPage + 1,
      }));
    }
  };

  if (isLoading && !state.notes.length) {
    return (
      <div className=" bg-white flex items-center justify-center w-full h-[400px]">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col-reverse grow h-[390px] overflow-auto m-2 bg-white"
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
          className="flex flex-col-reverse p-2 h-full"
          inverse={true}
          dataLength={state.notes.length}
          scrollableTarget="patient-notes-list"
        >
          {state.notes.map((note: any) => (
            <PatientNoteCard
              note={note}
              key={note.id}
              facilityId={facilityId}
            />
          ))}
        </InfiniteScroll>
      ) : (
        <div className="text-gray-500 text-2xl font-bold flex justify-center items-center mt-2">
          No Notes Found
        </div>
      )}
    </div>
  );
};

export default PatientNotesList;
