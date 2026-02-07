import {
  FileTextIcon,
  Loader2,
  PillIcon,
  PlusIcon,
  Search,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import FacilityOrganizationSelector from "@/pages/Facility/settings/organizations/components/FacilityOrganizationSelector";
import { QuestionnaireResponseTemplateReadSpec } from "@/types/questionnaire/questionnaireResponseTemplate";

import { cn } from "@/lib/utils";

interface AddToTemplateDialogProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: T | null;
  itemDisplayName: (item: T) => string;
  itemType: "medication" | "service_request";
  isCreatingNewTemplate: boolean;
  setIsCreatingNewTemplate: (value: boolean) => void;
  newTemplateName: string;
  setNewTemplateName: (value: string) => void;
  templateSearchQuery: string;
  setTemplateSearchQuery: (value: string) => void;
  templatesData?: { results?: QuestionnaireResponseTemplateReadSpec[] };
  isLoadingTemplates: boolean;
  onCreateNewTemplate: () => void;
  onSelectTemplate: (template: QuestionnaireResponseTemplateReadSpec) => void;
  isCreating: boolean;
  isAdding: boolean;
  facilityId?: string;
  selectedOrganizations?: string[] | null;
  onSelectedOrganizationsChange?: (value: string[] | null) => void;
}

export function AddToTemplateDialog<T>({
  open,
  onOpenChange,
  item,
  itemDisplayName,
  itemType,
  isCreatingNewTemplate,
  setIsCreatingNewTemplate,
  newTemplateName,
  setNewTemplateName,
  templateSearchQuery,
  setTemplateSearchQuery,
  templatesData,
  isLoadingTemplates,
  onCreateNewTemplate,
  onSelectTemplate,
  isCreating,
  isAdding,
  facilityId,
  selectedOrganizations,
  onSelectedOrganizationsChange,
}: AddToTemplateDialogProps<T>) {
  const { t } = useTranslation();

  const isMedication = itemType === "medication";
  const Icon = isMedication ? PillIcon : FileTextIcon;
  const countKey = isMedication ? "medication_request" : "activity_definition";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div
              className={cn(
                "rounded-lg p-1.5",
                isMedication ? "bg-blue-100" : "bg-purple-100",
              )}
            >
              <Icon
                className={cn(
                  "size-4",
                  isMedication ? "text-blue-600" : "text-purple-600",
                )}
              />
            </div>
            {isCreatingNewTemplate
              ? t("create_new_template")
              : t("add_to_template")}
          </DialogTitle>
          <DialogDescription>
            {isCreatingNewTemplate
              ? t("create_template_with_item")
              : t("select_or_create_template")}
          </DialogDescription>
        </DialogHeader>

        {/* Item preview */}
        {item && (
          <div
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border",
              isMedication
                ? "bg-blue-50 border-blue-200"
                : "bg-purple-50 border-purple-200",
            )}
          >
            <div
              className={cn(
                "rounded-full p-2 shrink-0",
                isMedication ? "bg-blue-100" : "bg-purple-100",
              )}
            >
              <Icon
                className={cn(
                  "size-4",
                  isMedication ? "text-blue-600" : "text-purple-600",
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "font-medium",
                  isMedication ? "text-blue-900" : "text-purple-900",
                )}
              >
                {itemDisplayName(item)}
              </p>
              <p
                className={cn(
                  "text-xs",
                  isMedication ? "text-blue-600" : "text-purple-600",
                )}
              >
                {isCreatingNewTemplate
                  ? t("will_be_added_to_new_template")
                  : t("will_be_added_to_selected_template")}
              </p>
            </div>
          </div>
        )}

        {isCreatingNewTemplate ? (
          /* Create New Template Form */
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-template-name">{t("template_name")}</Label>
              <Input
                id="new-template-name"
                placeholder={t("enter_template_name_placeholder")}
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    newTemplateName.trim() &&
                    !isCreating
                  ) {
                    onCreateNewTemplate();
                  }
                }}
              />
            </div>
            {facilityId && onSelectedOrganizationsChange && (
              <div className="space-y-2">
                <FacilityOrganizationSelector
                  key="new"
                  facilityId={facilityId}
                  value={selectedOrganizations}
                  onChange={onSelectedOrganizationsChange}
                  optional
                />
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsCreatingNewTemplate(false);
                  setNewTemplateName("");
                }}
                disabled={isCreating}
              >
                {t("back")}
              </Button>
              <Button
                className="flex-1"
                onClick={onCreateNewTemplate}
                disabled={!newTemplateName.trim() || isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    {t("creating")}
                  </>
                ) : (
                  <>
                    <PlusIcon className="size-4 mr-2" />
                    {t("create_template")}
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* Template Selection */
          <div className="space-y-3">
            {/* Create New Template Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center gap-3 p-3 h-auto rounded-lg border-2 border-dashed border-primary-300 bg-primary-50/30 hover:bg-primary-50 transition-colors text-left justify-start"
              onClick={() => setIsCreatingNewTemplate(true)}
            >
              <div className="rounded-lg bg-primary-100 p-2">
                <PlusIcon className="size-4 text-primary-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-primary-900">
                  {t("create_new_template")}
                </p>
                <p className="text-xs text-primary-600">
                  {t("start_new_template_with_item")}
                </p>
              </div>
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-gray-500">
                  {t("or_add_to_existing")}
                </span>
              </div>
            </div>

            {/* Search and Template List */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                placeholder={t("search_templates")}
                value={templateSearchQuery}
                onChange={(e) => setTemplateSearchQuery(e.target.value)}
                className="h-9 text-sm pl-9 pr-9"
              />
              {templateSearchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 size-7"
                  onClick={() => setTemplateSearchQuery("")}
                >
                  <X className="size-4" />
                  <span className="sr-only">{t("clear_search")}</span>
                </Button>
              )}
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2 -mx-1 px-1">
              {isLoadingTemplates ? (
                <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                  <Loader2 className="size-5 animate-spin mb-2" />
                  <span className="text-sm">{t("loading_templates")}</span>
                </div>
              ) : templatesData?.results?.length === 0 ? (
                <div className="text-center py-6 px-4">
                  <p className="text-sm text-gray-500">
                    {templateSearchQuery
                      ? t("no_templates_match_search")
                      : t("no_existing_templates")}
                  </p>
                </div>
              ) : (
                // Sort templates by item count
                [...(templatesData?.results || [])]
                  .sort((a, b) => {
                    const aCount = a.template_data?.[countKey]?.length ?? 0;
                    const bCount = b.template_data?.[countKey]?.length ?? 0;
                    if (aCount > 0 && bCount === 0) return -1;
                    if (bCount > 0 && aCount === 0) return 1;
                    return bCount - aCount;
                  })
                  .map((template) => {
                    const itemCount =
                      template.template_data?.[countKey]?.length ?? 0;
                    const otherCountKey = isMedication
                      ? "activity_definition"
                      : "medication_request";
                    const otherCount =
                      template.template_data?.[otherCountKey]?.length ?? 0;
                    const hasItems = itemCount > 0;

                    return (
                      <Button
                        key={template.id}
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full flex items-center gap-3 p-3 h-auto rounded-lg border transition-all text-left justify-start",
                          isAdding
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:border-primary-300 hover:bg-primary-50/50 cursor-pointer",
                          hasItems
                            ? isMedication
                              ? "border-blue-200 bg-blue-50/30"
                              : "border-purple-200 bg-purple-50/30"
                            : "border-gray-200 bg-white",
                        )}
                        onClick={() => onSelectTemplate(template)}
                        disabled={isAdding}
                      >
                        <div
                          className={cn(
                            "rounded-lg p-2",
                            hasItems
                              ? isMedication
                                ? "bg-blue-100"
                                : "bg-purple-100"
                              : "bg-gray-100",
                          )}
                        >
                          {hasItems ? (
                            <Icon
                              className={cn(
                                "size-4",
                                isMedication
                                  ? "text-blue-600"
                                  : "text-purple-600",
                              )}
                            />
                          ) : (
                            <FileTextIcon className="size-4 text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {template.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {itemCount > 0 && (
                              <span
                                className={cn(
                                  isMedication
                                    ? "text-blue-600"
                                    : "text-purple-600",
                                )}
                              >
                                {isMedication
                                  ? t("medications_count", {
                                      count: itemCount,
                                    })
                                  : t("service_requests_count", {
                                      count: itemCount,
                                    })}
                              </span>
                            )}
                            {itemCount > 0 && otherCount > 0 && <span>•</span>}
                            {otherCount > 0 && (
                              <span>
                                {isMedication
                                  ? t("service_requests_count", {
                                      count: otherCount,
                                    })
                                  : t("medications_count", {
                                      count: otherCount,
                                    })}
                              </span>
                            )}
                            {itemCount === 0 && otherCount === 0 && (
                              <span className="italic">
                                {t("empty_template")}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-primary-600">
                          <PlusIcon className="size-5" />
                        </div>
                      </Button>
                    );
                  })
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
