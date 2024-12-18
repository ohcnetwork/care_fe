import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";
import PaginatedList from "@/CAREUI/misc/PaginatedList";

import ButtonV2 from "@/components/Common/ButtonV2";
import CircularProgress from "@/components/Common/CircularProgress";
import { CommentModel } from "@/components/Facility/models";
import AutoExpandingTextInputFormField from "@/components/Form/FormFields/AutoExpandingTextInputFormField";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import { formatDateTime, formatName } from "@/Utils/utils";

interface CommentSectionProps {
  id: string;
}

const CommentSection = (props: CommentSectionProps) => {
  const [commentBox, setCommentBox] = useState("");
  const { t } = useTranslation();

  const onSubmitComment = async () => {
    const payload = { comment: commentBox };
    if (!/\S+/.test(commentBox)) {
      Notification.Error({ msg: t("comment_min_length") });
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
        <div className="flex w-full flex-col h-[690px] rounded-lg shadow-sm bg-white p-4 mt-4">
          <div className="w-full flex flex-col grow overflow-y-auto">
            <PaginatedList.WhenLoading>
              <CircularProgress />
            </PaginatedList.WhenLoading>
            <PaginatedList.WhenEmpty>
              <div className="flex items-center justify-center text-gray-500 h-full my-24">
                {t("No comments available")}
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
              placeholder={t("type_your_comment")}
              onChange={(e) => setCommentBox(e.value)}
              className="w-full grow"
              maxHeight={200}
              name="comment"
              errorClassName="hidden"
              innerClassName="pr-10"
            />
            <ButtonV2
              border={false}
              className="absolute right-2"
              ghost
              size="small"
              onClick={async () => {
                await onSubmitComment();
                query.refetch();
              }}
            >
              <CareIcon icon="l-message" className="text-lg" />
            </ButtonV2>
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

      <div className="w-5/6 rounded-md border-secondary-300 bg-gray-300 p-3 text-white">
        {comment}
      </div>
    </div>
  );
};
