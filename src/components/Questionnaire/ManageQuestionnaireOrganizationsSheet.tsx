import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building, Check, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
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
import questionnaireApi from "@/types/questionnaire/questionnaireApi";

interface Props {
  questionnaireId: string;
  trigger?: React.ReactNode;
}

export default function ManageQuestionnaireOrganizationsSheet({
  questionnaireId,
  trigger,
}: Props) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: organizations, isLoading } = useQuery({
    queryKey: ["questionnaire", questionnaireId, "organizations"],
    queryFn: query(questionnaireApi.getOrganizations, {
      pathParams: { id: questionnaireId },
    }),
    enabled: open,
  });

  const { data: availableOrganizations, isLoading: isLoadingOrganizations } =
    useQuery({
      queryKey: ["organizations", searchQuery],
      queryFn: query.debounced(organizationApi.list, {
        queryParams: {
          org_type: "role",
          name: searchQuery || undefined,
        },
      }),
      enabled: open,
    });

  const { mutate: setOrganizations, isPending: isUpdating } = useMutation({
    mutationFn: mutate(questionnaireApi.setOrganizations, {
      pathParams: { id: questionnaireId },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["questionnaire", questionnaireId, "organizations"],
      });
      toast.success("Organizations updated successfully");
      setOpen(false);
    },
  });

  // Initialize selected IDs when organizations are loaded
  useEffect(() => {
    if (organizations?.results) {
      setSelectedIds(organizations.results.map((org) => org.id));
    }
  }, [organizations?.results]);

  const handleToggleOrganization = (orgId: string) => {
    setSelectedIds((current) =>
      current.includes(orgId)
        ? current.filter((id) => id !== orgId)
        : [...current, orgId],
    );
  };

  const handleSave = () => {
    setOrganizations({ organizations: selectedIds });
  };

  const selectedOrganizations = organizations?.results.filter((org) =>
    selectedIds.includes(org.id),
  );

  const hasChanges = !organizations?.results
    ? false
    : new Set(organizations.results.map((org) => org.id)).size !==
        new Set(selectedIds).size ||
      !organizations.results.every((org) => selectedIds.includes(org.id));

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Building className="mr-2 h-4 w-4" />
            {t("manage_organization_one")}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t("manage_organization_other")}</SheetTitle>
          <SheetDescription>
            {t("manage_organizations_description")}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Selected Organizations */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">
              {t("selected_organizations")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedOrganizations?.map((org) => (
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
                    onClick={() => handleToggleOrganization(org.id)}
                    disabled={isUpdating}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
              {!isLoading &&
                (!selectedOrganizations ||
                  selectedOrganizations.length === 0) && (
                  <p className="text-sm text-gray-500">
                    {t("no_organizations_selected")}
                  </p>
                )}
            </div>
          </div>

          {/* Organization Selector */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">
              {t("add_organization", { count: 0 })}
            </h3>
            <Command className="rounded-lg border shadow-md">
              <CommandInput
                placeholder="Search organizations..."
                onValueChange={setSearchQuery}
              />
              <CommandList>
                <CommandEmpty>{t("no_organizations_found")}</CommandEmpty>
                <CommandGroup>
                  {isLoadingOrganizations ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    availableOrganizations?.results.map((org) => (
                      <CommandItem
                        key={org.id}
                        value={org.id}
                        onSelect={() => handleToggleOrganization(org.id)}
                      >
                        <div className="flex flex-1 items-center gap-2">
                          <Building className="h-4 w-4" />
                          <span>{org.name}</span>
                          {org.description && (
                            <span className="text-xs text-gray-500">
                              - {org.description}
                            </span>
                          )}
                        </div>
                        {selectedIds.includes(org.id) && (
                          <Check className="h-4 w-4" />
                        )}
                      </CommandItem>
                    ))
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
        </div>

        <SheetFooter className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className="flex w-full justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => {
                if (organizations?.results) {
                  setSelectedIds(organizations.results.map((org) => org.id));
                }
                setOpen(false);
              }}
            >
              {t("cancel")}
            </Button>
            <Button onClick={handleSave} disabled={isUpdating || !hasChanges}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("saving")}
                </>
              ) : (
                t("save")
              )}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
