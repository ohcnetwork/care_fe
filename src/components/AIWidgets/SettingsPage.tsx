import { useAtom } from "jotai";
import {
  CheckCircle2,
  ListChecks,
  PenSquare,
  Plus,
  Quote,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

import useAuthUser from "@/hooks/useAuthUser";

import { EditorDialog } from "@/components/AIWidgets/EditorDialog";
import { newWidgetId, widgetsAtomFor } from "@/components/AIWidgets/store";
import { TEMPLATES } from "@/components/AIWidgets/templates";
import { Widget, WidgetType } from "@/components/AIWidgets/types";

const TYPE_META: Record<
  WidgetType,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  markdown: { label: "Markdown", icon: PenSquare },
  "cited-summary": { label: "Cited summary", icon: Quote },
  "ranked-list": { label: "Ranked list", icon: ListChecks },
};

export function AIWidgetsSettingsPage() {
  const { t } = useTranslation();
  const authUser = useAuthUser();
  const widgetsAtom = useMemo(
    () => widgetsAtomFor(authUser.id ?? authUser.username),
    [authUser.id, authUser.username],
  );
  const [widgets, setWidgets] = useAtom(widgetsAtom);
  const [editing, setEditing] = useState<Widget | null>(null);
  const [open, setOpen] = useState(false);

  const startNew = (preset?: Partial<Widget>) => {
    setEditing({
      id: newWidgetId(),
      name: preset?.name ?? "",
      type: preset?.type ?? "markdown",
      prompt: preset?.prompt ?? "",
      model: preset?.model ?? "gpt-4.1-mini",
      enabled: true,
    });
    setOpen(true);
  };

  const saveWidget = (next: Widget) => {
    setWidgets((prev) => {
      const exists = prev.some((w) => w.id === next.id);
      if (exists) return prev.map((w) => (w.id === next.id ? next : w));
      return [...prev, next];
    });
    toast.success(t("ai_widgets__saved"));
    setOpen(false);
    setEditing(null);
  };

  const deleteWidget = (id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
    toast.success(t("ai_widgets__deleted"));
  };

  const toggle = (id: string, enabled: boolean) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, enabled } : w)),
    );
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Sparkles className="h-5 w-5 text-amber-600" />
            {t("ai_widgets__page_title")}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {t("ai_widgets__page_desc")}
          </p>
        </div>
        <Button onClick={() => startNew()}>
          <Plus className="h-4 w-4" />
          {t("ai_widgets__new")}
        </Button>
      </div>

      {widgets.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <Sparkles className="h-8 w-8 text-amber-500" />
            <p className="text-sm text-gray-700">
              {t("ai_widgets__no_widgets_yet")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {widgets.map((w) => {
            const Icon = TYPE_META[w.type].icon;
            return (
              <Card key={w.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <Icon className="mt-1 h-4 w-4 shrink-0 text-amber-700" />
                    <div className="min-w-0">
                      <CardTitle className="flex items-center gap-2">
                        {w.name || (
                          <span className="italic text-gray-400">
                            {t("ai_widgets__untitled")}
                          </span>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {TYPE_META[w.type].label}
                        </Badge>
                        {w.enabled && (
                          <Badge
                            variant="secondary"
                            className="bg-emerald-50 text-emerald-700 border border-emerald-200"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            {t("ai_widgets__enabled")}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1 line-clamp-2">
                        {w.prompt}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={w.enabled}
                      onCheckedChange={(v) => toggle(w.id, v)}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditing(w);
                        setOpen(true);
                      }}
                    >
                      <PenSquare className="h-4 w-4" />
                      <span className="sr-only">{t("ai_widgets__edit")}</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-rose-700 hover:text-rose-900"
                      onClick={() => deleteWidget(w.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">{t("ai_widgets__delete")}</span>
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">
          {t("ai_widgets__templates_title")}
        </h2>
        <p className="text-sm text-gray-600">
          {t("ai_widgets__templates_desc")}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {TEMPLATES.map((tpl) => {
            const Icon = TYPE_META[tpl.type].icon;
            return (
              <Card key={tpl.name}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="h-4 w-4 text-amber-700" />
                    {tpl.name}
                  </CardTitle>
                  <CardDescription>{tpl.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-between">
                  <Badge variant="secondary">{TYPE_META[tpl.type].label}</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startNew(tpl)}
                  >
                    <Plus className="h-3 w-3" />
                    {t("ai_widgets__use_template")}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {editing && (
        <EditorDialog
          open={open}
          onOpenChange={setOpen}
          widget={editing}
          onSave={saveWidget}
        />
      )}
    </div>
  );
}
