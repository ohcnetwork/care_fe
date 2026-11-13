import { LucideIcon, Pencil, Plus, Star } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";

import { SchedulableResourceType } from "@/types/scheduling/schedule";
import { TokenCategoryRead } from "@/types/tokens/tokenCategory/tokenCategory";

import { tokenNumberPreview } from "./tokenCategoryResourceTypes";

interface Props {
  resourceType: SchedulableResourceType;
  icon: LucideIcon;
  tokenCategories: TokenCategoryRead[];
  isLoading: boolean;
  canWrite: boolean;
  onAdd: () => void;
  onEdit: (tokenCategory: TokenCategoryRead) => void;
}

export function TokenCategoryGroup({
  resourceType,
  icon: Icon,
  tokenCategories,
  isLoading,
  canWrite,
  onAdd,
  onEdit,
}: Props) {
  const { t } = useTranslation();
  const headingId = `token-category-group-${resourceType}`;
  const resourceTypeLabel = t(resourceType);

  return (
    <section aria-labelledby={headingId} data-cy={headingId}>
      <Frame stacked>
        <FrameHeader className="flex-row items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground shadow-xs">
            <Icon className="size-4" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <FrameTitle className="flex items-center gap-2">
              <h2 id={headingId} className="text-base leading-6 font-semibold">
                {resourceTypeLabel}
              </h2>
              {!isLoading && (
                <Badge variant="neutral" aria-hidden>
                  {tokenCategories.length}
                </Badge>
              )}
            </FrameTitle>
            <FrameDescription>
              {t(`token_category_group_description__${resourceType}`)}
            </FrameDescription>
          </div>
          {canWrite && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAdd}
              aria-label={t("add_token_category_for_resource_type", {
                resource_type: resourceTypeLabel,
              })}
            >
              <Plus />
              <span className="max-sm:sr-only">{t("add")}</span>
            </Button>
          )}
        </FrameHeader>

        <FramePanel className="overflow-hidden p-0">
          {isLoading ? (
            <div className="divide-y">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3.5 p-4">
                  <Skeleton className="h-8 w-14" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : tokenCategories.length === 0 ? (
            <Empty className="rounded-none border-0 bg-transparent py-8">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Icon />
                </EmptyMedia>
                <EmptyTitle>
                  {t("no_token_categories_for_resource_type", {
                    resource_type: resourceTypeLabel,
                  })}
                </EmptyTitle>
                <EmptyDescription>
                  {t("no_token_categories_for_resource_type_description")}
                </EmptyDescription>
              </EmptyHeader>
              {canWrite && (
                <EmptyContent>
                  <Button variant="outline" size="sm" onClick={onAdd}>
                    <Plus />
                    {t("add_token_category")}
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          ) : (
            <ItemGroup role="list" className="gap-0">
              {tokenCategories.map((tokenCategory) => (
                <Item
                  key={tokenCategory.id}
                  role="listitem"
                  className="rounded-none border-0 border-border not-last:border-b"
                >
                  <ItemMedia>
                    <span className="inline-flex h-8 min-w-14 items-center justify-center rounded-md border bg-muted/50 px-2 font-mono text-xs font-semibold tracking-wider">
                      {tokenCategory.shorthand}
                    </span>
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                    <ItemTitle className="line-clamp-none">
                      <h3 className="text-sm font-medium text-wrap wrap-break-word">
                        {tokenCategory.name}
                      </h3>
                    </ItemTitle>
                    <ItemDescription>
                      {tokenCategory.default && (
                        <>
                          <span className="font-medium text-primary-700 dark:text-primary-400">
                            <Star
                              className="mr-1 inline size-3.5 -translate-y-px fill-current"
                              aria-hidden
                            />
                            {t("default")}
                          </span>
                          <span aria-hidden> · </span>
                        </>
                      )}
                      {t("token_category_issued_as", {
                        token: tokenNumberPreview(tokenCategory.shorthand),
                      })}
                    </ItemDescription>
                  </ItemContent>
                  {canWrite && (
                    <ItemActions>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(tokenCategory)}
                        aria-label={t("edit_named_token_category", {
                          name: tokenCategory.name,
                        })}
                      >
                        <Pencil />
                        <span className="max-sm:sr-only">{t("edit")}</span>
                      </Button>
                    </ItemActions>
                  )}
                </Item>
              ))}
            </ItemGroup>
          )}
        </FramePanel>
      </Frame>
    </section>
  );
}
