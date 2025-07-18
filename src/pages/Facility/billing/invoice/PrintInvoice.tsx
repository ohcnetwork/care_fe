import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { differenceInYears, format } from "date-fns";
import React from "react";
import { useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";

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

import query from "@/Utils/request/query";
import { MonetaryComponentType } from "@/types/base/monetaryComponent/monetaryComponent";
import { InvoiceRead } from "@/types/billing/invoice/invoice";
import invoiceApi from "@/types/billing/invoice/invoiceApi";

type PrintInvoiceProps = {
  facilityId: string;
  invoiceId: string;
};

export function PrintInvoice({ facilityId, invoiceId }: PrintInvoiceProps) {
  const { t } = useTranslation();

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: query(invoiceApi.retrieveInvoice, {
      pathParams: { facilityId, invoiceId },
    }),
  });

  if (isLoading || !invoice) {
    return <Loading />;
  }

  const patient = invoice.account.patient;
  const age = patient.date_of_birth
    ? differenceInYears(new Date(), new Date(patient.date_of_birth))
    : null;

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
    <PrintPreview title={`${t("invoice")} #${invoice.id}`}>
      <div className="min-h-screen py-8 max-w-4xl mx-auto">
        {/* Header with Facility Name and Logo */}
        <div className="flex justify-between items-start pb-6 border-b border-gray-200">
          <div className="space-y-4 flex-1">
            <div>
              <h1 className="text-3xl font-semibold">{invoice.number}</h1>
              <h2 className="text-gray-500 uppercase text-sm tracking-wide font-semibold mt-1">
                {t("invoice")} #{invoice.id}
              </h2>
            </div>
          </div>
          <img
            src={careConfig.mainLogo?.dark}
            alt="Care Logo"
            className="h-10 w-auto object-contain ml-6"
          />
        </div>

        {/* Invoice Information */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bill To Section */}
          <div>
            <h3 className="text-gray-500 font-semibold mb-2">{t("bill_to")}</h3>
            <div className="space-y-1">
              <p className="font-medium text-lg">{patient.name}</p>
              <p className="text-sm text-gray-600">
                {age !== null && `${age} ${t("years")} • `}
                {patient.gender && `${t(patient.gender)} • `}
                {formatPhoneNumberIntl(patient.phone_number)}
              </p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {patient.address}
              </p>
              <p className="text-sm text-gray-600">{patient.pincode}</p>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">{t("invoice_date")}</span>
              <span>
                {invoice.issue_date
                  ? format(new Date(invoice.issue_date), "dd MMM, yyyy h:mm a")
                  : "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t("invoice_number")}</span>
              <span>{invoice.id}</span>
            </div>
            {invoice.note && (
              <div className="mt-4">
                <span className="text-gray-500">{t("note")}</span>
                <p className="text-sm mt-1 whitespace-pre-wrap">
                  {invoice.note}
                </p>
              </div>
            )}
          </div>
        </div>

        <Separator className="my-4" />

        {/* Items Table */}
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
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
                    className="p-1 font-medium text-gray-500"
                  >
                    {t(taxCode)}
                  </TableHead>
                ))}
                <TableHead className="p-1 font-medium text-gray-500">
                  {t("total")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.charge_items.map((item) => {
                const baseComponent = getBaseComponent(item);
                const baseAmount = baseComponent?.amount || 0;

                return (
                  <TableRow key={item.id} className="border-b">
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
                    <TableCell className="p-1 align-top">
                      <MonetaryDisplay amount={item.total_price} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Totals */}
        <div className="flex flex-col items-end space-y-2 mt-6">
          {/* Base Amount */}
          {invoice.total_price_components
            ?.filter(
              (c) => c.monetary_component_type === MonetaryComponentType.base,
            )
            .map((component, index) => (
              <div key={`base-${index}`} className="flex w-64 justify-between">
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
                className="flex w-64 justify-between text-gray-500 text-sm"
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
                className="flex w-64 justify-between text-gray-500 text-sm"
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
                className="flex w-64 justify-between text-gray-500 text-sm"
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
          <div className="flex w-64 justify-between">
            <span className="text-gray-500">{t("net_amount")}</span>
            <MonetaryDisplay amount={invoice.total_net} />
          </div>

          {/* Total */}
          <div className="flex w-64 justify-between font-bold">
            <span>{t("total")}</span>
            <MonetaryDisplay amount={invoice.total_gross} />
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
