import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import { MonetaryDisplay } from "@/components/ui/monetary-display";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Loading from "@/components/Common/Loading";

import { MonetaryComponentType } from "@/types/base/monetaryComponent/monetaryComponent";
import { InvoiceRead } from "@/types/billing/invoice/invoice";
import invoiceApi from "@/types/billing/invoice/invoiceApi";
import query from "@/Utils/request/query";

import { cn } from "@/lib/utils";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { formatPatientAge } from "@/Utils/utils";

type PrintInvoiceProps = {
  facilityId: string;
  invoiceId: string;
};

export function PrintInvoice({ facilityId, invoiceId }: PrintInvoiceProps) {
  const { t } = useTranslation();

  const { data: invoice, isLoading: isInvoiceLoading } = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: query(invoiceApi.retrieveInvoice, {
      pathParams: { facilityId, invoiceId },
    }),
  });

  const { facility, isFacilityLoading } = useCurrentFacility();

  if (isInvoiceLoading || isFacilityLoading || !invoice || !facility) {
    return <Loading />;
  }
  interface DetailRowProps {
    label: string;
    value?: string | null;
    isStrong?: boolean;
    className?: string;
  }

  const DetailRow = ({
    label,
    value,
    isStrong = false,
    className = "",
  }: DetailRowProps) => {
    return (
      <div className="flex">
        <span className={cn("text-gray-600", className)}>{label}</span>
        <span className="text-gray-600">: </span>
        <span className={`ml-1 ${isStrong ? "font-semibold" : ""}`}>
          {value || "-"}
        </span>
      </div>
    );
  };

  const patient = invoice.account.patient;

  const getUnitComponentsByType = (item: any, type: MonetaryComponentType) => {
    return (
      item.unit_price_components?.filter(
        (c: any) => c.monetary_component_type === type,
      ) || []
    );
  };

  const getTotalComponentsByType = (item: any, type: MonetaryComponentType) => {
    return (
      item.total_price_components?.filter(
        (c: any) => c.monetary_component_type === type,
      ) || []
    );
  };

  const getApplicableTaxColumns = (invoice: InvoiceRead) => {
    const invoiceTaxCodes = new Set<string>();
    invoice.charge_items.forEach((item) => {
      getUnitComponentsByType(item, MonetaryComponentType.tax).forEach(
        (taxComponent: any) => {
          invoiceTaxCodes.add(taxComponent.code.code);
        },
      );
    });
    return Array.from(invoiceTaxCodes);
  };

  const getBaseComponent = (item: any) => {
    return item.unit_price_components?.find(
      (c: any) => c.monetary_component_type === MonetaryComponentType.base,
    );
  };

  return (
    <PrintPreview title={`${t("invoice")} ${invoice.number}`}>
      <div className="max-w-5xl mx-auto">
        {/* Header with Facility Name and Logo */}
        <div className="flex justify-between items-start mb-4 pb-2 border-b border-gray-200">
          <img
            src={careConfig.mainLogo?.dark}
            alt="Care Logo"
            className="h-10 w-auto object-contain mb-2 sm:mb-0 order-2"
          />
          <div className="text-left">
            <h1 className="text-3xl font-semibold">{facility.name}</h1>
            {facility.address && (
              <div className="text-gray-500 whitespace-pre-wrap break-words text-sm">
                {facility.address}
                {facility.phone_number && (
                  <p className="text-gray-500 text-sm">
                    {facility.phone_number}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Invoice Information */}
        <div>
          {/* Bill To Section */}
          <div className="space-y-2">
            <div className="flex justify-between">
              {/* <h5 className="text-gray-500 font-semibold mb-2">{t("bill_to")}</h5> */}
              <DetailRow label={t("inv_no")} value={invoice.number} />
              <DetailRow
                label={t("date")}
                value={
                  invoice.issue_date
                    ? format(
                        new Date(invoice.issue_date),
                        "dd MMM, yyyy h:mm a",
                      )
                    : "-"
                }
              />
            </div>
            <div className="flex justify-between">
              <DetailRow label={t("name")} value={patient.name.toUpperCase()} />
              <DetailRow
                label={`${t("age")} / ${t("sex")}`}
                value={
                  patient
                    ? `${formatPatientAge(patient, true)}, ${t(`GENDER__${patient.gender}`)}`
                    : undefined
                }
              />
              <DetailRow label={t("address")} value={patient.address} />
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto mt-4">
          <Table className="w-full border">
            <TableHeader>
              <TableRow className="divide-x">
                <TableHead className="p-1 font-medium text-gray-500">
                  {t("item")}
                </TableHead>
                <TableHead className="p-1 font-medium text-gray-500">
                  {t("unit_price")}
                </TableHead>
                <TableHead className="p-1 font-medium text-gray-500">
                  {t("qty")}
                </TableHead>
                <TableHead className="p-1 font-medium text-gray-500">
                  {t("discount")}
                </TableHead>
                {getApplicableTaxColumns(invoice).map((taxCode) => (
                  <TableHead
                    key={taxCode}
                    className="p-1 font-medium text-gray-500 text-center"
                  >
                    {t(taxCode)}
                  </TableHead>
                ))}
                <TableHead className="p-1 font-medium text-gray-500 text-right">
                  {t("total")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.charge_items.map((item) => {
                const baseComponent = getBaseComponent(item);
                const baseAmount = baseComponent?.amount || 0;

                return (
                  <TableRow key={item.id} className="border-b divide-x">
                    <TableCell className="p-1 align-top">
                      {item.title}
                    </TableCell>
                    <TableCell className="p-1 align-top">
                      <MonetaryDisplay amount={baseAmount} />
                    </TableCell>
                    <TableCell className="p-1 align-top">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="p-1 px-0 align-top">
                      {(() => {
                        const totalAmount = getTotalComponentsByType(
                          item,
                          MonetaryComponentType.discount,
                        ).reduce(
                          (acc: number, curr: { amount?: number }) =>
                            acc + (curr.amount || 0),
                          0,
                        );
                        return (
                          totalAmount !== 0 && (
                            <MonetaryDisplay amount={totalAmount} />
                          )
                        );
                      })()}
                    </TableCell>
                    {getApplicableTaxColumns(invoice).map((taxCode) => (
                      <TableCell key={taxCode} className="p-1 align-top">
                        {(() => {
                          const totalAmount = item.total_price_components.find(
                            (c) => c.code?.code === taxCode,
                          )?.amount;
                          const unitAmount = item.unit_price_components.find(
                            (c) => c.code?.code === taxCode,
                          );
                          return (
                            <div className="flex flex-col items-center gap-px">
                              <MonetaryDisplay amount={totalAmount} />
                              <div className="text-xs text-gray-500">
                                {totalAmount && (
                                  <>
                                    {`(`}
                                    <MonetaryDisplay {...unitAmount} />
                                    {`)`}
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </TableCell>
                    ))}
                    <TableCell className="p-1 align-top text-right">
                      <MonetaryDisplay amount={item.total_price} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Totals */}
        <div className="flex flex-col items-end border space-y-2">
          {/* Base Amount */}
          {invoice.total_price_components
            ?.filter(
              (c) => c.monetary_component_type === MonetaryComponentType.base,
            )
            .map((component, index) => (
              <div
                key={`base-${index}`}
                className="flex w-64 justify-between mr-1"
              >
                <span className="text-gray-500">
                  {component.code?.display || t("base_amount")}
                </span>
                <MonetaryDisplay amount={component.amount} fallback="-" />
              </div>
            ))}

          {/* Surcharges */}
          {invoice.total_price_components
            ?.filter(
              (c) =>
                c.monetary_component_type === MonetaryComponentType.surcharge,
            )
            .map((component, index) => (
              <div
                key={`surcharge-${index}`}
                className="flex w-64 justify-between text-gray-500 text-sm mr-1"
              >
                <span>
                  {component.code && `${component.code.display} `}(
                  {t("surcharge")})
                </span>
                <span>
                  + <MonetaryDisplay {...component} />
                </span>
              </div>
            ))}

          {/* Discounts */}
          {invoice.total_price_components
            ?.filter(
              (c) =>
                c.monetary_component_type === MonetaryComponentType.discount,
            )
            .map((component, index) => (
              <div
                key={`discount-${index}`}
                className="flex w-64 justify-between text-gray-500 text-sm mr-1"
              >
                <span>
                  {component.code && `${component.code.display} `}(
                  {t("discount")})
                </span>
                <span>
                  - <MonetaryDisplay {...component} />
                </span>
              </div>
            ))}

          {/* Taxes */}
          {invoice.total_price_components
            ?.filter(
              (c) => c.monetary_component_type === MonetaryComponentType.tax,
            )
            .map((component, index) => (
              <div
                key={`tax-${index}`}
                className="flex w-64 justify-between text-gray-500 text-sm mr-1"
              >
                <span>
                  {component.code && `${component.code.display} `}({t("tax")})
                </span>
                <span>
                  + <MonetaryDisplay {...component} />
                </span>
              </div>
            ))}

          <Separator className="my-2" />

          {/* Subtotal */}
          <div className="flex w-64 justify-between mr-1">
            <span className="text-gray-500">{t("net_amount")}</span>
            <MonetaryDisplay amount={String(invoice.total_net)} />
          </div>

          {/* Total */}
          <div className="flex w-64 justify-between font-bold mr-1">
            <span>{t("total")}</span>
            <MonetaryDisplay amount={String(invoice.total_gross)} />
          </div>
        </div>

        {/* Footer with Terms */}
        {invoice.payment_terms && (
          <div className="mt-10 text-sm text-gray-600 border-t pt-4">
            <h3 className="font-medium mb-2">{t("payment_terms")}</h3>
            <p className="prose w-full text-sm whitespace-pre-wrap">
              {invoice.payment_terms}
            </p>
          </div>
        )}

        {/* Generated Info */}
        <div className="mt-12 pt-4 border-t text-[10px] text-gray-500 flex justify-between">
          <p>
            {t("generated_on")} {format(new Date(), "PPP 'at' p")}
          </p>
        </div>
      </div>
    </PrintPreview>
  );
}

export default PrintInvoice;
