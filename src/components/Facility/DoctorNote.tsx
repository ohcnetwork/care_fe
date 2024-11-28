import InfiniteScroll from "react-infinite-scroll-component";

import CircularProgress from "@/components/Common/CircularProgress";
import DoctorNoteReplyPreviewCard from "@/components/Facility/DoctorNoteReplyPreviewCard";
import PatientNoteCard from "@/components/Facility/PatientNoteCard";
import {
  PatientNoteStateType,
  PatientNotesModel,
} from "@/components/Facility/models";

interface DoctorNoteProps {
  state: PatientNoteStateType;
  setReload: any;
  handleNext: () => void;
  disableEdit?: boolean;
  setReplyTo?: (reply_to: PatientNotesModel | undefined) => void;
}

const DoctorNote = (props: DoctorNoteProps) => {
  const { state, handleNext, setReload, disableEdit, setReplyTo } = props;

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
          {state.notes.map((note) => (
            <DoctorNoteReplyPreviewCard
              key={note.id}
              parentNote={note.reply_to_object}
            >
              <PatientNoteCard
                note={note}
                setReload={setReload}
                disableEdit={disableEdit}
                setReplyTo={setReplyTo}
              />
            </DoctorNoteReplyPreviewCard>
          ))}
        </InfiniteScroll>
      ) : (
        <div className="mt-2 flex h-full items-center justify-center text-2xl font-bold text-secondary-500">
          No Notes Found
        </div>
      )}
    </div>
  );
};

export default DoctorNote;
