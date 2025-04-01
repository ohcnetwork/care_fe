import { t } from "i18next";
import { Building, Tags, X } from "lucide-react";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import Autocomplete from "@/components/ui/autocomplete";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { QuestionnaireDetail } from "@/types/questionnaire/questionnaire";
import {
  QuestionStatus,
  SubjectType,
} from "@/types/questionnaire/questionnaire";
import { QuestionnaireTagModel } from "@/types/questionnaire/tags";

import CloneQuestionnaireSheet from "./CloneQuestionnaireSheet";
import CreateQuestionnaireTagSheet from "./CreateQuestionnaireTagSheet";
import ManageQuestionnaireOrganizationsSheet from "./ManageQuestionnaireOrganizationsSheet";
import ManageQuestionnaireTagsSheet from "./ManageQuestionnaireTagsSheet";

interface Organization {
  id: string;
  name: string;
  description?: string;
}

interface OrganizationResponse {
  results: Organization[];
}

interface QuestionnairePropertiesProps {
  questionnaire: QuestionnaireDetail;
  updateQuestionnaireField: <K extends keyof QuestionnaireDetail>(
    field: K,
    value: QuestionnaireDetail[K],
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
  tags?: QuestionnaireTagModel[];
  tagSelection: {
    selectedTags: QuestionnaireTagModel[];
    onToggle: (tagId: string) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    available?: QuestionnaireTagModel[];
    isLoading?: boolean;
    onTagCreated?: (tag: QuestionnaireTagModel) => void;
  };
}

function StatusSelector({
  value,
  onChange,
}: {
  value: QuestionStatus;
  onChange: (value: QuestionStatus) => void;
}) {
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
              "flex items-center px-2 py-1 space-x-2",
              status === "active" && "rounded-l-md",
              status === "retired" && "rounded-r-md",
            )}
          >
            <RadioGroupItem value={status} id={`status-${status}`} />
            <Label
              htmlFor={`status-${status}`}
              className="text-sm font-normal text-gray-950"
            >
              {t(status)}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}

function SubjectTypeSelector({
  value,
  onChange,
}: {
  value: SubjectType;
  onChange: (value: SubjectType) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="subject_type">{t("subject_type")}</Label>
      <RadioGroup
        value={value}
        onValueChange={onChange}
        className="flex w-fit items-center gap-0 border border-gray-300 divide-x rounded-md bg-white [&>div:has([data-state=checked])]:bg-primary-200"
      >
        {[
          { value: "patient", label: "patient" },
          { value: "encounter", label: "encounter" },
        ].map((type) => (
          <div
            key={type.value}
            className={cn(
              "flex items-center px-2 py-1 space-x-2",
              type.value === "patient" && "rounded-l-md",
              type.value === "encounter" && "rounded-r-md",
            )}
          >
            <RadioGroupItem
              value={type.value}
              id={`subject-type-${type.value}`}
            />
            <Label
              htmlFor={`subject-type-${type.value}`}
              className="text-sm font-normal text-gray-950"
            >
              {t(type.label)}
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
              <Building className="mr-2 h-4 w-4" />
              {t("manage_organization_one")}
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
                className="h-4 w-4 p-0 hover:bg-transparent"
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
      <Autocomplete
        options={(selection.available?.results ?? []).map((org) => ({
          label: org.name,
          value: org.id,
          description: org.description,
        }))}
        value=""
        onChange={(value) => {
          selection.onToggle(value);
          if (selection.error) selection.setError(undefined);
        }}
        onSearch={selection.setSearchQuery}
        placeholder={t("select_organizations")}
        isLoading={selection.isLoading}
        noOptionsMessage={t("no_organizations_found")}
      />
    </div>
  );
}

function TagSelector({
  id,
  selection,
  questionnaire,
}: {
  id?: string;
  selection: QuestionnairePropertiesProps["tagSelection"];
  questionnaire: QuestionnaireDetail;
}) {
  if (id) {
    return (
      <>
        <div className="flex flex-wrap gap-2 mb-2">
          {questionnaire.tags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="flex items-center gap-1"
            >
              <Building className="h-3 w-3" />
              {tag.name}
            </Badge>
          ))}
          {questionnaire.tags.length === 0 && (
            <p className="text-sm text-gray-500">{t("no_tags_selected")}</p>
          )}
        </div>
        <ManageQuestionnaireTagsSheet
          questionnaire={questionnaire}
          trigger={
            <Button variant="outline" className="w-full justify-start">
              <Tags className="mr-2 h-4 w-4" />
              {t("manage_tags")}
            </Button>
          }
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {selection.selectedTags.length > 0 ? (
          selection.selectedTags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {tag.name}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => selection.onToggle(tag.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))
        ) : (
          <p className="text-sm text-gray-500">{t("no_tags_selected")}</p>
        )}
      </div>

      <Autocomplete
        options={(selection.available ?? []).map((tag) => ({
          label: tag.name,
          value: tag.id,
        }))}
        value=""
        onChange={selection.onToggle}
        onSearch={selection.setSearchQuery}
        placeholder={t("select_tags")}
        isLoading={selection.isLoading}
        noOptionsMessage={t("no_tags_found")}
      />

      {!id && (
        <CreateQuestionnaireTagSheet
          onTagCreated={(tag) => {
            selection.onTagCreated?.(tag);
          }}
          trigger={
            <Button variant="outline" className="w-full justify-start">
              <Tags className="mr-2 h-4 w-4" />
              {t("create_tag")}
            </Button>
          }
        />
      )}
    </div>
  );
}

export function QuestionnaireProperties({
  questionnaire,
  updateQuestionnaireField,
  id,
  organizations,
  organizationSelection,
  tagSelection,
}: QuestionnairePropertiesProps) {
  return (
    <Card className="border-none bg-transparent shadow-none space-y-4 mt-2 ml-2">
      <CardHeader className="p-0">
        <CardTitle>{t("properties")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-0">
        <StatusSelector
          value={questionnaire.status}
          onChange={(val) => updateQuestionnaireField("status", val)}
        />

        <SubjectTypeSelector
          value={questionnaire.subject_type}
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
        <div className="space-y-2">
          <Label>{t("tags")}</Label>
          <TagSelector
            id={id}
            selection={tagSelection}
            questionnaire={questionnaire}
          />
        </div>
        {id && (
          <CloneQuestionnaireSheet
            questionnaire={questionnaire}
            trigger={
              <Button variant="outline" className="w-full justify-start">
                <CareIcon icon="l-copy" className="mr-2 h-4 w-4" />
                {t("clone_questionnaire")}
              </Button>
            }
          />
        )}

        <div className="space-y-2">
          <Label htmlFor="version">{t("version")}</Label>
          <Input
            id="version"
            value={questionnaire.version || "0.0.1"}
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
