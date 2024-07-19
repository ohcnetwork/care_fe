import { HCXClaimModel, HCXCommunicationModel } from "./models";
import { useEffect, useMemo, useRef, useState } from "react";

import ButtonV2 from "../Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";
import SendCommunicationModal from "./SendCommunicationModal";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import { classNames } from "../../Utils/utils";
import routes from "../../Redux/api";
import useQuery from "../../Utils/request/useQuery";
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
  const [responses, setResponses] = useState<IMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [createdCommunication, setCreatedCommunication] =
    useState<HCXCommunicationModel>();
  const bottomRef = useRef<HTMLDivElement>(null);

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

    const { res, data } = await request(routes.createHCXCommunication, {
      body: {
        claim: claim.id,
        content: responses.map((response) => ({
          type: response.type as string,
          data: response.data as string,
        })),
      },
    });

    if (res?.status === 201) {
      setCreatedCommunication(data);
    }
  };

  useEffect(() => {
    refetchCommunications();
  }, [refetchCommunications, createdCommunication]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [responses]);

  return (
    <div className="flex h-full flex-col justify-end">
      {createdCommunication && (
        <SendCommunicationModal
          communication={createdCommunication}
          show
          onClose={() => {
            setCreatedCommunication(undefined);
            setResponses([]);
          }}
        />
      )}
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

        {responses.map((message, i) => (
          <div className="mb-4 flex justify-end">
            <p
              onClick={() =>
                setResponses((prev) => prev.filter((_, j) => i !== j))
              }
              className="group relative ml-2 flex items-center justify-center gap-2 rounded-bl-3xl rounded-tl-3xl rounded-tr-xl bg-blue-400 px-4 py-3 text-white hover:bg-red-400"
            >
              <span className="group-hover:line-through group-hover:opacity-40">
                {message.data}
              </span>
              <CareIcon
                icon="l-trash"
                className="left-1/2 top-1/3 hidden text-xl font-bold group-hover:absolute group-hover:block"
              />
            </p>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>
      <div className="m-auto flex w-full items-center gap-3">
        <TextAreaFormField
          name="message"
          value={inputText}
          onChange={(e) => setInputText(e.value)}
          placeholder="Enter a message"
          rows={1}
          className="-mb-3 w-full"
        />
        {inputText.length || !responses.length ? (
          <ButtonV2
            onClick={() => {
              setResponses((prev) => [
                ...prev,
                { type: "text", data: inputText },
              ]);
              setInputText("");
            }}
            disabled={!inputText.length}
          >
            Add
          </ButtonV2>
        ) : (
          <ButtonV2 disabled={!responses.length} onClick={handleSubmit}>
            Submit
          </ButtonV2>
        )}
      </div>
    </div>
  );
}
