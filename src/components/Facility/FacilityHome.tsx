import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { Hospital, MapPin, MoreVertical, Settings, Trash2 } from "lucide-react";
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

import useAuthUser from "@/hooks/useAuthUser";

import { FACILITY_FEATURE_TYPES } from "@/common/constants";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import request from "@/Utils/request/request";
import uploadFile from "@/Utils/request/uploadFile";
import { getAuthorizationHeader } from "@/Utils/request/utils";
import { sleep } from "@/Utils/utils";
import { FacilityData } from "@/types/facility/facility";
import type {
  Organization,
  OrganizationParent,
} from "@/types/organization/organization";
import { getOrgLabel } from "@/types/organization/organization";

import type { UserModel } from "../Users/models";

export function canUserRegisterPatient(
  authUser: UserModel,
  facilityId: string,
) {
  return authUser.home_facility_object?.id === facilityId;
}

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
  const authUser = useAuthUser();

  const {
    data: facilityData,
    isLoading,
    refetch: facilityFetch,
  } = useQuery<FacilityData>({
    queryKey: [routes.facility.show.path, facilityId],
    queryFn: query(routes.facility.show, {
      pathParams: { id: facilityId },
    }),
  });

  const handleDeleteClose = () => {
    setOpenDeleteDialog(false);
  };

  const handleDeleteSubmit = async () => {
    await request(routes.deleteFacility, {
      pathParams: { id: facilityId },
      onResponse: ({ res }) => {
        if (res?.ok) {
          toast.success(
            t("deleted_successfully", { name: facilityData?.name }),
          );
        }
        navigate("/facility");
      },
    });
  };

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
          facilityFetch();
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
    const { res } = await request(routes.deleteFacilityCoverImage, {
      pathParams: { id: facilityId },
    });
    if (res?.ok) {
      toast.success(t("cover_image_deleted"));
      facilityFetch();
      setEditCoverImage(false);
    } else {
      onError();
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  const hasPermissionToEditCoverImage = true;
  const hasPermissionToDeleteFacility =
    authUser.user_type === "DistrictAdmin" ||
    authUser.user_type === "StateAdmin";

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
        onClose={handleDeleteClose}
        onConfirm={handleDeleteSubmit}
      />
      <AvatarEditModal
        title={t("edit_cover_photo")}
        open={editCoverImage}
        imageUrl={facilityData?.read_cover_image_url}
        handleUpload={handleCoverImageUpload}
        handleDelete={handleCoverImageDelete}
        onClose={() => setEditCoverImage(false)}
      />
      <div className="container mx-auto p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <Card className="overflow-hidden border-none bg-transparent shadow-none">
            <div className="group relative h-64 w-full overflow-hidden rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600">
              {facilityData?.read_cover_image_url ? (
                <>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent transition-opacity group-hover:opacity-70" />
                  <img
                    src={facilityData.read_cover_image_url}
                    alt={facilityData?.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </>
              ) : (
                <div className="relative h-full w-full bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.2),transparent)]" />
              )}

              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <div className="flex items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <Avatar
                        name={facilityData?.name}
                        className="h-12 w-12 shrink-0 rounded-xl border-2 border-white/10 shadow-xl"
                      />
                      <div>
                        <h1 className="text-3xl font-bold text-white">
                          {facilityData?.name}
                        </h1>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="bg-white/10 hover:bg-white/20"
                        >
                          <MoreVertical className="h-4 w-4 text-white" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        {hasPermissionToEditCoverImage && (
                          <DropdownMenuItem
                            onClick={() => setEditCoverImage(true)}
                          >
                            <Settings className="mr-2 h-4 w-4" />
                            {t("edit_cover_photo")}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() =>
                            navigate(`/facility/${facilityId}/update`)
                          }
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          {t("update_facility")}
                        </DropdownMenuItem>
                        {hasPermissionToDeleteFacility && (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setOpenDeleteDialog(true)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("delete_facility")}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-2 space-y-2">
              <Card>
                <CardContent>
                  <div className="flex flex-col gap-4 items-start mt-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-1 h-5 w-5 flex-shrink-0 text-muted-foreground" />
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
