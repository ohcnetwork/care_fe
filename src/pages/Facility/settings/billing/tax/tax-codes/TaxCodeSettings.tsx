import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
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
import { Code } from "@/types/base/code/code";

export function TaxCodeSettings() {
  const { t } = useTranslation();
  const { facility } = useCurrentFacility();
  const [search, setSearch] = useState("");

  if (!facility) {
    return <Loading />;
  }

  const allCodes = facility.instance_tax_codes || [];

  const filteredCodes = allCodes.filter(
    (code) =>
      code.display.toLowerCase().includes(search.toLowerCase()) ||
      code.code.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Page
      title={t("tax_codes")}
      options={
        <div className="flex items-center gap-2">
          <Input
            placeholder={t("search_tax_codes")}
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
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white">
            {filteredCodes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center h-24">
                  {search ? t("no_matching_tax_codes") : t("no_tax_codes")}
                </TableCell>
              </TableRow>
            ) : (
              filteredCodes.map((code: Code) => (
                <TableRow key={code.code}>
                  <TableCell>{code.display}</TableCell>
                  <TableCell>
                    <code className="px-2 py-1 rounded bg-gray-100 text-sm">
                      {code.code}
                    </code>
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
