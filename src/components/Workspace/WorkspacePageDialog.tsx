import { useId, useState } from "react";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  encounterPageKeySchema,
  titleSchema,
} from "@/types/workspace/encounterWorkspace";

import { type WorkspacePage } from "./workspaceEditorUtils";

const PAGE_ICONS = [
  "layout-dashboard",
  "stethoscope",
  "clipboard-list",
  "panels-top-left",
  "activity",
  "heart-pulse",
];

interface WorkspacePageDialogProps {
  page?: Extract<WorkspacePage, { kind: "custom" }>;
  pages: WorkspacePage[];
  systemKeys: string[];
  onClose: () => void;
  onSave: (page: WorkspacePage) => void;
}

export function WorkspacePageDialog({
  page,
  pages,
  systemKeys,
  onClose,
  onSave,
}: WorkspacePageDialogProps) {
  const { t } = useTranslation();
  const id = useId();
  const [title, setTitle] = useState(page?.title ?? "");
  const [key, setKey] = useState(page?.key ?? "");
  const [keyEdited, setKeyEdited] = useState(!!page);
  const [icon, setIcon] = useState(page?.icon ?? "layout-dashboard");
  const [showErrors, setShowErrors] = useState(false);
  const validTitle = titleSchema.safeParse(title).success;
  const validKey =
    encounterPageKeySchema.safeParse(key).success &&
    !systemKeys.includes(key) &&
    !pages.some((item) => item.key === key && item.key !== page?.key);
  const submit = () => {
    if (validTitle && validKey) {
      onSave({
        ...(page ?? { columns: [{ span: 1, widgets: [] }] }),
        kind: "custom",
        key,
        title: title.trim(),
        icon,
      });
    } else setShowErrors(true);
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t(
              page
                ? "workspace_builder_page_settings"
                : "workspace_builder_add_page",
            )}
          </DialogTitle>
          <DialogDescription>
            {t("workspace_builder_page_dialog_hint")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={id + "-title"}>
              {t("workspace_builder_page_title")}
            </Label>
            <Input
              id={id + "-title"}
              value={title}
              autoFocus
              maxLength={120}
              onChange={(event) => {
                setTitle(event.target.value);
                if (!keyEdited)
                  setKey(
                    event.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-|-$/g, "")
                      .slice(0, 64),
                  );
              }}
              aria-invalid={showErrors && !validTitle}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={id + "-key"}>
              {t("workspace_builder_page_key")}
            </Label>
            <Input
              id={id + "-key"}
              value={key}
              onChange={(event) => {
                setKeyEdited(true);
                setKey(event.target.value);
              }}
              aria-invalid={showErrors && !validKey}
              className="font-mono text-sm"
            />
            <p className="text-xs leading-relaxed text-gray-500">
              {t("workspace_builder_page_key_hint")}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor={id + "-icon"}>
              {t("workspace_builder_page_icon")}
            </Label>
            <Select value={icon} onValueChange={setIcon}>
              <SelectTrigger id={id + "-icon"}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[
                  ...PAGE_ICONS,
                  ...(!PAGE_ICONS.includes(icon) ? [icon] : []),
                ].map((value) => (
                  <SelectItem key={value} value={value}>
                    {t("workspace_builder_icon_" + value, {
                      defaultValue: value,
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {showErrors && (!validTitle || !validKey) && (
            <Alert variant="destructive">
              <AlertDescription>
                {t("workspace_builder_page_invalid")}
              </AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="button" onClick={submit}>
            {t(
              page
                ? "workspace_builder_apply_changes"
                : "workspace_builder_add_page",
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
