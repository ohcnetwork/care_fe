import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DatePicker } from "@/components/ui/date-picker";

import { cn } from "@/lib/utils";
import { TokenCard } from "@/pages/Facility/queues/TokenCard";
import { FacilityRead } from "@/types/facility/facility";
import { formatScheduleResourceName } from "@/types/scheduling/schedule";
import scheduleApis from "@/types/scheduling/scheduleApi";
import {
  renderTokenNumber,
  TOKEN_STATUS_COLORS,
  TokenRetrieve,
} from "@/types/tokens/token/token";
import query from "@/Utils/request/query";
import { dateQueryString } from "@/Utils/utils";
import { ChevronsDownUp, ChevronsUpDown } from "lucide-react";

interface PatientTokensListProps {
  patientId: string;
  facility: FacilityRead;
}

export default function PatientTokensList({
  patientId,
  facility,
}: PatientTokensListProps) {
  const { t } = useTranslation();
  const [expandedTokens, setExpandedTokens] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ["tokens", patientId, facility.id, selectedDate],
    queryFn: query(scheduleApis.appointments.get_tokens, {
      pathParams: { patientId },
      queryParams: {
        facility: facility.id,
        limit: 50,
        date: dateQueryString(selectedDate),
      },
    }),
  });

  const tokens = data?.results || [];

  const toggleTokenExpansion = (tokenId: string) => {
    const newExpanded = new Set(expandedTokens);
    if (newExpanded.has(tokenId)) {
      newExpanded.delete(tokenId);
    } else {
      newExpanded.add(tokenId);
    }
    setExpandedTokens(newExpanded);
  };

  if (isLoading) {
    return (
      <Card className="bg-white shadow-sm">
        <CardHeader className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-row gap-4 items-start sm:items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">{t("tokens")}</h3>
          <Badge variant="secondary">{tokens.length}</Badge>
        </div>

        <div className="flex items-center gap-2">
          <DatePicker
            date={selectedDate}
            onChange={handleDateChange}
            className="border-gray-300"
            dateFormat={
              selectedDate.toDateString() === new Date().toDateString()
                ? `'Today (${selectedDate.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })})'`
                : "dd MMM yyyy"
            }
          />
        </div>
      </div>

      {tokens.length === 0 && (
        <Card className="bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="rounded-full bg-primary/10 p-3 mb-3">
                <CareIcon icon="l-ticket" className="size-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-1">
                {t("no_tokens_found")}
              </h3>
              <p className="text-sm text-gray-500">
                {t("no_tokens_found_description")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {tokens.map((token) => {
        const isExpanded = expandedTokens.has(token.id);

        return (
          <Collapsible
            key={token.id}
            open={isExpanded}
            onOpenChange={() => toggleTokenExpansion(token.id)}
          >
            <Card
              className={cn(
                "bg-white shadow-sm rounded-md",
                isExpanded && "bg-gray-100 rounded-t-none",
              )}
            >
              <CollapsibleTrigger asChild>
                <CardHeader
                  className={cn(
                    "p-2 px-4 cursor-pointer rounded-md hover:bg-gray-50 transition-colors",
                    isExpanded && "rounded-none",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="space-y-1 w-full">
                      <div className="flex items-center justify-between">
                        <div className="flex justify-between gap-2">
                          <div className="text-sm font-semibold flex justify-between gap-2">
                            {renderTokenNumber(token)}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">
                          {formatScheduleResourceName(token)}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={TOKEN_STATUS_COLORS[token.status]}
                      className="px-1.5 rounded-sm ml-2"
                    >
                      {t(token.status.toLowerCase())}
                    </Badge>
                    {isExpanded ? (
                      <ChevronsDownUp className="size-4 shrink-0" />
                    ) : (
                      <ChevronsUpDown className="size-4 shrink-0" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="p-1 bg-gray-100 border-gray-100 rounded-md">
                  <div
                    id={`print-token-${token.id}`}
                    className="print:block print:w-[400px] print:border print:rounded-md"
                  >
                    <TokenCard
                      showlogo={false}
                      token={token as TokenRetrieve}
                      facility={facility}
                      id={`token-card-${token.id}`}
                      className="rounded-md border-none shadow-xs hover:shadow-xs hover:scale-none"
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}
    </div>
  );
}
