import React from "react";
import { useTranslation } from "react-i18next";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  CardGridSkeleton,
  TableSkeleton,
} from "@/components/Common/SkeletonLoading";

import { TagConfig, TagStatus } from "@/types/emr/tagConfig/tagConfig";

const TAG_STATUS_STYLES = {
  [TagStatus.ACTIVE]: "border-green-200 bg-green-50 text-green-800",
  [TagStatus.ARCHIVED]: "border-gray-200 bg-gray-50 text-gray-800",
};

interface TagConfigTableProps {
  configs: TagConfig[];
  isLoading: boolean;
  onView: (config: TagConfig) => void;
  onArchive?: (config: TagConfig) => void;
  showChildrenColumn?: boolean;
  showArchiveAction?: boolean;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  emptyStateIcon?: IconName;
}

function TagConfigCard({
  config,
  onView,
  showArchiveAction = false,
  onArchive,
}: {
  config: TagConfig;
  onView: (config: TagConfig) => void;
  showArchiveAction?: boolean;
  onArchive?: (config: TagConfig) => void;
}) {
  const { t } = useTranslation();

  const handleCardClick = () => {
    onView(config);
  };

  const handleArchiveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onArchive?.(config);
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleCardClick}
    >
      <CardContent className="p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <Badge
                variant="outline"
                className={TAG_STATUS_STYLES[config.status]}
              >
                {t(config.status)}
              </Badge>
              <Badge variant="secondary">{t(config.category)}</Badge>
              {config.has_children && (
                <Badge
                  variant="outline"
                  className="text-blue-600 border-blue-200"
                >
                  <CareIcon icon="l-sitemap" className="size-3 mr-1" />
                  {t("has_children")}
                </Badge>
              )}
            </div>
            <h3 className="font-medium text-gray-900">{config.display}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {config.resource} | Priority: {config.priority}
            </p>
            {config.description && (
              <p className="mt-2 text-sm text-gray-600">{config.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {showArchiveAction && onArchive && (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700"
                onClick={handleArchiveClick}
              >
                <CareIcon icon="l-trash" className="size-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm">
              <CareIcon icon="l-arrow-right" className="size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TagConfigTable({
  configs,
  isLoading,
  onView,
  onArchive,
  showChildrenColumn = true,
  showArchiveAction = false,
  emptyStateTitle = "no_tag_configs_found",
  emptyStateDescription = "adjust_tag_config_filters",
  emptyStateIcon = "l-tag-alt" as IconName,
}: TagConfigTableProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 md:hidden">
          <CardGridSkeleton count={4} />
        </div>
        <div className="hidden md:block">
          <TableSkeleton count={5} />
        </div>
      </>
    );
  }

  if (configs.length === 0) {
    return (
      <EmptyState
        icon={emptyStateIcon}
        title={t(emptyStateTitle)}
        description={t(emptyStateDescription)}
      />
    );
  }

  return (
    <>
      {/* Mobile Card View */}
      <div className="grid gap-4 md:hidden">
        {configs.map((config: TagConfig) => (
          <TagConfigCard
            key={config.id}
            config={config}
            onView={onView}
            showArchiveAction={showArchiveAction}
            onArchive={onArchive}
          />
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <div className="rounded-lg border">
          <Table>
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead>{t("display")}</TableHead>
                <TableHead>{t("category")}</TableHead>
                <TableHead>{t("resource")}</TableHead>
                <TableHead>{t("priority")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                {showChildrenColumn && <TableHead>{t("children")}</TableHead>}
                <TableHead>{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white">
              {configs.map((config: TagConfig) => (
                <TableRow
                  key={config.id}
                  className="divide-x cursor-pointer hover:bg-gray-50"
                  onClick={() => onView(config)}
                >
                  <TableCell className="font-medium">
                    <div>
                      <div>{config.display}</div>
                      {config.description && (
                        <div className="text-sm text-gray-500">
                          {config.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{t(config.category)}</Badge>
                  </TableCell>
                  <TableCell>{t(config.resource)}</TableCell>
                  <TableCell>{config.priority}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={TAG_STATUS_STYLES[config.status]}
                    >
                      {t(config.status)}
                    </Badge>
                  </TableCell>
                  {showChildrenColumn && (
                    <TableCell>
                      {config.has_children && (
                        <Badge
                          variant="outline"
                          className="text-blue-600 border-blue-200"
                        >
                          <CareIcon icon="l-sitemap" className="size-3 mr-1" />
                          {t("yes")}
                        </Badge>
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onView(config);
                        }}
                      >
                        <CareIcon icon="l-eye" className="size-4" />
                        {t("view")}
                      </Button>
                      {showArchiveAction && onArchive && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <CareIcon icon="l-trash" className="size-4" />
                              {t("archive")}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {t("archive_child_tag")}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {t("archive_child_tag_confirmation", {
                                  name: config.display,
                                })}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                {t("cancel")}
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onArchive(config)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {t("archive")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
