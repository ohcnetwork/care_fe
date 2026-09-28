import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronsUpDown,
  HeartPulse,
  Loader2,
  X,
} from "lucide-react";
import { navigate, usePath } from "raviger";
import { Fragment, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import useKeyboardShortcut from "use-keyboard-shortcut";

import CareIcon from "@/CAREUI/icons/CareIcon";

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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSidebar } from "@/components/ui/sidebar";
import { useAppSidebar } from "@/components/ui/sidebar/app-sidebar-provider";

import PaginationComponent from "@/components/Common/Pagination";

import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";

import query from "@/Utils/request/query";
import { TooltipComponent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import useCurrentService from "@/pages/Facility/services/utils/useCurrentService";
import { HealthcareServiceReadSpec } from "@/types/healthcareService/healthcareService";
import healthcareServiceApi from "@/types/healthcareService/healthcareServiceApi";

export function ServiceSwitcher() {
  const { t } = useTranslation();
  const { facilityId, service } = useCurrentService();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;
  const [selectedService, setSelectedService] = useState<
    HealthcareServiceReadSpec | undefined
  >(undefined);
  const [openDialog, setOpenDialog] = useState(false);
  const { handleMenuOpenChange } = useAppSidebar();
  const handleDialogOpenChange = (open: boolean) => {
    setOpenDialog(open);
    handleMenuOpenChange(open);
  };

  const fallbackUrl = `/facility/${facilityId}/overview`;

  useEffect(() => {
    setSelectedService(service as HealthcareServiceReadSpec);
  }, [service]);

  return (
    <Fragment>
      <ServiceSelectorDialog
        facilityId={facilityId}
        service={selectedService}
        setService={setSelectedService}
        open={openDialog}
        setOpen={handleDialogOpenChange}
      />
      <div
        className={cn(
          "flex min-w-0 flex-col gap-2 py-2",
          !isCollapsed && "px-2",
        )}
      >
        <div className="flex min-h-8 items-center justify-between">
          <Button
            variant="ghost"
            size={isCollapsed ? "icon" : "sm"}
            onClick={() => {
              if (isMobile) setOpenMobile(false);
              navigate(fallbackUrl);
            }}
            className={cn(
              "gap-1.5 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-950 focus-visible:ring-2 focus-visible:ring-indigo-400",
              isCollapsed ? "size-8" : "-ml-1 h-8 px-2",
            )}
            aria-label={t("home")}
            title={isCollapsed ? t("home") : undefined}
          >
            <ChevronLeft className="size-4" />
            {!isCollapsed && <span>{t("home")}</span>}
          </Button>
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-950 focus-visible:ring-2 focus-visible:ring-indigo-400"
              onClick={() => setOpenMobile(false)}
              aria-label={t("close_sidebar")}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>

        <div className="w-full">
          <TooltipComponent
            content={selectedService?.name ?? t("select_healthcare_service")}
          >
            <Button
              variant="ghost"
              className={cn(
                "flex h-auto w-full items-center justify-between gap-2 overflow-hidden rounded-[10px] border border-neutral-300 bg-white text-neutral-950 hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-indigo-400",
                isCollapsed ? "size-8 justify-center p-0" : "px-3 py-2.5",
              )}
              aria-label={
                selectedService?.name ?? t("select_healthcare_service")
              }
              aria-haspopup="dialog"
              aria-expanded={openDialog}
              onClick={() => handleDialogOpenChange(true)}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                {isCollapsed && (
                  <HeartPulse className="mx-auto size-4 text-neutral-600" />
                )}
                <div className={cn("min-w-0 flex-1", isCollapsed && "hidden")}>
                  <div className="flex min-w-0 w-full flex-col items-start overflow-hidden">
                    <span className="text-[10px] font-semibold tracking-wider text-neutral-600 uppercase">
                      {t("current_service")}
                    </span>
                    <span className="max-w-full truncate text-left text-sm font-semibold text-neutral-950">
                      {selectedService?.name ?? t("select_healthcare_service")}
                    </span>
                  </div>
                </div>
              </div>
              {!isCollapsed && (
                <ChevronsUpDown className="size-4 shrink-0 text-neutral-600" />
              )}
            </Button>
          </TooltipComponent>
        </div>
      </div>
    </Fragment>
  );
}

export function ServiceSelectorDialog({
  facilityId,
  service,
  setService,
  open,
  setOpen,
  navigateUrl,
}: {
  facilityId: string;
  service: HealthcareServiceReadSpec | undefined;
  setService: (service: HealthcareServiceReadSpec | undefined) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  navigateUrl?: (service: HealthcareServiceReadSpec) => string;
}) {
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = RESULTS_PER_PAGE_LIMIT;
  const path = usePath();
  const subPath =
    path?.match(/\/facility\/[^/]+\/services\/[^/]+\/(.*)/)?.[1] || "";

  const { data: services, isLoading } = useQuery({
    queryKey: ["healthcareServices", facilityId, currentPage, searchValue],
    queryFn: query.debounced(healthcareServiceApi.listHealthcareService, {
      pathParams: { facilityId },
      queryParams: {
        limit: resultsPerPage,
        offset: ((currentPage || 1) - 1) * resultsPerPage,
        ...(searchValue && { name: searchValue }),
      },
    }),
    enabled: open,
  });

  const handleSelect = (newService: HealthcareServiceReadSpec) => {
    const oldServiceId = service?.id;
    setService(newService);
    setOpen(false);
    setSearchValue("");
    setCurrentPage(1);
    if (newService.id !== oldServiceId) {
      if (navigateUrl) {
        navigate(navigateUrl(newService));
      } else {
        navigate(
          `/facility/${facilityId}/services/${newService.id}/${subPath}`,
        );
      }
    }
  };

  useKeyboardShortcut(["Shift", "Enter"], () => {
    if (service) {
      handleSelect(service);
    }
  });

  const getCurrentService = () => {
    if (!service) return <></>;
    return <span className="text-nowrap h-5">{service?.name}</span>;
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
        if (!open) {
          setSearchValue("");
          setCurrentPage(1);
        }
      }}
    >
      <DialogContent className="p-3 min-w-[calc(50vw)]">
        <DialogHeader>
          <DialogTitle>{getCurrentService()}</DialogTitle>
        </DialogHeader>
        <Command className="pt-3 pb-2" shouldFilter={false}>
          <div className="border border-gray-200">
            <CommandInput
              className="border-0 ring-0"
              placeholder={t("search")}
              onValueChange={(value) => {
                setSearchValue(value);
                setCurrentPage(1);
              }}
              value={searchValue}
            />
            <CommandList
              className="max-h-[calc(100vh-30rem)]"
              onWheel={(e) => {
                e.stopPropagation();
              }}
            >
              <CommandEmpty>
                {isLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                    <span className="ml-2 text-sm text-gray-500">
                      {t("loading")}
                    </span>
                  </div>
                ) : (
                  t("no_services_found")
                )}
              </CommandEmpty>
              <CommandGroup>
                {services?.results.map((service) => (
                  <ServiceCommandItem
                    key={service.id}
                    service={service}
                    handleSelect={handleSelect}
                  />
                ))}
              </CommandGroup>
            </CommandList>
          </div>
        </Command>
        <div className="flex w-full justify-center mt-4">
          <PaginationComponent
            cPage={currentPage}
            defaultPerPage={resultsPerPage}
            data={{ totalCount: services?.count || 0 }}
            onChange={(page: number) => setCurrentPage(page)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ServiceCommandItem({
  service,
  handleSelect,
}: {
  service: HealthcareServiceReadSpec;
  handleSelect: (service: HealthcareServiceReadSpec) => void;
}) {
  const { t } = useTranslation();
  return (
    <CommandItem
      key={service.id}
      value={service.id}
      onSelect={() => handleSelect(service)}
      className="flex items-start sm:items-center justify-between"
    >
      <span>{service.name}</span>
      <div>
        <Button variant="white" size="xs" className="p-2 mr-4 w-full shadow">
          <CareIcon icon="l-corner-down-left" />
          {t("select")}
        </Button>
      </div>
    </CommandItem>
  );
}
