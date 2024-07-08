import InfiniteScroll from "react-infinite-scroll-component";
import CircularProgress from "../Common/components/CircularProgress";
import PatientNoteCard from "./PatientNoteCard";
import { PatientNoteStateType, PatientNotesModel } from "./models";
import DoctorNoteReplyPreviewCard from "./DoctorNoteReplyPreviewCard";

interface DoctorNoteProps {
  state: PatientNoteStateType;
  setReload: any;
  handleNext: () => void;
  disableEdit?: boolean;
  setReplyTo?: (reply_to: PatientNotesModel | undefined) => void;
  mode?: "thread-view" | "default-view";
}

const DoctorNote = (props: DoctorNoteProps) => {
  const { state, handleNext, setReload, disableEdit, setReplyTo, mode } = props;

  return (
    <div
      className="mt-4 flex h-[400px] grow flex-col-reverse overflow-auto bg-white"
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
          className="flex h-full flex-col-reverse overflow-hidden"
          inverse={true}
          dataLength={state.notes.length}
          scrollableTarget="patient-notes-list"
        >
          {state.notes.map((note) => {
            if (mode === "thread-view") {
              return (
                <div className="" key={note.id}>
                  <PatientNoteCard
                    note={note}
                    setReload={setReload}
                    disableEdit={disableEdit}
                    setReplyTo={setReplyTo}
                  />
                  {note.replies.length > 0 ? (
                    <div className="mr-4 mt-1 flex items-center justify-end text-sm text-gray-500">
                      {note.replies.length}{" "}
                      {note.replies.length > 1 ? "default-view" : "reply"}
                    </div>
                  ) : (
                    <div className="mr-4 flex items-center justify-end text-sm text-gray-500">
                      No replies
                    </div>
                  )}
                </div>
              );
            } else if (mode === "default-view") {
              return (
                <DoctorNoteReplyPreviewCard
                  key={note.id}
                  parentNote={note.reply_to_object}
                >
                  <div className="mt-3">
                    <PatientNoteCard
                      note={note}
                      setReload={setReload}
                      disableEdit={disableEdit}
                      setReplyTo={setReplyTo}
                    />
                  </div>
                </DoctorNoteReplyPreviewCard>
              );
            }
          })}
        </InfiniteScroll>
      ) : (
        <div className="mt-2 flex h-full items-center justify-center text-2xl font-bold text-gray-500">
          No Notes Found
        </div>
      )}
    </div>
  );
};

export default DoctorNote;
