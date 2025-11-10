import { useQuery } from "@tanstack/react-query";
import { Loader2, MapPinIcon } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/components/ui/sidebar";

import PaginationComponent from "@/components/Common/Pagination";

import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";

import query from "@/Utils/request/query";
import useCurrentService from "@/pages/Facility/services/utils/useCurrentService";
import { HealthcareServiceReadSpec } from "@/types/healthcareService/healthcareService";
import healthcareServiceApi from "@/types/healthcareService/healthcareServiceApi";

export function ServiceSwitcher() {
  const { t } = useTranslation();
  const { facilityId, service } = useCurrentService();
  const { state } = useSidebar();
  const [selectedService, setSelectedService] = useState<
    HealthcareServiceReadSpec | undefined
  >(undefined);
  const [openDialog, setOpenDialog] = useState(false);

  const fallbackUrl = `/facility/${facilityId}/overview`;

  useEffect(() => {
    setSelectedService(service as HealthcareServiceReadSpec);
  }, [service]);

  if (state === "collapsed") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate(fallbackUrl)}
        className="w-8 h-8"
      >
        <CareIcon icon="l-home-alt" />
      </Button>
    );
  }

  return (
    <Fragment>
      <ServiceSelectorDialog
        facilityId={facilityId}
        service={selectedService}
        setService={setSelectedService}
        open={openDialog}
        setOpen={setOpenDialog}
      />
      <div className="flex flex-col items-start gap-4">
        <Button variant="ghost" onClick={() => navigate(fallbackUrl)}>
          <CareIcon icon="l-arrow-left" />
          <span className="underline underline-offset-2">{t("home")}</span>
        </Button>

        <div className="w-full px-2">
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between gap-3 py-6 px-2 rounded-md bg-white border border-gray-200"
            onClick={() => setOpenDialog(true)}
          >
            <div className="flex items-center gap-2">
              <MapPinIcon className="size-5 text-green-600" />
              <div className="flex flex-col items-start">
                <span className="text-xs text-gray-500">
                  {t("current_service")}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {selectedService?.name}
                </span>
              </div>
            </div>
            <CareIcon icon="l-sort" />
          </Button>
          <Separator className="mt-4" />
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
        offset: ((currentPage ?? 1) - 1) * resultsPerPage,
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
