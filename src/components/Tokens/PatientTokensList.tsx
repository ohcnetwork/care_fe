import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DatePicker } from "@/components/ui/date-picker";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { AssignToServicePointDialog } from "@/pages/Facility/queues/AssignToServicePointDialog";
import { TokenCard } from "@/pages/Facility/queues/TokenCard";
import { getTokenStatus } from "@/pages/Facility/queues/utils";
import { FacilityRead } from "@/types/facility/facility";
import { formatScheduleResourceName } from "@/types/scheduling/schedule";
import scheduleApis from "@/types/scheduling/scheduleApi";
import {
  renderTokenNumber,
  TOKEN_STATUS_COLORS,
  TokenRetrieve,
  TokenStatus,
} from "@/types/tokens/token/token";
import tokenApi from "@/types/tokens/token/tokenApi";
import { TokenSubQueueStatus } from "@/types/tokens/tokenSubQueue/tokenSubQueue";
import tokenSubQueueApi from "@/types/tokens/tokenSubQueue/tokenSubQueueApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { dateQueryString } from "@/Utils/utils";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowRight,
  ChevronsDownUp,
  ChevronsUpDown,
  TicketIcon,
} from "lucide-react";
import { toast } from "sonner";

interface PatientTokensListProps {
  patientId: string;
  facility: FacilityRead;
  tokenId?: string;
  queueId?: string;
}

export default function PatientTokensList({
  patientId,
  facility,
  tokenId,
  queueId,
}: PatientTokensListProps) {
  const { t } = useTranslation();
  const [expandedTokens, setExpandedTokens] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showServicepointDialog, setShowServicepointDialog] = useState(false);
  const queryClient = useQueryClient();

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  useEffect(() => {
    if (tokenId) {
      setExpandedTokens(new Set([tokenId]));
    }
  }, [tokenId]);

  const { data: token } = useQuery({
    queryKey: ["token", facility.id, queueId, tokenId],
    queryFn: query(tokenApi.get, {
      pathParams: {
        facility_id: facility.id,
        queue_id: queueId ?? "",
        id: tokenId ?? "",
      },
    }),
    enabled: !!queueId && !!tokenId,
  });

  const { data: subQueues } = useQuery({
    queryKey: ["servicePoints", facility.id],
    queryFn: query(tokenSubQueueApi.list, {
      pathParams: { facility_id: facility.id },
      queryParams: {
        resource_type: token?.resource_type,
        resource_id: token?.resource.id,
        limit: 100, // We are assuming that a resource will not have more than 100 sub-queues
        status: TokenSubQueueStatus.ACTIVE,
      },
    }),
    enabled: !!token,
  });

  const { mutate: updateToken, isPending } = useMutation({
    mutationFn: mutate(tokenApi.update, {
      pathParams: {
        facility_id: facility.id,
        queue_id: token?.queue.id ?? "",
        id: token?.id ?? "",
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["infinite-tokens", facility.id, token?.queue.id ?? ""],
      });
      queryClient.invalidateQueries({
        queryKey: ["tokens", token?.patient?.id, facility.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["token-queue-summary", facility.id, token?.queue.id ?? ""],
      });
      toast.success(t("token_assigned_to_service_point"));
      setShowServicepointDialog(false);
    },
  });

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

  const isOnlyOneSubQueue = subQueues?.results?.length === 1;

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
                ? `'Today (${selectedDate.toLocaleDateString("default", {
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
        <EmptyState
          title={t("no_tokens_found")}
          description={t("no_tokens_found_description")}
          icon={<TicketIcon className="size-5 text-primary m-1" />}
          className="lg:border-solid"
        />
      )}

      {[
        // ordered by selected token first, then by created date
        ...tokens.filter((token) => token.id === tokenId),
        ...tokens.filter((token) => token.id !== tokenId),
      ].map((token) => {
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
                      className="px-1.5 rounded-sm ml-2 whitespace-nowrap flex-shrink-0"
                    >
                      {getTokenStatus({ token, t })}
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
                    className="flex flex-col gap-2 print:block print:w-[400px] print:border print:rounded-md"
                  >
                    <TokenCard
                      showlogo={false}
                      token={token as TokenRetrieve}
                      facility={facility}
                      id={`token-card-${token.id}`}
                      className="rounded-md border-none shadow-xs hover:shadow-xs hover:scale-none"
                    />
                    {tokenId && token.status === TokenStatus.CREATED && (
                      <div className="flex justify-center items-center bg-white p-2 rounded-md mb-1 shadow-xs animate-in slide-in-from-top-2 duration-700">
                        <Button
                          variant="outline_primary"
                          className="w-full flex items-center justify-center gap-2 font-semibold"
                          onClick={() => {
                            if (isOnlyOneSubQueue) {
                              updateToken({
                                status: TokenStatus.IN_PROGRESS,
                                sub_queue: subQueues?.results?.[0]?.id,
                                note: token.note,
                              });
                            } else {
                              setShowServicepointDialog(true);
                            }
                          }}
                        >
                          {t("mark_as_in_service")}
                          <ArrowRight className="size-4 animate-arrow-slide" />
                        </Button>
                      </div>
                    )}
                    {!isOnlyOneSubQueue && (
                      <AssignToServicePointDialog
                        open={showServicepointDialog}
                        onOpenChange={setShowServicepointDialog}
                        token={token}
                        subQueues={subQueues?.results ?? []}
                        onUpdate={updateToken}
                        isPending={isPending}
                      />
                    )}
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
