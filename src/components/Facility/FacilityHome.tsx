import careConfig from "@careConfig";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { Hospital, MapPin, MoreVertical, Settings } from "lucide-react";
import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Markdown } from "@/components/ui/markdown";

import { Avatar } from "@/components/Common/Avatar";
import AvatarEditModal from "@/components/Common/AvatarEditModal";
import ConfirmDialog from "@/components/Common/ConfirmDialog";
import ContactLink from "@/components/Common/ContactLink";
import Loading from "@/components/Common/Loading";

import { FACILITY_FEATURE_TYPES } from "@/common/constants";

import { PLUGIN_Component } from "@/PluginEngine";
import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import uploadFile from "@/Utils/request/uploadFile";
import { getAuthorizationHeader } from "@/Utils/request/utils";
import { sleep } from "@/Utils/utils";
import EditFacilitySheet from "@/pages/Organization/components/EditFacilitySheet";
import { FacilityData } from "@/types/facility/facility";
import type {
  Organization,
  OrganizationParent,
} from "@/types/organization/organization";
import { getOrgLabel } from "@/types/organization/organization";

type Props = {
  facilityId: string;
};

export const getFacilityFeatureIcon = (featureId: number) => {
  const feature = FACILITY_FEATURE_TYPES.find((f) => f.id === featureId);
  if (!feature?.icon) return null;
  return typeof feature.icon === "string" ? (
    <Hospital className="h-4 w-4" />
  ) : (
    feature.icon
  );
};

const renderGeoOrganizations = (geoOrg: Organization) => {
  const orgParents: OrganizationParent[] = [];

  let currentParent = geoOrg.parent;

  while (currentParent) {
    if (currentParent.id) {
      orgParents.push(currentParent);
    }
    currentParent = currentParent.parent;
  }

  const parentDetails = orgParents.map((org) => {
    return {
      label: getOrgLabel(org.org_type, org.metadata),
      value: org.name,
    };
  });

  return [
    {
      label: getOrgLabel(geoOrg.org_type, geoOrg.metadata),
      value: geoOrg.name,
    },
  ]
    .concat(parentDetails)
    .map((org, index) => (
      <div key={index}>
        <span className="text-gray-500">{org.value}</span>
      </div>
    ));
};

export const FacilityHome = ({ facilityId }: Props) => {
  const { t } = useTranslation();
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editCoverImage, setEditCoverImage] = useState(false);
  const queryClient = useQueryClient();

  const { data: facilityData, isLoading } = useQuery<FacilityData>({
    queryKey: ["facility", facilityId],
    queryFn: query(routes.facility.show, {
      pathParams: { id: facilityId },
    }),
  });
  const { mutate: deleteFacility } = useMutation({
    mutationFn: mutate(routes.deleteFacility, {
      pathParams: { id: facilityId },
    }),
    onSuccess: () => {
      toast.success(
        t("entity_deleted_successfully", { name: facilityData?.name }),
      );
      navigate("/facility");
    },
  });

  const { mutateAsync: deleteAvatar } = useMutation({
    mutationFn: mutate(routes.deleteFacilityCoverImage, {
      pathParams: { id: facilityId },
    }),
    onSuccess: () => {
      toast.success(t("cover_image_deleted"));
      queryClient.invalidateQueries({
        queryKey: ["facility", facilityId],
      });
      setEditCoverImage(false);
    },
  });

  const handleCoverImageUpload = async (file: File, onError: () => void) => {
    const formData = new FormData();
    formData.append("cover_image", file);
    const url = `${careConfig.apiUrl}/api/v1/facility/${facilityId}/cover_image/`;

    uploadFile(
      url,
      formData,
      "POST",
      { Authorization: getAuthorizationHeader() },
      async (xhr: XMLHttpRequest) => {
        if (xhr.status === 200) {
          await sleep(1000);
          queryClient.invalidateQueries({
            queryKey: ["facility", facilityId],
          });
          toast.success(t("cover_image_updated"));
          setEditCoverImage(false);
        } else {
          onError();
        }
      },
      null,
      () => {
        onError();
      },
    );
  };
  const handleCoverImageDelete = async (onError: () => void) => {
    try {
      await deleteAvatar();
    } catch {
      onError();
    }
  };

  if (isLoading || !facilityData) {
    return <Loading />;
  }

  const hasPermissionToEditCoverImage = true;

  const coverImageHint = (
    <>
      {t("max_size_for_image_uploaded_should_be", { maxSize: "1MB" })}
      <br />
      {t("allowed_formats_are", { formats: "jpg, png, jpeg" })}{" "}
      {t("recommended_aspect_ratio_for", { aspectRatio: "16:9" })}
    </>
  );

  return (
    <div>
      <ConfirmDialog
        title={t("delete_item", { name: facilityData?.name })}
        description={
          <span>
            {t("are_you_sure_want_to_delete", { name: facilityData?.name })}
          </span>
        }
        action="Delete"
        variant="destructive"
        show={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        onConfirm={() => deleteFacility()}
      />
      <AvatarEditModal
        title={t("edit_cover_photo")}
        open={editCoverImage}
        imageUrl={facilityData?.read_cover_image_url}
        handleUpload={handleCoverImageUpload}
        handleDelete={handleCoverImageDelete}
        onClose={() => setEditCoverImage(false)}
        hint={coverImageHint}
      />
      <div className="container mx-auto p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <Card className="overflow-hidden border-none bg-transparent shadow-none">
            <div className="group relative h-64 w-full overflow-hidden rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600">
              {facilityData?.read_cover_image_url ? (
                <>
                  <img
                    src={facilityData.read_cover_image_url}
                    alt={facilityData?.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent transition-opacity group-hover:opacity-70" />
                </>
              ) : (
                <div className="relative h-full w-full bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.2),transparent)]" />
              )}

              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <div className="flex flex-wrap items-center gap-4 md:gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 md:gap-4">
                      <Avatar
                        name={facilityData.name}
                        className="h-9 w-9 md:h-12 md:w-12 shrink-0 rounded-xl border-2 border-white/10 shadow-xl"
                      />
                      <div className="min-w-0">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <h1 className="text-sm md:text-3xl text-white md:font-bold">
                                {facilityData?.name}
                              </h1>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-sm text-white bg-black rounded-md p-2">
                                {facilityData?.name}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          aria-label={t("facility_actions_menu")}
                          className="bg-white/20 hover:bg-white/40 w-8 h-8"
                        >
                          <MoreVertical className="h-4 w-4 text-white" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 md:w-56">
                        {hasPermissionToEditCoverImage && (
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => setEditCoverImage(true)}
                          >
                            <Settings className="mr-2 h-4 w-4" />
                            {t("edit_cover_photo")}
                          </DropdownMenuItem>
                        )}

                        <EditFacilitySheet
                          facilityId={facilityId}
                          trigger={
                            <DropdownMenuItem
                              className=" cursor-pointer"
                              onSelect={(e) => {
                                e.preventDefault();
                              }}
                            >
                              <Settings className="mr-2 h-4 w-4" />
                              {t("update_facility")}
                            </DropdownMenuItem>
                          }
                        />
                        {/* TODO: get permissions from backend */}
                        {/* {hasPermissionToDeleteFacility && (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setOpenDeleteDialog(true)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("delete_facility")}
                          </DropdownMenuItem>
                        )} */}
                        <PLUGIN_Component
                          __name="FacilityHomeActions"
                          facility={facilityData}
                        />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-2 space-y-2">
              <Card>
                <CardContent>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-12 mt-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-2 h-5 w-5 flex-shrink-0 text-gray-500" />
                      <div>
                        {facilityData?.geo_organization && (
                          <div className="mt-2 text-sm">
                            {renderGeoOrganizations(
                              facilityData?.geo_organization,
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div>
                        <div className="mt-1">
                          <ContactLink
                            tel={String(facilityData?.phone_number)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {facilityData?.features?.some((feature: number) =>
                FACILITY_FEATURE_TYPES.some((f) => f.id === feature),
              ) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-medium">
                      {t("features")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {facilityData?.features?.map(
                        (feature: number) =>
                          FACILITY_FEATURE_TYPES.some(
                            (f) => f.id === feature,
                          ) && (
                            <Badge
                              key={feature}
                              variant="secondary"
                              className="flex items-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            >
                              {getFacilityFeatureIcon(feature)}
                              <span>
                                {
                                  FACILITY_FEATURE_TYPES.find(
                                    (f) => f.id === feature,
                                  )?.name
                                }
                              </span>
                            </Badge>
                          ),
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {facilityData?.description && (
                <Card>
                  <CardContent className="mt-4">
                    <Markdown content={facilityData.description} />
                  </CardContent>
                </Card>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
