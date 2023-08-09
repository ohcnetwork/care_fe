import { useReducer, useEffect, useRef, useState, Dispatch } from "react";
import ButtonV2 from "../Components/Common/components/ButtonV2";
import { FormAction, FormReducer, FormState } from "../Components/Form/Utils";
import { relativeTime } from "./utils";

type Draft = {
  timestamp: number;
  draft: {
    [key: string]: any;
  };
};

export function useAutoSaveReducer<T>(
  reducer: any,
  initialState: any
): [FormState<T>, Dispatch<FormAction<T>>] {
  const saveInterval = 1000;
  const saveKey = useRef(`form_draft_${window.location.pathname}`);
  const sessionStartTime = useRef(Date.now());
  const [canStartDraft, setCanStartDraft] = useState(false);
  const [draftStarted, setDraftStarted] = useState(false);
  const [state, dispatch] = useReducer<FormReducer<T>>(reducer, initialState);

  useEffect(() => {
    if (!canStartDraft) return;
    setDraftStarted(true);
  }, [canStartDraft, state]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCanStartDraft(true);
    }, 3000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!draftStarted) return;
      const savedDrafts = localStorage.getItem(saveKey.current);
      const drafts = savedDrafts ? JSON.parse(savedDrafts) : [];
      const existingIndex = drafts.findIndex(
        (draft: Draft) => draft.timestamp === sessionStartTime.current
      );
      const currentDraft = {
        timestamp: sessionStartTime.current,
        draft: state,
      };
      if (existingIndex !== -1) {
        drafts[existingIndex] = currentDraft;
      } else {
        drafts.push(currentDraft);
      }
      if (drafts.length > 2) drafts.shift();
      localStorage.setItem(saveKey.current, JSON.stringify(drafts));
    }, saveInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [state, draftStarted]);

  return [state, dispatch];
}

export function useAutoSaveState(initialState: any) {
  const [state, dispatch] = useAutoSaveReducer((state: any, action: any) => {
    if (action.type === "set_state") {
      return action.state;
    }
    return state;
  }, initialState);

  const setState = (newState: any) => {
    dispatch({ type: "set_state", state: newState });
  };

  return [state, setState];
}

export function DraftSection(props: {
  handleDraftSelect: (formState: any) => void;
  formData: any;
}) {
  const { handleDraftSelect } = props;
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const saveKey = useRef(`form_draft_${window.location.pathname}`);
  const draftStarted =
    drafts.length > 0
      ? drafts[drafts.length - 1].draft == props.formData
      : false;

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const savedDrafts = localStorage.getItem(saveKey.current);
      const drafts = savedDrafts ? JSON.parse(savedDrafts) : [];
      setDrafts(drafts);
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <>
      {drafts && (
        <div className="my-2 flex flex-wrap justify-end">
          {drafts?.length > 0 && (
            <div className="mx-1 flex items-center">
              <p className="text-gray-500">
                Last saved draft:{" "}
                {relativeTime(
                  draftStarted
                    ? drafts[0].timestamp
                    : drafts[drafts.length - 1].timestamp
                )}
              </p>
              <ButtonV2
                type="button"
                variant="primary"
                onClick={() =>
                  handleDraftSelect(
                    (draftStarted ? drafts[0] : drafts[drafts.length - 1]).draft
                  )
                }
                className="ml-2"
              >
                Restore
              </ButtonV2>
            </div>
          )}
        </div>
      )}
    </>
  );
}
