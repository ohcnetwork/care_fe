import { AlertCircle } from "lucide-react";
import { useFormState, type Control } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { collectFormIssues, type FormIssue } from "./collectValueSetFormIssues";
import type { ValueSetFormData } from "./valueSetFormTypes";

interface ValueSetFormErrorsProps {
  control: Control<ValueSetFormData>;
  onFocusIssue: (issue: FormIssue) => void;
}

export function ValueSetFormErrors({
  control,
  onFocusIssue,
}: ValueSetFormErrorsProps) {
  const { t } = useTranslation();
  const { errors, submitCount } = useFormState({ control });
  const issues = collectFormIssues(errors);
  const issueLabel = (issue: FormIssue) => {
    const parts = issue.name.split(".");
    if (parts[0] !== "compose") return t(parts[0]);
    const rule = t(
      parts[1] === "include"
        ? "valueset_include_rule"
        : "valueset_exclude_rule",
      { number: Number(parts[2]) + 1 },
    );
    if (parts[3] === "concept" || parts[3] === "filter") {
      const location = t("valueset_issue_location", {
        rule,
        item: t(
          parts[3] === "concept"
            ? "valueset_concept_number"
            : "valueset_filter_number",
          { number: Number(parts[4]) + 1 },
        ),
      });
      const fieldLabel = t(
        parts[5] === "op"
          ? "operator"
          : parts[5] === "display"
            ? "display_name"
            : parts[5],
      );
      return `${location} · ${fieldLabel}`;
    }
    return rule;
  };
  return (
    <>
      {submitCount > 0 && issues.length > 0 && (
        <Alert variant="destructive" className="border-red-200">
          <AlertCircle />
          <AlertTitle>{t("valueset_fix_errors")}</AlertTitle>
          <AlertDescription>
            <ul className="space-y-1">
              {issues.map((issue) => (
                <li key={issue.name}>
                  <button
                    type="button"
                    className="cursor-pointer text-left underline underline-offset-2"
                    onClick={() => onFocusIssue(issue)}
                  >
                    {issueLabel(issue)}: {issue.message}
                  </button>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
