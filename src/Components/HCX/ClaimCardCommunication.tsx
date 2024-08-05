import { HCXClaimModel, HCXCommunicationModel } from "./models";
import { useState } from "react";
import * as Notification from "../../Utils/Notifications";

import ButtonV2 from "../Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import { classNames } from "../../Utils/utils";
import routes from "../../Redux/api";
import useQuery from "../../Utils/request/useQuery";
import { useTranslation } from "react-i18next";
import useFileUpload from "../../Utils/useFileUpload";
import request from "../../Utils/request/request";
import { FileUploadModel } from "../Patient/models";

interface IProps {
  claim: HCXClaimModel;
  setShowMessages: (show: boolean) => void;
}

export default function ClaimCardCommunication({
  claim,
  setShowMessages,
}: IProps) {
  const { t } = useTranslation();
  const [inputText, setInputText] = useState("");
  const [isSendingCommunication, setIsSendingCommunication] = useState(false);

  const { UploadButton, files, removeFile, clearFiles, handleFileUpload } =
    useFileUpload({
      multiple: true,
      type: "COMMUNICATION",
      allowedExtensions: ["pdf", "jpg", "jpeg", "png"],
    });

  const { data: communicationsResult, refetch: refetchCommunications } =
    useQuery(routes.listHCXCommunications, {
      query: {
        claim: claim.id,
        ordering: "-created_date",
      },
    });

  const handleSubmit = async () => {
    if (!claim.id) return;

    setIsSendingCommunication(true);

    const { res, data } = await request(routes.createHCXCommunication, {
      body: {
        claim: claim.id,
        content: [
          {
            type: "text",
            data: inputText,
          },
        ],
      },
    });

    if (res?.status === 201 && data) {
      await handleFileUpload(data.id as string);

      const { res } = await request(routes.hcxSendCommunication, {
        body: {
          communication: data.id,
        },
      });

      if (res?.ok) {
        Notification.Success({ msg: "Sent communication to HCX" });

        await refetchCommunications();

        setInputText("");
        clearFiles();
      } else {
        Notification.Error({ msg: "Error sending communication to HCX" });
      }
    }

    setIsSendingCommunication(false);
  };

  return (
    <div className="flex h-full flex-col justify-end">
      <div className="flex justify-end">
        <CareIcon
          icon="l-info-circle"
          className=" h-7 w-7 cursor-pointer text-gray-600 hover:text-gray-800"
          onClick={() => setShowMessages(false)}
        />
      </div>

      <CommunicationChatInterface
        communications={communicationsResult?.results ?? []}
      />

      <div className="m-auto flex w-full items-center gap-3">
        <div className="relative w-full">
          <div className="absolute bottom-full flex max-w-full items-center gap-2 overflow-x-auto pb-2.5">
            {files.map((file, i) => (
              <div
                key={file.name}
                className="flex min-w-36 max-w-36 items-center gap-2"
              >
                <div>
                  {file.type.includes("image") ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="h-10 w-10 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-300">
                      <CareIcon icon="l-file" className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="w-24 truncate text-sm">{file.name}</p>
                  <div className="flex !items-center gap-2.5">
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                    <button
                      onClick={() => {
                        removeFile(i);
                      }}
                    >
                      <CareIcon
                        icon="l-trash"
                        className="h-4 w-4 text-danger-500"
                      />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <TextAreaFormField
            name="message"
            value={inputText}
            onChange={(e) => setInputText(e.value)}
            placeholder={t("enter_message")}
            rows={1}
            className="-mb-3"
          />
        </div>
        <div className="w-fit">
          <UploadButton>
            <CareIcon icon="l-paperclip" className="h-5 w-5" />
          </UploadButton>
        </div>
        <ButtonV2
          disabled={!inputText}
          loading={isSendingCommunication}
          onClick={handleSubmit}
        >
          {t("send_message")}
        </ButtonV2>
      </div>
    </div>
  );
}

interface ICommunicationChatInterfaceProps {
  communications: HCXCommunicationModel[];
}

function CommunicationChatInterface({
  communications,
}: ICommunicationChatInterfaceProps) {
  return (
    <div className="my-3 flex h-full w-full flex-col-reverse gap-4 overflow-y-auto">
      {communications?.map((communication) => (
        <CommunicationChatMessage communication={communication} />
      ))}
    </div>
  );
}

interface ICommunicationChatMessageProps {
  communication: HCXCommunicationModel;
}

function CommunicationChatMessage({
  communication,
}: ICommunicationChatMessageProps) {
  const { t } = useTranslation();
  const [attachments, setAttachments] = useState<null | FileUploadModel[]>(
    null,
  );
  const [isFetchingAttachments, setIsFetchingAttachments] = useState(false);
  const [isDownloadingAttachment, setIsDownloadingAttachment] = useState(false);

  return (
    <div
      className={classNames(
        "mb-4 flex flex-col gap-2",
        communication.created_by ? "items-end pr-2" : "items-start pl-2",
      )}
    >
      {communication.content?.map((message) => (
        <p
          className={classNames(
            "ml-2 px-4 py-3 text-white",
            communication.created_by
              ? "rounded-bl-3xl rounded-tl-3xl rounded-tr-xl bg-blue-400"
              : "rounded-br-3xl rounded-tl-xl rounded-tr-3xl bg-gray-500",
          )}
        >
          {message.data}
        </p>
      ))}
      {attachments ? (
        <div className="flex max-w-full items-center gap-2 overflow-x-auto pb-2.5">
          {attachments.length === 0 ? (
            <p className="text-sm text-secondary-600">
              {t("no_attachments_found")}
            </p>
          ) : (
            attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex min-w-36 max-w-36 items-center gap-2"
              >
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-300">
                    <CareIcon icon="l-file" className="h-5 w-5" />
                  </div>
                </div>
                <div className="flex flex-col items-start gap-1">
                  <p className="w-24 truncate text-sm">{attachment.name}</p>
                  <button
                    disabled={isDownloadingAttachment}
                    onClick={async () => {
                      if (!attachment.id) return;

                      setIsDownloadingAttachment(true);

                      const { res, data } = await request(
                        routes.retrieveUpload,
                        {
                          query: {
                            file_type: "COMMUNICATION",
                            associating_id: communication.id,
                          },
                          pathParams: { id: attachment.id },
                        },
                      );

                      if (res?.ok) {
                        const url = data?.read_signed_url;
                        window.open(url, "_blank");
                      } else {
                        Notification.Error({
                          msg: "Error downloading attachment",
                        });
                      }

                      setIsDownloadingAttachment(false);
                    }}
                    className="cursor-pointer text-xs text-blue-500 hover:text-blue-700 hover:underline"
                  >
                    {t("open")}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <button
          onClick={async () => {
            setIsFetchingAttachments(true);

            const { res, data } = await request(routes.viewUpload, {
              query: {
                file_type: "COMMUNICATION",
                associating_id: communication.id,
                is_archived: false,
              },
            });

            if (res?.ok) {
              Notification.Success({ msg: "Fetched attachments successfully" });
              setAttachments(data?.results ?? []);
            } else {
              Notification.Error({ msg: "Error fetching attachments" });
            }

            setIsFetchingAttachments(false);
          }}
          className="cursor-pointer text-sm text-secondary-700 hover:text-secondary-900 hover:underline"
        >
          {isFetchingAttachments ? t("fetching") + "..." : t("see_attachments")}
        </button>
      )}
    </div>
  );
}
