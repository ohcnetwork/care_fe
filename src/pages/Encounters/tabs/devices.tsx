import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Unlink } from "lucide-react";
import { Link } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import Pagination from "@/components/Common/Pagination";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import AssociateDeviceSheet from "@/pages/Encounters/AssociateDeviceSheet";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import deviceApi from "@/types/device/deviceApi";
import { inactiveEncounterStatus } from "@/types/emr/encounter/encounter";

export const EncounterDevicesTab = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const {
    selectedEncounterId: encounterId,
    patientId,
    facilityId,
    currentEncounterId,
    selectedEncounter: encounter,
  } = useEncounter();

  const readOnly =
    encounterId !== currentEncounterId ||
    (encounter && inactiveEncounterStatus.includes(encounter.status));

  const limit = RESULTS_PER_PAGE_LIMIT;

  const { data, isLoading } = useQuery({
    queryKey: ["devices", facilityId, patientId, page, limit],
    queryFn: query(deviceApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        current_encounter: encounterId,
        offset: (page - 1) * limit,
        limit,
      },
    }),
  });

  const { mutate: disassociateDevice, isPending: isDisassociating } =
    useMutation({
      mutationFn: (deviceId: string) =>
        mutate(deviceApi.associateEncounter, {
          pathParams: { facilityId, deviceId },
        })({ encounter: null }),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["devices", facilityId, patientId],
        });
      },
    });

  return (
    <div className="space-y-6">
      {isLoading ? (
        <TableSkeleton count={6} />
      ) : (
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {data?.results?.length ? (
                <Table className="w-full overflow-x-auto whitespace-nowrap">
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="w-1/2">{t("name")}</TableHead>
                      <TableHead className="w-1/3">{t("type")}</TableHead>
                      <TableHead className="w-1/4">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.results.map((device) => {
                      return (
                        <TableRow
                          key={device.id}
                          className="hover:bg-gray-50/50"
                        >
                          <TableCell className="font-medium">
                            <Link
                              href={`/devices/${device.id}`}
                              basePath={`/facility/${facilityId}/settings`}
                              className="group flex items-start gap-1"
                            >
                              <div>
                                <div className="flex items-center gap-1 text-gray-900 group-hover:text-primary-600 group-hover:underline">
                                  <span>{device.registered_name}</span>
                                  <ExternalLink className="size-3 opacity-70 group-hover:opacity-100" />
                                </div>
                                {device.user_friendly_name && (
                                  <div className="text-sm text-gray-500">
                                    {device.user_friendly_name}
                                  </div>
                                )}
                              </div>
                            </Link>
                          </TableCell>
                          <TableCell>
                            <span>{device.care_type || "-"}</span>
                          </TableCell>
                          <TableCell>
                            {!readOnly && (
                              <div className="flex items-center">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:text-destructive/90 px-2"
                                        onClick={() =>
                                          disassociateDevice(device.id)
                                        }
                                        disabled={isDisassociating}
                                      >
                                        <Unlink className="size-4 mr-1" />
                                        {t("disassociate")}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {t("disassociate_device_from_encounter")}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  {t("no_devices_available")}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-center">
            {!!(data && data.count > limit) && (
              <Pagination
                data={{ totalCount: data.count }}
                onChange={(page, _) => setPage(page)}
                defaultPerPage={limit}
                cPage={page}
              />
            )}

            {facilityId && !readOnly && (
              <AssociateDeviceSheet
                facilityId={facilityId}
                encounterId={encounterId}
              >
                <Button variant="white">
                  <CareIcon icon="l-link-add" className="size-4 mr-1" />
                  {t("associate_device_to_encounter")}
                </Button>
              </AssociateDeviceSheet>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
