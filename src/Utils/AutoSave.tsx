import React, {
  Dispatch,
  ReactNode,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

import { FormAction, FormReducer, FormState } from "@/components/Form/Utils";

import { relativeTime } from "@/Utils/utils";

type Draft = {
  timestamp: number;
  draft: {
    [key: string]: any;
  };
};

export function useAutoSaveReducer<T>(
  reducer: any,
  initialState: any,
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
        (draft: Draft) => draft.timestamp === sessionStartTime.current,
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

type RestoreDraftContextValue = {
  handleDraftSelect: (formState: any) => void;
  draftStarted: boolean;
  drafts: Draft[];
};

const RestoreDraftContext =
  React.createContext<RestoreDraftContextValue | null>(null);

export function DraftSection(props: {
  handleDraftSelect: (formState: any) => void;
  formData: any;
  hidden?: boolean;
  children?: ReactNode;
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

  // Remove drafts older than 24 hours
  useEffect(() => {
    const keys = Object.keys(localStorage);
    const now = Date.now();
    keys.forEach((key) => {
      if (key.startsWith("form_draft_")) {
        const savedDrafts = localStorage.getItem(key);
        const drafts = savedDrafts ? JSON.parse(savedDrafts) : [];
        const newDrafts = drafts.filter(
          (draft: Draft) => now - draft.timestamp < 24 * 60 * 60 * 1000,
        );
        localStorage.setItem(key, JSON.stringify(newDrafts));
        if (newDrafts.length === 0) localStorage.removeItem(key);
      }
    });
  }, []);

  return (
    <RestoreDraftContext.Provider
      value={{ handleDraftSelect, drafts, draftStarted }}
    >
      {!props.hidden && drafts && drafts.length > 0 && (
        <div className="my-2 flex flex-wrap justify-end">
          <RestoreDraftButton />
        </div>
      )}
      {props.children}
    </RestoreDraftContext.Provider>
  );
}

export const RestoreDraftButton = () => {
  const ctx = useContext(RestoreDraftContext);

  if (!ctx) {
    throw new Error(
      "RestoreDraftButton must be used within a RestoreDraftProvider",
    );
  }

  const { handleDraftSelect, draftStarted, drafts } = ctx;

  if (!(drafts && drafts.length > 0)) {
    return null;
  }

  return (
    <Button
      variant="outline"
      type="button"
      className="flex items-center space-x-2"
      onClick={() =>
        handleDraftSelect(
          (draftStarted ? drafts[0] : drafts[drafts.length - 1]).draft,
        )
      }
    >
      <CareIcon icon="l-pen" />
      <span>Restore draft</span>
      <span className="text-sm text-secondary-500">
        (
        {relativeTime(
          draftStarted
            ? drafts[0].timestamp
            : drafts[drafts.length - 1].timestamp,
        )}
        )
      </span>
    </Button>
  );
};
