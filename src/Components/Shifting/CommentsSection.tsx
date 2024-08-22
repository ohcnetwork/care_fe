import { useState } from "react";
import CircularProgress from "../Common/components/CircularProgress";
import * as Notification from "../../Utils/Notifications.js";
import { formatDateTime, formatName } from "../../Utils/utils";
import { useTranslation } from "react-i18next";
import ButtonV2 from "../Common/components/ButtonV2";
import routes from "../../Redux/api";
import { IComment } from "../Resource/models";
import PaginatedList from "../../CAREUI/misc/PaginatedList";
import request from "../../Utils/request/request";

interface CommentSectionProps {
  id: string;
}
const CommentSection = (props: CommentSectionProps) => {
  const [commentBox, setCommentBox] = useState("");
  const { t } = useTranslation();

  const onSubmitComment = async () => {
    const payload = {
      comment: commentBox,
    };
    if (!/\S+/.test(commentBox)) {
      Notification.Error({
        msg: t("comment_min_length"),
      });
      return;
    }
    const { res } = await request(routes.addShiftComments, {
      pathParams: { id: props.id },
      body: payload,
    });
    if (res?.ok) {
      Notification.Success({ msg: t("comment_added_successfully") });

      setCommentBox("");
    }
  };

  return (
    <PaginatedList
      route={routes.getShiftComments}
      pathParams={{ id: props.id }}
    >
      {(_, query) => (
        <div className="flex w-full flex-col">
          <textarea
            rows={3}
            value={commentBox}
            minLength={3}
            placeholder={t("type_your_comment")}
            className="mt-4 rounded-lg border border-secondary-500 p-4 focus:ring-primary-500"
            onChange={(e) => setCommentBox(e.target.value)}
          />
          <div className="flex w-full justify-end">
            <ButtonV2
              className="mt-4"
              onClick={async () => {
                await onSubmitComment();
                query.refetch();
              }}
            >
              {t("post_your_comment")}
            </ButtonV2>
          </div>
          <div className="w-full">
            <PaginatedList.WhenLoading>
              <CircularProgress />
            </PaginatedList.WhenLoading>
            <PaginatedList.Items<IComment>>
              {(item) => <Comment {...item} />}
            </PaginatedList.Items>
            <div className="flex w-full items-center justify-center">
              <PaginatedList.Paginator hideIfSinglePage />
            </div>
          </div>
        </div>
      )}
    </PaginatedList>
  );
};

export default CommentSection;

export const Comment = ({
  id,
  comment,
  created_by_object,
  modified_date,
}: IComment) => {
  const { t } = useTranslation();
  return (
    <div
      key={id}
      className="mt-4 flex w-full flex-col rounded-lg border border-secondary-300 bg-white p-4 text-secondary-800"
    >
      <div className="flex w-full">
        <p className="text-justify">{comment}</p>
      </div>
      <div className="mt-3">
        <span className="text-xs text-secondary-500">
          {modified_date ? formatDateTime(modified_date) : "-"}
        </span>
      </div>
      <div className="mr-auto flex items-center rounded-md border bg-secondary-100 py-1 pl-2 pr-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-700 p-1 uppercase text-white">
          {created_by_object?.first_name?.charAt(0) || t("unknown")}
        </div>
        <span className="pl-2 text-sm text-secondary-700">
          {formatName(created_by_object)}
        </span>
      </div>
    </div>
  );
};
