import { FilePlus2, Paperclip, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/careui/badge";
import { Button } from "@/components/careui/button";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/careui/item";
import FileUploadDialog from "@/components/Files/FileUploadDialog";
import useFileUpload from "@/hooks/useFileUpload";
import { FileType } from "@/types/files/file";

import {
  ReferralResourceContext,
  ReferralResourcePicker,
  StagedReferralResource,
} from "./ReferralResourcePicker";

interface ReferralCreateRecordsProps {
  context: ReferralResourceContext;
  value: StagedReferralResource[];
  onChange: (value: StagedReferralResource[]) => void;
  canUpload: boolean;
  disabled?: boolean;
  readOnly?: boolean;
}

export function ReferralCreateRecords({
  context,
  value,
  onChange,
  canUpload,
  disabled,
  readOnly,
}: ReferralCreateRecordsProps) {
  const { t } = useTranslation();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const add = (record: StagedReferralResource) => {
    if (
      !value.some(
        (item) =>
          item.resource.resource_type === record.resource.resource_type &&
          item.resource.resource_id === record.resource.resource_id,
      )
    ) {
      onChange([...value, record]);
    }
  };
  const upload = useFileUpload({
    type: context.encounterId ? FileType.ENCOUNTER : FileType.PATIENT,
    multiple: false,
    onUpload: (file) => {
      add({
        resource: {
          resource_type: "file_upload",
          resource_id: file.id,
          attachment_type: "source",
        },
        title: file.name,
      });
      setUploadOpen(false);
    },
  });
  return (
    <div className="space-y-3">
      <p className="text-sm text-cui-muted-foreground">
        {t("referral_selected_records_count", { count: value.length })}
      </p>
      {value.length ? (
        <div className="space-y-2">
          {value.map((record) => (
            <Item
              key={`${record.resource.resource_type}:${record.resource.resource_id}`}
              variant="outline"
              size="sm"
              className="bg-cui-background"
            >
              <Paperclip className="size-4 shrink-0 text-cui-muted-foreground" />
              <ItemContent className="min-w-0">
                <ItemTitle className="break-words">{record.title}</ItemTitle>
                {record.detail && (
                  <ItemDescription className="break-words">
                    {record.detail}
                  </ItemDescription>
                )}
                <Badge variant="neutral" className="w-fit">
                  {t(`referral_resource_${record.resource.resource_type}`)}
                </Badge>
              </ItemContent>
              {!readOnly && (
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  disabled={disabled}
                  aria-label={t("referral_remove_selected_record", {
                    name: record.title,
                  })}
                  onClick={() =>
                    onChange(value.filter((item) => item !== record))
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </Item>
          ))}
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-cui-border p-4 text-sm text-cui-muted-foreground">
          {t("referral_selected_records_empty")}
        </p>
      )}
      {!readOnly && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => setPickerOpen(true)}
          >
            <FilePlus2 className="size-4" />
            {t("referral_add_record")}
          </Button>
          {canUpload && (
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              onClick={() => setUploadOpen(true)}
            >
              <Upload className="size-4" />
              {t("upload_file")}
            </Button>
          )}
        </div>
      )}
      {pickerOpen && (
        <ReferralResourcePicker
          context={context}
          attachments={value.map((item) => item.resource)}
          onSelect={add}
          onClose={() => setPickerOpen(false)}
        />
      )}
      {uploadOpen && (
        <FileUploadDialog
          open
          fileUpload={upload}
          associatingId={context.encounterId ?? context.patientId}
          type={context.encounterId ? "encounter" : "patient"}
          description={t("referral_staged_upload_description")}
          onOpenChange={(open) => {
            if (!open) {
              upload.clearFiles();
              setUploadOpen(false);
            }
          }}
        />
      )}
    </div>
  );
}
