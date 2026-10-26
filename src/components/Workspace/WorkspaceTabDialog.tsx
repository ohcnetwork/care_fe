import { ChevronDown } from "lucide-react";
import { useId, useRef, useState } from "react";
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
import { cn } from "@/lib/utils";
import {
  encounterPageKeySchema,
  titleSchema,
} from "@/types/workspace/encounterWorkspace";

import { type WorkspacePage } from "./workspaceEditorUtils";
import { TAB_ICONS } from "./workspaceTabIcons";

interface WorkspaceTabDialogProps {
  page?: Extract<WorkspacePage, { kind: "custom" }>;
  pages: WorkspacePage[];
  systemKeys: string[];
  allowSystemKeys?: boolean;
  onClose: () => void;
  onSave: (page: WorkspacePage) => void;
}

const keyFromTitle = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);

export function WorkspaceTabDialog({
  page,
  pages,
  systemKeys,
  allowSystemKeys = false,
  onClose,
  onSave,
}: WorkspaceTabDialogProps) {
  const { t } = useTranslation();
  const id = useId();
  const [title, setTitle] = useState(page?.title ?? "");
  const [key, setKey] = useState(page?.key ?? "");
  // Only consulted inside handlers, so it never needs to trigger a render.
  const keyEdited = useRef(!!page);
  const [icon, setIcon] = useState(page?.icon ?? "layout-dashboard");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const validTitle = titleSchema.safeParse(title).success;
  const keyTaken = pages.some(
    (item) => item.key === key && item.key !== page?.key,
  );
  const validKey =
    encounterPageKeySchema.safeParse(key).success &&
    (allowSystemKeys || !systemKeys.includes(key)) &&
    !keyTaken;
  const submit = () => {
    if (validTitle && validKey) {
      onSave({
        ...(page ?? { columns: [{ span: 12, widgets: [] }] }),
        kind: "custom",
        key,
        title: title.trim(),
        icon,
      });
    } else {
      setShowErrors(true);
      if (!validKey) setAdvancedOpen(true);
    }
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
                ? "workspace_studio_tab_settings"
                : "workspace_studio_new_tab",
            )}
          </DialogTitle>
          <DialogDescription>
            {t("workspace_studio_tab_dialog_hint")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor={`${id}-title`}>
              {t("workspace_studio_tab_name")}
            </Label>
            <Input
              id={`${id}-title`}
              value={title}
              autoFocus
              maxLength={120}
              placeholder={t("workspace_studio_tab_name_placeholder")}
              onChange={(event) => {
                setTitle(event.target.value);
                if (!keyEdited.current)
                  setKey(keyFromTitle(event.target.value));
              }}
              aria-invalid={showErrors && !validTitle}
            />
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">
              {t("workspace_studio_tab_icon")}
            </legend>
            <div className="flex flex-wrap gap-2">
              {Object.entries(TAB_ICONS).map(([value, Icon]) => (
                <Button
                  key={value}
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={t(`workspace_builder_icon_${value}`, {
                    defaultValue: value,
                  })}
                  aria-pressed={icon === value}
                  onClick={() => setIcon(value)}
                  className={cn(
                    "size-10 shadow-none",
                    icon === value &&
                      "border-primary-500 bg-primary-50 text-primary-800 ring-1 ring-primary-500",
                  )}
                >
                  <Icon className="size-4" />
                </Button>
              ))}
            </div>
          </fieldset>
          <details
            className="group rounded-lg border border-border"
            open={advancedOpen}
            onToggle={(event) => setAdvancedOpen(event.currentTarget.open)}
          >
            <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs font-semibold text-soft-foreground [&::-webkit-details-marker]:hidden">
              {t("workspace_studio_tab_advanced")}
              <ChevronDown
                className="ml-auto size-3.5 transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <div className="space-y-2 border-t border-soft-border p-3">
              <Label htmlFor={`${id}-key`}>
                {t("workspace_studio_tab_key")}
              </Label>
              <Input
                id={`${id}-key`}
                value={key}
                onChange={(event) => {
                  keyEdited.current = true;
                  setKey(event.target.value);
                }}
                aria-invalid={showErrors && !validKey}
                className="font-mono text-sm"
              />
              <p className="text-xs leading-relaxed text-soft-foreground">
                {t("workspace_studio_tab_key_hint")}
              </p>
            </div>
          </details>
          {showErrors && (!validTitle || !validKey) && (
            <Alert variant="destructive">
              <AlertDescription>
                {t(
                  !validTitle
                    ? "workspace_studio_tab_name_required"
                    : keyTaken
                      ? "workspace_studio_tab_key_taken"
                      : "workspace_studio_tab_key_invalid",
                )}
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
                : "workspace_studio_add_tab",
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
