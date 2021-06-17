import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { getPatientNotes, addPatientNote } from "../../Redux/actions";
import { Button } from "@material-ui/core";
import * as Notification from "../../Utils/Notifications.js";
import moment from "moment";
import PageTitle from "../Common/PageTitle";
import Pagination from "../Common/Pagination";
import { navigate } from "raviger";

interface PatientNotesProps {
  patientId: any;
  facilityId: any;
}

const pageSize = 14;

const PatientNotes = (props: PatientNotesProps) => {
  const dispatch: any = useDispatch();
  let initialData: any = { notes: [], cPage: 1, count: 1 };
  const [state, setState] = useState(initialData);
  const [noteField, setNoteField] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const fetchData = useCallback(
    async (page: number = 1, status: statusType = { aborted: false }) => {
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

  function handlePagination(page: number) {
    fetchData(page);
  }

  const onAddNote = () => {
    const payload = {
      note: noteField,
    };
    dispatch(addPatientNote(props.patientId, payload)).then((res: any) => {
      Notification.Success({ msg: "Note added successfully" });
      fetchData();
    });
  };

  if (isLoading) {
    return <div>Loading</div>;
  }

  return (
    <div className="w-full flex flex-col">
      <PageTitle title="Patient Notes" />
      <div className=" w-full">
        {state.notes.map((note: any) => (
          <div className="flex p-4 bg-white rounded-lg text-gray-800 mt-4 flex-col w-full border border-gray-300">
            <div className="flex  w-full ">
              <p className="text-justify">{note.note}</p>
            </div>
            <div className="mt-3">
              <span className="text-xs text-gray-500">
                {moment(note.created_date).format("LLL") || "-"}
              </span>
            </div>

            <div className="sm:flex space-y-2 sm:space-y-0">
              <div className="mr-2 inline-flex bg-gray-100 border items-center rounded-md py-1 pl-2 pr-3">
                <div className="flex justify-center items-center w-8 h-8 rounded-full">
                  <i className="fas fa-user" />
                </div>
                <span className="text-gray-700 text-sm">
                  {note.created_by_object?.first_name || "Unknown"}{" "}
                  {note.created_by_object?.last_name}
                </span>
              </div>

              <div
                className="inline-flex bg-gray-100 border items-center rounded-md py-1 pl-2 pr-3 cursor-pointer"
                onClick={() => navigate(`/facility/${note.facility?.id}`)}
              >
                <div className="flex justify-center items-center w-8 h-8 rounded-full">
                  <i className="fas fa-hospital" />
                </div>
                <span className="text-gray-700 text-sm">
                  {note.facility?.name || "Unknown"}
                </span>
              </div>
            </div>
          </div>
        ))}
        <div className="mt-2 left-0">
          <Pagination
            data={{ totalCount: state.count }}
            onChange={handlePagination}
            defaultPerPage={pageSize}
            cPage={state.cPage}
          />
        </div>
      </div>
      <textarea
        rows={3}
        placeholder="Type your Note"
        className="mt-4 border border-gray-500 rounded-lg p-4"
        onChange={(e) => setNoteField(e.target.value)}
      />
      <div className="flex w-full justify-end">
        <Button
          onClick={onAddNote}
          className="border border-solid border-green-600 hover:border-green-700 text-green-600 hover:bg-white capitalize my-2 text-sm"
        >
          Post Your Note
        </Button>
      </div>
    </div>
  );
};

export default PatientNotes;
