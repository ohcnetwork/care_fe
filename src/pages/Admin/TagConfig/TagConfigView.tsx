import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { navigate } from "raviger";
import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import Page from "@/components/Common/Page";
import { FormSkeleton } from "@/components/Common/SkeletonLoading";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import {
  TAG_STATUS_COLORS,
  TagConfig,
  TagStatus,
} from "@/types/emr/tagConfig/tagConfig";
import tagConfigApi from "@/types/emr/tagConfig/tagConfigApi";

import TagConfigForm from "./TagConfigForm";
import TagConfigTable from "./components/TagConfigTable";

interface TagConfigViewProps {
  tagId: string;
  facilityId?: string;
}

export default function TagConfigView({
  tagId,
  facilityId,
}: TagConfigViewProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [isEditSheetOpen, setIsEditSheetOpen] = React.useState(false);
  const [isAddChildSheetOpen, setIsAddChildSheetOpen] = React.useState(false);

  // Fetch tag details
  const { data: tagConfig, isLoading } = useQuery({
    queryKey: ["tagConfig", tagId, facilityId],
    queryFn: query(tagConfigApi.retrieve, {
      pathParams: { external_id: tagId },
      queryParams: facilityId ? { facility: facilityId } : undefined,
    }),
  });

  // Fetch child tags
  const { data: childrenResponse, isLoading: isLoadingChildren } = useQuery({
    queryKey: ["tagConfig", "children", tagId, facilityId],
    queryFn: query(tagConfigApi.list, {
      queryParams: {
        parent: tagId,
        limit: 100,
        facility: facilityId,
      },
    }),
    enabled: !!tagConfig,
  });

  const children = childrenResponse?.results || [];

  // Archive mutation for child tags
  const archiveMutation = useMutation({
    mutationFn: async (child: TagConfig) => {
      // First fetch the child to get its current data
      const queryFn = query(tagConfigApi.retrieve, {
        pathParams: { external_id: child.id! },
      });
      const childData = await queryFn({ signal: new AbortController().signal });

      // Then update with archived status
      return mutate(tagConfigApi.update, {
        pathParams: { external_id: child.id! },
      })({
        slug: childData.slug,
        display: childData.display,
        category: childData.category,
        description: childData.description || "",
        priority: childData.priority,
        status: TagStatus.ARCHIVED,
        resource: childData.resource,
        parent:
          childData.parent &&
          typeof childData.parent === "object" &&
          childData.parent.id
            ? childData.parent.id
            : null,
      });
    },
    onSuccess: () => {
      toast.success(t("child_tag_archived_successfully"));
      queryClient.invalidateQueries({
        queryKey: ["tagConfig", "children", tagId, facilityId],
      });
    },
    onError: (error: any) => {
      toast.error(error?.message || t("failed_to_archive_child_tag"));
    },
  });

  const handleEditSuccess = () => {
    setIsEditSheetOpen(false);
    queryClient.invalidateQueries({
      queryKey: ["tagConfig", tagId, facilityId],
    });
  };

  const handleAddChildSuccess = () => {
    setIsAddChildSheetOpen(false);
    queryClient.invalidateQueries({
      queryKey: ["tagConfig", "children", tagId, facilityId],
    });
  };

  const handleViewChild = (config: TagConfig) => {
    if (facilityId) {
      navigate(`/facility/${facilityId}/settings/tag_config/${config.id}`);
    } else {
      navigate(`/admin/tag_config/${config.id}`);
    }
  };

  const handleArchiveChild = (child: TagConfig) => {
    archiveMutation.mutate(child);
  };

  if (isLoading) {
    return (
      <Page title={t("tag_config_details")} hideTitleOnPage>
        <FormSkeleton rows={5} />
      </Page>
    );
  }

  if (!tagConfig) {
    return (
      <Page title={t("tag_config_details")} hideTitleOnPage>
        <EmptyState
          icon="l-tag-alt"
          title={t("tag_config_not_found")}
          description={t("tag_config_not_found_description")}
        />
      </Page>
    );
  }

  return (
    <Page title={tagConfig.display} hideTitleOnPage>
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {tagConfig.display}
              </h1>
              <p className="text-gray-600">{tagConfig.slug}</p>
            </div>
          </div>
          <Button onClick={() => setIsEditSheetOpen(true)}>
            <CareIcon icon="l-edit" className="size-4 mr-2" />
            {t("edit_tag")}
          </Button>
        </div>

        {/* Tag Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CareIcon icon="l-tag-alt" className="size-5" />
              {t("tag_details")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  {t("category")}
                </label>
                <div className="mt-1">
                  <Badge variant="secondary">{t(tagConfig.category)}</Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  {t("resource")}
                </label>
                <div className="mt-1">
                  <Badge variant="outline">{t(tagConfig.resource)}</Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  {t("status")}
                </label>
                <div className="mt-1">
                  <Badge variant={TAG_STATUS_COLORS[tagConfig.status]}>
                    {t(tagConfig.status)}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  {t("priority")}
                </label>
                <div className="mt-1 text-sm">{tagConfig.priority}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  {t("system_generated")}
                </label>
                <div className="mt-1 text-sm">
                  {tagConfig.system_generated ? t("yes") : t("no")}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  {t("has_children")}
                </label>
                <div className="mt-1 text-sm">
                  {tagConfig.has_children ? t("yes") : t("no")}
                </div>
              </div>
            </div>
            {tagConfig.description && (
              <div>
                <label className="text-sm font-medium text-gray-600">
                  {t("description")}
                </label>
                <div className="mt-1 text-sm text-gray-900">
                  {tagConfig.description}
                </div>
              </div>
            )}
            {tagConfig.parent &&
              typeof tagConfig.parent === "object" &&
              tagConfig.parent.id && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    {t("parent_tag")}
                  </label>
                  <div className="mt-1">
                    <Button
                      variant="link"
                      className="p-0 h-auto text-blue-600"
                      onClick={() =>
                        handleViewChild({
                          ...tagConfig.parent,
                          id: tagConfig.parent.id!,
                        } as TagConfig)
                      }
                    >
                      {tagConfig.parent.display}
                    </Button>
                  </div>
                </div>
              )}
          </CardContent>
        </Card>

        {/* Child Tags Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CareIcon icon="l-sitemap" className="size-5" />
                {t("child_tags")}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddChildSheetOpen(true)}
              >
                <CareIcon icon="l-plus" className="size-4 mr-2" />
                {t("add_child_tag")}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <TagConfigTable
              configs={children}
              isLoading={isLoadingChildren}
              onView={handleViewChild}
              onArchive={handleArchiveChild}
              showChildrenColumn={false}
              showArchiveAction={true}
              emptyStateTitle={t("no_child_tags_found")}
              emptyStateDescription={t("add_child_tags_to_organize_better")}
              emptyStateIcon={"l-sitemap" as IconName}
            />
          </CardContent>
        </Card>

        {/* Edit Sheet */}
        <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{t("edit_tag_config")}</SheetTitle>
            </SheetHeader>
            <div className="mt-6 pb-6">
              <TagConfigForm
                configId={tagId}
                onSuccess={handleEditSuccess}
                facilityId={facilityId}
              />
            </div>
          </SheetContent>
        </Sheet>

        {/* Add Child Sheet */}
        <Sheet open={isAddChildSheetOpen} onOpenChange={setIsAddChildSheetOpen}>
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{t("add_child_tag")}</SheetTitle>
            </SheetHeader>
            <div className="mt-6 pb-6">
              <TagConfigForm
                parentId={tagId}
                onSuccess={handleAddChildSuccess}
                facilityId={facilityId}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </Page>
  );
}
