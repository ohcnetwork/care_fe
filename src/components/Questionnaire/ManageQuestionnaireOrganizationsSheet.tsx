import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building, Check, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

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
import questionnaireApi from "@/types/questionnaire/questionnaireApi";

interface Props {
  questionnaireId: string;
  trigger?: React.ReactNode;
}

interface OrgSelectorPopoverProps {
  title?: string;
  selected: string[];
  onToggle: (orgId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading?: boolean;
  organizations?: {
    results: Array<{
      id: string;
      name: string;
      description?: string;
    }>;
  };
  className?: string;
  triggerClassName?: string;
}

export function OrgSelectorPopover({
  title,
  selected,
  onToggle,
  searchQuery,
  onSearchChange,
  isLoading,
  organizations,
  className,
  triggerClassName,
}: OrgSelectorPopoverProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Popover
      modal={true}
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onSearchChange("");
        }
        setOpen(isOpen);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          data-cy="manage-organisation-search"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            triggerClassName,
          )}
        >
          <Building className="mr-2 size-4" />
          <span>{title || t("search_organizations")}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("p-0 w-[var(--radix-popover-trigger-width)]", className)}
        align="start"
      >
        <Command className="rounded-lg" filter={() => 1}>
          <CommandInput
            placeholder={t("search_organizations")}
            value={searchQuery}
            onValueChange={onSearchChange}
            className="outline-hidden border-none ring-0 shadow-none"
          />
          <CommandList>
            <CommandEmpty>{t("no_organizations_found")}</CommandEmpty>
            <CommandGroup>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="size-6 animate-spin" />
                </div>
              ) : (
                organizations?.results.map((org) => (
                  <CommandItem
                    key={org.id}
                    value={org.id}
                    onSelect={() => onToggle(org.id)}
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
                    {selected.includes(org.id) && <Check className="size-4" />}
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
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
            <Building className="mr-2 size-4" />
            {t("manage_organization", { count: 0 })}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t("manage_organization", { count: 0 })}</SheetTitle>
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
                    className="size-4 p-0 hover:bg-transparent"
                    onClick={() => handleToggleOrganization(org.id)}
                    disabled={isUpdating}
                  >
                    <X className="size-3" />
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
            <OrgSelectorPopover
              selected={selectedIds}
              onToggle={handleToggleOrganization}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              isLoading={isLoadingOrganizations}
              organizations={availableOrganizations}
            />
          </div>
        </div>

        <SheetFooter className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex w-full justify-end gap-4">
            <Button
              type="button"
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
            <Button
              onClick={handleSave}
              disabled={isUpdating || !hasChanges}
              data-cy="save-manage-organization"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
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
