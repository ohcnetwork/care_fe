import InfiniteScroll from "react-infinite-scroll-component";
import CircularProgress from "../Common/components/CircularProgress";
import PatientNoteCard from "./PatientNoteCard";
import { PatientNoteStateType } from "./models";

interface DoctorNoteProps {
  state: PatientNoteStateType;
  setReload: any;
  handleNext: () => void;
  disableEdit?: boolean;
}

const DoctorNote = (props: DoctorNoteProps) => {
  const { state, handleNext, setReload, disableEdit } = props;
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
            <PatientNoteCard
              note={note}
              key={note.id}
              setReload={setReload}
              disableEdit={disableEdit}
            />
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

export default DoctorNote;
