import { useCallback, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  getPatientNotes,
  addPatientNote,
  getPatient,
} from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import PageTitle from "../Common/PageTitle";
import Pagination from "../Common/Pagination";
import { navigate } from "raviger";
import { RESULTS_PER_PAGE_LIMIT } from "../../Common/constants";
import Loading from "../Common/Loading";
import { formatDateTime } from "../../Utils/utils";
import ButtonV2 from "../Common/components/ButtonV2";
import { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";

interface PatientNotesProps {
  patientId: any;
  facilityId: any;
}

const pageSize = RESULTS_PER_PAGE_LIMIT;

const PatientNotes = (props: PatientNotesProps) => {
  const { patientId, facilityId } = props;

  const dispatch: any = useDispatch();
  const initialData: any = { notes: [], cPage: 1, count: 1 };
  const [state, setState] = useState(initialData);
  const [noteField, setNoteField] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [facilityName, setFacilityName] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientActive, setPatientActive] = useState(true);

  const fetchData = useCallback(
    async (page = 1, status: statusType = { aborted: false }) => {
      setIsLoading(true);
      const res = await dispatch(
        getPatientNotes(props.patientId, pageSize, (page - 1) * pageSize)
      );
      if (!status.aborted) {
        if (res && res.data) {
          setState({
            ...state,
            count: res.data?.count,
            notes: res.data?.results,
            cPage: page,
          });
        }
        setIsLoading(false);
      }
    },
    [props.patientId, dispatch]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchData(1, status);
    },
    [fetchData]
  );

  useEffect(() => {
    async function fetchPatientName() {
      if (patientId) {
        const res = await dispatch(getPatient({ id: patientId }));
        if (res.data) {
          setPatientName(res.data.name);
          setFacilityName(res.data.facility_object.name);
          setPatientActive(res.data.is_active);
        }
      } else {
        setPatientName("");
        setFacilityName("");
      }
    }
    fetchPatientName();
  }, [dispatch, patientId]);

  function handlePagination(page: number) {
    fetchData(page);
  }

  const onAddNote = () => {
    const payload = {
      note: noteField,
    };
    if (!/\S+/.test(noteField)) {
      Notification.Error({
        msg: "Note Should Contain At Least 1 Character",
      });
      return;
    }
    dispatch(addPatientNote(props.patientId, payload)).then(() => {
      Notification.Success({ msg: "Note added successfully" });
      setNoteField("");
      fetchData();
    });
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="flex w-full flex-col">
      <PageTitle
        title="Patient Notes"
        className="mb-5"
        crumbsReplacements={{
          [facilityId]: { name: facilityName },
          [patientId]: { name: patientName },
        }}
        backUrl={`/facility/${facilityId}/patient/${patientId}`}
      />
      <h3 className="pl-10 text-lg">Add new notes</h3>
      <textarea
        rows={3}
        placeholder="Type your Note"
        className="mx-10 my-4 rounded-lg border border-gray-500 p-4 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
        onChange={(e) => setNoteField(e.target.value)}
      />
      <div className="flex w-full justify-end pr-10">
        <ButtonV2
          authorizeFor={NonReadOnlyUsers}
          onClick={onAddNote}
          disabled={!patientActive}
        >
          Post Your Note
        </ButtonV2>
      </div>
      <div className="px-10 py-5">
        <h3 className="text-lg">Added Notes</h3>
        <div className="w-full">
          {state.notes.length ? (
            state.notes.map((note: any) => (
              <div
                key={note.id}
                className="mt-4 flex w-full flex-col rounded-lg border border-gray-300 bg-white p-4 text-gray-800"
              >
                <span className="whitespace-pre-wrap break-words">
                  {note.note}
                </span>
                <div className="mt-3">
                  <span className="text-xs text-gray-500">
                    {formatDateTime(note.created_date) || "-"}
                  </span>
                </div>

                <div className="space-y-2 sm:flex sm:space-y-0">
                  <div className="mr-2 inline-flex w-full items-center justify-center rounded-md border bg-gray-100 py-1 pl-2 pr-3 md:w-auto">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full">
                      <i className="fas fa-user" />
                    </div>
                    <span className="text-sm text-gray-700">
                      {note.created_by_object?.first_name || "Unknown"}{" "}
                      {note.created_by_object?.last_name}
                    </span>
                  </div>

                  <div
                    className="inline-flex w-full cursor-pointer items-center justify-center rounded-md border bg-gray-100 py-1 pl-2 pr-3 md:w-auto"
                    onClick={() => navigate(`/facility/${note.facility?.id}`)}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full">
                      <i className="fas fa-hospital" />
                    </div>
                    <span className="text-sm text-gray-700">
                      {note.facility?.name || "Unknown"}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="mt-2 flex items-center justify-center text-2xl font-bold text-gray-500">
              No Notes Found
            </div>
          )}
          {state.count > pageSize && (
            <div className="mt-4 flex w-full justify-center">
              <Pagination
                data={{ totalCount: state.count }}
                onChange={handlePagination}
                defaultPerPage={pageSize}
                cPage={state.cPage}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientNotes;
