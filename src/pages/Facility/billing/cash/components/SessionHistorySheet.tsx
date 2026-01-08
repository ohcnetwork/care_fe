import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { SessionData } from "@/types/billing/cash/cashSession";
import cashSessionApi from "@/types/billing/cash/cashSessionApi";
import query from "@/Utils/request/query";

interface SessionHistorySheetProps {
  facilityId: string;
  userId: string;
}

export default function SessionHistorySheet({
  facilityId,
  userId,
}: SessionHistorySheetProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const { data: sessionsResponse, isLoading } = useQuery({
    queryKey: ["cash-sessions", facilityId, userId],
    queryFn: query(cashSessionApi.listSessions, {
      pathParams: { facilityId: facilityId },
      queryParams: {
        status: "closed",
      },
    }),
    enabled: open,
  });

  const sessions = sessionsResponse?.sessions ?? [];

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "-";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getDifferenceColor = (difference: number | null) => {
    if (difference === null || difference === 0) return "text-gray-900";
    return difference > 0 ? "text-green-600" : "text-red-600";
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">
          <CareIcon icon="l-history" className="mr-2 size-4" />
          {t("session_history")}
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("session_history")}</SheetTitle>
          <SheetDescription>
            {t("session_history_description")}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CareIcon
                icon="l-history"
                className="size-12 text-gray-300 mb-4"
              />
              <p className="text-gray-500">{t("no_past_sessions")}</p>
            </div>
          ) : (
            sessions.map((session: SessionData) => (
              <div
                key={session.id}
                className="rounded-lg border p-4 space-y-3 gap-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{session.counter_name}</h4>
                    <p className="text-sm text-gray-500">
                      {formatDateTime(session.opened_at)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      session.status === "open" ? "primary" : "secondary"
                    }
                  >
                    {t(`session_${session.status}`)}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded bg-gray-50 p-2">
                    <p className="text-gray-500">{t("opening_balance")}</p>
                    <p className="font-medium">
                      {formatCurrency(session.opening_balance)}
                    </p>
                  </div>
                  <div className="rounded bg-gray-50 p-2">
                    <p className="text-gray-500">{t("expected_amount")}</p>
                    <p className="font-medium">
                      {formatCurrency(session.expected_amount)}
                    </p>
                  </div>
                  {session.status === "closed" && (
                    <>
                      <div className="rounded bg-gray-50 p-2">
                        <p className="text-gray-500">{t("declared_amount")}</p>
                        <p className="font-medium">
                          {formatCurrency(session.closing_declared)}
                        </p>
                      </div>
                      <div className="rounded bg-gray-50 p-2">
                        <p className="text-gray-500">{t("difference")}</p>
                        <p
                          className={`font-medium ${getDifferenceColor(session.closing_difference)}`}
                        >
                          {session.closing_difference > 0 ? "+" : ""}
                          {formatCurrency(session.closing_difference)}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {session.closed_at && (
                  <p className="text-xs text-gray-400">
                    {t("closed_at")}: {formatDateTime(session.closed_at)}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
