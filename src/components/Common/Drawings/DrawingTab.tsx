import { useQuery } from "@tanstack/react-query";
import { t } from "i18next";
import { navigate } from "raviger";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import Loading from "@/components/Common/Loading";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import { Encounter } from "@/types/emr/encounter";
import { Patient } from "@/types/emr/newPatient";
import metaArtifactApi from "@/types/metaAritifact/metaArtifactApi";

export interface DrawingsTabProps {
  type: "encounter" | "patient";
  facilityId: string;
  patientId?: string;
  encounter?: Encounter;
  patient?: Patient;
  drawingId?: string;
}

export const DrawingTab = (props: DrawingsTabProps) => {
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {data?.results.map((drawing) => (
                <Card key={drawing.id} className="p-4">
                  <CardContent className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <CareIcon icon="l-edit" className="text-xl" />
                      <span className="font-medium">{drawing.name}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>
                        {t("created_on")}:{" "}
                        {new Date(drawing.created_date).toLocaleDateString()}
                      </p>
                      <p>
                        {t("created_by")}: {drawing.created_by.username}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        if (props.type === "encounter") {
                          navigate(
                            `/facility/${props.facilityId}/patient/${props.patientId}/encounter/${props.encounter?.id}/drawings/${drawing.id}`,
                          );
                        } else {
                          navigate(
                            `/facility/${props.facilityId}/patient/${props.patientId}/drawings/${drawing.id}`,
                          );
                        }
                      }}
                      className="mt-2"
                    >
                      <span className="flex flex-row items-center gap-1">
                        <CareIcon icon="l-eye" />
                        {t("view")}
                      </span>
                    </Button>
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
