import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { getResourceComments, addResourceComments } from "../../Redux/actions";
import { Button } from "@material-ui/core";
import * as Notification from "../../Utils/Notifications.js";
import moment from "moment";
import loadable from "@loadable/component";
import Pagination from "../Common/Pagination";

const Loading = loadable(() => import("../Common/Loading"));

interface CommentSectionProps {
  id: string;
}
const CommentSection = (props: CommentSectionProps) => {
  const dispatch: any = useDispatch();
  let initialData: any = [];
  const [comments, setComments] = useState(initialData);
  const [commentBox, setCommentBox] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 8;

  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentPage(page);
    setOffset(offset);
  };

  const fetchData = useCallback(
    async (status: statusType = { aborted: false }) => {
      setIsLoading(true);
      const res = await dispatch(
        getResourceComments(props.id, { limit, offset })
      );
      if (!status.aborted) {
        if (res && res.data) {
          setComments(res.data?.results);
          setTotalCount(res.data.count);
        }
        setIsLoading(false);
      }
    },
    [dispatch, offset, limit, props.id]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [fetchData]
  );

  const onSubmitComment = () => {
    const payload = {
      comment: commentBox,
    };
    dispatch(addResourceComments(props.id, payload)).then((res: any) => {
      Notification.Success({ msg: "Comment added successfully" });
      fetchData();
    });
    setCommentBox("");
  };

  return (
    <div className="w-full flex flex-col">
      <textarea
        rows={3}
        placeholder="Type your comment"
        className="mt-4 border border-gray-500 rounded-lg p-4"
        value={commentBox}
        onChange={(e) => setCommentBox(e.target.value)}
      />
      <div className="flex w-full justify-end">
        <Button
          onClick={onSubmitComment}
          className="border border-solid border-primary-600 hover:border-primary-700 text-primary-600 hover:bg-white capitalize my-2 text-sm"
        >
          Post Your Comment
        </Button>
      </div>
      <div className=" w-full">
        {isLoading ? (
          <Loading />
        ) : (
          comments.map((comment: any, i: number) => (
            <div
              key={i}
              className="flex p-4 bg-white rounded-lg text-gray-800 mt-4 flex-col w-full border border-gray-300"
            >
              <div className="flex  w-full ">
                <p className="text-justify">{comment.comment}</p>
              </div>
              <div className="mt-3">
                <span className="text-xs text-gray-500">
                  {moment(comment.modified_date).format("LLL") || "-"}
                </span>
              </div>
              <div className=" flex mr-auto bg-gray-100 border items-center rounded-md py-1 pl-2 pr-3">
                <div className="flex justify-center items-center w-8 h-8 rounded-full bg-primary-700 uppercase text-white p-1">
                  {comment.created_by_object?.first_name?.charAt(0) || "U"}
                </div>
                <span className="text-gray-700 text-sm pl-2">
                  {comment.created_by_object?.first_name || "Unknown"}{" "}
                  {comment.created_by_object?.last_name}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
      {totalCount > limit && (
        <div className="mt-4 flex w-full justify-center">
          <Pagination
            cPage={currentPage}
            defaultPerPage={limit}
            data={{ totalCount }}
            onChange={handlePagination}
          />
        </div>
      )}
    </div>
  );
};

export default CommentSection;
