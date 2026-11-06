import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

import { RecordLike } from "@/components/Questionnaire/structured/contextMatch";

export interface DraftContextChange {
  questionId: string;
  title: string;
  added: RecordLike[];
  removed: RecordLike[];
  changed: RecordLike[];
}

function recordLabel(record: RecordLike): string {
  const code = record.code as { display?: string } | undefined;
  const medication = record.medication as { display?: string } | undefined;
  return (
    code?.display ??
    medication?.display ??
    (record.status as string | undefined) ??
    (record.id as string | undefined) ??
    "—"
  );
}

type ChangeKind = "added" | "removed" | "changed";

const KIND_META: Record<
  ChangeKind,
  { labelKey: string; icon: IconName; dot: string; label: string }
> = {
  added: {
    labelKey: "draft_changes_added",
    icon: "l-plus-circle",
    dot: "bg-green-500",
    label: "text-green-700",
  },
  removed: {
    labelKey: "draft_changes_removed",
    icon: "l-minus-circle",
    dot: "bg-red-500",
    label: "text-red-700",
  },
  changed: {
    labelKey: "draft_changes_updated",
    icon: "l-sync",
    dot: "bg-amber-500",
    label: "text-amber-700",
  },
};

function ChangeGroup({
  kind,
  records,
}: {
  kind: ChangeKind;
  records: RecordLike[];
}) {
  const { t } = useTranslation();
  if (!records.length) return null;
  const meta = KIND_META[kind];
  return (
    <div className="space-y-1.5">
      <div
        className={cn(
          "flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide",
          meta.label,
        )}
      >
        <CareIcon icon={meta.icon} className="size-3.5" />
        {t(meta.labelKey)}
      </div>
      <ul className="space-y-1">
        {records.map((record, i) => (
          <li
            key={(record.id as string) ?? i}
            className="flex items-center gap-2 text-sm text-gray-700"
          >
            <span
              className={cn("size-1.5 shrink-0 rounded-full", meta.dot)}
              aria-hidden
            />
            {recordLabel(record)}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DraftContextChangesScreen({
  changes,
  onContinue,
}: {
  changes: DraftContextChange[];
  onContinue: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-lg sm:p-8">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-100">
            <CareIcon
              icon="l-exclamation-triangle"
              className="size-6 text-amber-600"
            />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            {t("draft_data_changed_title")}
          </h2>
          <p className="text-sm text-gray-500">
            {t("draft_data_changed_description")}
          </p>
        </div>

        <div className="space-y-3">
          {changes.map((change) => (
            <div
              key={change.questionId}
              className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4"
            >
              <h3 className="text-sm font-semibold text-gray-900">
                {change.title}
              </h3>
              <ChangeGroup kind="added" records={change.added} />
              <ChangeGroup kind="removed" records={change.removed} />
              <ChangeGroup kind="changed" records={change.changed} />
            </div>
          ))}
        </div>

        <Button onClick={onContinue} className="w-full">
          {t("continue")}
        </Button>
      </div>
    </div>
  );
}
