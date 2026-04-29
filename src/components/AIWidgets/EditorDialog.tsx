import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { Textarea } from "@/components/ui/textarea";

import { Widget, WidgetType } from "@/components/AIWidgets/types";

const ALLOWED_MODELS = ["gpt-4.1-mini", "gpt-4.1", "gpt-5.4-mini", "gpt-5.4"];

const TYPE_OPTIONS: {
  value: WidgetType;
  label: string;
  description: string;
}[] = [
  {
    value: "markdown",
    label: "Markdown",
    description: "Sections, callouts, freeform.",
  },
  {
    value: "cited-summary",
    label: "Cited summary",
    description: "Narrative grounded in tools.",
  },
  {
    value: "ranked-list",
    label: "Ranked list",
    description: "Items with score and rationale.",
  },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  widget: Widget;
  onSave: (w: Widget) => void;
}

export function EditorDialog({ open, onOpenChange, widget, onSave }: Props) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<Widget>(widget);

  const tokenEstimate = Math.ceil(draft.prompt.length / 4);
  const valid = draft.name.trim().length > 0 && draft.prompt.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("ai_widgets__editor_title")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ai-widget-name">{t("ai_widgets__name")}</Label>
            <Input
              id="ai-widget-name"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder={t("ai_widgets__name_placeholder")}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t("ai_widgets__type")}</Label>
            <Select
              value={draft.type}
              onValueChange={(v) =>
                setDraft({ ...draft, type: v as WidgetType })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{opt.label}</span>
                      <span className="text-xs text-gray-500">
                        {opt.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ai-widget-prompt">{t("ai_widgets__prompt")}</Label>
            <Textarea
              id="ai-widget-prompt"
              value={draft.prompt}
              onChange={(e) => setDraft({ ...draft, prompt: e.target.value })}
              placeholder={t("ai_widgets__prompt_placeholder")}
              rows={8}
              className="font-mono text-sm"
            />
            <div className="flex justify-end text-xs text-gray-500">
              ~{tokenEstimate} {t("ai_widgets__tokens")}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t("ai_widgets__model")}</Label>
            <Select
              value={draft.model}
              onValueChange={(v) => setDraft({ ...draft, model: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALLOWED_MODELS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button disabled={!valid} onClick={() => onSave(draft)}>
            {t("ai_widgets__save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
