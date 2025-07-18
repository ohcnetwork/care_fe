import { useQuery } from "@tanstack/react-query";
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
import { Separator } from "@/components/ui/separator";

import Page from "@/components/Common/Page";

import query from "@/Utils/request/query";
import { Code } from "@/types/base/code/code";
import {
  PRODUCT_KNOWLEDGE_STATUS_COLORS,
  ProductName,
} from "@/types/inventory/productKnowledge/productKnowledge";
import productKnowledgeApi from "@/types/inventory/productKnowledge/productKnowledgeApi";

interface Props {
  facilityId: string;
  productKnowledgeId: string;
}

function CodeDisplay({ code }: { code: Code | null }) {
  if (!code) return null;
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium">{code.display}</p>
      <p className="text-xs text-gray-500">{code.system}</p>
      <p className="text-xs text-gray-500">{code.code}</p>
    </div>
  );
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

export default function ProductKnowledgeView({
  facilityId,
  productKnowledgeId,
}: Props) {
  const { t } = useTranslation();

  const {
    data: product,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["productKnowledge", productKnowledgeId],
    queryFn: query(productKnowledgeApi.retrieveProductKnowledge, {
      pathParams: { productKnowledgeId },
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
            <AlertTitle>{t("error_loading_product_knowledge")}</AlertTitle>
            <AlertDescription>
              {t("product_knowledge_not_found")}
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() =>
              navigate(`/facility/${facilityId}/settings/product_knowledge`)
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
    <Page title={product.name} hideTitleOnPage={true}>
      <div className="container mx-auto max-w-3xl space-y-6">
        <Button
          variant="outline"
          size="xs"
          className="mb-2"
          onClick={() =>
            navigate(`/facility/${facilityId}/settings/product_knowledge`)
          }
        >
          <CareIcon icon="l-arrow-left" className="size-4" />
          {t("back")}
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{product.name}</h1>
              <Badge variant={PRODUCT_KNOWLEDGE_STATUS_COLORS[product.status]}>
                {t(product.status)}
              </Badge>
            </div>
            {product.code && (
              <p className="mt-1 text-sm text-gray-600">
                {product.code.system} | {product.code.code}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() =>
              navigate(
                `/facility/${facilityId}/settings/product_knowledge/${product.id}/edit`,
              )
            }
          >
            <CareIcon icon="l-pen" className="mr-2 size-4" />
            {t("edit")}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("overview")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">{t("product_type")}</p>
              <p className="font-medium">{t(product.product_type)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t("slug")}</p>
              <p className="text-gray-700">{product.slug}</p>
            </div>
          </CardContent>
        </Card>

        {product.names && product.names.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("names")}</CardTitle>
              <CardDescription>
                {t("product_knowledge_names_description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {product.names.map((name: ProductName, index) => (
                  <div
                    key={index}
                    className="rounded-lg border bg-gray-50/50 p-4 transition-colors hover:bg-gray-50"
                  >
                    <div className="space-y-2">
                      <p className="font-medium">{name.name}</p>
                      <p className="text-sm text-gray-500">
                        {t(name.name_type)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {product.storage_guidelines &&
          product.storage_guidelines.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("storage_guidelines")}</CardTitle>
                <CardDescription>
                  {t("pk_form_storage_guidelines_description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {product.storage_guidelines.map((guideline, index) => (
                    <div
                      key={index}
                      className="rounded-lg border bg-gray-50/50 p-4 transition-colors hover:bg-gray-50"
                    >
                      <div className="space-y-4">
                        <p className="text-sm font-medium">{guideline.note}</p>
                        <Separator />
                        <div>
                          <p className="text-sm text-gray-500">
                            {t("stability_duration")}
                          </p>
                          <p className="font-medium">
                            {guideline.stability_duration.value}{" "}
                            {guideline.stability_duration.unit?.code || ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        {product.definitional && (
          <Card>
            <CardHeader>
              <CardTitle>{t("product_definition")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6">
                <div>
                  <p className="mb-2 text-sm text-gray-500">
                    {t("dosage_form")}
                  </p>
                  <div className="rounded-lg border bg-gray-50/50 p-3">
                    <CodeDisplay code={product.definitional.dosage_form} />
                  </div>
                </div>
                {product.definitional.intended_routes &&
                  product.definitional.intended_routes.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm text-gray-500">
                        {t("intended_routes")}
                      </p>
                      <div className="space-y-2">
                        {product.definitional.intended_routes.map(
                          (route, index) => (
                            <div
                              key={index}
                              className="rounded-lg border bg-gray-50/50 p-3"
                            >
                              <CodeDisplay code={route} />
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Page>
  );
}
