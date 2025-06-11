import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Page from "@/components/Common/Page";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import {
  InventoryStatus,
  InventoryStatusOptions,
} from "@/types/inventory/product/inventory";
import inventoryApi from "@/types/inventory/product/inventoryApi";

interface StockLevelOption {
  label: string;
  icon: string;
  max?: number;
  min?: number;
}

const STOCK_LEVEL_OPTIONS: Record<string, StockLevelOption> = {
  all: {
    label: "all_stock",
    icon: "l-box",
  },
  in_stock: {
    label: "in_stock",
    icon: "l-check-circle",
    min: 999,
  },
  low_stock: {
    label: "low_stock",
    icon: "l-exclamation-triangle",
    min: 1,
    max: 999,
  },
  no_stock: {
    label: "no_stock",
    icon: "l-times-circle",
    max: 0,
  },
} as const;

interface InventoryListProps {
  facilityId: string;
  locationId: string;
}

export function InventoryList({ facilityId, locationId }: InventoryListProps) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 14,
    disableCache: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["inventory", facilityId, locationId, qParams],
    queryFn: query(inventoryApi.list, {
      pathParams: { facilityId, locationId },
      queryParams: {
        status: qParams.status,
        facility: facilityId,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        net_content_max: qParams.stock_level
          ? STOCK_LEVEL_OPTIONS[
              qParams.stock_level as keyof typeof STOCK_LEVEL_OPTIONS
            ].max
          : undefined,
        net_content_min: qParams.stock_level
          ? STOCK_LEVEL_OPTIONS[
              qParams.stock_level as keyof typeof STOCK_LEVEL_OPTIONS
            ].min
          : undefined,
      },
    }),
  });

  return (
    <Page
      title={t("inventory")}
      options={
        <Select
          value={qParams.status ? qParams.status : "all"}
          onValueChange={(value: InventoryStatus | "all") =>
            updateQuery({ status: value === "all" ? undefined : value })
          }
        >
          <SelectTrigger className="max-w-42">
            <div className="flex items-center gap-2">
              <CareIcon icon="l-filter" className="size-4" />
              <SelectValue placeholder={t("status")} />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all_statuses")}</SelectItem>
            {InventoryStatusOptions.map((status) => (
              <SelectItem key={status} value={status}>
                {t(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      {/* Stock Level Tabs */}
      <div className="mb-4 pt-6">
        <Tabs
          value={qParams.stock_level || "all"}
          onValueChange={(value) => updateQuery({ stock_level: value })}
          className="w-full"
        >
          <TabsList className="w-full justify-evenly sm:justify-start border-b rounded-none bg-transparent p-0 h-auto overflow-x-auto">
            {Object.entries(STOCK_LEVEL_OPTIONS).map(([key, { label }]) => (
              <TabsTrigger
                key={key}
                value={key}
                className="border-b-2 px-2 sm:px-4 py-2 text-gray-600 hover:text-gray-900 data-[state=active]:border-b-primary-700 data-[state=active]:text-primary-800 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none"
              >
                <CareIcon icon={STOCK_LEVEL_OPTIONS[key].icon as IconName} />
                {t(label)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="rounded-md border">
          <TableSkeleton count={10} />
        </div>
      ) : !data?.results?.length ? (
        <EmptyState
          icon="l-box"
          title={t("no_inventory")}
          description={t("no_inventory_description")}
        />
      ) : (
        <div className="overflow-hidden rounded-md border-2 border-white shadow-md">
          <Table className="rounded-md">
            <TableHeader className=" bg-gray-100 text-gray-700">
              <TableRow className="divide-x">
                <TableHead className="text-gray-700">{t("product")}</TableHead>
                <TableHead className="text-gray-700">
                  {t("net_content")}
                </TableHead>
                <TableHead className="text-gray-700">{t("status")}</TableHead>
                <TableHead className="text-gray-700">
                  {t("expiration_date")}
                </TableHead>
                <TableHead className="text-gray-700">{t("batch")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white">
              {data?.results?.map((inventory) => (
                <TableRow
                  key={inventory.id}
                  className="hover:bg-gray-50 divide-x"
                >
                  <TableCell className="font-semibold text-gray-950">
                    <Link
                      href={`/facility/${facilityId}/settings/product_knowledge/${inventory.product.product_knowledge.id}`}
                      basePath="/"
                      className="flex items-center gap-2"
                    >
                      {inventory.product.product_knowledge.name}
                      <CareIcon
                        icon="l-external-link-alt"
                        className="size-4 text-gray-500"
                      />
                    </Link>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "font-medium",
                      "text-gray-950",
                      inventory.net_content < 10 && "text-yellow-600",
                    )}
                  >
                    {inventory.net_content}
                  </TableCell>
                  <TableCell className="font-medium">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "capitalize",
                        {
                          active: "bg-green-100 text-green-800",
                          inactive: "bg-gray-100 text-gray-800",
                          entered_in_error: "bg-red-100 text-red-800",
                        }[inventory.status],
                      )}
                    >
                      {t(inventory.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-gray-950">
                    {inventory.product.expiration_date
                      ? new Date(
                          inventory.product.expiration_date,
                        ).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell className="font-medium text-gray-950">
                    {inventory.product.batch?.lot_number || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="mt-8 flex justify-center">
        <Pagination totalCount={data?.count || 0} />
      </div>
    </Page>
  );
}
