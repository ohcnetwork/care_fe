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
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
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
import useBreakpoints from "@/hooks/useBreakpoints";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { Organization } from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";

interface Props {
  questionnaireId: string;
  trigger?: React.ReactNode;
}

interface OrgSelectorProps {
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

export function OrgSelector({
  title,
  selected,
  onToggle,
  searchQuery,
  onSearchChange,
  isLoading,
  organizations,
  className,
  triggerClassName,
}: OrgSelectorProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const isMobile = useBreakpoints({ default: true, sm: false });

  const triggerButton = (
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
  );

  const content = (
    <Command className="rounded-lg" filter={() => 1}>
      <CommandInput
        placeholder={t("search_organizations")}
        value={searchQuery}
        onValueChange={onSearchChange}
        className="outline-hidden border-none ring-0 shadow-none text-base sm:text-sm"
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
  );

  if (isMobile) {
    return (
      <Drawer
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            onSearchChange("");
          }
          setOpen(isOpen);
        }}
      >
        <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
        <DrawerContent className="px-0 pt-2 min-h-[50vh] max-h-[85vh]">
          <div className="mt-3 pb-[env(safe-area-inset-bottom)] px-2 overflow-y-auto">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

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
      <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
      <PopoverContent
        className={cn("p-0 w-[var(--radix-popover-trigger-width)]", className)}
        align="start"
      >
        {content}
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
  const [selectedOrganizations, setSelectedOrganizations] = useState<
    Organization[]
  >([]);
  const isMobile = useBreakpoints({ default: true, sm: false });

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
  useEffect(() => {
    if (organizations?.results) {
      setSelectedOrganizations(organizations.results);
    }
  }, [organizations?.results]);

  const handleToggleOrganization = (orgId: string) => {
    setSelectedOrganizations((current) => {
      const isSelected = current.some((org) => org.id === orgId);

      if (isSelected) {
        return current.filter((org) => org.id !== orgId);
      } else {
        const allOrgs = [
          ...(organizations?.results ?? []),
          ...(availableOrganizations?.results ?? []),
        ];
        const orgToAdd = allOrgs.find((org) => org.id === orgId);
        if (orgToAdd) {
          return [...current, orgToAdd];
        }
        return current;
      }
    });
  };

  const handleSave = () => {
    const selectedIds = selectedOrganizations.map((org) => org.id);
    setOrganizations({ organizations: selectedIds });
  };
  const hasChanges = !organizations?.results
    ? false
    : new Set(organizations.results.map((org) => org.id)).size !==
        new Set(selectedOrganizations.map((org) => org.id)).size ||
      !organizations.results.every((org) =>
        selectedOrganizations.some((selected) => selected.id === org.id),
      );

  const bodyContent = (
    <div className="space-y-6 py-4">
      {/* Selected Organizations */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">{t("selected_organizations")}</h3>
        <div className="flex flex-wrap gap-2">
          {selectedOrganizations.map((org) => (
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
          {!isLoading && selectedOrganizations.length === 0 && (
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
        <OrgSelector
          selected={selectedOrganizations.map((org) => org.id)}
          onToggle={handleToggleOrganization}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isLoading={isLoadingOrganizations}
          organizations={availableOrganizations}
        />
      </div>
    </div>
  );

  const footerActions = (
    <div className="flex w-full justify-end gap-4">
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          if (organizations?.results) {
            setSelectedOrganizations(organizations.results);
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
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm">
              <Building className="mr-2 size-4" />
              {t("manage_organization", { count: 0 })}
            </Button>
          )}
        </DrawerTrigger>
        <DrawerContent className="px-0 pt-2 min-h-[60vh] max-h-[90vh]">
          <div className="mt-3 pb-[env(safe-area-inset-bottom)] px-4 flex flex-col h-full overflow-hidden">
            <div className="mb-2 border-b pb-2">
              <h2 className="text-base font-semibold">
                {t("manage_organization", { count: 0 })}
              </h2>
              <p className="text-sm text-gray-500">
                {t("manage_organizations_description")}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto pr-1">{bodyContent}</div>
            <div className="mt-4 border-t pt-4 sticky bottom-0 bg-white">
              {footerActions}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

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
        {bodyContent}
        <SheetFooter className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          {footerActions}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
