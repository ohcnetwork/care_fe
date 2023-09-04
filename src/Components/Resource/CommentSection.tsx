import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { getResourceComments, addResourceComments } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import Pagination from "../Common/Pagination";
import { formatDateTime } from "../../Utils/utils";
import CircularProgress from "../Common/components/CircularProgress";
import ButtonV2 from "../Common/components/ButtonV2";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";

interface CommentSectionProps {
  id: string;
}
const CommentSection = (props: CommentSectionProps) => {
  const dispatch: any = useDispatch();
  const initialData: any = [];
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
    [props.id, dispatch, offset]
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
    if (!/\S+/.test(commentBox)) {
      Notification.Error({
        msg: "Comment Should Contain At Least 1 Character",
      });
      return;
    }
    dispatch(addResourceComments(props.id, payload)).then((_: any) => {
      Notification.Success({ msg: "Comment added successfully" });
      fetchData();
    });
    setCommentBox("");
  };

  return (
    <div className="flex w-full flex-col">
      <TextAreaFormField
        name="comment"
        placeholder="Type your comment"
        value={commentBox}
        onChange={(e) => setCommentBox(e.value)}
      />
      <div className="flex w-full justify-end">
        <ButtonV2 onClick={onSubmitComment}>Post Your Comment</ButtonV2>
      </div>
      <div className="w-full">
        {isLoading ? (
          <CircularProgress className="h-12 w-12" />
        ) : (
          comments.map((comment: any) => (
            <div
              key={comment.id}
              className="mt-4 flex w-full flex-col rounded-lg border border-gray-300 bg-white p-4 text-gray-800"
            >
              <div className="flex  w-full ">
                <p className="text-justify">{comment.comment}</p>
              </div>
              <div className="mt-3">
                <span className="text-xs text-gray-500">
                  {formatDateTime(comment.modified_date) || "-"}
                </span>
              </div>
              <div className=" mr-auto flex items-center rounded-md border bg-gray-100 py-1 pl-2 pr-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-700 p-1 uppercase text-white">
                  {comment.created_by_object?.first_name?.charAt(0) || "U"}
                </div>
                <span className="pl-2 text-sm text-gray-700">
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
