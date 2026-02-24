import { useQuery } from "@tanstack/react-query";
import { Copy, FileText, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";

import { ChargeItemDefinitionDrawer } from "@/components/Common/ChargeItemDefinitionDrawer";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import {
  ResourceCategoryResourceType,
  ResourceCategorySubType,
} from "@/types/base/resourceCategory/resourceCategory";
import {
  ChargeItemDefinitionBase,
  ChargeItemDefinitionRead,
  ChargeItemDefinitionStatus,
} from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
import chargeItemDefinitionApi from "@/types/billing/chargeItemDefinition/chargeItemDefinitionApi";
import query from "@/Utils/request/query";
import { ResourceDefinitionCategoryPicker } from "./ResourceDefinitionCategoryPicker";

interface ChargeItemDefinitionPickerProps {
  facilityId: string;
  value: ChargeItemDefinitionBase | ChargeItemDefinitionBase[] | undefined;
  onValueChange: (
    definitions:
      | ChargeItemDefinitionBase
      | ChargeItemDefinitionBase[]
      | undefined,
  ) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showCreateButton?: boolean;
  showCopyButton?: boolean;
  categorySlug?: string;
  allowMultiple?: boolean;
  resourceSubType?: ResourceCategorySubType;
}

export function ChargeItemDefinitionPicker({
  facilityId,
  value,
  onValueChange,
  placeholder,
  disabled = false,
  className,
  showCreateButton = false,
  showCopyButton = false,
  categorySlug,
  resourceSubType,
  allowMultiple = false,
}: ChargeItemDefinitionPickerProps) {
  const { t } = useTranslation();
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [copyDrawerOpen, setCopyDrawerOpen] = useState(false);
  const [copySelectionOpen, setCopySelectionOpen] = useState(false);
  const [selectedDefinitionForCopy, setSelectedDefinitionForCopy] = useState<
    ChargeItemDefinitionRead | undefined
  >(undefined);
  const [selectedDefinitions, setSelectedDefinitions] = useState<
    ChargeItemDefinitionBase[]
  >([]);

  useEffect(() => {
    if (value) {
      const defs = Array.isArray(value) ? value : [value];
      setSelectedDefinitions(defs);
    } else {
      setSelectedDefinitions([]);
    }
  }, [value]);

  // Fetch all charge item definitions for copy selection
  const { data: allDefinitionsResponse, isLoading: isLoadingAllDefinitions } =
    useQuery({
      queryKey: ["allChargeItemDefinitions", facilityId],
      queryFn: query(chargeItemDefinitionApi.listChargeItemDefinition, {
        pathParams: { facilityId },
        queryParams: {
          limit: 1000,
          status: ChargeItemDefinitionStatus.active,
          ordering: "title",
        },
      }),
      enabled: copySelectionOpen,
    });

  const allDefinitions = useMemo(
    () => allDefinitionsResponse?.results || [],
    [allDefinitionsResponse?.results],
  );

  const handleCreateSuccess = (
    chargeItemDefinition: ChargeItemDefinitionRead,
  ) => {
    if (allowMultiple) {
      const newDefinitions = [...selectedDefinitions, chargeItemDefinition];
      setSelectedDefinitions(newDefinitions);
      onValueChange(newDefinitions);
    } else {
      setSelectedDefinitions([chargeItemDefinition]);
      onValueChange(chargeItemDefinition);
    }
    setCreateDrawerOpen(false);
  };

  const handleCopySuccess = (
    chargeItemDefinition: ChargeItemDefinitionRead,
  ) => {
    if (allowMultiple) {
      const newDefinitions = [...selectedDefinitions, chargeItemDefinition];
      setSelectedDefinitions(newDefinitions);
      onValueChange(newDefinitions);
    } else {
      setSelectedDefinitions([chargeItemDefinition]);
      onValueChange(chargeItemDefinition);
    }
    setCopyDrawerOpen(false);
  };

  const handleCopyDefinitionSelect = (definition: ChargeItemDefinitionRead) => {
    setCopySelectionOpen(false);
    setCopyDrawerOpen(true);
    // Store the selected definition for prefilling
    setSelectedDefinitionForCopy(definition);
  };

  return (
    <>
      <div className="grow">
        <ResourceDefinitionCategoryPicker<ChargeItemDefinitionBase>
          facilityId={facilityId}
          value={allowMultiple ? selectedDefinitions : selectedDefinitions[0]}
          onValueChange={(selectedDef) => {
            if (!selectedDef) {
              setSelectedDefinitions([]);
              onValueChange(undefined);
              return;
            }
            if (allowMultiple) {
              const defs = Array.isArray(selectedDef)
                ? selectedDef
                : [selectedDef];
              setSelectedDefinitions(defs);
              onValueChange(defs);
            } else {
              const def = Array.isArray(selectedDef)
                ? selectedDef[0]
                : selectedDef;
              setSelectedDefinitions([def]);
              onValueChange(def);
            }
          }}
          allowMultiple={allowMultiple}
          placeholder={placeholder}
          className={className}
          disabled={disabled}
          resourceType={ResourceCategoryResourceType.charge_item_definition}
          listDefinitions={{
            queryFn: chargeItemDefinitionApi.listChargeItemDefinition,
            pathParams: { facilityId },
            queryParams: {
              status: ChargeItemDefinitionStatus.active,
            },
          }}
          resourceSubType={resourceSubType}
          translationBaseKey="charge_item_definition"
        />
      </div>

      {(showCreateButton || showCopyButton) && (
        <div className="flex items-center gap-2 self-end w-full sm:w-auto">
          {showCreateButton && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCreateDrawerOpen(true)}
              className="h-9 px-2 w-full"
              disabled={disabled}
            >
              <Plus className="h-3 w-3 mr-1" />
              {t("create_charge_item_definition")}
            </Button>
          )}
          {showCopyButton && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCopySelectionOpen(true)}
              className="h-9 px-2 w-full"
              disabled={disabled}
            >
              <Copy className="h-3 w-3 mr-1" />
              {t("copy_charge_item_definition")}
            </Button>
          )}
        </div>
      )}

      <ChargeItemDefinitionDrawer
        open={createDrawerOpen}
        onOpenChange={setCreateDrawerOpen}
        facilityId={facilityId}
        categorySlug={categorySlug}
        onSuccess={handleCreateSuccess}
      />

      {/* Copy Selection Drawer */}
      <Drawer open={copySelectionOpen} onOpenChange={setCopySelectionOpen}>
        <DrawerContent className="max-h-[85vh] flex flex-col">
          <div className="px-4 py-4 flex-1 min-h-0 overflow-auto">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">
                {t("select_definition_to_copy")}
              </h3>
              <p className="text-sm text-gray-600">
                {t("select_definition_to_copy_description")}
              </p>
            </div>

            <Command className="border-0">
              <div className="px-3 py-2 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <CommandInput
                    placeholder={t("search_definitions")}
                    className="pl-9 h-9 border-0 focus:ring-0 text-base sm:text-sm"
                  />
                </div>
              </div>

              <CommandList className="max-h-[300px]">
                <CommandEmpty>
                  {isLoadingAllDefinitions ? (
                    <div className="p-6 space-y-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-4 w-4 rounded" />
                        <div className="space-y-1 flex-1">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-gray-500">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <div className="text-sm">{t("no_definitions_found")}</div>
                    </div>
                  )}
                </CommandEmpty>

                <CommandGroup>
                  {allDefinitions.map((definition) => (
                    <CommandItem
                      key={definition.id}
                      value={definition.title}
                      onSelect={() => handleCopyDefinitionSelect(definition)}
                      className="flex items-center justify-between px-3 py-3 cursor-pointer hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150 border-b border-gray-200 last:border-b-0"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="shrink-0">
                          <FileText className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate">
                            {definition.title}
                          </div>
                          {definition.description && (
                            <div className="text-xs text-gray-500 truncate mt-0.5">
                              {definition.description}
                            </div>
                          )}
                          {definition.price_components?.[0] && (
                            <div className="text-xs mt-0.5">
                              {definition.price_components[0].amount && (
                                <MonetaryDisplay
                                  amount={definition.price_components[0].amount}
                                />
                              )}{" "}
                              {definition.price_components[0].code?.code ||
                                "INR"}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Copy className="h-4 w-4 text-gray-500" />
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Copy Drawer with prefilled data */}
      <ChargeItemDefinitionDrawer
        open={copyDrawerOpen}
        onOpenChange={(open) => {
          setCopyDrawerOpen(open);
          if (!open) {
            setSelectedDefinitionForCopy(undefined);
          }
        }}
        facilityId={facilityId}
        categorySlug={categorySlug}
        initialData={selectedDefinitionForCopy}
        onSuccess={handleCopySuccess}
      />
    </>
  );
}
