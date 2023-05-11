import { HCXClaimModel, HCXCommunicationModel } from "./models";
import { useCallback, useEffect, useRef, useState } from "react";

import ButtonV2 from "../Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { HCXActions } from "../../Redux/actions";
import SendCommunicationModal from "./SendCommunicationModal";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import { classNames } from "../../Utils/utils";
import { useDispatch } from "react-redux";

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
  const dispatch = useDispatch<any>();
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [responses, setResponses] = useState<IMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [createdCommunication, setCreatedCommunication] =
    useState<HCXCommunicationModel>();
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchCommunications = useCallback(async () => {
    const response = await dispatch(
      HCXActions.communications.list({
        claim: claim.id,
        ordering: "created_date",
      })
    );

    if (response.status === 200 && response.data) {
      response.data.results?.forEach(
        (communication: HCXCommunicationModel, i: number) => {
          communication.content?.forEach((content) =>
            setMessages((prev) => [
              ...prev,
              { ...content, user: communication.created_by, index: i },
            ])
          );
        }
      );
    }
  }, [claim.id, dispatch]);

  const handleSubmit = async () => {
    const response = await dispatch(
      HCXActions.communications.create({
        claim: claim.id,
        content: responses.map((response) => ({
          type: response.type as string,
          data: response.data as string,
        })),
      })
    );

    console.log(response, response.status);
    if (response.status === 201) {
      setCreatedCommunication(response.data); //TODO: check if this is correct
    }
  };

  useEffect(() => {
    fetchCommunications();
  }, [fetchCommunications, createdCommunication]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [responses]);

  return (
    <div className="flex flex-col justify-end h-full">
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
          onClick={() => setShowMessages(false)}
          className="care-l-info-circle w-7 h-7 text-gray-600 cursor-pointer hover:text-gray-800"
        />
      </div>

      <div className="overflow-y-auto w-full h-full my-3">
        {messages.map((message) => (
          <div
            className={classNames(
              "flex mb-4",
              message.user ? "justify-end" : "justify-start"
            )}
          >
            <p
              className={classNames(
                "ml-2 py-3 px-4 text-white",
                message.user
                  ? "bg-blue-400 rounded-bl-3xl rounded-tl-3xl rounded-tr-xl"
                  : "bg-gray-500 rounded-br-3xl rounded-tr-3xl rounded-tl-xl"
              )}
            >
              {message.data}
            </p>
          </div>
        ))}

        {responses.map((message, i) => (
          <div className="flex mb-4 justify-end">
            <p
              onClick={() =>
                setResponses((prev) => prev.filter((_, j) => i !== j))
              }
              className="group relative flex items-center justify-center gap-2 ml-2 py-3 px-4 text-white bg-blue-400 rounded-bl-3xl rounded-tl-3xl rounded-tr-xl hover:bg-red-400"
            >
              <span className="group-hover:opacity-40 group-hover:line-through">
                {message.data}
              </span>
              <CareIcon className="care-l-trash text-xl font-bold hidden group-hover:block group-hover:absolute top-1/3 left-1/2" />
            </p>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>
      <div className="flex items-center gap-3 w-full m-auto">
        <TextAreaFormField
          name="message"
          value={inputText}
          onChange={(e) => setInputText(e.value)}
          placeholder="Enter a message"
          rows={1}
          className="w-full -mb-3"
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
