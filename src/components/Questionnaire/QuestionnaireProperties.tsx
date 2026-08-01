import { Building, X } from "lucide-react";
import { UseFormReturn, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import {
  QuestionnaireRead,
  QuestionStatus,
  SubjectType,
} from "@/types/questionnaire/questionnaire";

import CloneQuestionnaireSheet from "./CloneQuestionnaireSheet";
import ManageQuestionnaireOrganizationsSheet, {
  OrgSelector,
} from "./ManageQuestionnaireOrganizationsSheet";

interface Organization {
  id: string;
  name: string;
  description?: string;
}

interface OrganizationResponse {
  results: Organization[];
}

interface QuestionnairePropertiesProps {
  form: UseFormReturn<QuestionnaireRead>;
  updateQuestionnaireField: <K extends keyof QuestionnaireRead>(
    field: K,
    value: QuestionnaireRead[K],
  ) => void;
  id?: string;
  organizations?: OrganizationResponse;
  organizationSelection: {
    selectedOrgs: Organization[];
    onToggle: (orgId: string) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    available?: OrganizationResponse;
    isLoading?: boolean;
    error: string | undefined;
    setError: (error?: string) => void;
  };
}

function StatusSelector({
  value,
  onChange,
}: {
  value: QuestionStatus;
  onChange: (value: QuestionStatus) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2 w-fit">
      <Label htmlFor="status">{t("status")}</Label>
      <RadioGroup
        value={value}
        onValueChange={onChange}
        className="flex items-center gap-0 border border-gray-300 divide-x rounded-md bg-white [&>div:has([data-state=checked])]:text-primary-500 [&>div:has([data-state=checked])]:bg-primary-200"
      >
        {["active", "draft", "retired"].map((status) => (
          <div
            key={status}
            className={cn(
              "flex items-center px-2 py-1",
              status === "active" && "rounded-l-md",
              status === "retired" && "rounded-r-md",
            )}
          >
            <RadioGroupItem value={status} id={`status-${status}`} />
            <Label
              htmlFor={`status-${status}`}
              className="text-sm mx-1 font-normal text-gray-950"
            >
              {t(status)}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}

const SUBJECT_TYPES: SubjectType[] = ["patient", "encounter"];

function SubjectTypeSelector({
  value,
  onChange,
}: {
  value: SubjectType;
  onChange: (value: SubjectType) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <Label htmlFor="subject_type">{t("subject_type")}</Label>
      <RadioGroup
        value={value}
        onValueChange={onChange}
        className="flex w-fit items-center gap-0 border border-gray-300 divide-x rounded-md bg-white [&>div:has([data-state=checked])]:bg-primary-200"
      >
        {SUBJECT_TYPES.map((subjectType) => (
          <div
            key={subjectType}
            className={cn(
              "flex items-center px-2 py-1",
              subjectType === "patient" && "rounded-l-md",
              subjectType === "encounter" && "rounded-r-md",
            )}
          >
            <RadioGroupItem
              value={subjectType}
              id={`subject-type-${subjectType}`}
            />
            <Label
              htmlFor={`subject-type-${subjectType}`}
              className="text-sm mx-1 font-normal text-gray-950"
            >
              {t(subjectType)}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}

function OrganizationSelector({
  id,
  organizations,
  selection,
}: {
  id?: string;
  organizations?: OrganizationResponse;
  selection: QuestionnairePropertiesProps["organizationSelection"];
}) {
  const { t } = useTranslation();

  if (id) {
    return (
      <>
        <div className="flex flex-wrap gap-2 mb-2">
          {organizations?.results.map((org) => (
            <Badge
              key={org.id}
              variant="secondary"
              className="flex items-center gap-1"
            >
              <Building className="h-3 w-3" />
              {org.name}
            </Badge>
          ))}
          {(!organizations?.results || organizations.results.length === 0) && (
            <p className="text-sm text-red-500">{selection.error}</p>
          )}
        </div>
        <ManageQuestionnaireOrganizationsSheet
          questionnaireId={id}
          trigger={
            <Button variant="outline" className="w-full justify-start">
              <Building className="mr-2 size-4" />
              {t("manage_organization_other")}
            </Button>
          }
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {selection.selectedOrgs.length > 0 ? (
          selection.selectedOrgs.map((org) => (
            <Badge
              key={org.id}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {org.name}
              <Button
                variant="ghost"
                size="icon"
                className="size-4 p-0 hover:bg-transparent"
                onClick={() => selection.onToggle(org.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))
        ) : (
          <p className="text-sm text-gray-500">
            {t("no_organizations_selected")}
          </p>
        )}
      </div>
      {selection.error && (
        <p className="text-sm text-red-500">{selection.error}</p>
      )}
      <OrgSelector
        title={t("select_organizations")}
        selected={selection.selectedOrgs.map((org) => org.id)}
        onToggle={(value) => {
          selection.onToggle(value);
          if (selection.error) selection.setError(undefined);
        }}
        searchQuery={selection.searchQuery}
        onSearchChange={selection.setSearchQuery}
        isLoading={selection.isLoading}
        organizations={selection.available}
      />
    </div>
  );
}

export function QuestionnaireProperties({
  form,
  updateQuestionnaireField,
  id,
  organizations,
  organizationSelection,
}: QuestionnairePropertiesProps) {
  const { t } = useTranslation();
  const status = useWatch({ control: form.control, name: "status" });
  const subjectType = useWatch({ control: form.control, name: "subject_type" });

  return (
    <Card className="border-none bg-transparent shadow-none space-y-4 mt-2 ml-2">
      <CardHeader className="p-0">
        <CardTitle>{t("properties")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-0">
        <StatusSelector
          value={status}
          onChange={(val) => updateQuestionnaireField("status", val)}
        />

        <SubjectTypeSelector
          value={subjectType}
          onChange={(val) => updateQuestionnaireField("subject_type", val)}
        />

        <div className="space-y-2">
          <Label>
            {t("organizations")} <span className="text-red-500">*</span>
          </Label>
          <OrganizationSelector
            id={id}
            organizations={organizations}
            selection={organizationSelection}
          />
        </div>
        {id && (
          <CloneQuestionnaireSheet
            form={form}
            trigger={
              <Button variant="outline" className="w-full justify-start">
                <CareIcon icon="l-copy" className="mr-2 size-4" />
                {t("clone_questionnaire")}
              </Button>
            }
          />
        )}

        <div className="space-y-2">
          <Label htmlFor="version">{t("version")}</Label>
          <Input
            id="version"
            value={form.getValues("version") || "0.0.1"}
            disabled={true}
            onChange={(e) =>
              updateQuestionnaireField("version", e.target.value)
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
