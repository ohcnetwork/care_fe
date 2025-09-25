import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import type React from "react";
import { useTranslation } from "react-i18next";

import Loading from "@/components/Common/Loading";

import PrintPreview from "@/CAREUI/misc/PrintPreview";
import query from "@/Utils/request/query";
import { formatPatientAge } from "@/Utils/utils";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { MonetaryComponentType } from "@/types/base/monetaryComponent/monetaryComponent";
import accountApi from "@/types/billing/account/accountApi";
import {
  ChargeItemRead,
  ChargeItemStatus,
} from "@/types/billing/chargeItem/chargeItem";
import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";
import patientApi from "@/types/emr/patient/patientApi";
import { formatPhoneNumberIntl } from "react-phone-number-input";

interface DetailRowProps {
  label: string;
  value?: string | null;
  isStrong?: boolean;
}

const DetailRow = ({ label, value, isStrong = false }: DetailRowProps) => {
  return (
    <div className="flex">
      <span className="text-gray-600 w-32">{label}</span>
      <span className="text-gray-600">: </span>
      <span className={`ml-1 ${isStrong ? "font-semibold" : ""}`}>
        {value || "-"}
      </span>
    </div>
  );
};

export const PrintChargeItems = (props: {
  facilityId: string;
  accountId: string;
}) => {
  const { facilityId, accountId } = props;
  const { facility } = useCurrentFacility();
  const { t } = useTranslation();

  const { data: account } = useQuery({
    queryKey: ["account", accountId],
    queryFn: query(accountApi.retrieveAccount, {
      pathParams: { facilityId, accountId },
    }),
  });

  const { data: patient } = useQuery({
    queryKey: ["patient", account?.patient?.id],
    queryFn: query(patientApi.getPatient, {
      pathParams: { id: account?.patient?.id || "" },
    }),
    enabled: !!account?.patient?.id,
  });

  const { data: chargeItems, isLoading } = useQuery({
    queryKey: ["chargeItems", accountId],
    queryFn: query.paginated(chargeItemApi.listChargeItem, {
      pathParams: { facilityId },
      queryParams: {
        account: accountId,
        ordering: "-created_date",
      },
      pageSize: 100,
    }),
  });

  if (isLoading) return <Loading />;

  if (!chargeItems?.results) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed p-4 text-gray-500 border-gray-200">
        {t("no_charge_items_found_for_this_account")}
      </div>
    );
  }

  return (
    <PrintPreview
      title={t("charge_items")}
      disabled={!chargeItems?.results?.length}
    >
      <div className="min-h-screen md:p-2 max-w-4xl mx-auto">
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start mb-4 pb-2 border-b border-gray-200">
            <img
              src={careConfig.mainLogo?.dark}
              alt="Care Logo"
              className="h-10 w-auto object-contain mb-2 sm:mb-0 sm:order-2"
            />
            <div className="text-center sm:text-left sm:order-1">
              <h1 className="text-3xl font-semibold">{facility?.name}</h1>
              {facility?.address && (
                <div className="text-gray-500 whitespace-pre-wrap break-words text-sm">
                  {facility.address}
                  {facility.phone_number && (
                    <p className="text-gray-500 text-sm">
                      {facility.phone_number}
                    </p>
                  )}
                </div>
              )}
              <h2 className="text-gray-500 uppercase text-sm tracking-wide mt-4 font-semibold">
                {t("charge_items")}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mb-8">
            <div className="space-y-3">
              <DetailRow label={t("patient")} value={patient?.name} isStrong />
              <DetailRow
                label={`${t("age")} / ${t("sex")}`}
                value={
                  patient
                    ? `${formatPatientAge(patient, true)}, ${t(`GENDER__${patient.gender}`)}`
                    : undefined
                }
                isStrong
              />
            </div>
            <div className="space-y-3">
              <DetailRow label={t("account")} value={account?.name} isStrong />
              <DetailRow
                label={t("mobile_number")}
                value={patient && formatPhoneNumberIntl(patient.phone_number)}
                isStrong
              />
            </div>
          </div>

          {chargeItems?.results && chargeItems?.results?.length > 0 && (
            <div className="mt-4">
              <p className="text-base font-semibold mb-2">
                {t("charge_items")}
              </p>
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="bg-transparent hover:bg-transparent border-b-gray-200">
                      <TableHead className="h-auto py-1 pl-2 pr-2 text-black text-left w-16">
                        {t("sno")}
                      </TableHead>
                      <TableHead className="h-auto py-1 pl-2 pr-2 text-black text-left">
                        {t("description")}
                      </TableHead>
                      <TableHead className="h-auto py-1 pl-2 pr-2 text-black text-right w-28">
                        {t("rate")}
                      </TableHead>
                      <TableHead className="h-auto py-1 pl-2 pr-2 text-black text-right w-24">
                        {t("quantity")}
                      </TableHead>
                      <TableHead className="h-auto py-1 pl-2 pr-2 text-black text-right w-32">
                        {t("amount")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      // Group charge items by category, excluding entered_in_error items
                      const validItems = chargeItems.results.filter(
                        (item) =>
                          item.status !== ChargeItemStatus.entered_in_error,
                      );

                      const groups = validItems.reduce(
                        (
                          acc: Record<string, ChargeItemRead[]>,
                          item: ChargeItemRead,
                        ) => {
                          const categoryTitle =
                            item.charge_item_definition?.category?.title ||
                            t("uncategorized");
                          const list = acc[categoryTitle] ?? [];
                          list.push(item);
                          acc[categoryTitle] = list;
                          return acc;
                        },
                        {} as Record<string, ChargeItemRead[]>,
                      );

                      // Sort categories alphabetically
                      const sortedCategories = Object.keys(groups).sort();

                      const rows: React.ReactNode[] = [];
                      let globalIndex = 1;

                      sortedCategories.forEach((categoryTitle) => {
                        // Add category header
                        rows.push(
                          <TableRow
                            key={`category-${categoryTitle}`}
                            className="bg-transparent"
                          >
                            <TableCell
                              colSpan={5}
                              className="text-left font-semibold capitalize bg-gray-50"
                            >
                              {categoryTitle}
                            </TableCell>
                          </TableRow>,
                        );

                        const items: ChargeItemRead[] =
                          groups[categoryTitle] ?? [];
                        items.forEach((chargeItem: ChargeItemRead) => {
                          const unitPrice =
                            chargeItem.unit_price_components.find(
                              (c) =>
                                c.monetary_component_type ===
                                MonetaryComponentType.base,
                            )?.amount;
                          rows.push(
                            <TableRow
                              key={chargeItem.id}
                              className="bg-transparent hover:bg-transparent"
                            >
                              <TableCell className="text-left">
                                {globalIndex++}
                              </TableCell>
                              <TableCell className="text-left">
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {chargeItem.title}
                                  </span>
                                  {chargeItem.description && (
                                    <span className="text-xs text-gray-600 whitespace-pre-wrap">
                                      {chargeItem.description}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <MonetaryDisplay amount={unitPrice} />
                              </TableCell>
                              <TableCell className="text-right">
                                {Math.floor(Number(chargeItem.quantity))}
                              </TableCell>
                              <TableCell className="text-right">
                                <MonetaryDisplay
                                  amount={chargeItem.total_price}
                                />
                              </TableCell>
                            </TableRow>,
                          );
                        });

                        // Add category subtotal
                        const categoryTotal = items
                          .reduce(
                            (sum: number, item: ChargeItemRead) =>
                              sum + Number(item.total_price ?? 0),
                            0,
                          )
                          .toFixed(2);
                        rows.push(
                          <TableRow
                            key={`subtotal-${categoryTitle}`}
                            className="font-semibold bg-gray-50"
                          >
                            <TableCell colSpan={4} className="text-right pr-2">
                              {t("total")}
                            </TableCell>
                            <TableCell className="text-right">
                              <MonetaryDisplay amount={categoryTotal} />
                            </TableCell>
                          </TableRow>,
                        );
                      });

                      // Add grand total
                      rows.push(
                        <TableRow
                          key="grand-total"
                          className="bg-muted/30 font-semibold"
                        >
                          <TableCell colSpan={4} className="text-right pr-2">
                            {t("net_total")}
                          </TableCell>
                          <TableCell className="text-right">
                            <MonetaryDisplay
                              amount={validItems
                                .reduce(
                                  (sum, item) =>
                                    sum + Number(item.total_price ?? 0),
                                  0,
                                )
                                .toFixed(2)}
                            />
                          </TableCell>
                        </TableRow>,
                      );
                      return rows;
                    })()}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </div>
    </PrintPreview>
  );
};
