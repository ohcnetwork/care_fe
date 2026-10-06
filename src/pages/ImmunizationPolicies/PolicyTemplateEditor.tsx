import { Copy, Layers2, Plus, Syringe, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ImmunizationPolicyTemplate } from "@/types/emr/immunizationPolicy/immunizationPolicy";

import { PolicyCodePicker } from "./PolicyCodePicker";
import { PolicyTemplateDetails } from "./PolicyTemplateDetails";
import { RecommendationOutline } from "./RecommendationOutline";
import { newPolicyTemplate } from "./policySchema";

interface PolicyTemplateEditorProps {
  value: ImmunizationPolicyTemplate;
  onChange: (value: ImmunizationPolicyTemplate) => void;
  disabled: boolean;
  issues: readonly { path: PropertyKey[]; message: string }[];
  title: string;
}

function nodeAtPath(
  root: ImmunizationPolicyTemplate,
  path: number[],
): ImmunizationPolicyTemplate {
  return path.reduce((node, index) => node.children[index], root);
}

function updateAtPath(
  root: ImmunizationPolicyTemplate,
  path: number[],
  update: (node: ImmunizationPolicyTemplate) => ImmunizationPolicyTemplate,
): ImmunizationPolicyTemplate {
  if (!path.length) return update(root);
  const [index, ...rest] = path;
  return {
    ...root,
    children: root.children.map((child, childIndex) =>
      childIndex === index ? updateAtPath(child, rest, update) : child,
    ),
  };
}

function copyTemplate(
  template: ImmunizationPolicyTemplate,
): ImmunizationPolicyTemplate {
  const copy = structuredClone(template);
  const clearIds = (node: ImmunizationPolicyTemplate) => {
    delete node.id;
    node.children.forEach(clearIds);
  };
  clearIds(copy);
  return copy;
}

const DOSE_FIELDS = [
  ["series", "immunization_series"],
  ["dose_number", "immunization_dose_number"],
  ["series_number", "immunization_series_number"],
] as const;

const OFFSET_FIELDS = [
  ["earliest_date", "immunization_earliest", "immunization_earliest_offset"],
  ["due_date", "immunization_due", "immunization_due_offset"],
  ["overdue_date", "immunization_overdue", "immunization_overdue_offset"],
] as const;

export function PolicyTemplateEditor({
  value,
  onChange,
  disabled,
  issues,
  title,
}: PolicyTemplateEditorProps) {
  const { t } = useTranslation();
  const id = useId();
  const [selectedPath, setSelectedPath] = useState<number[]>([]);
  const node = nodeAtPath(value, selectedPath);
  const selectedTitle =
    selectedPath.length === 0
      ? title
      : t(
          node.is_group
            ? "immunization_group_number"
            : "immunization_recommendation_number",
          { number: selectedPath.at(-1)! + 1 },
        );
  const issuePath: PropertyKey[] = [
    "policy_template",
    ...selectedPath.flatMap((index) => ["children", index]),
  ];
  const fieldError = (field: string) =>
    issues.find(
      (issue) =>
        issue.path.length === issuePath.length + 1 &&
        issuePath.every((part, index) => issue.path[index] === part) &&
        issue.path.at(-1) === field,
    )?.message;
  const changeNode = (next: ImmunizationPolicyTemplate) =>
    onChange(updateAtPath(value, selectedPath, () => next));
  const Icon = node.is_group ? Layers2 : Syringe;

  const addChild = (isGroup: boolean) => {
    const path = [...selectedPath, node.children.length];
    changeNode({
      ...node,
      children: [...node.children, newPolicyTemplate(isGroup)],
    });
    setSelectedPath(path);
  };

  const duplicateNode = () => {
    const parentPath = selectedPath.slice(0, -1);
    const duplicateIndex = selectedPath.at(-1)! + 1;
    onChange(
      updateAtPath(value, parentPath, (parent) => ({
        ...parent,
        children: [
          ...parent.children.slice(0, duplicateIndex),
          copyTemplate(node),
          ...parent.children.slice(duplicateIndex),
        ],
      })),
    );
    setSelectedPath([...parentPath, duplicateIndex]);
  };

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
      <RecommendationOutline
        value={value}
        selectedPath={selectedPath}
        onSelect={setSelectedPath}
        issues={issues}
      />
      <fieldset
        disabled={disabled}
        className="min-w-0 rounded-lg border border-gray-200 bg-white"
        aria-label={selectedTitle}
      >
        <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
          <div className="flex min-w-0 items-start gap-3">
            <span className="rounded-md bg-primary-50 p-2 text-primary-700">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-gray-950">
                {selectedTitle}
              </h2>
              <p className="mt-0.5 text-xs leading-5 text-gray-500">
                {t(
                  node.is_group
                    ? "immunization_group_editor_hint"
                    : "immunization_recommendation_editor_hint",
                )}
              </p>
            </div>
          </div>
          {selectedPath.length > 0 && !disabled && (
            <div className="flex shrink-0 items-center gap-1 self-end sm:self-auto">
              <Button
                type="button"
                size="sm"
                variant="outline"
                aria-label={t("immunization_duplicate_node", {
                  name: selectedTitle,
                })}
                onClick={duplicateNode}
              >
                <Copy className="size-4" aria-hidden="true" />
                {t("duplicate")}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={t("immunization_remove_node", {
                      name: selectedTitle,
                    })}
                  >
                    <Trash2
                      className="size-4 text-gray-500"
                      aria-hidden="true"
                    />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t("immunization_remove_node", { name: selectedTitle })}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("immunization_remove_node_confirm")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        const parentPath = selectedPath.slice(0, -1);
                        const removeIndex = selectedPath.at(-1);
                        onChange(
                          updateAtPath(value, parentPath, (parent) => ({
                            ...parent,
                            children: parent.children.filter(
                              (_, index) => index !== removeIndex,
                            ),
                          })),
                        );
                        setSelectedPath(parentPath);
                      }}
                    >
                      {t("remove")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>

        <div className="space-y-5 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Label htmlFor={`${id}-type`} className="text-gray-600">
              {t("type")}
            </Label>
            <Select
              value={node.is_group ? "group" : "recommendation"}
              disabled={disabled}
              onValueChange={(type) =>
                changeNode({ ...node, is_group: type === "group" })
              }
            >
              <SelectTrigger id={`${id}-type`} className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  value="recommendation"
                  disabled={node.children.length > 0}
                >
                  {t("immunization_recommendation")}
                </SelectItem>
                <SelectItem value="group">{t("group")}</SelectItem>
              </SelectContent>
            </Select>
            {node.children.length > 0 && (
              <p className="w-full text-xs text-gray-500">
                {t("immunization_group_type_hint")}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <PolicyCodePicker
              codes={node.codes}
              onChange={(codes) => changeNode({ ...node, codes })}
              kind="vaccine"
              required={!node.is_group}
              disabled={disabled}
              error={fieldError("codes")}
            />
            <PolicyCodePicker
              codes={node.diseases ?? []}
              onChange={(diseases) => changeNode({ ...node, diseases })}
              kind="disease"
              disabled={disabled}
            />
          </div>

          <section
            className="space-y-3 border-t border-gray-100 pt-5"
            aria-labelledby={`${id}-dose-heading`}
          >
            <h3
              id={`${id}-dose-heading`}
              className="text-sm font-semibold text-gray-900"
            >
              {t("immunization_dose_details")}
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-[2fr_1fr_1fr]">
              {DOSE_FIELDS.map(([field, label]) => (
                <div
                  key={field}
                  className={cn(
                    "min-w-0 space-y-1.5",
                    field === "series" && "col-span-2 sm:col-span-1",
                  )}
                >
                  <Label htmlFor={`${id}-${field}`}>{t(label)}</Label>
                  <Input
                    id={`${id}-${field}`}
                    value={node[field] ?? ""}
                    onChange={(event) =>
                      changeNode({ ...node, [field]: event.target.value })
                    }
                  />
                </div>
              ))}
            </div>
          </section>

          <section
            className="space-y-3 border-t border-gray-100 pt-5"
            aria-labelledby={`${id}-schedule-heading`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <h3
                id={`${id}-schedule-heading`}
                className="text-sm font-semibold text-gray-900"
              >
                {t("immunization_timing")}
              </h3>
              <span className="text-xs text-gray-500">
                {t("immunization_day_offsets")}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {OFFSET_FIELDS.map(([field, label, accessibleLabel]) => {
                const error = fieldError(field);
                return (
                  <div key={field} className="min-w-0 space-y-1.5">
                    <Label
                      htmlFor={`${id}-${field}`}
                      className="text-xs text-gray-600"
                    >
                      {t(label)}
                    </Label>
                    <Input
                      id={`${id}-${field}`}
                      aria-label={t(accessibleLabel)}
                      type="number"
                      step={1}
                      value={node[field] ?? ""}
                      onChange={(event) =>
                        changeNode({
                          ...node,
                          [field]:
                            event.target.value === ""
                              ? undefined
                              : Number(event.target.value),
                        })
                      }
                      aria-invalid={!!error}
                      aria-describedby={`${id}-offset-help${error ? ` ${id}-${field}-error` : ""}`}
                    />
                    {error && (
                      <p
                        id={`${id}-${field}-error`}
                        className="text-xs text-red-600"
                        role="alert"
                      >
                        {error}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            <p
              className="text-xs leading-5 text-gray-500"
              id={`${id}-offset-help`}
            >
              {t("immunization_timing_hint")}
            </p>
          </section>

          <PolicyTemplateDetails
            key={selectedPath.join(".")}
            id={id}
            node={node}
            onChange={changeNode}
          />
        </div>

        {node.is_group && !disabled && (
          <div className="flex flex-wrap gap-2 border-t border-gray-200 bg-gray-50/70 px-4 py-3 sm:px-5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addChild(false)}
            >
              <Plus className="size-4" aria-hidden="true" />
              {t("immunization_add_recommendation")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => addChild(true)}
            >
              <Layers2 className="size-4" aria-hidden="true" />
              {t("immunization_add_group")}
            </Button>
          </div>
        )}
      </fieldset>
    </div>
  );
}
