import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { NoteManager } from "@/components/Notes/NoteManager";
import { NoteThreadSource } from "@/components/Notes/noteSource";

import { ReferralRetrieve } from "@/types/emr/referral/referral";
import referralApi from "@/types/emr/referral/referralApi";
import referralConversationApi from "@/types/emr/referral/referralConversationApi";
import { callApi } from "@/Utils/request/query";
import { HTTPError } from "@/Utils/request/types";

interface ReferralConversationProps {
  referral: ReferralRetrieve;
  canWrite: boolean;
}

export function ReferralConversation(props: ReferralConversationProps) {
  return <ReferralConversationContent key={props.referral.id} {...props} />;
}

function ReferralConversationContent({
  referral,
  canWrite,
}: ReferralConversationProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [createdThreadId, setCreatedThreadId] = useState<string>();
  const threadId = referral.thread || createdThreadId;
  const pathParams = { referralId: referral.id };
  const detailKey = ["referrals", "detail", referral.id];

  const saveThread = (thread: { id: string }) => {
    setCreatedThreadId(thread.id);
    queryClient.setQueryData<ReferralRetrieve>(detailKey, (current) =>
      current ? { ...current, thread: thread.id } : current,
    );
  };

  const source: NoteThreadSource = {
    key: `referral:${referral.id}`,
    queryKey: ["referrals", "conversation", referral.id],
    // The baseline referral API does not expose the persisted thread title.
    title: t("notes__discussion"),
    canRename: false,
    listMessages: ({ offset, limit, signal }) =>
      callApi(referralConversationApi.list, {
        pathParams,
        queryParams: { offset, limit },
        signal,
        silent: true,
      }),
    prepareSend: async () => {
      if (threadId) return;
      try {
        saveThread(
          await callApi(referralConversationApi.createThread, {
            pathParams,
            body: {},
            silent: true,
          }),
        );
      } catch (error) {
        if (error instanceof HTTPError && error.status === 403) throw error;
        // Recover an existing thread after a competing creation or a lost response.
        const current = await callApi(referralApi.get, {
          pathParams,
          silent: true,
        });
        queryClient.setQueryData(detailKey, current);
        if (!current.thread) throw error;
        saveThread({ id: current.thread });
      }
    },
    sendMessage: (message) =>
      callApi(referralConversationApi.create, {
        pathParams,
        body: { message },
        silent: true,
      }),
    getMessage: (messageId) =>
      callApi(referralConversationApi.get, {
        pathParams: { ...pathParams, messageId },
        silent: true,
      }),
    updateMessage: (messageId, message) =>
      callApi(referralConversationApi.update, {
        pathParams: { ...pathParams, messageId },
        body: { message },
        silent: true,
      }),
    renameThread: async () => undefined,
    onRefresh: () => {
      void queryClient.invalidateQueries({ queryKey: detailKey });
    },
  };

  return (
    <NoteManager
      patientId={referral.patient}
      canAccess
      canWrite={canWrite}
      source={source}
    />
  );
}
