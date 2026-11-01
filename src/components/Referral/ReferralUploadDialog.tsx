import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import FileUploadDialog from "@/components/Files/FileUploadDialog";
import useFileUpload from "@/hooks/useFileUpload";
import { ReferralRetrieve } from "@/types/emr/referral/referral";
import {
  REFERRAL_RESOURCE_CATEGORIES,
  ReferralResourceCategory,
} from "@/types/emr/referral/referralResource";
import referralResourceApi from "@/types/emr/referral/referralResourceApi";
import { FileReadMinimal, FileType } from "@/types/files/file";
import { callApi } from "@/Utils/request/query";

import { invalidateReferralResources } from "./invalidateReferralResources";
import { referralResourceError } from "./referralResourceError";
import { ReferralResourceCategoryField } from "./ReferralResourcePicker";

export function ReferralUploadDialog({
  referral,
  onClose,
  categories = REFERRAL_RESOURCE_CATEGORIES,
}: {
  referral: ReferralRetrieve;
  onClose: () => void;
  categories?: readonly ReferralResourceCategory[];
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedCategory, setCategory] = useState<ReferralResourceCategory>(
    categories[0],
  );
  const category = categories.includes(selectedCategory)
    ? selectedCategory
    : categories[0];
  const [uploaded, setUploaded] = useState<FileReadMinimal>();
  const attach = useMutation({
    retry: false,
    mutationFn: async (file: FileReadMinimal) => {
      // Reconcile a previously completed link before retrying after a lost
      // response. This operation never creates or uploads another file.
      let offset = 0;
      while (true) {
        const page = await callApi(referralResourceApi.list, {
          pathParams: { referralId: referral.id },
          queryParams: { resource_type: "file_upload", limit: 100, offset },
          silent: true,
        });
        const existing = page.results.find(
          (item) => item.resource_id === file.id,
        );
        if (existing) return existing;
        offset += page.results.length;
        if (!page.results.length || offset >= page.count) break;
      }
      return callApi(referralResourceApi.create, {
        pathParams: { referralId: referral.id },
        body: {
          resource_type: "file_upload",
          resource_id: file.id,
          attachment_type: category,
        },
        silent: true,
      });
    },
    onSuccess: (attachment) => {
      void invalidateReferralResources(queryClient, attachment);
      toast.success(t("referral_record_added"));
      onClose();
    },
  });
  const upload = useFileUpload({
    type: FileType.REFERRAL,
    multiple: false,
    onUpload: (file) => {
      setUploaded(file);
      attach.mutate(file);
    },
  });

  return (
    <FileUploadDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      fileUpload={upload}
      associatingId={referral.id}
      type="referral"
      description={t("referral_upload_file_description")}
      uploadLabel={t("referral_upload_and_attach")}
      completion={
        uploaded
          ? {
              pending: attach.isPending,
              message: attach.isPending
                ? t("referral_attaching_file")
                : t("referral_file_uploaded_attach_pending", {
                    name: uploaded.name,
                  }),
              error: attach.isError
                ? referralResourceError(
                    attach.error,
                    t("referral_record_share_error"),
                  )
                : undefined,
              onRetry: () => attach.mutate(uploaded),
              retryLabel: t("referral_retry_attachment"),
            }
          : undefined
      }
    >
      <ReferralResourceCategoryField
        value={category}
        onChange={setCategory}
        disabled={upload.uploading || attach.isPending || !!uploaded}
        categories={categories}
      />
    </FileUploadDialog>
  );
}
