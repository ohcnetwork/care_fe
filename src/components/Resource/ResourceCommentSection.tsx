import { useState } from "react";

import PaginatedList from "@/CAREUI/misc/PaginatedList";

import ButtonV2 from "@/components/Common/ButtonV2";
import CircularProgress from "@/components/Common/CircularProgress";
import { CommentModel } from "@/components/Facility/models";
import TextAreaFormField from "@/components/Form/FormFields/TextAreaFormField";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import { formatDateTime, formatName } from "@/Utils/utils";

const CommentSection = (props: { id: string }) => {
  const [commentBox, setCommentBox] = useState("");

  const onSubmitComment = async () => {
    const payload = {
      comment: commentBox,
    };
    if (!/\S+/.test(commentBox)) {
      Notification.Error({
        msg: "Comment Should Contain At Least 1 Character",
      });
      return;
    }
    const { res } = await request(routes.addResourceComments, {
      pathParams: { id: props.id },
      body: payload,
    });
    if (res?.ok) {
      Notification.Success({ msg: "Comment added successfully" });
    }
    setCommentBox("");
  };
  return (
    <PaginatedList
      route={routes.getResourceComments}
      pathParams={{ id: props.id }}
    >
      {(_, query) => (
        <div className="flex w-full flex-col">
          <TextAreaFormField
            name="comment"
            placeholder="Type your comment"
            value={commentBox}
            onChange={(e) => setCommentBox(e.value)}
          />

          <div className="flex w-full justify-end">
            <ButtonV2
              onClick={async () => {
                await onSubmitComment();
                query.refetch();
              }}
            >
              Post Your Comment
            </ButtonV2>
          </div>
          <div className="w-full">
            <div>
              <PaginatedList.WhenEmpty className="flex w-full justify-center border-b border-secondary-200 bg-white p-5 text-center text-2xl font-bold text-secondary-500">
                <span>No comments available</span>
              </PaginatedList.WhenEmpty>
              <PaginatedList.WhenLoading>
                <CircularProgress className="h-12 w-12" />
              </PaginatedList.WhenLoading>
              <PaginatedList.Items<CommentModel>>
                {(item) => <Comment {...item} />}
              </PaginatedList.Items>
              <div className="flex w-full items-center justify-center">
                <PaginatedList.Paginator hideIfSinglePage />
              </div>
            </div>
          </div>
        </div>
      )}
    </PaginatedList>
  );
};

export default CommentSection;

export const Comment = ({
  comment,
  created_by_object,
  modified_date,
}: CommentModel) => (
  <div className="mt-4 flex w-full flex-col rounded-lg border border-secondary-300 bg-white p-4 text-secondary-800">
    <div className="w-full">
      <p className="break-words">{comment}</p>
    </div>
    <div className="mt-3">
      <span className="text-xs text-secondary-500">
        {formatDateTime(modified_date) || "-"}
      </span>
    </div>
    <div className="mr-auto flex items-center rounded-md border bg-secondary-100 py-1 pl-2 pr-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-700 p-1 uppercase text-white">
        {created_by_object?.first_name?.charAt(0) || "U"}
      </div>
      <span className="pl-2 text-sm text-secondary-700">
        {formatName(created_by_object)}
      </span>
    </div>
  </div>
);
