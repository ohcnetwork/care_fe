import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Activity,
  CalendarDays,
  ClipboardList,
  ClipboardPlus,
  Ellipsis,
  Eye,
  FileAudio,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Files,
  FlaskConical,
  Link2,
  Loader2,
  type LucideIcon,
  Plus,
  ShieldAlert,
  Stethoscope,
  Syringe,
  TestTubeDiagonal,
  Trash2,
  Upload,
} from "lucide-react";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/careui/button";
import { Frame, FrameHeader, FramePanel } from "@/components/careui/frame";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/careui/item";
import FilePreviewDialog from "@/components/Common/FilePreviewDialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ReferralRetrieve } from "@/types/emr/referral/referral";
import {
  REFERRAL_RESOURCE_CATEGORIES,
  ReferralResource,
  ReferralResourceCategory,
  ReferralResourceType,
} from "@/types/emr/referral/referralResource";
import referralResourceApi from "@/types/emr/referral/referralResourceApi";
import { FILE_EXTENSIONS } from "@/types/files/file";
import { callApi } from "@/Utils/request/query";
import { formatDateTime } from "@/Utils/utils";

import { invalidateReferralResources } from "./invalidateReferralResources";
import {
  ReferralResourceContent,
  referralResourceTitle,
} from "./ReferralResourceContent";
import { ReferralResourcePicker } from "./ReferralResourcePicker";
import { ReferralUploadDialog } from "./ReferralUploadDialog";
import {
  ResolvedReferralResourceState,
  useResolvedReferralResources,
} from "./useResolvedReferralResources";

// Keep clinical sections in a predictable review order, independent of the
// order in which the referring clinician attached individual records.
const RECORD_GROUPS = [
  { type: "condition", label: "diagnoses", icon: Stethoscope },
  { type: "questionnaire_response", label: "responses", icon: ClipboardList },
  { type: "diagnostic_report", label: "diagnostic_report", icon: FlaskConical },
  { type: "specimen", label: "specimens", icon: TestTubeDiagonal },
  { type: "referral", label: "referral_related_referrals", icon: Link2 },
  { type: "file_upload", label: "referral_attached_files", icon: Files },
  { type: "observation", label: "observations", icon: Activity },
  { type: "allergy_intolerance", label: "allergies", icon: ShieldAlert },
  { type: "service_request", label: "service_requests", icon: ClipboardPlus },
  { type: "immunization", label: "immunizations", icon: Syringe },
  { type: "appointment", label: "appointments", icon: CalendarDays },
] as const satisfies readonly {
  type: ReferralResourceType;
  label: string;
  icon: LucideIcon;
}[];

function SharedRecordRow({
  attachment,
  resolved,
  canWrite,
  onRemove,
}: {
  attachment: ReferralResource;
  resolved: ResolvedReferralResourceState;
  canWrite: boolean;
  onRemove: (trigger: HTMLButtonElement | null) => void;
}) {
  const { t } = useTranslation();
  const [preview, setPreview] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const removalRequestedRef = useRef(false);
  const title =
    !resolved.isError && resolved.data
      ? referralResourceTitle(resolved.data) ||
        t(`referral_resource_${attachment.resource_type}`)
      : t(`referral_resource_${attachment.resource_type}`);
  const isFile = attachment.resource_type === "file_upload";
  const file =
    !resolved.isError && resolved.data?.resource_type === "file_upload"
      ? resolved.data.resource
      : undefined;
  const fileUrl = file?.read_signed_url || file?.signed_url;
  const extension = file?.extension.replace(/^\./, "").toLowerCase() ?? "";
  const isImage =
    (file?.mime_type ?? "").startsWith("image/") ||
    FILE_EXTENSIONS.IMAGE.some((value) => value === extension);
  const isPdf = file?.mime_type === "application/pdf" || extension === "pdf";
  const FileIcon = isImage
    ? FileImage
    : (file?.mime_type ?? "").startsWith("audio/") ||
        FILE_EXTENSIONS.AUDIO.some((value) => value === extension)
      ? FileAudio
      : (file?.mime_type ?? "").startsWith("video/") ||
          FILE_EXTENSIONS.VIDEO.some((value) => value === extension)
        ? FileVideo
        : ["csv", "xls", "xlsx", "ods"].includes(extension)
          ? FileSpreadsheet
          : FileText;
  const baseFileName =
    file && extension && file.name.toLowerCase().endsWith(`.${extension}`)
      ? file.name.slice(0, -(extension.length + 1))
      : (file?.name ?? title);
  const fileName = extension ? `${baseFileName}.${extension}` : baseFileName;
  const fileDate = file?.created_date ?? attachment.created_date;
  const unavailable = resolved.isError || (isFile && !!file && !fileUrl);
  const hasNativeCard =
    !resolved.isError &&
    !!resolved.data &&
    ["condition", "specimen", "diagnostic_report"].includes(
      attachment.resource_type,
    );
  const actions = canWrite && (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) removalRequestedRef.current = false;
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-11 text-cui-muted-foreground sm:size-9"
          ref={menuTriggerRef}
          aria-label={t("referral_record_actions", { name: title })}
        >
          <Ellipsis aria-hidden="true" className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="careui"
        align="end"
        onCloseAutoFocus={(event) => {
          if (removalRequestedRef.current) event.preventDefault();
        }}
      >
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => {
            removalRequestedRef.current = true;
            onRemove(menuTriggerRef.current);
          }}
        >
          <Trash2 aria-hidden="true" className="size-4" />
          {t("remove")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
  return (
    <section aria-label={title} className="min-w-0 space-y-3">
      {isFile ? (
        <Item
          size="sm"
          className="flex-nowrap items-center gap-2 border-cui-border bg-cui-background p-2 sm:gap-3 focus-within:border-cui-ring focus-within:ring-2 focus-within:ring-cui-ring/20"
        >
          <ItemMedia
            aria-hidden="true"
            variant="icon"
            className={cn(
              "size-10 rounded-md self-center! translate-y-0!",
              isPdf
                ? "bg-cui-destructive/10 text-cui-destructive"
                : isImage
                  ? "bg-blue-50 text-blue-700"
                  : "bg-cui-muted text-cui-muted-foreground",
            )}
          >
            <FileIcon className="size-5" />
          </ItemMedia>
          <ItemContent className="min-w-0">
            <ItemTitle className="block w-full min-w-0 line-clamp-none">
              <span
                className="block break-all line-clamp-2 sm:line-clamp-1"
                title={fileName}
              >
                {fileName}
              </span>
            </ItemTitle>
            <ItemDescription className="text-xs">
              <time dateTime={fileDate}>
                {formatDateTime(fileDate, "DD MMM YYYY")}
              </time>
            </ItemDescription>
          </ItemContent>
          <div className="flex shrink-0 gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={!fileUrl || unavailable}
              onClick={() => setPreview(true)}
              aria-label={t("referral_preview_record", { name: title })}
              className="h-11 gap-1.5 px-2 underline underline-offset-4 sm:h-9"
            >
              <Eye aria-hidden="true" className="size-4" />
              {t("view")}
            </Button>
            {actions}
          </div>
        </Item>
      ) : (
        !hasNativeCard && (
          <h5 className="min-w-0 break-words text-base font-semibold text-cui-foreground">
            {title}
          </h5>
        )
      )}
      {(resolved.isLoading || unavailable || !isFile) && (
        <div className="min-w-0">
          {resolved.isLoading ? (
            <p role="status" className="flex items-center gap-2 text-sm">
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              {t("loading")}
            </p>
          ) : unavailable ? (
            <div role="alert" className="space-y-3">
              <p className="text-sm text-cui-muted-foreground">
                {t("referral_record_unavailable")}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void resolved.refetch()}
              >
                {t("retry")}
              </Button>
            </div>
          ) : (
            resolved.data && <ReferralResourceContent data={resolved.data} />
          )}
        </div>
      )}
      {!isFile && (
        <footer className="flex items-center justify-between gap-3 border-t border-cui-border/60 pt-2 text-xs text-cui-muted-foreground">
          <time dateTime={attachment.created_date}>
            {t("referral_attachment_date", {
              date: formatDateTime(attachment.created_date),
            })}
          </time>
          {actions}
        </footer>
      )}
      {preview && file && fileUrl && !unavailable && (
        <FilePreviewDialog
          show
          onClose={() => setPreview(false)}
          file_state={{
            open: true,
            isImage,
            name: baseFileName,
            extension,
            isZoomInDisabled: false,
            isZoomOutDisabled: false,
          }}
          fileUrl={fileUrl}
          downloadURL={fileUrl}
          currentIndex={0}
        />
      )}
    </section>
  );
}

function useReferralRecords(
  referralId: string,
  category: ReferralResourceCategory | undefined,
  enabled: boolean,
) {
  const records = useInfiniteQuery({
    queryKey: category
      ? ["referrals", referralId, "resources", category]
      : ["referrals", referralId, "resources"],
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) =>
      callApi(referralResourceApi.list, {
        pathParams: { referralId },
        queryParams: {
          limit: 20,
          offset: pageParam,
          ...(category ? { attachment_type: category } : {}),
        },
        signal,
        silent: true,
      }),
    enabled,
    getNextPageParam: (last, pages) => {
      if (last.results.length === 0) return undefined;
      const loaded = pages.reduce(
        (count, page) => count + page.results.length,
        0,
      );
      return loaded < last.count ? loaded : undefined;
    },
  });
  const attachments =
    enabled && !records.isError
      ? (records.data?.pages.flatMap((page) => page.results) ?? [])
      : [];
  // Keep resolve batches within their category. Loading metadata later must
  // not reshuffle a source batch and resolve its records a second time.
  const resolved = useResolvedReferralResources(attachments);
  return { ...records, attachments, resolved };
}

export function ReferralSharedRecords({
  referral,
  canWrite,
  categories,
  title,
  description,
  hideWhenEmpty = false,
  onDialogOpenChange,
}: {
  referral: ReferralRetrieve;
  canWrite: boolean;
  categories?: readonly ReferralResourceCategory[];
  title?: ReactNode;
  description?: ReactNode;
  hideWhenEmpty?: boolean;
  onDialogOpenChange?: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const titleId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const addRecordRef = useRef<HTMLButtonElement>(null);
  const removalTriggerRef = useRef<HTMLButtonElement | null>(null);
  const removalCompletedRef = useRef(false);
  const queryClient = useQueryClient();
  const [action, setAction] = useState<"add" | "upload">();
  const [removing, setRemoving] = useState<ReferralResource>();
  useEffect(() => {
    onDialogOpenChange?.(canWrite && (!!action || !!removing));
    return () => onDialogOpenChange?.(false);
  }, [action, removing, canWrite, onDialogOpenChange]);
  const visibleCategories = REFERRAL_RESOURCE_CATEGORIES.filter(
    (category) => !categories || categories.includes(category),
  );
  // Preserve the original all-record query for unscoped consumers. Scoped
  // sections paginate each category at the server, so a source-heavy first
  // page can never make response records appear absent.
  const allRecords = useReferralRecords(referral.id, undefined, !categories);
  const sourceRecords = useReferralRecords(
    referral.id,
    "source",
    !!categories?.includes("source"),
  );
  const responseRecords = useReferralRecords(
    referral.id,
    "response",
    !!categories?.includes("response"),
  );
  const metadataRecords = useReferralRecords(
    referral.id,
    "metadata",
    !!categories?.includes("metadata"),
  );
  const categoryQueries = {
    source: sourceRecords,
    response: responseRecords,
    metadata: metadataRecords,
  };
  const queries = categories
    ? visibleCategories.map((category) => categoryQueries[category])
    : [allRecords];
  const attachments = queries.flatMap((records) => records.attachments);
  // Include known attachments from the other section when disabling already
  // linked candidates, without requesting or resolving that section's data.
  const knownQueries = categories
    ? [sourceRecords, responseRecords, metadataRecords]
    : [allRecords];
  const knownAttachments = knownQueries.flatMap((records) =>
    records.isError
      ? []
      : (records.data?.pages.flatMap((page) => page.results) ?? []),
  );
  const isLoading = queries.some((records) => records.isLoading);
  const isError = queries.some((records) => records.isError);
  const hasNextPage = queries.some((records) => records.hasNextPage);
  const isFetchingNextPage = queries.some(
    (records) => records.isFetchingNextPage,
  );
  const resolved = new Map(
    queries.flatMap((records) => [...records.resolved.entries()]),
  );
  const remove = useMutation({
    mutationFn: (attachment: ReferralResource) =>
      callApi(referralResourceApi.delete, {
        pathParams: { referralId: referral.id, resourceId: attachment.id },
      }),
    onSuccess: (_data, attachment) => {
      removalCompletedRef.current = true;
      setRemoving(undefined);
      void invalidateReferralResources(queryClient, attachment);
      toast.success(t("referral_record_removed"));
    },
  });
  const isEmpty = !isLoading && !isError && attachments.length === 0;
  if (hideWhenEmpty && isEmpty) return null;
  return (
    <section className="careui space-y-4" aria-labelledby={titleId}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2
            id={titleId}
            ref={headingRef}
            tabIndex={-1}
            className="text-base font-semibold text-cui-foreground"
          >
            {title ?? t("referral_shared_records")}
          </h2>
          {(description || isEmpty) && (
            <p className="max-w-xl text-sm text-cui-muted-foreground">
              {description ?? t("referral_no_shared_records")}
            </p>
          )}
        </div>
        {canWrite && visibleCategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAction("upload")}
            >
              <Upload className="size-4" />
              {t("referral_upload_file")}
            </Button>
            <Button
              ref={addRecordRef}
              size="sm"
              onClick={() => setAction("add")}
            >
              <Plus className="size-4" />
              {t("referral_add_record")}
            </Button>
          </div>
        )}
      </div>
      {isLoading && (
        <p role="status" className="flex items-center gap-2 py-6 text-sm">
          <Loader2 className="size-4 animate-spin" />
          {t("loading")}
        </p>
      )}
      {isError && (
        <div
          role="alert"
          className="space-y-3 rounded-md border border-cui-border p-4"
        >
          <p className="text-sm text-cui-muted-foreground">
            {t("referral_records_load_error")}
          </p>
          <Button
            variant="outline"
            onClick={() => {
              void Promise.all(
                queries
                  .filter((records) => records.isError)
                  .map((records) => records.refetch()),
              );
            }}
          >
            {t("retry")}
          </Button>
        </div>
      )}
      {visibleCategories.map((category) => {
        const categoryRecords = attachments.filter(
          (attachment) => attachment.attachment_type === category,
        );
        if (!categoryRecords.length) return null;
        const renderRecord = (attachment: ReferralResource) => (
          <SharedRecordRow
            key={attachment.id}
            attachment={attachment}
            resolved={resolved.get(attachment.id)!}
            canWrite={canWrite}
            onRemove={(trigger) => {
              removalTriggerRef.current = trigger;
              removalCompletedRef.current = false;
              setRemoving(attachment);
            }}
          />
        );
        return (
          <div key={category} className="space-y-4">
            {categories?.length !== 1 && (
              <h3 className="text-sm font-medium text-cui-muted-foreground">
                {t(`referral_records_${category}`)}
              </h3>
            )}
            {RECORD_GROUPS.map(({ type, label, icon: Icon }) => {
              const group = categoryRecords.filter(
                (attachment) => attachment.resource_type === type,
              );
              if (!group.length) return null;
              return (
                <Frame
                  key={type}
                  spacing="sm"
                  className="min-w-0 border-cui-border"
                >
                  <FrameHeader>
                    <h4 className="flex items-center gap-2 text-base font-semibold text-cui-foreground">
                      <Icon aria-hidden="true" className="size-5 shrink-0" />
                      {t(label, { count: group.length })}
                      <span className="text-sm font-normal text-cui-muted-foreground">
                        · {group.length}
                        {(
                          categories
                            ? categoryQueries[category].hasNextPage
                            : allRecords.hasNextPage
                        )
                          ? "+"
                          : ""}
                      </span>
                    </h4>
                  </FrameHeader>
                  {type === "file_upload" ? (
                    <div className="space-y-2 px-1.5 pb-1.5">
                      {group.map(renderRecord)}
                    </div>
                  ) : (
                    group.map((attachment) => (
                      <FramePanel
                        key={attachment.id}
                        className="min-w-0 border-cui-border shadow-none sm:p-4"
                      >
                        {renderRecord(attachment)}
                      </FramePanel>
                    ))
                  )}
                </Frame>
              );
            })}
          </div>
        );
      })}
      {hasNextPage && (
        <Button
          variant="outline"
          disabled={isFetchingNextPage}
          onClick={() => {
            void Promise.all(
              queries
                .filter((records) => records.hasNextPage)
                .map((records) => records.fetchNextPage()),
            );
          }}
        >
          {isFetchingNextPage && <Loader2 className="size-4 animate-spin" />}
          {t("load_more")}
        </Button>
      )}
      {canWrite && visibleCategories.length > 0 && action === "add" && (
        <ReferralResourcePicker
          referral={referral}
          attachments={knownAttachments}
          categories={visibleCategories}
          onClose={() => setAction(undefined)}
        />
      )}
      {canWrite && visibleCategories.length > 0 && action === "upload" && (
        <ReferralUploadDialog
          referral={referral}
          categories={visibleCategories}
          onClose={() => setAction(undefined)}
        />
      )}
      <AlertDialog
        open={!!removing && canWrite}
        onOpenChange={(open) => {
          if (!open && !remove.isPending) setRemoving(undefined);
        }}
      >
        <AlertDialogContent
          className="careui"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const target =
              !removalCompletedRef.current &&
              removalTriggerRef.current?.isConnected
                ? removalTriggerRef.current
                : (addRecordRef.current ?? headingRef.current);
            target?.focus({ preventScroll: true });
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>{t("referral_remove_record")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("referral_remove_record_description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>
              {t("cancel")}
            </AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => {
                if (removing) remove.mutate(removing);
              }}
            >
              {remove.isPending && <Loader2 className="size-4 animate-spin" />}
              {t("remove")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
