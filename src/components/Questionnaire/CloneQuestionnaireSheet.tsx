import { useMutation, useQuery } from "@tanstack/react-query";
import { Building, Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import { useNavigate } from "raviger";
import { useState } from "react";
import { UseFormReturn, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import organizationApi from "@/types/organization/organizationApi";
import type { QuestionnaireDetail } from "@/types/questionnaire/questionnaire";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";

interface Props {
  form: UseFormReturn<QuestionnaireDetail>;
  trigger?: React.ReactNode;
}

export default function CloneQuestionnaireSheet({ form, trigger }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const slug = useWatch({ control: form.control, name: "slug" });
  const tags = useWatch({ control: form.control, name: "tags" });
  const [newSlug, setNewSlug] = useState(slug + "-copy");
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: availableOrganizations, isLoading: isLoadingOrganizations } =
    useQuery({
      queryKey: ["organizations", searchQuery],
      queryFn: query(organizationApi.list, {
        queryParams: {
          org_type: "role",
          name: searchQuery || undefined,
        },
      }),
      enabled: open,
    });

  const { mutate: cloneQuestionnaire, isPending: isCloning } = useMutation({
    mutationFn: mutate(questionnaireApi.create, {
      silent: true,
    }),
    onSuccess: async (data: QuestionnaireDetail) => {
      navigate(`/admin/questionnaire/${data.slug}/edit`);
      setOpen(false);
    },
    onError: (error) => {
      const errorData = error.cause as { errors: { msg: string }[] };
      errorData.errors.forEach((er) => {
        toast.error(er.msg);
      });
    },
  });

  const handleClone = () => {
    if (!newSlug.trim()) {
      setError("Slug is required");
      return;
    }

    const clonedQuestionnaire = {
      ...form.getValues(),
      slug: newSlug.trim(),
      id: undefined,
      status: "draft" as const,
      title: `${form.getValues("title")} (Clone)`,
      organizations: selectedIds,
      tags: tags.map((tag) => tag.id),
    };

    cloneQuestionnaire(clonedQuestionnaire);
  };

  const handleToggleOrganization = (orgId: string) => {
    setSelectedIds((current) =>
      current.includes(orgId)
        ? current.filter((id) => id !== orgId)
        : [...current, orgId],
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t("clone_questionnaire")}</SheetTitle>
          <SheetDescription>
            {t("clone_questionnaire_description")}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Slug Input */}
          <div className="space-y-2">
            <Label htmlFor="slug">{t("slug")}</Label>
            <Input
              id="slug"
              value={newSlug}
              onChange={(e) => {
                setNewSlug(e.target.value);
                setError(null);
              }}
              placeholder={t("slug_input_placeholder")}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          {/* Selected Organizations */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">
              {t("selected_organizations")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedIds.length > 0 ? (
                availableOrganizations?.results
                  .filter((org) => selectedIds.includes(org.id))
                  .map((org) => (
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
                        onClick={() => handleToggleOrganization(org.id)}
                      >
                        <X className="size-3" />
                      </Button>
                    </Badge>
                  ))
              ) : (
                <p className="text-sm text-gray-500">
                  {t("no_organizations_selected")}
                </p>
              )}
            </div>
          </div>

          {/* Organization Selector */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">{t("add_organizations")}</h3>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  <span className="truncate">{t("select_organizations")}</span>
                  <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="p-0 w-[var(--radix-popover-trigger-width)]"
                align="start"
              >
                <Command>
                  <CommandInput
                    placeholder={t("search_organizations")}
                    onValueChange={setSearchQuery}
                    className="focus:ring-0 focus:outline-hidden border-none"
                  />
                  <CommandList>
                    <CommandEmpty>{t("no_organizations_found")}</CommandEmpty>
                    <CommandGroup>
                      {isLoadingOrganizations ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="h-6 w-4 animate-spin" />
                        </div>
                      ) : (
                        availableOrganizations?.results.map((org) => (
                          <CommandItem
                            key={org.id}
                            value={org.name}
                            onSelect={() => handleToggleOrganization(org.id)}
                            className="flex items-center justify-between pr-2"
                          >
                            <div className="flex flex-1 items-center gap-2">
                              <Building className="size-4" />
                              <span>{org.name}</span>
                              {org.description && (
                                <span className="text-xs text-gray-500">
                                  - {org.description}
                                </span>
                              )}
                            </div>
                            {selectedIds.includes(org.id) && (
                              <Check className="size-4" />
                            )}
                          </CommandItem>
                        ))
                      )}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <SheetFooter className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex w-full justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setNewSlug(slug + "-copy");
                setSelectedIds([]);
                setError(null);
                setOpen(false);
              }}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleClone}
              disabled={
                isCloning || !newSlug.trim() || selectedIds.length === 0
              }
            >
              {isCloning ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t("cloning")}...
                </>
              ) : (
                t("clone")
              )}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
