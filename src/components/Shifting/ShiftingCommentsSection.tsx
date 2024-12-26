import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";
import PaginatedList from "@/CAREUI/misc/PaginatedList";

import CircularProgress from "@/components/Common/CircularProgress";
import { CommentModel } from "@/components/Facility/models";
import AutoExpandingTextInputFormField from "@/components/Form/FormFields/AutoExpandingTextInputFormField";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import { formatDateTime, formatName } from "@/Utils/utils";

import { Button } from "../ui/button";

interface CommentSectionProps {
  id: string;
}

const CommentSection = (props: CommentSectionProps) => {
  const [commentBox, setCommentBox] = useState("");
  const { t } = useTranslation();

  const { mutate: addComment } = useMutation({
    mutationFn: mutate(routes.addShiftComments, {
      pathParams: { id: props.id },
      body: { comment: commentBox },
    }),
    onSuccess: () => {
      Notification.Success({ msg: t("comment_added_successfully") });
      setCommentBox("");
    },
    onError: () => {
      Notification.Error({ msg: t("comment_add_error") });
    },
  });

  const onSubmitComment = async () => {
    const payload = { comment: commentBox };
    if (!/\S+/.test(commentBox)) {
      Notification.Error({ msg: t("comment_min_length") });
      return;
    }
    addComment(payload);
  };

  return (
    <PaginatedList
      route={routes.getShiftComments}
      pathParams={{ id: props.id }}
    >
      {(_, query) => (
        <div className="flex w-full flex-col h-[700px] rounded-lg shadow-sm bg-white p-4 mt-2">
          <div className="w-full flex flex-col grow overflow-y-auto">
            <PaginatedList.WhenLoading>
              <CircularProgress />
            </PaginatedList.WhenLoading>
            <PaginatedList.WhenEmpty>
              <div className="flex items-center justify-center text-gray-500 h-full my-24">
                {t("no_comments_available")}
              </div>
            </PaginatedList.WhenEmpty>

            <PaginatedList.Items<CommentModel>>
              {(item) => <Comment {...item} />}
            </PaginatedList.Items>
            <div className="flex w-full items-center justify-center">
              <PaginatedList.Paginator hideIfSinglePage />
            </div>
          </div>

          <div className="relative mx-4 flex items-center mt-auto">
            <AutoExpandingTextInputFormField
              value={commentBox}
              rows={1}
              placeholder={t("type_your_comment")}
              onChange={(e) => setCommentBox(e.value)}
              className="w-full grow"
              maxHeight={200}
              name="comment"
              errorClassName="hidden"
              innerClassName="pr-10"
            />
            <Button
              className="absolute right-2"
              variant="primary"
              onClick={async () => {
                await onSubmitComment();
                query.refetch();
              }}
            >
              <CareIcon icon="l-message" className="text-lg" />
            </Button>
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
}: CommentModel) => {
  const { t } = useTranslation();
  return (
    <div key={id} className="mb-4 flex flex-col rounded-lg p-4">
      <div className="flex items-center mb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-700 text-white uppercase">
          {created_by_object?.first_name?.charAt(0) || t("unknown")}
        </div>
        <div className="ml-2">
          <span className="font-bold text-secondary-800">
            {formatName(created_by_object)}
          </span>
          <span className="ml-2 text-sm text-secondary-500">
            {modified_date ? formatDateTime(modified_date) : "-"}
          </span>
        </div>
      </div>

      <div className="w-5/6 rounded-md border-secondary-300 bg-gray-400 p-3 text-white">
        {comment}
      </div>
    </div>
  );
};
