import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Link2,
  MapPin,
  Monitor,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

import { useIsMobile } from "@/hooks/use-mobile";

import { formatDateTime, formatName } from "@/Utils/utils";
import { QuestionnaireResponseStatus } from "@/types/questionnaire/questionnaireResponse";
import { ResourceQuestionnaireResponse } from "@/types/questionnaire/resourceQuestionnaireResponseApi";

import ResourceResponseDetails from "./ResourceResponseDetails";
import { ResourceResponseSubjectType } from "./types";

interface ResourceResponseViewerProps {
  response: ResourceQuestionnaireResponse | null;
  open: boolean;
  onClose: () => void;
  subjectType: ResourceResponseSubjectType;
  subjectName?: string;
  onPrevious?: () => void;
  onNext?: () => void;
  position?: number;
  total?: number;
  isLoading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  onCopyLink?: () => void;
}

export default function ResourceResponseViewer({
  response,
  open,
  onClose,
  subjectType,
  subjectName,
  onPrevious,
  onNext,
  position,
  total,
  isLoading,
  error,
  onRetry,
  onCopyLink,
}: ResourceResponseViewerProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const SubjectIcon = {
    location: MapPin,
    device: Monitor,
    facility: Building2,
  }[subjectType];
  const openerRef = useRef<HTMLElement | null>(null);
  const previousRef = useRef<HTMLButtonElement | null>(null);
  const nextRef = useRef<HTMLButtonElement | null>(null);
  const navigationIntent = useRef<{
    direction: "previous" | "next";
    responseId: string | undefined;
  } | null>(null);
  const [lastVisible, setLastVisible] = useState({ response, position, total });

  // Keep the last visible content while Radix plays the closing animation.
  if (
    open &&
    (response !== lastVisible.response ||
      position !== lastVisible.position ||
      total !== lastVisible.total)
  ) {
    setLastVisible({ response, position, total });
  }

  const visible = open ? { response, position, total } : lastVisible;
  const visibleResponse = visible.response;
  const showNavigation =
    visible.position !== undefined && visible.total !== undefined;
  const showLoading = open && isLoading;

  useEffect(() => {
    if (!open) {
      navigationIntent.current = null;
      return;
    }
    const intent = navigationIntent.current;
    if (!intent || isLoading || intent.responseId === response?.id) return;

    if (intent.direction === "next" && !onNext) {
      previousRef.current?.focus();
    } else if (intent.direction === "previous" && !onPrevious) {
      nextRef.current?.focus();
    }
    navigationIntent.current = null;
  }, [open, isLoading, response?.id, onPrevious, onNext]);

  return (
    <Sheet
      open={open}
      modal={isMobile}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <SheetContent
        side="right"
        className="flex h-dvh w-full flex-col gap-0 border-neutral-200 p-0 shadow-lg sm:max-w-none md:w-[min(720px,70vw)] [&>button]:hidden"
        onOpenAutoFocus={() => {
          openerRef.current =
            document.activeElement instanceof HTMLElement
              ? document.activeElement
              : null;
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (openerRef.current?.isConnected) openerRef.current.focus();
        }}
        onInteractOutside={(event) => {
          if (!isMobile) event.preventDefault();
        }}
      >
        <SheetHeader className="shrink-0 space-y-0 border-b border-neutral-200 bg-white px-4 pb-4 pt-2 text-left">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-neutral-700">
              {t("response_details")}
            </p>
            <div className="flex items-center gap-1">
              {onCopyLink && (
                <Button
                  variant="ghost"
                  className="h-12 px-3 text-neutral-950 underline underline-offset-4 hover:bg-neutral-200/75 focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 md:h-10 [&_svg]:size-5"
                  onClick={onCopyLink}
                >
                  <Link2 className="size-4" />
                  {t("copy_link")}
                </Button>
              )}
              <SheetClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-12 text-neutral-700 hover:bg-neutral-200/75 focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 md:size-10 [&_svg]:size-5"
                  aria-label={t("close")}
                >
                  <X className="size-5" />
                </Button>
              </SheetClose>
            </div>
          </div>
          <SheetTitle className="break-words text-lg leading-7 font-semibold text-neutral-950">
            {visibleResponse?.questionnaire.title || t("view_response")}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {t("response_details")}
          </SheetDescription>
          {(subjectName || visibleResponse) && (
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
              {subjectName && (
                <span className="inline-flex min-w-0 items-center gap-1.5 text-sm text-neutral-600">
                  <SubjectIcon
                    className="size-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="break-words">{subjectName}</span>
                </span>
              )}
              {visibleResponse && (
                <Badge
                  size="xs"
                  className={cn(
                    "h-5 rounded-sm px-2 py-0",
                    visibleResponse.status ===
                      QuestionnaireResponseStatus.EnteredInError
                      ? "border-red-500/45"
                      : "border-green-500/40",
                  )}
                  variant={
                    visibleResponse.status ===
                    QuestionnaireResponseStatus.EnteredInError
                      ? "destructive"
                      : "green"
                  }
                >
                  {t(visibleResponse.status)}
                </Badge>
              )}
            </div>
          )}
        </SheetHeader>

        <div
          key={visibleResponse?.id}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4"
          data-cy={`${subjectType}-response-content`}
          aria-busy={showLoading}
        >
          {showLoading ? (
            <div role="status" className="space-y-6">
              <span className="sr-only">{t("loading")}</span>
              <Skeleton className="h-20 w-full" />
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className="space-y-3">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-6 w-3/4" />
                </div>
              ))}
            </div>
          ) : open && (error || !visibleResponse) ? (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>
                <p>{t("error_loading_questionnaire_response")}</p>
                {onRetry && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 h-12 border-neutral-400 text-sm text-neutral-950 shadow-md hover:bg-neutral-200/75 focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 md:h-10"
                    onClick={onRetry}
                  >
                    {t("try_again")}
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          ) : visibleResponse ? (
            <div className="space-y-7">
              <dl className="grid grid-cols-1 gap-4 rounded-[10px] border border-neutral-200 bg-neutral-50 p-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-neutral-700">
                    {t("submitted_by")}
                  </dt>
                  <dd className="mt-1 break-words font-medium text-neutral-900">
                    {formatName(visibleResponse.created_by)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-neutral-700">
                    {t("submitted_on")}
                  </dt>
                  <dd className="mt-1 font-medium text-neutral-900">
                    {visibleResponse.created_date
                      ? formatDateTime(visibleResponse.created_date)
                      : t("unknown")}
                  </dd>
                </div>
              </dl>

              {visibleResponse.questionnaire.description && (
                <p className="break-words whitespace-pre-wrap text-sm leading-6 text-neutral-600">
                  {visibleResponse.questionnaire.description}
                </p>
              )}

              <section className="space-y-4">
                <h3 className="text-sm font-medium text-neutral-700">
                  {t("submitted_answers")}
                </h3>
                <ResourceResponseDetails response={visibleResponse} />
              </section>
            </div>
          ) : null}
        </div>

        {showNavigation && (
          <div className="shrink-0 border-t border-neutral-200 bg-neutral-50 p-4">
            <p
              className="mb-3 text-center text-xs text-neutral-500"
              aria-live="polite"
            >
              {t("response_position", {
                position: visible.position,
                total: visible.total,
              })}
            </p>
            <div className="flex items-center justify-between gap-3">
              <Button
                ref={previousRef}
                variant="outline"
                className="h-12 flex-1 border-neutral-400 text-neutral-950 shadow-md hover:bg-neutral-200/75 focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 sm:flex-none md:h-10 [&_svg]:size-5"
                aria-label={t("previous_response")}
                disabled={!onPrevious || showLoading}
                onClick={() => {
                  navigationIntent.current = {
                    direction: "previous",
                    responseId: response?.id,
                  };
                  onPrevious?.();
                }}
              >
                <ArrowLeft className="size-4" />
                <span className="sm:hidden">{t("previous")}</span>
                <span className="hidden sm:inline">
                  {t("previous_response")}
                </span>
              </Button>
              <Button
                ref={nextRef}
                variant="outline"
                className="h-12 flex-1 border-neutral-400 text-neutral-950 shadow-md hover:bg-neutral-200/75 focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 sm:flex-none md:h-10 [&_svg]:size-5"
                aria-label={t("next_response")}
                disabled={!onNext || showLoading}
                onClick={() => {
                  navigationIntent.current = {
                    direction: "next",
                    responseId: response?.id,
                  };
                  onNext?.();
                }}
              >
                <span className="sm:hidden">{t("next")}</span>
                <span className="hidden sm:inline">{t("next_response")}</span>
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
