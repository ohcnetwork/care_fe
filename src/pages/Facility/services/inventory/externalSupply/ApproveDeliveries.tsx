import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircleIcon } from "lucide-react";
import { useNavigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import Page from "@/components/Common/Page";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { ProductKnowledgeSelect } from "@/pages/Facility/services/inventory/ProductKnowledgeSelect";
import { SupplierSelect } from "@/pages/Facility/services/inventory/SupplierSelect";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import {
  SupplyDeliveryCondition,
  SupplyDeliveryRead,
  SupplyDeliveryStatus,
  SupplyDeliveryUpdate,
} from "@/types/inventory/supplyDelivery/supplyDelivery";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";
import { Organization } from "@/types/organization/organization";

import ExternalSupplyDeliveryApprovalTable from "./components/ExternalSupplyDeliveryApprovalTable";

interface Props {
  facilityId: string;
  locationId: string;
}

export function ApproveExternalSupplyDelivery({
  facilityId,
  locationId,
}: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedDeliveries, setSelectedDeliveries] = useState<
    SupplyDeliveryRead[]
  >([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Organization>();
  const [selectedProduct, setSelectedProduct] =
    useState<ProductKnowledgeBase>();

  const { data: response, isLoading } = useQuery({
    queryKey: [
      "externalSupplyDeliveries",
      "pendingApprovals",
      facilityId,
      locationId,
      { selectedSupplier, selectedProduct },
    ],
    queryFn: query(supplyDeliveryApi.listSupplyDelivery, {
      queryParams: {
        facility: facilityId,
        limit: 100,
        status: SupplyDeliveryStatus.in_progress,
        destination: locationId,
        origin_isnull: true,
        supplier: selectedSupplier?.id,
        supplied_item_product_knowledge: selectedProduct?.id,
      },
    }),
  });

  const deliveries = response?.results || [];

  // Combine filtered deliveries with selected deliveries that might be filtered out
  const allDeliveries = [
    ...deliveries,
    ...selectedDeliveries.filter(
      (selected) => !deliveries.some((d) => d.id === selected.id),
    ),
  ];

  const handleDeliverySelect = (delivery: SupplyDeliveryRead) => {
    setSelectedDeliveries((prev) =>
      prev.some((d) => d.id === delivery.id)
        ? prev.filter((d) => d.id !== delivery.id)
        : [
            ...prev,
            {
              ...delivery,
              supplied_item_condition: SupplyDeliveryCondition.normal,
            },
          ],
    );
  };

  const handleDeliveryConditionChange = (
    deliveryId: string,
    condition: SupplyDeliveryCondition,
  ) => {
    setSelectedDeliveries((prev) =>
      prev.map((d) =>
        d.id === deliveryId ? { ...d, supplied_item_condition: condition } : d,
      ),
    );
  };

  const batchRequest = useMutation({
    mutationFn: mutate(routes.batchRequest),
    onSuccess: () => {
      toast.success(t("deliveries_approved"));
      navigate("/external_supply/incoming_deliveries");
    },
    onError: () => {
      toast.error(t("error_approving_deliveries"));
    },
  });

  const approveDeliveries = () => {
    batchRequest.mutate({
      requests: selectedDeliveries.map((delivery) => ({
        url: supplyDeliveryApi.updateSupplyDelivery.path.replace(
          "{supplyDeliveryId}",
          delivery.id,
        ),
        method: supplyDeliveryApi.updateSupplyDelivery.method,
        reference_id: `approve-delivery-${delivery.id}`,
        body: {
          status: SupplyDeliveryStatus.completed,
          supplied_item_condition: delivery.supplied_item_condition,
        } satisfies SupplyDeliveryUpdate,
      })),
    });
  };

  const handleClearFilters = () => {
    setSelectedProduct(undefined);
    setSelectedSupplier(undefined);
  };

  return (
    <Page
      title={t("approve_external_supply_deliveries")}
      options={
        <Button
          size="sm"
          disabled={selectedDeliveries.length === 0 || batchRequest.isPending}
          onClick={approveDeliveries}
        >
          {batchRequest.isPending ? (
            <CareIcon icon="l-spinner" className="animate-spin" />
          ) : (
            <CheckCircleIcon />
          )}
          {t("approve")} ({selectedDeliveries.length})
        </Button>
      }
    >
      <Separator className="my-4" />
      <div className="container mx-auto space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">
                  {t("pending_deliveries")}
                </p>
                <p className="text-2xl font-semibold">{allDeliveries.length}</p>
              </div>
              <div className="rounded-full bg-amber-100 p-3 text-amber-700">
                <CareIcon icon="l-box" className="size-6" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">
                  {t("selected_for_approval")}
                </p>
                <p className="text-2xl font-semibold">
                  {selectedDeliveries.length}
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-3 text-green-700">
                <CareIcon icon="l-check" className="size-6" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">
                  {t("delivery_conditions")}
                </p>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-green-600">
                    {
                      selectedDeliveries.filter(
                        (d) =>
                          d.supplied_item_condition ===
                          SupplyDeliveryCondition.normal,
                      ).length
                    }{" "}
                    {t("normal")}
                  </p>
                  <p className="text-sm font-medium text-red-600">
                    {
                      selectedDeliveries.filter(
                        (d) =>
                          d.supplied_item_condition ===
                          SupplyDeliveryCondition.damaged,
                      ).length
                    }{" "}
                    {t("damaged")}
                  </p>
                </div>
              </div>
              <div className="rounded-full bg-blue-100 p-3 text-blue-700">
                <CareIcon icon="l-tag" className="size-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  {t("filter_deliveries")}
                </h3>
                {(selectedProduct || selectedSupplier) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearFilters}
                  >
                    <CareIcon icon="l-times" />
                    {t("clear_filters")}
                  </Button>
                )}
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <ProductKnowledgeSelect
                  value={selectedProduct}
                  onChange={setSelectedProduct}
                  className="w-full sm:w-[300px]"
                />
                <SupplierSelect
                  value={selectedSupplier}
                  onChange={setSelectedSupplier}
                  className="w-full sm:w-[300px]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <ExternalSupplyDeliveryApprovalTable
          deliveries={allDeliveries}
          isLoading={isLoading}
          selectedDeliveries={selectedDeliveries}
          onDeliverySelect={handleDeliverySelect}
          onDeliveryConditionChange={handleDeliveryConditionChange}
          facilityId={facilityId}
          locationId={locationId}
        />
      </div>
    </Page>
  );
}
