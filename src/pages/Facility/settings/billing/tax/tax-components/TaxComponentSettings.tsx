import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";

import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";

export function TaxComponentSettings() {
  const { t } = useTranslation();
  const { facility } = useCurrentFacility();
  const [search, setSearch] = useState("");

  if (!facility) {
    return <Loading />;
  }

  const allComponents = facility.instance_tax_monetary_components || [];

  const filteredComponents = allComponents.filter(
    (component) =>
      component.title.toLowerCase().includes(search.toLowerCase()) ||
      component.code?.code.toLowerCase().includes(search.toLowerCase()) ||
      (component.code?.display || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (component.factor != null &&
        component.factor.toString().includes(search)) ||
      (component.amount != null &&
        component.amount.toString().includes(search)),
  );

  return (
    <Page
      title={t("tax_components")}
      options={
        <div className="flex items-center gap-2">
          <Input
            placeholder={t("search_tax_components")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-[300px]"
          />
        </div>
      }
    >
      <div className="rounded-md border overflow-hidden mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("code")}</TableHead>
              <TableHead>{t("value")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white">
            {filteredComponents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center h-24">
                  {search
                    ? t("no_matching_tax_components")
                    : t("no_tax_components")}
                </TableCell>
              </TableRow>
            ) : (
              filteredComponents.map((component, idx) => (
                <TableRow key={`${component.title}-${idx}`}>
                  <TableCell>{component.title}</TableCell>
                  <TableCell>
                    {component.code && (
                      <code className="px-2 py-1 rounded bg-gray-100 text-sm">
                        {component.code.code}
                      </code>
                    )}
                  </TableCell>
                  <TableCell>
                    <MonetaryDisplay {...component} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Page>
  );
}
