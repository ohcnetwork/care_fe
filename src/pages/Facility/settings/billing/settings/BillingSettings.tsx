import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import React from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";

import mutate from "@/Utils/request/mutate";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import facilityApi from "@/types/facility/facilityApi";

export function BillingSettings() {
  const { t } = useTranslation();
  const { facility, facilityId } = useCurrentFacility();
  const [editing, setEditing] = useState(false);
  const [expression, setExpression] = useState("");

  const queryClient = useQueryClient();

  const {
    mutate: saveExpression,
    isPending,
    isSuccess,
    isError,
    reset,
  } = useMutation({
    mutationFn: mutate(facilityApi.setInvoiceExpression, {
      pathParams: { facilityId },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facility", facilityId] });
      setEditing(false);
    },
  });

  React.useEffect(() => {
    if (facility && !editing)
      setExpression(facility.invoice_number_expression || "");
  }, [facility, editing]);

  if (!facility) {
    return <Loading />;
  }

  return (
    <Page title={t("invoice_number_expression")}>
      <section className="w-full max-w-5xl mx-auto mt-8">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold text-gray-900">
              {t("invoice_number_expression")}
            </h2>
            <div className="text-gray-500 text-sm mt-1">
              <div className="font-semibold mb-1">
                {t("invoice_number_expression_supported_variables")}
              </div>
              <ul className="list-disc list-inside mb-2">
                <li>{t("invoice_number_expression_invoice_count")}</li>
                <li>{t("invoice_number_expression_current_year_yy")}</li>
                <li>{t("invoice_number_expression_current_year_yyyy")}</li>
              </ul>
              <div className="mb-1">
                {t("invoice_number_expression_other_characters")}
              </div>
              <div className="mb-1">{t("arithmetic_help")}</div>
              <pre className="bg-gray-100 rounded px-3 py-2 text-xs font-mono text-gray-700 overflow-x-auto">
                {t("invoice_number_expression_example_value")}
              </pre>
            </div>
          </div>
          <div className="flex flex-col gap-4 w-full max-w-md">
            {editing ? (
              <>
                <Input
                  value={expression}
                  onChange={(e) => setExpression(e.target.value)}
                  className="w-full text-base"
                  autoFocus
                  data-cy="invoice-number-expression-input"
                  aria-label={t("invoice_number_expression")}
                />
                <div className="flex flex-col gap-2 sm:flex-row sm:gap-2 w-full">
                  <Button
                    onClick={() =>
                      saveExpression({ invoice_number_expression: expression })
                    }
                    disabled={isPending || !expression.trim()}
                    data-cy="save-invoice-number-expression"
                    className="w-full sm:w-auto"
                  >
                    {isPending ? t("saving") : t("save")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditing(false);
                      setExpression(facility.invoice_number_expression || "");
                      reset();
                    }}
                    data-cy="cancel-invoice-number-expression"
                    className="w-full sm:w-auto"
                  >
                    {t("cancel")}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <span className="font-mono bg-gray-100 px-3 py-2 rounded text-base border border-gray-200 min-w-[200px] text-gray-800 w-full block">
                  {facility.invoice_number_expression || (
                    <span className="text-gray-400">-</span>
                  )}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setEditing(true)}
                  data-cy="edit-invoice-number-expression"
                  className="w-full sm:w-auto mt-2"
                >
                  {t("edit")}
                </Button>
              </>
            )}
          </div>
          {isSuccess && !editing && (
            <div className="text-green-600 text-sm mt-2">
              {t("saved_successfully")}
            </div>
          )}
          {isError && (
            <div className="text-red-600 text-sm mt-2">{t("error")}</div>
          )}
        </div>
      </section>
    </Page>
  );
}
