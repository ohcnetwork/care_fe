import { t } from "i18next";
import { useState } from "react";
import { toast } from "sonner";

import PaginatedList from "@/CAREUI/misc/PaginatedList";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { Avatar } from "@/components/Common/Avatar";
import CircularProgress from "@/components/Common/CircularProgress";

import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import { formatName, relativeTime } from "@/Utils/utils";
import { CommentModel } from "@/types/resourceRequest/resourceRequest";

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
          <Textarea
            name="comment"
            placeholder={t("type_your_comment")}
            value={commentBox}
            onChange={(e) => setCommentBox(e.target.value)}
          />

          <div className="flex w-full justify-end mt-2">
            <Button
              variant="primary"
              onClick={async () => {
                await onSubmitComment();
                query.refetch();
              }}
            >
              {t("post_your_comment")}
            </Button>
          </div>
          <div className="w-full">
            <div>
              <PaginatedList.WhenEmpty className="flex w-full justify-center border-b border-secondary-200 bg-white p-5 text-center text-2xl font-bold text-secondary-500">
                <span>{t("no_comments_available")}</span>
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
  created_by,
  created_date,
}: CommentModel) => (
  <div className="mt-4 flex w-full flex-col rounded-lg border border-secondary-300 bg-white p-4 text-secondary-800">
    <div className="w-full">
      <p className="break-words whitespace-pre-wrap">
        {comment.replace(/\n+/g, "\n")}
      </p>
    </div>
    <div className="flex w-full items-center">
      <div className="mr-auto flex items-center rounded-md border bg-secondary-100 py-1 pl-2 pr-3">
        <Avatar
          name={`${created_by.first_name} ${created_by.last_name}`}
          className="h-8 w-8 "
        />
        <span className="pl-2 text-sm text-secondary-700">
          {formatName(created_by)}
        </span>
      </div>
      <div className="text-xs">{relativeTime(created_date)}</div>
    </div>
  </div>
);
