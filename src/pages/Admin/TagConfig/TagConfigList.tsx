import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { FilterSelect } from "@/components/ui/filter-select";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import Page from "@/components/Common/Page";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import {
  TagCategory,
  TagConfig,
  TagResource,
  TagStatus,
} from "@/types/emr/tagConfig/tagConfig";
import tagConfigApi from "@/types/emr/tagConfig/tagConfigApi";

import TagConfigForm from "./TagConfigForm";
import TagConfigTable from "./components/TagConfigTable";

interface TagConfigListProps {
  facilityId?: string;
}

export default function TagConfigList({ facilityId }: TagConfigListProps) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    disableCache: true,
  });

  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  // TODO: Remove this once we have a default status (robo's PR)
  useEffect(() => {
    if (!qParams.status) {
      updateQuery({ status: "active" });
    }
  }, []);

  const { data: response, isLoading } = useQuery({
    queryKey: ["tagConfig", qParams, facilityId],
    queryFn: query.debounced(tagConfigApi.list, {
      queryParams: {
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        search: qParams.search,
        status: qParams.status,
        category: qParams.category,
        resource: qParams.resource,
        parent_is_null: true,
        facility: facilityId,
      },
    }),
  });

  const configs = response?.results || [];

  const handleView = (config: TagConfig) => {
    if (facilityId) {
      navigate(`/facility/${facilityId}/settings/tag_config/${config.id}`);
    } else {
      navigate(`/admin/tag_config/${config.id}`);
    }
  };

  const handleAdd = () => {
    setIsSheetOpen(true);
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
  };

  const handleSheetOpenChange = (open: boolean) => {
    setIsSheetOpen(open);
  };

  return (
    <Page title={t("tag_config")} hideTitleOnPage>
      <div className="container mx-auto">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-700">
            {t("tag_config")}
          </h1>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">
                {t("manage_tag_config_description")}
              </p>
            </div>
            <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
              <Button onClick={handleAdd}>
                <CareIcon icon="l-plus" className="mr-2" />
                {t("add_tag_config")}
              </Button>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>{t("add_tag_config")}</SheetTitle>
                </SheetHeader>
                <div className="mt-6 pb-6">
                  <TagConfigForm
                    onSuccess={handleSheetClose}
                    facilityId={facilityId}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
            <div className="w-full md:w-auto">
              <div className="relative w-full md:w-auto">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <CareIcon icon="l-search" className="size-5" />
                </span>
                <Input
                  placeholder={t("search_tag_configs")}
                  value={qParams.search || ""}
                  onChange={(e) =>
                    updateQuery({ search: e.target.value || undefined })
                  }
                  className="w-full md:w-[300px] pl-10"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full sm:w-auto">
              <div className="flex-1 sm:flex-initial sm:w-auto">
                <FilterSelect
                  value={qParams.status || ""}
                  onValueChange={(value) => updateQuery({ status: value })}
                  options={Object.values(TagStatus)}
                  label={t("status")}
                  onClear={() => updateQuery({ status: undefined })}
                />
              </div>
              <div className="flex-1 sm:flex-initial sm:w-auto">
                <FilterSelect
                  value={qParams.category || ""}
                  onValueChange={(value) => updateQuery({ category: value })}
                  options={Object.values(TagCategory)}
                  label={t("category")}
                  onClear={() => updateQuery({ category: undefined })}
                />
              </div>
              <div className="flex-1 sm:flex-initial sm:w-auto">
                <FilterSelect
                  value={qParams.resource || ""}
                  onValueChange={(value) => updateQuery({ resource: value })}
                  options={Object.values(TagResource)}
                  label={t("resource")}
                  onClear={() => updateQuery({ resource: undefined })}
                />
              </div>
            </div>
          </div>
        </div>

        <TagConfigTable
          configs={configs}
          isLoading={isLoading}
          onView={handleView}
          showChildrenColumn={true}
          showArchiveAction={false}
          emptyStateTitle="no_tag_configs_found"
          emptyStateDescription="adjust_tag_config_filters"
          emptyStateIcon={"l-tag-alt" as IconName}
        />

        {response && response.count > resultsPerPage && (
          <div className="mt-4 flex justify-center">
            <Pagination totalCount={response.count} />
          </div>
        )}
      </div>
    </Page>
  );
}
