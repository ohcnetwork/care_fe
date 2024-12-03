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
  setReload?: (value: boolean) => void;
  handleNext: () => void;
  disableEdit?: boolean;
  setReplyTo?: (reply_to: PatientNotesModel | undefined) => void;
  mode?: "thread-view" | "default-view";
  setThreadViewNote?: (noteId: string) => void;
}

const DoctorNote = (props: DoctorNoteProps) => {
  const {
    state,
    handleNext,
    setReload,
    disableEdit,
    setReplyTo,
    mode,
    setThreadViewNote,
  } = props;

  const notes =
    mode === "thread-view"
      ? state.notes.filter((note) => !note.root_note_object)
      : state.notes;

  return (
    <div
      className="mt-4 flex h-[500px] grow flex-col-reverse overflow-y-scroll bg-white sm:ml-2"
      id="patient-notes-list"
    >
      {notes.length ? (
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
          dataLength={notes.length}
          scrollableTarget="patient-notes-list"
        >
          {notes.map((note) => {
            const noteCard = (
              <PatientNoteCard
                note={note}
                setReload={setReload}
                disableEdit={disableEdit}
                setReplyTo={setReplyTo}
                mode={mode}
                allowThreadView={mode === "thread-view"}
                allowReply={mode !== "thread-view"}
                setThreadViewNote={setThreadViewNote}
              />
            );
            if (mode === "thread-view") {
              return (
                <div key={note.id} className="mt-3">
                  {noteCard}
                </div>
              );
            } else {
              return (
                <DoctorNoteReplyPreviewCard
                  key={note.id}
                  parentNote={note.reply_to_object}
                >
                  <div className="mt-3">{noteCard}</div>
                </DoctorNoteReplyPreviewCard>
              );
            }
          })}
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
