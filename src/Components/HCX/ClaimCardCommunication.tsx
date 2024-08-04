import { HCXClaimModel } from "./models";
import { useMemo, useRef, useState } from "react";
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

interface IProps {
  claim: HCXClaimModel;
  setShowMessages: (show: boolean) => void;
}

interface IMessage {
  type?: string;
  data?: string;
  user?: string | null;
  index?: number;
}

export default function ClaimCardCommunication({
  claim,
  setShowMessages,
}: IProps) {
  const { t } = useTranslation();
  const [inputText, setInputText] = useState("");
  const [isSendingCommunication, setIsSendingCommunication] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

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
        ordering: "created_date",
      },
    });

  const messages = useMemo(() => {
    return (
      (communicationsResult?.results
        ?.flatMap((communication, i) => {
          return communication.content?.map((content) => ({
            ...content,
            user: communication.created_by,
            index: i,
          }));
        })
        .filter(Boolean) as IMessage[]) ?? []
    );
  }, [communicationsResult]);

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

        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
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

      <div className="my-3 h-full w-full overflow-y-auto">
        {messages?.map((message) => (
          <div
            className={classNames(
              "mb-4 flex",
              message.user ? "justify-end" : "justify-start",
            )}
          >
            <p
              className={classNames(
                "ml-2 px-4 py-3 text-white",
                message.user
                  ? "rounded-bl-3xl rounded-tl-3xl rounded-tr-xl bg-blue-400"
                  : "rounded-br-3xl rounded-tl-xl rounded-tr-3xl bg-gray-500",
              )}
            >
              {message.data}
            </p>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>
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
        <UploadButton className="!w-fit">
          <CareIcon icon="l-paperclip" className="h-5 w-5" />
        </UploadButton>
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
