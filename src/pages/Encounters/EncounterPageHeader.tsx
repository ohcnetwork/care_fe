import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { Link, useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { WorkspaceHeader } from "@/components/ui/sidebar/workspace-header";

import { useRouteParams } from "@/hooks/useRouteParams";

import patientApi from "@/types/emr/patient/patientApi";
import query from "@/Utils/request/query";
import { goBack } from "@/Utils/utils";

interface EncounterPageHeaderProps {
  onSearch: () => void;
}

export default function EncounterPageHeader({
  onSearch,
}: EncounterPageHeaderProps) {
  const { t } = useTranslation();
  const { scope, scopeId, patientId, encounterId } = useRouteParams(
    "/:scope/:scopeId/patient/:patientId/encounter/:encounterId",
  );
  const facilityId = scope === "facility" ? scopeId : undefined;
  const [{ selectedEncounter }] = useQueryParams();
  const { data: patient } = useQuery({
    queryKey: ["patient", patientId, facilityId],
    queryFn: query(patientApi.get, {
      pathParams: { id: patientId! },
      queryParams: { facility: facilityId },
      silent: true,
    }),
    enabled: !!patientId,
  });
  const patientUrl = facilityId
    ? `/facility/${facilityId}/patient/${patientId}`
    : `/patient/${patientId}`;
  const encounterUrl = `/${scope}/${scopeId}/patient/${patientId}/encounter/${encounterId}/updates`;
  const encounterQuery = selectedEncounter
    ? `?${new URLSearchParams({ selectedEncounter })}`
    : "";
  const linkClassName =
    "truncate rounded-sm text-neutral-950 underline underline-offset-4 hover:text-neutral-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500";

  return (
    <WorkspaceHeader onSearch={onSearch}>
      <div
        className="flex min-w-0 flex-1 items-center gap-3"
        onKeyDown={(event) => {
          // Preserve native activation instead of the global Enter shortcut.
          if (
            event.key === "Enter" &&
            !event.shiftKey &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.altKey
          ) {
            event.stopPropagation();
          }
        }}
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={t("back")}
          onClick={() => goBack(patientUrl)}
          className="size-8 shrink-0 gap-2 rounded-md p-0 text-neutral-950 hover:bg-neutral-100 sm:w-auto sm:px-2"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          <span className="hidden font-semibold underline underline-offset-4 sm:inline">
            {t("back")}
          </span>
        </Button>
        <span aria-hidden="true" className="h-6 w-px shrink-0 bg-neutral-200" />
        <Breadcrumb className="min-w-0 flex-1">
          <BreadcrumbList className="flex-nowrap gap-1.5 sm:gap-2 text-neutral-600">
            <BreadcrumbItem className="hidden shrink-0 lg:flex">
              <BreadcrumbLink asChild>
                <Link
                  basePath="/"
                  href={facilityId ? `/facility/${facilityId}/overview` : "/"}
                  className={linkClassName}
                >
                  {t("home")}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden lg:block" />
            <BreadcrumbItem className="hidden shrink-0 md:flex">
              <BreadcrumbLink asChild>
                <Link basePath="/" href={patientUrl} className={linkClassName}>
                  {t("patient")}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem className="hidden shrink-0 sm:flex">
              <BreadcrumbLink asChild>
                <Link
                  basePath="/"
                  href={`${encounterUrl}${encounterQuery}`}
                  className={linkClassName}
                >
                  {t("encounter")}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden sm:block" />
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage
                title={patient?.name}
                className="truncate text-neutral-600"
              >
                {patient?.name ?? t("patient")}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </WorkspaceHeader>
  );
}
