import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ExpandableText,
  ExpandableTextContent,
  ExpandableTextExpandButton,
} from "@/components/ui/expandable-text";

import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import {
  CardGridSkeleton,
  TableSkeleton,
} from "@/components/Common/SkeletonLoading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/Common/Table";

import {
  TAG_STATUS_COLORS,
  TagConfig,
  TagStatus,
} from "@/types/emr/tagConfig/tagConfig";

interface TagConfigTableProps {
  configs: TagConfig[];
  isLoading: boolean;
  onView: (id: string) => void;
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
  onView: (id: string) => void;
  showArchiveAction?: boolean;
  onArchive?: (config: TagConfig) => void;
}) {
  const { t } = useTranslation();
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);

  const handleCardClick = () => {
    onView(config.id);
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleCardClick}
    >
      <CardContent className="p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant={TAG_STATUS_COLORS[config.status]}>
                {t(config.status)}
              </Badge>
              <Badge variant="secondary">{t(config.category)}</Badge>
              {config.has_children && (
                <Badge variant="blue">
                  <CareIcon icon="l-sitemap" className="size-3 mr-1" />
                  {t("has_children")}
                </Badge>
              )}
            </div>
            <h3 className="font-medium text-gray-900 text-lg">
              {config.display}
            </h3>
            <p className="mt-1 text-sm text-gray-500 capitalize">
              {t(config.resource)} | {t("priority")}: {config.priority}
            </p>
            {config.description && (
              <ExpandableText>
                <ExpandableTextContent className="mt-2 text-sm text-gray-600">
                  {config.description}
                </ExpandableTextContent>
                <ExpandableTextExpandButton>
                  {t("read_more")}
                </ExpandableTextExpandButton>
              </ExpandableText>
            )}
          </div>
          <div
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            {showArchiveAction && onArchive && config.status !== "archived" && (
              <>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowArchiveDialog(true)}
                >
                  <CareIcon icon="l-trash" className="size-4" />
                </Button>
                <ConfirmActionDialog
                  open={showArchiveDialog}
                  onOpenChange={setShowArchiveDialog}
                  title={t("archive_child_tag")}
                  description={t("archive_child_tag_confirmation", {
                    name: config.display,
                  })}
                  variant="destructive"
                  onConfirm={() => {
                    onArchive(config);
                  }}
                  confirmText={t("archive")}
                />
              </>
            )}
            <Button variant="outline" size="sm">
              <CareIcon icon="l-arrow-right" className="size-4" />
              {t("view")}
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
  const [tagConfigToArchive, setTagConfigToArchive] =
    useState<TagConfig | null>(null);

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
        icon={
          <CareIcon icon={emptyStateIcon} className="text-primary size-6" />
        }
        title={t(emptyStateTitle)}
        description={t(emptyStateDescription)}
      />
    );
  }

  // Sort configs to show active tags first
  const sortedConfigs = [...configs].sort((a, b) => {
    if (a.status === TagStatus.ACTIVE && b.status !== TagStatus.ACTIVE)
      return -1;
    if (a.status !== TagStatus.ACTIVE && b.status === TagStatus.ACTIVE)
      return 1;
    return 0;
  });

  return (
    <>
      {/* Mobile Card View */}
      <div className="grid gap-4 md:hidden">
        {sortedConfigs.map((config: TagConfig) => (
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
              {sortedConfigs.map((config: TagConfig) => (
                <TableRow key={config.id} className="divide-x hover:bg-gray-50">
                  <TableCell className="font-medium">
                    <div className="flex flex-col text-sm break-words whitespace-normal">
                      <span>{config.display}</span>
                      {config.description && (
                        <ExpandableText>
                          <ExpandableTextContent className="text-gray-500">
                            {config.description}
                          </ExpandableTextContent>
                          <ExpandableTextExpandButton>
                            {t("read_more")}
                          </ExpandableTextExpandButton>
                        </ExpandableText>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {t(config.category)}
                    </Badge>
                  </TableCell>
                  <TableCell>{t(config.resource)}</TableCell>
                  <TableCell>{config.priority}</TableCell>
                  <TableCell>
                    <Badge variant={TAG_STATUS_COLORS[config.status]}>
                      {t(config.status)}
                    </Badge>
                  </TableCell>
                  {showChildrenColumn && (
                    <TableCell>
                      {config.has_children && (
                        <Badge variant="blue">
                          <CareIcon icon="l-sitemap" className="size-3 mr-1" />
                          {t("yes")}
                        </Badge>
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <div
                      className="flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onView(config.id);
                        }}
                      >
                        <CareIcon icon="l-eye" className="size-4" />
                        {t("view")}
                      </Button>
                      {showArchiveAction &&
                        onArchive &&
                        config.status !== "archived" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => setTagConfigToArchive(config)}
                            >
                              <CareIcon icon="l-trash" className="size-4" />
                              {t("archive")}
                            </Button>
                            <ConfirmActionDialog
                              open={!!tagConfigToArchive}
                              onOpenChange={(open) =>
                                !open && setTagConfigToArchive(null)
                              }
                              title={t("archive_child_tag")}
                              description={
                                <>
                                  {t("archive_child_tag_confirmation", {
                                    name: tagConfigToArchive?.display,
                                  })}
                                </>
                              }
                              variant="destructive"
                              onConfirm={() => {
                                onArchive(tagConfigToArchive!);
                              }}
                              confirmText={t("archive")}
                            />
                          </>
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
