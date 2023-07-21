import React, { useCallback, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  getPatientNotes,
  addPatientNote,
  getPatient,
  updatePatientNote,
} from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import PageTitle from "../Common/PageTitle";
import Pagination from "../Common/Pagination";
import { navigate } from "raviger";
import { RESULTS_PER_PAGE_LIMIT } from "../../Common/constants";
import Loading from "../Common/Loading";
import { formatDate } from "../../Utils/utils";
import CareIcon from "../../CAREUI/icons/CareIcon";
import ButtonV2 from "../Common/components/ButtonV2";
import moment from "moment";
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
  const [editMode, setEditMode] = useState({
    edit: false,
    id: "",
    text: "",
  });

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

  const validate = (note: string) => {
    if (!/\S+/.test(note)) {
      Notification.Error({
        msg: "Note Should Contain At Least 1 Character",
      });
      return false;
    }
    return true;
  };

  const onAddNote = () => {
    const payload = {
      note: noteField,
    };
    if (!validate(noteField)) return;
    dispatch(addPatientNote(props.patientId, payload)).then(() => {
      Notification.Success({ msg: "Note added successfully" });
      setNoteField("");
      fetchData();
    });
  };

  const updateNote = (id: string, note: string) => {
    const payload = {
      note,
    };
    if (!validate(note)) return false;
    dispatch(updatePatientNote(props.patientId, id, payload)).then(
      (res: any) => {
        if (res && res.status === 200) {
          Notification.Success({ msg: "Note updated successfully" });
          fetchData();
        }
      }
    );
    return true;
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="w-full flex flex-col">
      <PageTitle
        title="Patient Notes"
        className="mb-5"
        crumbsReplacements={{
          [facilityId]: { name: facilityName },
          [patientId]: { name: patientName },
        }}
        backUrl={`/facility/${facilityId}/patient/${patientId}`}
      />
      <h3 className="text-lg pl-10">Add new notes</h3>
      <textarea
        rows={3}
        placeholder="Type your Note"
        className="mx-10 my-4 border border-gray-500 rounded-lg p-4 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
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
                className="flex p-4 bg-white rounded-lg text-gray-800 mt-4 flex-col w-full border border-gray-300"
              >
                {editMode.edit && editMode.id === note.id ? (
                  <div className="flex flex-col">
                    <textarea
                      rows={2}
                      placeholder="Type your Note"
                      className="border border-gray-500 rounded-lg p-4 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      onChange={(e) =>
                        setEditMode({ ...editMode, text: e.target.value })
                      }
                      defaultValue={note.note}
                    />
                  </div>
                ) : (
                  <span className="md:whitespace-pre">{note.note}</span>
                )}
                <div className="my-3">
                  <span className="text-xs text-gray-500 flex flex-col">
                    {note.modified_date &&
                      moment(note.created_date).format("YYYY-MM-DD HH:mm:ss") !=
                        moment(note.modified_date).format(
                          "YYYY-MM-DD HH:mm:ss"
                        ) && (
                        <div>Edited: {formatDate(note.modified_date)} </div>
                      )}
                    {note.created_date && (
                      <div>Sent: {formatDate(note.created_date) || "-"}</div>
                    )}
                  </span>
                </div>

                <div className="sm:flex space-y-2 sm:space-y-0">
                  <div className="mr-2 inline-flex w-full md:w-auto justify-center bg-gray-100 border items-center rounded-md py-1 pl-2 pr-3">
                    <div className="flex justify-center items-center w-8 h-8 rounded-full">
                      <i className="fas fa-user" />
                    </div>
                    <span className="text-gray-700 text-sm">
                      {note.created_by_object?.first_name || "Unknown"}{" "}
                      {note.created_by_object?.last_name}
                    </span>
                  </div>

                  <div
                    className="inline-flex w-full md:w-auto justify-center bg-gray-100 border items-center rounded-md py-1 pl-2 pr-3 cursor-pointer"
                    onClick={() => navigate(`/facility/${note.facility?.id}`)}
                  >
                    <div className="flex justify-center items-center w-8 h-8 rounded-full">
                      <i className="fas fa-hospital" />
                    </div>
                    <span className="text-gray-700 text-sm">
                      {note.facility?.name || "Unknown"}
                    </span>
                  </div>
                  {editMode.edit && editMode.id === note.id ? (
                    <div className="flex flex-col ml-auto gap-2 md:flex-row">
                      <ButtonV2
                        onClick={() => {
                          updateNote(note.id, editMode.text) &&
                            setEditMode({ edit: false, id: "", text: "" });
                        }}
                        disabled={!patientActive}
                      >
                        Update
                      </ButtonV2>
                      <ButtonV2
                        onClick={() =>
                          setEditMode({ edit: false, id: "", text: "" })
                        }
                        variant="secondary"
                        disabled={!patientActive}
                      >
                        Cancel
                      </ButtonV2>
                    </div>
                  ) : (
                    <>
                      {patientActive &&
                        moment() <= moment(note.editable_until) && (
                          <ButtonV2
                            className="flex gap-2 ml-auto py-2 px-3 w-full md:w-fit"
                            onClick={() =>
                              setEditMode({
                                edit: true,
                                id: note.id,
                                text: note.note,
                              })
                            }
                          >
                            <CareIcon className="care-l-pen h-4 mr-1" />
                            Edit
                          </ButtonV2>
                        )}
                    </>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-500 text-2xl font-bold flex justify-center items-center mt-2">
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
