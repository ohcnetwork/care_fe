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
import query from "@/Utils/request/query";

import { HealthcareServiceReadSpec } from "@/types/emr/healthcareService/healthcareService";
import healthcareServiceApi from "@/types/emr/healthcareService/healthcareServiceApi";
import { PatientRead } from "@/types/emr/patient";

export function ServiceSwitcher() {
  const { t } = useTranslation();
  const [selectedService, setSelectedService] =
    useState<HealthcareServiceReadSpec | null>(null);
  const path = usePath();
  const pathParts = path.split("/");
  const fallbackUrl = `/${pathParts[1]}`;
  const [openDialog, setOpenDialog] = useState(false);
  const facilityId = pathParts[3];

  const { data: services, isLoading } = useQuery({
    queryKey: ["my-services", facilityId],
    queryFn: query.debounced(healthcareServiceApi.list, {
      pathParams: { facility: facilityId },
      queryParams: { mode: "my_services" },
    }),
  });

  const service = services?.results.find(
    (service) => service.id === pathParts[5],
  );

  useEffect(() => {
    if (service) {
      setSelectedService(service);
    }
  }, [service]);

  useKeyboardShortcut(
    ["Ctrl", "Alt", "s"],
    () => {
      setOpenDialog((open) => !open);
    },
    {
      overrideSystem: false,
      ignoreInputFields: true,
    },
  );

  if (isLoading) {
    return <Loader2 className="animate-spin" />;
  }

  if (!services?.results.length) {
    return (
      <Button variant="ghost" onClick={() => navigate(fallbackUrl)}>
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
            <div className="flex min-w-0 flex-1 items-center gap-2 text-left">
              <MapPinIcon className="size-5 shrink-0 text-green-600" />
              <div className="flex min-w-0 flex-col items-start">
                <span className="text-xs text-gray-500">
                  {t("current_service")}
                </span>
                <span
                  className="w-full truncate text-sm font-medium text-gray-900"
                  title={selectedService?.name}
                >
                  {selectedService?.name}
                </span>
              </div>
            </div>
            <CareIcon icon="l-angle-down" />
          </Button>
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
  patient,
}: {
  facilityId: string;
  service: HealthcareServiceReadSpec | null;
  setService: (service: HealthcareServiceReadSpec | null) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  patient?: PatientRead;
}) {
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;
  const path = usePath();
  const { t } = useTranslation();
  const pathParts = path.split("/");
  const facilityRootPath = `/${pathParts[1]}/${pathParts[2]}/${facilityId}`;

  const handleSelect = (service: HealthcareServiceReadSpec) => {
    setService(service);
    navigate(
      patient
        ? `${facilityRootPath}/service/${service.id}/patients/${patient.id}`
        : `${facilityRootPath}/service/${service.id}`,
    );
    setOpen(false);
  };

  const { data: services, isLoading } = useQuery({
    queryKey: ["my-services", facilityId],
    queryFn: query.debounced(healthcareServiceApi.list, {
      pathParams: { facility: facilityId },
      queryParams: {
        mode: "my_services",
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
        search_text: searchValue || undefined,
      },
    }),
  });

  useEffect(() => {
    if (!open) {
      setSearchValue("");
      setCurrentPage(1);
    }
  }, [open]);

  useEffect(() => {
    if (searchValue) {
      setCurrentPage(1);
    }
  }, [searchValue]);

  useKeyboardShortcut(
    ["Ctrl", "Alt", "s"],
    () => {
      if (!open) return;
      setOpen(false);
    },
    {
      overrideSystem: false,
      ignoreInputFields: true,
    },
  );

  const totalCount = services?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const getCurrentService = () => {
    if (!service) return <></>;
    return (
      <span className="block h-5 max-w-full truncate" title={service.name}>
        {service.name}
      </span>
    );
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
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t("search_services")}
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>{t("no_results_found")}</CommandEmpty>
            <CommandGroup>
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="size-4 animate-spin" />
                </div>
              ) : (
                services?.results.map((service) => (
                  <ServiceCommandItem
                    key={service.id}
                    service={service}
                    handleSelect={handleSelect}
                  />
                ))
              )}
            </CommandGroup>
          </CommandList>
        </Command>
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((page) => page - 1)}
              disabled={currentPage === 1}
            >
              {t("previous")}
            </Button>
            <span className="text-sm text-gray-500">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((page) => page + 1)}
              disabled={currentPage === totalPages}
            >
              {t("next")}
            </Button>
          </div>
        )}
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
      className="flex items-start justify-between gap-2 sm:items-center"
    >
      <span className="min-w-0 flex-1 truncate" title={service.name}>
        {service.name}
      </span>
      <div className="shrink-0">
        <Button variant="white" size="xs" className="p-2 mr-4 w-full shadow">
          <CareIcon icon="l-corner-down-left" />
          {t("select")}
        </Button>
      </div>
    </CommandItem>
  );
}
