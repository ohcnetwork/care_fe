import careConfig from "@careConfig";
import { useQueries } from "@tanstack/react-query";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import { DisablingCover } from "@/components/Common/DisablingCover";
import Loading from "@/components/Common/Loading";
import PrintFooter from "@/components/Common/PrintFooter";
import { formatPatientAddress } from "@/components/Patient/utils";
import {
  MonetaryDisplay,
  getCurrencySymbol,
} from "@/components/ui/monetary-display";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { cn } from "@/lib/utils";
import {
  InvoiceChargeItemTitle,
  useMedicationDispenseData,
} from "@/pages/Facility/billing/invoice/components/InvoiceChargeItemTitle";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { MonetaryComponentType } from "@/types/base/monetaryComponent/monetaryComponent";
import { ChargeItemRead } from "@/types/billing/chargeItem/chargeItem";
import { InvoiceRead, InvoiceStatus } from "@/types/billing/invoice/invoice";
import invoiceApi from "@/types/billing/invoice/invoiceApi";
import {
  PAYMENT_RECONCILIATION_METHOD_MAP,
  PaymentReconciliationStatus,
} from "@/types/billing/paymentReconciliation/paymentReconciliation";
import { getPartialId } from "@/types/emr/patient/patient";
import patientApi from "@/types/emr/patient/patientApi";
import { PatientIdentifierUse } from "@/types/patient/patientIdentifierConfig/patientIdentifierConfig";
import { add, multiply, round } from "@/Utils/decimal";
import query from "@/Utils/request/query";
import { formatName, formatPatientAge } from "@/Utils/utils";

interface PrintInvoicesProps {
  facilityId: string;
  invoiceIds: string;
}

export function PrintInvoices({ facilityId, invoiceIds }: PrintInvoicesProps) {
  const { t } = useTranslation();

  // Parse comma-separated invoice IDs
  const invoiceIdArray = Array.from(
    new Set(invoiceIds.split(",").map((id) => id.trim())),
  );

  // Fetch all invoices using useQueries
  const invoiceQueries = useQueries({
    queries: invoiceIdArray.map((invoiceId) => ({
      queryKey: ["invoice", invoiceId],
      queryFn: query(invoiceApi.retrieveInvoice, {
        pathParams: { facilityId, invoiceId },
      }),
    })),
  });

  const isLoading = invoiceQueries.some((q) => q.isLoading);
  const invoices = invoiceQueries
    .map((q) => q.data)
    .filter((invoice): invoice is InvoiceRead => invoice !== undefined);

  // Collect all charge items from all invoices for medication dispense fetching
  const allChargeItems = invoices.flatMap((invoice) => invoice.charge_items);

  // Pre-fetch medication dispense data for all charge items
  const { dispenseMap, isLoadingDispenses } =
    useMedicationDispenseData(allChargeItems);

  // Fetch patient data for each unique patient
  const uniquePatients = Array.from(
    new Map(
      invoices.map((invoice) => [
        invoice.account.patient.id,
        invoice.account.patient,
      ]),
    ).values(),
  );

  const patientQueries = useQueries({
    queries: uniquePatients.map((patient) => ({
      queryKey: ["patient-verify", patient.id, patient.year_of_birth],
      queryFn: query(patientApi.searchRetrieve, {
        pathParams: { facilityId },
        body: {
          phone_number: patient.phone_number ?? "",
          year_of_birth: patient.year_of_birth?.toString() ?? "",
          partial_id: getPartialId(patient),
        },
      }),
      enabled: true,
    })),
  });

  const verifiedPatientsMap = new Map(
    uniquePatients.map((patient, index) => [
      patient.id,
      patientQueries[index]?.data,
    ]),
  );

  const { facility, isFacilityLoading } = useCurrentFacility();

  if (isLoading || isFacilityLoading || invoices.length === 0 || !facility) {
    return <Loading />;
  }

  const tableHeadClass = "border-r border-gray-200 font-medium text-center";
  const tableCellClass =
    "border-r border-gray-200 font-medium text-gray-950 text-sm";

  const getUnitComponentsByType = (
    item: ChargeItemRead,
    type: MonetaryComponentType,
  ) => {
    return (
      item.unit_price_components?.filter(
        (c) => c.monetary_component_type === type,
      ) || []
    );
  };

  const getApplicableTaxColumns = (invoice: InvoiceRead) => {
    const invoiceTaxCodes = new Set<string>();
    invoice.charge_items.forEach((item) => {
      getUnitComponentsByType(item, MonetaryComponentType.tax).forEach(
        (taxComponent) => {
          if (taxComponent.code?.code) {
            invoiceTaxCodes.add(taxComponent.code.code);
          }
        },
      );
    });
    return Array.from(invoiceTaxCodes);
  };

  const getBaseComponent = (item: ChargeItemRead) => {
    return item.unit_price_components?.find(
      (c) => c.monetary_component_type === MonetaryComponentType.base,
    );
  };

  const getWatermark = (invoice: InvoiceRead) => {
    if (invoice.status === InvoiceStatus.cancelled) {
      return { text: t("cancelled"), color: "red" as const };
    }
    if (invoice.status === InvoiceStatus.entered_in_error) {
      return { text: t("entered_in_error"), color: "red" as const };
    }
    return undefined;
  };

  return (
    <PrintPreview
      title={`${t("invoices")} (${invoices.length})`}
      watermark={invoices.length === 1 ? getWatermark(invoices[0]) : undefined}
      disabled={isLoadingDispenses}
    >
      <DisablingCover
        disabled={isLoadingDispenses}
        message={t("loading_medication_details")}
      >
        <div className="max-w-5xl mx-auto">
          {/* Header with Facility Name and Logo - shown once */}
          <div className="flex justify-between items-start mb-4 pb-2 border-b border-gray-200">
            <div className="flex items-start gap-4">
              <div className="text-left">
                <h1 className="text-2xl font-medium">{facility.name}</h1>
                {facility.address && (
                  <div className="text-gray-500 whitespace-pre-wrap wrap-break-word text-sm">
                    {facility.address}
                    {facility.phone_number && (
                      <p className="text-gray-500 text-sm">
                        {t("phone")}: {facility.phone_number}
                      </p>
                    )}
                  </div>
                )}
              </div>
              <QRCodeSVG
                value={invoices[0].account.patient.id}
                size={50}
                level="Q"
                marginSize={0}
              />
            </div>
            <img
              src={careConfig.mainLogo?.dark}
              alt="Logo"
              className="h-10 w-auto object-contain mb-2 sm:mb-0 text-end"
            />
          </div>

          {/* Bill To section - shown once */}
          {(() => {
            const firstInvoice = invoices[0];
            const verifiedPatient = verifiedPatientsMap.get(
              firstInvoice.account.patient.id,
            );

            return (
              <div className="mb-4 flex justify-between items-center">
                <div>
                  <div className="font-medium text-gray-700 text-sm">
                    {t("bill_to")}:
                  </div>
                  <div>
                    <p className="font-semibold text-base">
                      {firstInvoice.account.patient.name}
                      <span className="text-gray-600 ml-2 font-normal">
                        ({t(`GENDER__${firstInvoice.account.patient.gender}`)},{" "}
                        {formatPatientAge(firstInvoice.account.patient, true)})
                      </span>
                    </p>
                  </div>
                  {verifiedPatient &&
                    "instance_identifiers" in verifiedPatient &&
                    verifiedPatient.instance_identifiers
                      .filter(
                        ({ config }) =>
                          config.config.use === PatientIdentifierUse.official &&
                          !config.config.auto_maintained,
                      )
                      .map((identifier) => (
                        <div
                          key={identifier.config.id}
                          className="text-base text-gray-700"
                        >
                          <span>{identifier.config.config.display}: </span>
                          <span className="ml-2 font-semibold">
                            {identifier.value}
                          </span>
                        </div>
                      ))}
                </div>
                <div>
                  <div className="flex gap-1 font-medium text-gray-700 text-sm ml-2">
                    {t("address")}:{" "}
                    <p className="font-medium text-gray-700 text-sm whitespace-pre-wrap ml-2">
                      {formatPatientAddress(
                        firstInvoice.account.patient.address,
                      ) || (
                        <span className="text-gray-500">
                          {t("no_address_provided")}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {invoices.map((invoice, invoiceIndex) => {
            return (
              <div
                key={invoice.id}
                className={cn(invoiceIndex > 0 && "page-break-before mt-4")}
              >
                {/* Invoice Title */}
                <div className="mb-4 flex justify-between items-center">
                  <div className="flex items-start gap-2">
                    <div className="text-base uppercase">{t("invoice")}</div>
                    <div className="text-gray-950 text-base font-semibold">
                      {invoice.number}
                    </div>
                  </div>
                  <div className="text-right flex">
                    <div className="font-medium text-gray-700 text-sm">
                      {t("issue_date")}:
                    </div>
                    <p className="font-medium text-gray-950 text-sm">
                      {invoice.issue_date
                        ? format(
                            new Date(invoice.issue_date),
                            "dd MMM, yyyy h:mm a",
                          )
                        : "-"}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Items Table */}
                  <div className="rounded-t-sm border border-gray-300">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-gray-200">
                          <TableHead className={tableHeadClass}>#</TableHead>
                          <TableHead
                            className={cn(tableHeadClass, "text-left")}
                          >
                            {t("item")}
                          </TableHead>
                          <TableHead className={tableHeadClass}>
                            {t("unit_price")} ({getCurrencySymbol()})
                          </TableHead>
                          <TableHead className={tableHeadClass}>
                            {t("qty")}
                          </TableHead>
                          <TableHead className={tableHeadClass}>
                            {t("discount")}
                          </TableHead>
                          {getApplicableTaxColumns(invoice).map((taxCode) => (
                            <TableHead key={taxCode} className={tableHeadClass}>
                              {t(taxCode)}
                            </TableHead>
                          ))}
                          <TableHead className="font-medium text-center">
                            {t("total")} ({getCurrencySymbol()})
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoice.charge_items.length === 0 ? (
                          <TableRow className="border-b border-gray-200">
                            <TableCell
                              colSpan={
                                7 + getApplicableTaxColumns(invoice).length
                              }
                              className="text-center text-gray-500"
                            >
                              {t("no_charge_items")}
                            </TableCell>
                          </TableRow>
                        ) : (
                          invoice.charge_items.map((item, index) => {
                            const baseComponent = getBaseComponent(item);
                            const baseAmount = baseComponent?.amount || "0";

                            return (
                              <TableRow
                                key={item.id}
                                className="border-b border-gray-200"
                              >
                                <TableCell
                                  className={cn(tableCellClass, "text-center")}
                                >
                                  {index + 1}
                                </TableCell>
                                <TableCell
                                  className={cn(
                                    tableCellClass,
                                    "font-medium whitespace-pre-wrap",
                                  )}
                                >
                                  <InvoiceChargeItemTitle
                                    item={item}
                                    dispenseMap={dispenseMap}
                                    isLoading={isLoadingDispenses}
                                  />
                                </TableCell>
                                <TableCell
                                  className={cn(tableCellClass, "text-right")}
                                >
                                  <MonetaryDisplay
                                    amount={baseAmount}
                                    hideCurrency
                                  />
                                </TableCell>
                                <TableCell
                                  className={cn(tableCellClass, "text-center")}
                                >
                                  {round(item.quantity)}
                                </TableCell>
                                <TableCell
                                  className={cn(tableCellClass, "text-right")}
                                >
                                  <div className="flex flex-col items-end gap-0.5">
                                    <MonetaryDisplay
                                      amount={add(
                                        ...item.total_price_components
                                          .filter(
                                            (c) =>
                                              c.monetary_component_type ===
                                              MonetaryComponentType.discount,
                                          )
                                          .map((c) => c.amount || "0"),
                                      )}
                                      hideCurrency
                                    />
                                    {item.unit_price_components
                                      .filter(
                                        (c) =>
                                          c.monetary_component_type ===
                                          MonetaryComponentType.discount,
                                      )
                                      .map((discountComponent, idx) => (
                                        <div
                                          key={idx}
                                          className="text-xs text-gray-500"
                                        >
                                          <MonetaryDisplay
                                            {...discountComponent}
                                            hideCurrency
                                          />
                                        </div>
                                      ))}
                                  </div>
                                </TableCell>
                                {getApplicableTaxColumns(invoice).map(
                                  (taxCode) => (
                                    <TableCell
                                      key={taxCode}
                                      className={cn(
                                        tableCellClass,
                                        "text-right",
                                      )}
                                    >
                                      {(() => {
                                        const totalAmount =
                                          item.total_price_components.find(
                                            (c) => c.code?.code === taxCode,
                                          )?.amount;
                                        const unitAmount =
                                          item.unit_price_components.find(
                                            (c) => c.code?.code === taxCode,
                                          );
                                        return (
                                          <div className="flex flex-col items-end gap-0.5">
                                            <MonetaryDisplay
                                              amount={totalAmount}
                                              hideCurrency
                                            />
                                            <div className="text-xs text-gray-500">
                                              {totalAmount && (
                                                <MonetaryDisplay
                                                  {...unitAmount}
                                                  hideCurrency
                                                />
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })()}
                                    </TableCell>
                                  ),
                                )}
                                <TableCell className="text-right">
                                  <MonetaryDisplay
                                    amount={item.total_price}
                                    hideCurrency
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Totals Section */}
                  <div
                    className={cn(
                      "border-x border-gray-300 p-2 -mt-4 border-t-none space-y-2",
                      invoice.payments?.filter(
                        (p) => p.status === PaymentReconciliationStatus.active,
                      ).length === 0 && "border-b rounded-b-md",
                    )}
                  >
                    <div className="flex flex-col items-end space-y-2 text-gray-950 font-normal text-sm mb-4">
                      {/* Base Amount */}
                      {invoice.total_price_components
                        ?.filter(
                          (c) =>
                            c.monetary_component_type ===
                            MonetaryComponentType.base,
                        )
                        .map((component, index) => (
                          <div
                            key={`base-${index}`}
                            className="flex w-64 justify-between"
                          >
                            <span>
                              {component.code?.display || t("base_amount")}:
                            </span>
                            <span className="font-medium">
                              <MonetaryDisplay amount={component.amount} />
                            </span>
                          </div>
                        ))}

                      {/* Surcharges */}
                      {invoice.total_price_components
                        ?.filter(
                          (c) =>
                            c.monetary_component_type ===
                            MonetaryComponentType.surcharge,
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
                            c.monetary_component_type ===
                            MonetaryComponentType.discount,
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
                          (c) =>
                            c.monetary_component_type ===
                            MonetaryComponentType.tax,
                        )
                        .map((component, index) => (
                          <div
                            key={`tax-${index}`}
                            className="flex w-64 justify-between text-gray-500 text-sm"
                          >
                            <span>
                              {component.code && `${component.code.display} `}(
                              {t("tax")})
                            </span>
                            <span>
                              + <MonetaryDisplay {...component} />
                            </span>
                          </div>
                        ))}

                      {/* Net Amount */}
                      <div className="flex w-64 justify-between">
                        <span className="text-gray-500">{t("net_amount")}</span>
                        <MonetaryDisplay amount={invoice.total_net} />
                      </div>

                      <div className="p-1 border-t-2 border-dashed border-gray-200 w-full" />

                      {/* Total */}
                      <div className="flex w-64 justify-between font-semibold">
                        <span>{t("total")}</span>
                        <MonetaryDisplay amount={invoice.total_gross} />
                      </div>
                      <div className="p-1 border-t-2 border-dashed border-gray-200 w-full" />
                    </div>
                  </div>

                  {/* Payments Section */}
                  {invoice.payments?.filter(
                    (p) => p.status === PaymentReconciliationStatus.active,
                  ).length > 0 && (
                    <>
                      <div className="border-x border-b border-t border-gray-300 rounded-b-md -mt-4 space-y-2">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-b border-gray-200">
                              <TableHead className={tableHeadClass}>
                                #
                              </TableHead>
                              <TableHead
                                className={cn(tableHeadClass, "text-left")}
                              >
                                {t("date_and_time")}
                              </TableHead>
                              <TableHead
                                className={cn(tableHeadClass, "text-left")}
                              >
                                {t("payment_method")}
                              </TableHead>
                              <TableHead
                                className={cn(tableHeadClass, "text-left")}
                              >
                                {t("reference")}
                              </TableHead>
                              <TableHead className="font-medium text-right">
                                {t("amount")} ({getCurrencySymbol()})
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {invoice.payments
                              .filter(
                                (p) =>
                                  p.status ===
                                  PaymentReconciliationStatus.active,
                              )
                              .map((payment, index) => (
                                <TableRow
                                  key={payment.id}
                                  className="border-b border-gray-200"
                                >
                                  <TableCell
                                    className={cn(
                                      tableCellClass,
                                      "text-center",
                                    )}
                                  >
                                    {index + 1}
                                  </TableCell>
                                  <TableCell
                                    className={cn(
                                      tableCellClass,
                                      "font-medium",
                                    )}
                                  >
                                    {payment.payment_datetime
                                      ? format(
                                          new Date(payment.payment_datetime),
                                          "d MMM yyyy, hh:mm a",
                                        )
                                      : "-"}
                                  </TableCell>
                                  <TableCell
                                    className={cn(tableCellClass, "text-left")}
                                  >
                                    {
                                      PAYMENT_RECONCILIATION_METHOD_MAP[
                                        payment.method
                                      ]
                                    }
                                  </TableCell>
                                  <TableCell className={tableCellClass}>
                                    {payment.reference_number}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <MonetaryDisplay
                                      amount={multiply(
                                        payment.amount,
                                        payment.is_credit_note ? -1 : 1,
                                      )}
                                      hideCurrency
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="flex flex-col items-end space-y-2 text-gray-950 font-normal text-sm mb-4">
                        <div className="p-1 border-t-2 border-dashed border-gray-200 w-full" />

                        {/* Total Received */}
                        <div className="flex w-64 justify-between font-semibold">
                          <span>{t("total_received")}</span>
                          <MonetaryDisplay amount={invoice.total_payments} />
                        </div>
                        <div className="p-1 border-b-2 border-dashed border-gray-200 w-full" />
                      </div>
                    </>
                  )}

                  {/* Credit Notes Section */}
                  {invoice.credit_notes?.filter(
                    (p) => p.status === PaymentReconciliationStatus.active,
                  ).length > 0 && (
                    <>
                      <div className="border border-gray-300 rounded-md space-y-2">
                        <div className="mt-2 px-3 font-medium">
                          {t("credit_notes_issued_against_this_invoice")}
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow className="border-b border-gray-200">
                              <TableHead className={tableHeadClass}>
                                #
                              </TableHead>
                              <TableHead
                                className={cn(tableHeadClass, "text-left")}
                              >
                                {t("date_and_time")}
                              </TableHead>
                              <TableHead
                                className={cn(tableHeadClass, "text-left")}
                              >
                                {t("payment_method")}
                              </TableHead>
                              <TableHead
                                className={cn(tableHeadClass, "text-left")}
                              >
                                {t("reference")}
                              </TableHead>
                              <TableHead className="font-medium text-right">
                                {t("amount")} ({getCurrencySymbol()})
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {invoice.credit_notes
                              .filter(
                                (p) =>
                                  p.status ===
                                  PaymentReconciliationStatus.active,
                              )
                              .map((creditNote, index) => (
                                <TableRow
                                  key={creditNote.id}
                                  className="border-b border-gray-200"
                                >
                                  <TableCell
                                    className={cn(
                                      tableCellClass,
                                      "text-center",
                                    )}
                                  >
                                    {index + 1}
                                  </TableCell>
                                  <TableCell
                                    className={cn(
                                      tableCellClass,
                                      "font-medium",
                                    )}
                                  >
                                    {creditNote.payment_datetime
                                      ? format(
                                          new Date(creditNote.payment_datetime),
                                          "d MMM yyyy, hh:mm a",
                                        )
                                      : "-"}
                                  </TableCell>
                                  <TableCell
                                    className={cn(tableCellClass, "text-left")}
                                  >
                                    {
                                      PAYMENT_RECONCILIATION_METHOD_MAP[
                                        creditNote.method
                                      ]
                                    }
                                  </TableCell>
                                  <TableCell className={tableCellClass}>
                                    {creditNote.reference_number}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <MonetaryDisplay
                                      amount={creditNote.amount}
                                      hideCurrency
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="flex flex-col items-end space-y-2 text-gray-950 font-normal text-sm mb-4">
                        <div className="p-1 border-t-2 border-dashed border-gray-200 w-full" />

                        {/* Total Credit Notes */}
                        <div className="flex w-64 justify-between font-semibold">
                          <span>{t("total_credit_notes")}</span>
                          <MonetaryDisplay
                            amount={invoice.total_credit_notes}
                          />
                        </div>
                        <div className="p-1 border-b-2 border-dashed border-gray-200 w-full" />
                      </div>
                    </>
                  )}
                </div>

                {/* Payment Terms */}
                {invoice.payment_terms && (
                  <div className="mt-6 border-t pt-4">
                    <h3 className="font-medium text-gray-950 text-sm">
                      {t("payment_terms")}
                    </h3>
                    <p className="text-sm mt-1">{invoice.payment_terms}</p>
                  </div>
                )}

                {/* Generated Info */}
                <PrintFooter
                  leftContent={
                    <>
                      <span className="font-semibold">{t("created_by")}: </span>
                      {formatName(invoice.created_by)}
                    </>
                  }
                  rightContent={
                    invoice.payments?.[0]?.location?.name ? (
                      <>
                        <span className="font-semibold">{t("location")}: </span>
                        <span>{invoice.payments[0].location.name}</span>
                      </>
                    ) : undefined
                  }
                />
              </div>
            );
          })}
        </div>
      </DisablingCover>
    </PrintPreview>
  );
}

export default PrintInvoices;
