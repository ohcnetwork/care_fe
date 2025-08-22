import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import Page from "@/components/Common/Page";

import query from "@/Utils/request/query";
import { PRODUCT_STATUS_COLORS } from "@/types/inventory/product/product";
import productApi from "@/types/inventory/product/productApi";
import { PRODUCT_KNOWLEDGE_TYPE_COLORS } from "@/types/inventory/productKnowledge/productKnowledge";

interface Props {
  facilityId: string;
  productId: string;
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

export default function ProductView({ facilityId, productId }: Props) {
  const { t } = useTranslation();

  const {
    data: product,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["product", productId],
    queryFn: query(productApi.retrieveProduct, {
      pathParams: {
        facilityId,
        productId,
      },
    }),
  });

  if (isLoading) {
    return (
      <Page title={t("loading")}>
        <LoadingSkeleton />
      </Page>
    );
  }

  if (isError || !product) {
    return (
      <Page title={t("error")}>
        <div className="container mx-auto max-w-3xl py-8">
          <Alert variant="destructive">
            <CareIcon icon="l-exclamation-triangle" className="size-4" />
            <AlertTitle>{t("error_loading_product")}</AlertTitle>
            <AlertDescription>{t("product_not_found")}</AlertDescription>
          </Alert>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate(`/facility/${facilityId}/settings/product`)}
          >
            <CareIcon icon="l-arrow-left" className="mr-2 size-4" />
            {t("back_to_list")}
          </Button>
        </div>
      </Page>
    );
  }

  return (
    <Page title={`Product: ${product.id}`} hideTitleOnPage={true}>
      <div className="container mx-auto max-w-3xl space-y-6">
        <Button
          variant="outline"
          size="xs"
          className="mb-2"
          onClick={() => navigate(`/facility/${facilityId}/settings/product`)}
        >
          <CareIcon icon="l-arrow-left" className="size-4" />
          {t("back")}
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Product ID: {product.id}</h1>
              <Badge variant={PRODUCT_STATUS_COLORS[product.status]}>
                {t(product.status)}
              </Badge>
            </div>
            {product.batch?.lot_number && (
              <p className="mt-1 text-sm text-gray-600">
                {t("lot_number")}: {product.batch.lot_number}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() =>
              navigate(
                `/facility/${facilityId}/settings/product/${product.id}/edit`,
              )
            }
          >
            <CareIcon icon="l-pen" className="mr-2 size-4" />
            {t("edit")}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("product_details")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">{t("status")}</p>
              <p className="font-medium">{t(product.status)}</p>
            </div>
            {product.batch?.lot_number && (
              <div>
                <p className="text-sm text-gray-500">{t("lot_number")}</p>
                <p className="text-gray-700">{product.batch.lot_number}</p>
              </div>
            )}
            {product.expiration_date && (
              <div>
                <p className="text-sm text-gray-500">{t("expiration_date")}</p>
                <p className="text-gray-700">
                  {format(new Date(product.expiration_date), "PPP")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("product_knowledge")}</CardTitle>
            <CardDescription>
              {t("product_knowledge_description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-gray-50/50 p-4 transition-colors hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        PRODUCT_KNOWLEDGE_TYPE_COLORS[
                          product.product_knowledge.product_type
                        ]
                      }
                    >
                      {t(product.product_knowledge.product_type)}
                    </Badge>
                  </div>
                  <h3 className="font-medium">
                    {product.product_knowledge.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {product.product_knowledge.slug}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    navigate(
                      `/facility/${facilityId}/settings/product_knowledge/${product.product_knowledge.id}`,
                    )
                  }
                >
                  <CareIcon icon="l-eye" className="mr-2 size-4" />
                  {t("view_details")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {product.charge_item_definition && (
          <Card>
            <CardHeader>
              <CardTitle>{t("charge_item_definition")}</CardTitle>
              <CardDescription>
                {t("charge_item_definition_description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-gray-50/50 p-4 transition-colors hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h3 className="font-medium">
                      {product.charge_item_definition.title ||
                        product.charge_item_definition.id}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {product.charge_item_definition.id}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      navigate(
                        `/facility/${facilityId}/settings/charge_item_definitions/${product.charge_item_definition.id}`,
                      )
                    }
                  >
                    <CareIcon icon="l-eye" className="mr-2 size-4" />
                    {t("view_details")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Page>
  );
}
