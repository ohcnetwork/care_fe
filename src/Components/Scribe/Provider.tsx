import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  ScribeField,
  ScribeForm,
  ScribeInput,
  ScribeProviderProps,
  ScribeStatus,
} from "./types";
import request from "../../Utils/request/request";
import routes from "../../Redux/api";
import * as Notify from "../../Utils/Notifications";
import useSegmentedRecording from "../../Utils/useSegmentedRecorder";
import uploadFile from "../../Utils/request/uploadFile";
import { scrapeFields } from "./scribeutils";
import { Controller } from "./Controller";

export const initialContextValue: ScribeForm = {
  inputs: [],
  status: "IDLE",
  reviewedAIResponses: {},
};

export const ScribeContext = createContext<
  [ScribeForm, Dispatch<SetStateAction<ScribeForm>>]
>([initialContextValue, () => {}]);

export function Provider(props: ScribeProviderProps) {
  const { children } = props;
  const [scribe, setScribe] = useState<ScribeForm>(initialContextValue);

  useEffect(() => {
    if (scribe.status !== "REVIEWING") return;
    const unreviewedResponse = scribe.lastAIResponse
      ? Object.entries(scribe.lastAIResponse).find(
          ([id, value]) =>
            !Object.keys(scribe.reviewedAIResponses).includes(id),
        )
      : undefined;
    if (!unreviewedResponse) return;
    document
      .querySelector(`[data-scribe-input="${unreviewedResponse[0]}"]`)
      ?.scrollIntoView({
        behavior: "smooth",
      });
  }, [scribe.lastAIResponse, scribe.reviewedAIResponses]);

  return (
    <ScribeContext.Provider value={[scribe, setScribe]}>
      <Controller />
      {children}
    </ScribeContext.Provider>
  );
}

export function useScribe<T>(input?: ScribeInput<T>) {
  const [context, setContext] = useContext(ScribeContext);

  const reviewResponse = (id: string, accept: boolean) => {
    setContext((context) => ({
      ...context,
      reviewedAIResponses: {
        ...context.reviewedAIResponses,
        [id]: accept,
      },
    }));
  };

  // Registers a scribe input with the context. Removes the input when the component unmounts.
  useEffect(() => {
    if (!input) return;
    setContext((context) => ({
      ...context,
      inputs: [...context.inputs, input],
    }));

    return () =>
      setContext((context) => ({
        ...context,
        inputs: context.inputs.filter((i) => i.id !== input.id),
      }));
  }, []);

  if (context === undefined) {
    throw new Error("useScribe must be used within a ScribeProvider");
  }
  return {
    ...context,
    reviewResponse,
  };
}
