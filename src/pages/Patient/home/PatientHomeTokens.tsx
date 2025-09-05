import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import query from "@/Utils/request/query";
import useFilters from "@/hooks/useFilters";
import scheduleApis from "@/types/scheduling/scheduleApi";
import { TokenRead, renderTokenNumber } from "@/types/tokens/token/token";

interface PatientHomeTokensProps {
  patientId: string;
  facilityId: string;
}

export default function PatientHomeTokens({
  patientId,
  facilityId,
}: PatientHomeTokensProps) {
  const { t } = useTranslation();
  const { qParams, Pagination, resultsPerPage } = useFilters({
    disableCache: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["getTokens", patientId, qParams],
    queryFn: query(scheduleApis.appointments.get_tokens, {
      pathParams: { patientId },
      queryParams: {
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        ordering: "-created_date",
      },
    }),
  });

  const tokens = data?.results;

  return (
    <div className="mt-4 px-3 md:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0">
        <h2 className="text-2xl font-semibold leading-tight text-center sm:text-left">
          {t("tokens")}
        </h2>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("token_number")}</TableHead>
              <TableHead>{t("category")}</TableHead>
              <TableHead>{t("queue")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead>{t("created_date")}</TableHead>
              {facilityId && (
                <TableHead className="text-right">{t("actions")}</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  {t("loading")}
                </TableCell>
              </TableRow>
            ) : tokens && tokens.length ? (
              tokens.map((token: TokenRead) => (
                <TableRow key={token.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                        <CareIcon
                          icon="l-ticket"
                          className="size-4 text-primary"
                        />
                      </div>
                      <span className="font-mono text-sm">
                        {renderTokenNumber(token)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {token.category.name}
                      </span>
                      {token.category.shorthand && (
                        <Badge variant="outline" className="text-xs">
                          {token.category.shorthand}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {token.queue.name}
                      </span>
                      {token.sub_queue && (
                        <span className="text-xs text-gray-500">
                          {token.sub_queue.name}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{t(token.status.toLowerCase())}</TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      TODO
                      {/* TODO: Add created date */}
                    </span>
                  </TableCell>
                  {facilityId && (
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          href={`/facility/${facilityId}/queues/${token.queue.id}/tokens/${token.id}`}
                        >
                          <CareIcon icon="l-eye" className="mr-1" />
                          {t("view")}
                        </Link>
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <div className="rounded-full bg-primary/10 p-3 mb-3">
                      <CareIcon
                        icon="l-ticket"
                        className="size-6 text-primary"
                      />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">
                      {t("no_tokens_found")}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {t("no_tokens_found_description")}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Pagination totalCount={data?.count ?? 0} />
      </div>
    </div>
  );
}
