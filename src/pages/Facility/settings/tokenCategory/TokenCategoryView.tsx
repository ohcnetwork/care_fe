import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import Page from "@/components/Common/Page";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { SCHEDULABLE_RESOURCE_TYPE_COLORS } from "@/types/scheduling/schedule";
import tokenCategoryApi from "@/types/tokens/tokenCategory/tokenCategoryApi";

interface Props {
  facilityId: string;
  tokenCategoryId: string;
}

function LoadingSkeleton() {
  return (
    <div className="container mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded-md bg-gray-200" />
          <div className="h-4 w-32 animate-pulse rounded-md bg-gray-200" />
        </div>
      </div>
      <div className="space-y-6">
        <div className="rounded-lg border border-gray-200 p-6">
          <div className="space-y-4">
            <div className="h-6 w-32 animate-pulse rounded-md bg-gray-200" />
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded-md bg-gray-200" />
              <div className="h-4 w-3/4 animate-pulse rounded-md bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TokenCategoryView({
  facilityId,
  tokenCategoryId,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

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
      // Invalidate and refetch the token category data
      queryClient.invalidateQueries({
        queryKey: ["tokenCategory", tokenCategoryId],
      });
      // Also invalidate the list to refresh any default indicators
      queryClient.invalidateQueries({
        queryKey: ["tokenCategories"],
      });
    },
  });

  const handleSetDefault = () => {
    setDefault({});
  };

  if (isLoading) {
    return (
      <Page title={t("loading")}>
        <LoadingSkeleton />
      </Page>
    );
  }

  if (isError || !tokenCategory) {
    return (
      <Page title={t("error")}>
        <div className="container mx-auto max-w-3xl py-8">
          <Alert variant="destructive">
            <CareIcon icon="l-exclamation-triangle" className="size-4" />
            <AlertTitle>{t("error_loading_token_category")}</AlertTitle>
            <AlertDescription>{t("token_category_not_found")}</AlertDescription>
          </Alert>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() =>
              navigate(`/facility/${facilityId}/settings/token_category`)
            }
          >
            <CareIcon icon="l-arrow-left" className="mr-2 size-4" />
            {t("back_to_list")}
          </Button>
        </div>
      </Page>
    );
  }

  return (
    <Page
      title={`Token Category: ${tokenCategory.name}`}
      hideTitleOnPage={true}
    >
      <div className="container mx-auto max-w-3xl space-y-6">
        <Button
          variant="outline"
          size="xs"
          className="mb-2"
          onClick={() =>
            navigate(`/facility/${facilityId}/settings/token_category`)
          }
        >
          <CareIcon icon="l-arrow-left" className="size-4" />
          {t("back")}
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{tokenCategory.name}</h1>
              <Badge
                variant={
                  SCHEDULABLE_RESOURCE_TYPE_COLORS[tokenCategory.resource_type]
                }
              >
                {t(tokenCategory.resource_type)}
              </Badge>
            </div>
            {tokenCategory.shorthand && (
              <p className="mt-1 text-sm text-gray-600">
                {t("shorthand")}: {tokenCategory.shorthand}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            {!tokenCategory.default && (
              <Button
                variant="outline"
                onClick={handleSetDefault}
                disabled={isSettingDefault}
              >
                <CareIcon icon="l-star" className="mr-2 size-4" />
                {isSettingDefault
                  ? t("setting_as_default")
                  : t("set_as_default")}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() =>
                navigate(
                  `/facility/${facilityId}/settings/token_category/${tokenCategory.id}/edit`,
                )
              }
            >
              <CareIcon icon="l-pen" className="mr-2 size-4" />
              {t("edit")}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("token_category_details")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">{t("name")}</p>
              <p className="font-medium">{tokenCategory.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t("resource_type")}</p>
              <p className="text-gray-700">{t(tokenCategory.resource_type)}</p>
            </div>
            {tokenCategory.shorthand && (
              <div>
                <p className="text-sm text-gray-500">{t("shorthand")}</p>
                <p className="text-gray-700">{tokenCategory.shorthand}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">{t("id")}</p>
              <p className="text-gray-700 font-mono text-sm">
                {tokenCategory.id}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
