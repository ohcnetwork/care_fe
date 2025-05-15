import { exportToSvg } from "@excalidraw/excalidraw";
import { ExcalidrawElement } from "@excalidraw/excalidraw/dist/types/excalidraw/element/types";
import { useQuery } from "@tanstack/react-query";
import { SearchIcon } from "lucide-react";
import { navigate, usePathParams } from "raviger";
import { memo, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import Loading from "@/components/Common/Loading";

import useFilters from "@/hooks/useFilters";

import { getPermissions } from "@/common/Permissions";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { usePermissions } from "@/context/PermissionContext";
import { Encounter, inactiveEncounterStatus } from "@/types/emr/encounter";
import { Patient } from "@/types/emr/patient";
import metaArtifactApi from "@/types/metaAritifact/metaArtifactApi";

export interface DrawingsTabProps {
  type: "encounter" | "patient";
  patient?: Patient;
  encounter?: Encounter;
  patientId?: string;
}

interface ExcalidrawPreviewProps {
  elements: readonly ExcalidrawElement[];
}

const ExcalidrawPreview = memo(({ elements }: ExcalidrawPreviewProps) => {
  const { t } = useTranslation();
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [svgKey, setSvgKey] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    setSvgKey((prev) => prev + 1);
  }, [elements]);

  useEffect(() => {
    let isMounted = true;

    if (!elements.length || !svgContainerRef.current) {
      if (isMounted) setIsLoading(false);
      return;
    }

    const generateSvg = async () => {
      try {
        if (svgContainerRef.current) {
          svgContainerRef.current.innerHTML = "";
        }

        const svg = await exportToSvg({
          elements,
          appState: {
            viewBackgroundColor: "#ffffff",
            exportWithDarkMode: false,
            theme: "light",
          },
          exportPadding: 10,
          files: null,
        });

        if (isMounted && svgContainerRef.current) {
          svg.setAttribute("width", "100%");
          svg.setAttribute("height", "100%");
          svg.style.maxHeight = "100%";
          svg.style.maxWidth = "100%";
          svg.style.display = "block";
          svg.style.margin = "auto";

          svgContainerRef.current.appendChild(svg);
        }
      } catch (_error) {
        toast.error(t("error_generating_svg"));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      generateSvg();
    }, 50);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [elements, svgKey]);

  return (
    <div className="h-60 md:h-40 w-full overflow-hidden rounded-md border border-gray-200 bg-white flex items-center justify-center">
      {isLoading ? (
        <div className="flex items-center justify-center h-full w-full">
          <CareIcon
            icon="l-spinner"
            className="animate-spin text-2xl text-gray-400"
          />
        </div>
      ) : elements.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-gray-400">
          <CareIcon icon="l-image" className="text-2xl mb-1" />
          <span className="text-xs">{t("empty_drawing")}</span>
        </div>
      ) : (
        <div
          ref={svgContainerRef}
          className="h-full w-full flex items-center justify-center p-2"
        />
      )}
    </div>
  );
});

ExcalidrawPreview.displayName = "ExcalidrawPreview";

export const DrawingPage = ({
  type,
  patientId,
  patient,
  encounter,
}: DrawingsTabProps) => {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const subpathMatch = usePathParams("/facility/:facilityId/*");
  const facilityIdExists = !!subpathMatch?.facilityId;
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    cacheBlacklist: ["name"],
  });
  const { data: patientData } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: query(routes.patient.getPatient, {
      pathParams: { id: patientId ?? "" },
    }),
    enabled: !!patient && !!patientId,
  });

  const associatingId = type === "encounter" ? encounter?.id : patientId;

  const { canViewClinicalData, canWritePatient } = getPermissions(
    hasPermission,
    patient?.permissions ?? patientData?.permissions ?? [],
  );
  const { canViewEncounter, canWriteEncounter } = getPermissions(
    hasPermission,
    encounter?.permissions ?? [],
  );
  const canAccess =
    type === "encounter"
      ? canViewClinicalData || canViewEncounter
      : canViewClinicalData;

  const canWriteCurrentEncounter =
    facilityIdExists &&
    canWriteEncounter &&
    encounter &&
    !inactiveEncounterStatus.includes(encounter.status);

  const canEdit =
    type === "encounter" ? canWriteCurrentEncounter : canWritePatient;

  const { data, isLoading } = useQuery({
    queryKey: ["drawings", associatingId, qParams, resultsPerPage],
    queryFn: query.debounced(metaArtifactApi.list, {
      queryParams: {
        object_type: "drawing",
        associating_type: type,
        name: qParams.name,
        associating_id: associatingId,
        limit: resultsPerPage,
        offset: (qParams.page - 1) * resultsPerPage,
      },
    }),
    enabled: canAccess,
  });

  return (
    <div className="p-4 -ml-4 -mt-2">
      <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
        <div className="relative flex-1 min-w-72 max-w-96 ml-2">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-500" />
          <Input
            id="search-by-name"
            placeholder={t("search_drawings")}
            value={qParams.name || ""}
            onChange={(e) => updateQuery({ name: e.target.value })}
            className="pl-10"
          />
        </div>
        {canEdit && (
          <Button variant="white" onClick={() => navigate("drawings/new")}>
            <CareIcon icon="l-pen" />
            {t("new_drawing")}
          </Button>
        )}
      </div>
      {isLoading ? (
        <Loading />
      ) : (
        <>
          {data?.results.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-gray-500">
              <CareIcon icon="l-image" className="text-4xl mb-2" />
              <p className="text-lg font-medium">{t("no_drawings_so_far")}</p>
              {canEdit && (
                <p className="text-sm">{t("create_new_drawing_message")}</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 ml-1">
              {data?.results.map((drawing) => (
                <Card
                  key={drawing.id}
                  className="overflow-hidden hover:shadow-md transition-shadow duration-200 group cursor-pointer"
                  onClick={() => {
                    navigate(`./drawings/${drawing.id}`);
                  }}
                >
                  <div className="relative">
                    <div className="h-60 md:h-40 w-full bg-gray-50">
                      <ExcalidrawPreview
                        elements={drawing.object_value.elements}
                        key={drawing.modified_date}
                      />
                    </div>
                    <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-center p-2">
                      <span className="text-white font-medium flex items-center gap-1">
                        <CareIcon icon="l-eye" />
                        {t("view")}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <CareIcon
                        icon="l-edit"
                        className="text-xl text-primary-600 shrink-0"
                      />
                      <span className="font-medium truncate">
                        {drawing.name}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p className="flex items-center gap-1">
                        <CareIcon icon="l-calender" className="text-gray-400" />
                        {new Date(drawing.created_date).toLocaleDateString()}
                      </p>
                      <p className="flex items-center gap-1">
                        <CareIcon icon="l-user" className="text-gray-400" />
                        {drawing.created_by.username}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
      <Pagination totalCount={data?.count || 0} />
    </div>
  );
};
