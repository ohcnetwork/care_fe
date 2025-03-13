import careConfig from "@careConfig";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { Hospital } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Markdown } from "@/components/ui/markdown";
import { TooltipComponent } from "@/components/ui/tooltip";

import { Avatar } from "@/components/Common/Avatar";
import AvatarEditModal from "@/components/Common/AvatarEditModal";
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
import { FeatureBadge } from "@/pages/Facility/Utils";
import EditFacilitySheet from "@/pages/Organization/components/EditFacilitySheet";
import { FacilityData } from "@/types/facility/facility";
import type {
  Organization,
  OrganizationParent,
} from "@/types/organization/organization";
import { getOrgLabel } from "@/types/organization/organization";

import { FacilityMapsLink } from "./FacilityMapLink";

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

  const formatValue = (name: string, label: string) => {
    return name.endsWith(label)
      ? name.replace(new RegExp(`${label}$`), "").trim()
      : name;
  };

  const parentDetails = orgParents.map((org) => {
    const label = getOrgLabel(org.org_type, org.metadata);
    return {
      label,
      value: formatValue(org.name, label),
    };
  });

  const geoOrgLabel = getOrgLabel(geoOrg.org_type, geoOrg.metadata);

  return [
    {
      label: geoOrgLabel,
      value: formatValue(geoOrg.name, geoOrgLabel),
    },
  ].concat(parentDetails);
};

export const FacilityHome = ({ facilityId }: Props) => {
  const { t } = useTranslation();
  const [editCoverImage, setEditCoverImage] = useState(false);
  const queryClient = useQueryClient();

  const { data: facilityData, isLoading } = useQuery<FacilityData>({
    queryKey: ["facility", facilityId],
    queryFn: query(routes.facility.show, {
      pathParams: { id: facilityId },
    }),
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

  const handleCoverImageUpload = async (
    file: File,
    onSuccess: () => void,
    onError: () => void,
  ) => {
    const formData = new FormData();
    formData.append("cover_image", file);
    const url = `${careConfig.apiUrl}/api/v1/facility/${facilityId}/cover_image/`;

    await uploadFile(
      url,
      formData,
      "POST",
      { Authorization: getAuthorizationHeader() },
      async (xhr: XMLHttpRequest) => {
        if (xhr.status === 200) {
          setEditCoverImage(false);
          await sleep(1000);
          queryClient.invalidateQueries({
            queryKey: ["facility", facilityId],
          });
          toast.success(t("cover_image_updated"));
          onSuccess();
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
  const handleCoverImageDelete = async (
    onSuccess: () => void,
    onError: () => void,
  ) => {
    try {
      await deleteAvatar();
      onSuccess();
    } catch {
      onError();
    }
  };

  if (isLoading || !facilityData) {
    return <Loading />;
  }

  const hasPermissionToEditCoverImage = true;

  //  TODO: get permissions from backend to delete facility

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
      <AvatarEditModal
        title={t("edit_cover_photo")}
        open={editCoverImage}
        imageUrl={facilityData?.read_cover_image_url}
        handleUpload={handleCoverImageUpload}
        handleDelete={handleCoverImageDelete}
        onOpenChange={(open) => setEditCoverImage(open)}
        hint={coverImageHint}
      />
      <div className="container mx-auto pt-2">
        <div className="mx-auto max-w-3xl space-y-6">
          <Card className="border-none bg-transparent shadow-none">
            <div className="group rounded-2xl relative h-64 w-full bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600">
              {facilityData?.read_cover_image_url ? (
                <>
                  <img
                    src={facilityData.read_cover_image_url}
                    alt={facilityData?.name}
                    className="h-full w-full object-cover rounded-2xl"
                  />
                  <div className="absolute rounded-2xl inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent transition-opacity group-hover:opacity-70" />
                </>
              ) : (
                <div className="relative rounded-2xl  h-full w-full bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.2),transparent)]" />
              )}
              <div className="absolute bottom-0 left-0 translate-x-0 translate-y-1/3">
                <div className="sm:px-4 px-8 inline-flex rounded-xl">
                  <Avatar
                    name={facilityData.name}
                    className="size-20 md:size-24 rounded-xl border-4 border-white shadow-lg"
                  />
                </div>
              </div>

              <div className="absolute bottom-0 left-0 translate-x-0 ml-32">
                <div className="flex flex-wrap items-center gap-4 md:gap-6">
                  <div className="flex-1 min-w-0 mb-2">
                    <div className="text-white">
                      <TooltipComponent content={facilityData?.name}>
                        <h1 className="text-lg sm:text-sm md:text-2xl lg:text-3xl font-bold">
                          {facilityData?.name}
                        </h1>
                      </TooltipComponent>
                      <TooltipComponent
                        content={facilityData?.facility_type}
                        side="right"
                      >
                        <h2 className="text-xs sm:text-sm md:text-base lg:text-base text-white/70">
                          {facilityData?.facility_type}
                        </h2>
                      </TooltipComponent>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {/* <AlertDialog>
                      TODO: add delete facility
                      <AlertDialogTrigger asChild>
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t("delete_facility")}
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {t("delete_facility")}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("delete_facility_confirmation", {
                              name: facilityData?.name,
                            })}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                          <div
                            onClick={() => deleteFacility()}
                            className={cn(
                              buttonVariants({ variant: "destructive" }),
                            )}
                            // disabled={isDeleting}
                          >
                            {isDeleting ? t("deleting") : t("delete")}
                          </div>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog> */}
                  </div>
                </div>
              </div>
              <div className="absolute right-0 bottom-0 p-1 text-white [@media(max-width:55rem)]:top-0">
                {hasPermissionToEditCoverImage && (
                  <Button
                    variant="link"
                    onClick={() => setEditCoverImage(true)}
                    aria-label={t("edit_cover_photo")}
                    size="sm"
                  >
                    <CareIcon
                      icon="l-pen"
                      className="text-white"
                      aria-hidden="true"
                    />
                    <span className="underline text-white">
                      {t("edit_cover_photo")}
                    </span>
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-2 space-y-2">
              <div className="flex justify-end gap-2 max-sm:flex-col sm:mt-4 mt-12 flex-wrap">
                <PLUGIN_Component
                  __name="FacilityHomeActions"
                  facility={facilityData}
                />
                <EditFacilitySheet
                  facilityId={facilityId}
                  trigger={
                    <Button
                      className="cursor-pointer font-semibold"
                      variant="outline"
                      size="sm"
                    >
                      <CareIcon icon="l-pen" />
                      {t("edit_facility_details")}
                    </Button>
                  }
                />
              </div>
              <div className="flex flex-col [@media(min-width:60rem)]:flex-row gap-2">
                <Card className="basis-1/2">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="col-span-1 sm:col-span-2 flex flex-col">
                        <span className="font-semibold">{t("address")}</span>
                        <span className="text-gray-700 whitespace-pre-wrap break-words text-sm">
                          {facilityData.address}
                        </span>
                      </div>

                      <div className="flex flex-col mt-2">
                        <span className="font-semibold">
                          {t("mobile_number")}
                        </span>
                        <span className="text-gray-700 truncate text-sm">
                          <ContactLink
                            tel={formatPhoneNumberIntl(
                              String(facilityData?.phone_number),
                            )}
                          />
                        </span>
                      </div>

                      <div className="flex flex-col mt-2">
                        <span className="font-semibold">
                          {t("location_details")}
                        </span>
                        <span className="text-sm">
                          {facilityData.latitude && facilityData.longitude && (
                            <FacilityMapsLink
                              latitude={facilityData.latitude.toString()}
                              longitude={facilityData.longitude.toString()}
                            />
                          )}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="basis-1/2 ">
                  <CardContent>
                    <div className="grid grid-cols-1 mt-6 sm:grid-cols-2 gap-4">
                      {facilityData.geo_organization &&
                        renderGeoOrganizations(
                          facilityData.geo_organization,
                        ).map((item, index) => (
                          <div key={index} className="flex flex-col">
                            <span className="font-semibold truncate">
                              {item.label}
                            </span>
                            <span className="text-gray-700 text-sm truncate">
                              {item.value}
                            </span>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {facilityData?.features?.some((feature: number) =>
                FACILITY_FEATURE_TYPES.some((f) => f.id === feature),
              ) && (
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="font-semibold text-lg">
                      {t("features")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {facilityData.features?.map((featureId) => (
                        <FeatureBadge
                          key={featureId}
                          featureId={featureId as number}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {facilityData?.description && (
                <Card>
                  <CardContent className="mt-4">
                    <Markdown
                      content={facilityData.description}
                      className="text-sm"
                    />
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
