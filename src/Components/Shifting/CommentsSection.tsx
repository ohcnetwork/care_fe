import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { getShiftComments, addShiftComments } from "../../Redux/actions";
import CircularProgress from "../Common/components/CircularProgress";
import * as Notification from "../../Utils/Notifications.js";
import { formatDateTime } from "../../Utils/utils";
import { useTranslation } from "react-i18next";
import ButtonV2 from "../Common/components/ButtonV2";

interface CommentSectionProps {
  id: string;
}
const CommentSection = (props: CommentSectionProps) => {
  const dispatch: any = useDispatch();
  const initialData: any = [];
  const [comments, setComments] = useState(initialData);
  const [commentBox, setCommentBox] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  const fetchData = useCallback(
    async (status: statusType = { aborted: false }) => {
      setIsLoading(true);
      const res = await dispatch(getShiftComments(props.id));
      if (!status.aborted) {
        if (res && res.data) {
          setComments(res.data?.results);
        }
        setIsLoading(false);
      }
    },
    [props.id, dispatch]
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
        msg: t("comment_min_length"),
      });
      return;
    }
    dispatch(addShiftComments(props.id, payload)).then((_: any) => {
      Notification.Success({ msg: t("comment_added_successfully") });
      fetchData();
      setCommentBox("");
    });
  };

  return (
    <div className="flex w-full flex-col">
      <textarea
        rows={3}
        value={commentBox}
        minLength={3}
        placeholder={t("type_your_comment")}
        className="mt-4 rounded-lg border border-gray-500 p-4 focus:ring-primary-500"
        onChange={(e) => setCommentBox(e.target.value)}
      />
      <div className="flex w-full justify-end">
        <ButtonV2 onClick={onSubmitComment} className="mt-4">
          {t("post_your_comment")}
        </ButtonV2>
      </div>
      <div className=" w-full">
        {isLoading ? (
          <CircularProgress />
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
                  {comment.modified_date
                    ? formatDateTime(comment.modified_date)
                    : "-"}
                </span>
              </div>
              <div className=" mr-auto flex items-center rounded-md border bg-gray-100 py-1 pl-2 pr-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-700 p-1 uppercase text-white">
                  {comment.created_by_object?.first_name?.charAt(0) ||
                    t("unknown")}
                </div>
                <span className="pl-2 text-sm text-gray-700">
                  {comment.created_by_object?.first_name || t("unknown")}{" "}
                  {comment.created_by_object?.last_name}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;
