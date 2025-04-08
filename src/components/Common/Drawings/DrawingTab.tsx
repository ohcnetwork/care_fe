import { exportToSvg } from "@excalidraw/excalidraw";
import { type ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { memo, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import Loading from "@/components/Common/Loading";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import { Encounter } from "@/types/emr/encounter";
import metaArtifactApi from "@/types/metaAritifact/metaArtifactApi";

export interface DrawingsTabProps {
  type: "encounter" | "patient";
  patientId?: string;
  encounter?: Encounter;
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

export const DrawingTab = (props: DrawingsTabProps) => {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    cacheBlacklist: ["name"],
  });

  const associatingId =
    props.type === "encounter" ? props.encounter?.id : props.patientId;

  const { data, isLoading } = useQuery({
    queryKey: ["drawings", associatingId, qParams, resultsPerPage],
    queryFn: query.debounced(metaArtifactApi.list, {
      queryParams: {
        object_type: "drawing",
        associating_type: props.type,
        name: qParams.name,
        associating_id: associatingId,
        limit: resultsPerPage,
        offset: (qParams.page - 1) * resultsPerPage,
      },
    }),
  });

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4 gap-2">
        <Input
          id="search-by-name"
          name="name"
          placeholder={t("search_drawings")}
          value={qParams.name}
          onChange={(e) => updateQuery({ name: e.target.value })}
          className="w-full sm:w-1/3"
        />
        <Button variant="white" onClick={() => navigate("drawings/new")}>
          <CareIcon icon="l-pen" />
          {t("new_drawing")}
        </Button>
      </div>
      {isLoading ? (
        <Loading />
      ) : (
        <>
          {data?.results.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-gray-500">
              <CareIcon icon="l-image" className="text-4xl mb-2" />
              <p className="text-lg font-medium">{t("no_drawings_so_far")}</p>
              <p className="text-sm">{t("create_new_drawing_message")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
