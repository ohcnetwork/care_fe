import { t } from "i18next";
import { useState } from "react";
import { toast } from "sonner";

import PaginatedList from "@/CAREUI/misc/PaginatedList";

import { Button } from "@/components/ui/button";

import CircularProgress from "@/components/Common/CircularProgress";
import TextAreaFormField from "@/components/Form/FormFields/TextAreaFormField";

import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import { formatName } from "@/Utils/utils";
import { CommentModel } from "@/types/resourceRequest/resourceRequest";

import { Avatar } from "../Common/Avatar";

const CommentSection = (props: { id: string }) => {
  const [commentBox, setCommentBox] = useState("");

  const onSubmitComment = async () => {
    const payload = {
      comment: commentBox,
    };
    if (!/\S+/.test(commentBox)) {
      toast.error(t("comment_min_length"));
      return;
    }
    const { res } = await request(routes.addResourceComments, {
      pathParams: { id: props.id },
      body: payload,
    });
    if (res?.ok) {
      toast.success(t("comment_added_successfully"));
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
            <Button
              variant="primary"
              onClick={async () => {
                await onSubmitComment();
                query.refetch();
              }}
            >
              Post Your Comment
            </Button>
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

export const Comment = ({ comment, created_by }: CommentModel) => (
  <div className="mt-4 flex w-full flex-col rounded-lg border border-secondary-300 bg-white p-4 text-secondary-800">
    <div className="w-full">
      <p className="break-words">{comment}</p>
    </div>
    <div className="mr-auto flex items-center rounded-md border bg-secondary-100 py-1 pl-2 pr-3">
      <Avatar
        name={`${created_by.first_name} ${created_by.first_name}`}
        className="h-8 w-8 "
      />
      <span className="pl-2 text-sm text-secondary-700">
        {formatName(created_by)}
      </span>
    </div>
  </div>
);
