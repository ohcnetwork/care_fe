import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Star } from "lucide-react";
import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Muted,
  CareUIPageTitle as PageTitle,
} from "@/components/ui/typography";

import Page from "@/components/Common/Page";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { getPermissions } from "@/common/Permissions";
import { usePermissions } from "@/context/PermissionContext";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import tokenCategoryApi from "@/types/tokens/tokenCategory/tokenCategoryApi";

import { TokenCategorySheet } from "./TokenCategorySheet";
import {
  TOKEN_CATEGORY_RESOURCE_TYPE_ICONS,
  tokenNumberPreview,
} from "./tokenCategoryResourceTypes";

interface Props {
  facilityId: string;
  tokenCategoryId: string;
}

export default function TokenCategoryView({
  facilityId,
  tokenCategoryId,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const listPath = `/facility/${facilityId}/settings/token_category`;

  const {
    data: tokenCategory,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["tokenCategory", tokenCategoryId],
    queryFn: query(tokenCategoryApi.get, {
      pathParams: {
        facility_id: facilityId,
        id: tokenCategoryId,
      },
    }),
  });

  const { mutate: setDefault, isPending: isSettingDefault } = useMutation({
    mutationFn: mutate(tokenCategoryApi.setDefault, {
      pathParams: {
        facility_id: facilityId,
        id: tokenCategoryId,
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tokenCategory", tokenCategoryId],
      });
      queryClient.invalidateQueries({ queryKey: ["tokenCategories"] });
    },
  });

  const { facility } = useCurrentFacility();
  const { hasPermission } = usePermissions();
  const { canWriteTokenCategory } = getPermissions(
    hasPermission,
    facility?.permissions ?? [],
  );

  const backButton = (
    <Button variant="ghost" size="sm" onClick={() => navigate(listPath)}>
      <ArrowLeft />
      {t("token_categories")}
    </Button>
  );

  if (isLoading) {
    return (
      <Page title={t("token_category")} hideTitleOnPage>
        <div className="container mx-auto max-w-3xl space-y-6">
          <Skeleton className="h-9 w-40" />
          <div className="space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-32" />
          </div>
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </Page>
    );
  }

  if (isError || !tokenCategory) {
    return (
      <Page title={t("token_category")} hideTitleOnPage>
        <div className="container mx-auto max-w-3xl space-y-6">
          {backButton}
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyTitle>{t("error_loading_token_category")}</EmptyTitle>
              <EmptyDescription>
                {t("token_category_not_found")}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" onClick={() => navigate(listPath)}>
                {t("back_to_list")}
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      </Page>
    );
  }

  const ResourceIcon =
    TOKEN_CATEGORY_RESOURCE_TYPE_ICONS[tokenCategory.resource_type];

  return (
    <Page title={tokenCategory.name} hideTitleOnPage>
      <div className="container mx-auto max-w-3xl space-y-6 text-foreground">
        {backButton}

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex min-w-0 items-start gap-4">
            <span className="inline-flex h-12 min-w-16 shrink-0 items-center justify-center rounded-lg border bg-muted/50 px-3 font-mono text-base font-semibold tracking-wider">
              {tokenCategory.shorthand}
            </span>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <PageTitle className="wrap-break-word">
                  {tokenCategory.name}
                </PageTitle>
                {tokenCategory.default && (
                  <Badge variant="primary">
                    <Star className="fill-current" />
                    {t("default")}
                  </Badge>
                )}
              </div>
              <Muted className="flex items-center gap-1.5">
                <ResourceIcon className="size-4" aria-hidden />
                {t(tokenCategory.resource_type)}
              </Muted>
            </div>
          </div>
          {canWriteTokenCategory && (
            <div className="flex shrink-0 flex-wrap gap-2">
              {!tokenCategory.default && (
                <Button
                  variant="outline"
                  onClick={() => setDefault({})}
                  disabled={isSettingDefault}
                >
                  {isSettingDefault ? <Spinner className="size-4" /> : <Star />}
                  {t(
                    isSettingDefault ? "setting_as_default" : "set_as_default",
                  )}
                </Button>
              )}
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Pencil />
                {t("edit")}
              </Button>
            </div>
          )}
        </div>

        <Frame stacked>
          <FrameHeader>
            <FrameTitle>{t("token_category_details")}</FrameTitle>
          </FrameHeader>
          <FramePanel>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <dt className="text-sm text-muted-foreground">{t("name")}</dt>
                <dd className="text-sm font-medium wrap-break-word">
                  {tokenCategory.name}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm text-muted-foreground">
                  {t("resource_type")}
                </dt>
                <dd className="text-sm font-medium">
                  {t(tokenCategory.resource_type)}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm text-muted-foreground">
                  {t("shorthand")}
                </dt>
                <dd className="font-mono text-sm font-medium">
                  {tokenCategory.shorthand}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm text-muted-foreground">
                  {t("token_number_format")}
                </dt>
                <dd className="font-mono text-sm font-medium">
                  {tokenNumberPreview(tokenCategory.shorthand)}
                </dd>
              </div>
            </dl>
          </FramePanel>
        </Frame>
      </div>

      <TokenCategorySheet
        facilityId={facilityId}
        state={isEditing ? { mode: "edit", tokenCategory } : null}
        onClose={() => setIsEditing(false)}
      />
    </Page>
  );
}
