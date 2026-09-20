import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { extractQuestions } from "@/components/QuestionnaireV2/shared/questionnaireImport";
import { Question } from "@/types/questionnaire/question";

/** Max accepted size for a fetched questionnaire JSON (bytes/characters). */
const MAX_IMPORT_SIZE = 5_000_000;

async function fetchQuestionnaire(url: string, signal: AbortSignal) {
  const response = await fetch(url, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(10_000)]),
  });
  if (!response.ok) throw new Error("Failed to fetch questionnaire");
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType && !/json|text/i.test(contentType)) {
    throw new Error("Unexpected content type");
  }
  if (Number(response.headers.get("content-length")) > MAX_IMPORT_SIZE) {
    throw new Error("Questionnaire file too large");
  }
  const text = await response.text();
  if (text.length > MAX_IMPORT_SIZE) {
    throw new Error("Questionnaire file too large");
  }
  return text;
}

/** Reads external JSON into an import preview, never into the query cache.
 * A source change or unmount invalidates both fetches and uncancellable
 * File.text reads, so only this session's latest request may finish. */
export function useQuestionImport(onReady: () => void) {
  const { t } = useTranslation();
  const activeImport = useRef<AbortController | null>(null);
  const [pendingQuestions, setPendingQuestions] = useState<Question[] | null>(
    null,
  );
  const [isFetching, setIsFetching] = useState(false);
  const [fileError, setFileError] = useState("");

  useEffect(
    () => () => {
      activeImport.current?.abort();
      activeImport.current = null;
    },
    [],
  );

  const cancelImport = () => {
    activeImport.current?.abort();
    activeImport.current = null;
    setIsFetching(false);
    setPendingQuestions(null);
    setFileError("");
  };

  const readImport = async (
    source: "file" | "url",
    read: (signal: AbortSignal) => Promise<string>,
  ) => {
    cancelImport();
    const controller = new AbortController();
    activeImport.current = controller;
    setIsFetching(source === "url");
    const isCurrent = () =>
      activeImport.current === controller && !controller.signal.aborted;
    try {
      const text = await read(controller.signal);
      if (!isCurrent()) return;
      const data: unknown = JSON.parse(text);
      const questions = extractQuestions(data);
      if (!questions) {
        if (source === "file") setFileError(t("invalid_json"));
        else toast.error(t("invalid_json"));
        return;
      }
      setPendingQuestions(questions);
      onReady();
    } catch {
      if (!isCurrent()) return;
      if (source === "file") setFileError(t("invalid_json"));
      else toast.error(t("failed_to_import_questionnaire"));
    } finally {
      if (isCurrent()) {
        activeImport.current = null;
        setIsFetching(false);
      }
    }
  };

  return {
    pendingQuestions,
    isFetching,
    fileError,
    cancelImport,
    importFile: (file: File) => readImport("file", () => file.text()),
    importUrl: (url: string) =>
      readImport("url", (signal) => fetchQuestionnaire(url, signal)),
  };
}
