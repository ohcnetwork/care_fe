import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/careui/button";
import { Field, FieldError, FieldLabel } from "@/components/careui/field";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/careui/item";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthContext } from "@/hooks/useAuthUser";
import { ReferralRetrieve } from "@/types/emr/referral/referral";
import {
  REFERRAL_ATTACHABLE_RESOURCE_TYPES,
  REFERRAL_RESOURCE_CATEGORIES,
  ReferralResource,
  ReferralResourceCategory,
  ReferralResourceCreate,
  ReferralResourceType,
} from "@/types/emr/referral/referralResource";
import referralResourceApi from "@/types/emr/referral/referralResourceApi";
import { FileType } from "@/types/files/file";
import mutate from "@/Utils/request/mutate";

import { invalidateReferralResources } from "./invalidateReferralResources";
import {
  loadReferralCandidates,
  REFERRAL_CANDIDATE_PAGE_SIZE,
  ReferralResourceCandidate,
} from "./referralResourceCandidates";
import { referralResourceError } from "./referralResourceError";

export interface ReferralResourceContext {
  patientId: string;
  encounterId?: string;
  sourceFacility?: { id: string; name: string } | null;
  destinationFacility?: { id: string; name: string } | null;
}

export interface StagedReferralResource {
  resource: ReferralResourceCreate;
  title: string;
  detail?: string;
}

function useResourceFacilities(context: ReferralResourceContext) {
  const { user } = useAuthContext();
  const facilities = [
    context.destinationFacility,
    context.sourceFacility,
    ...(user?.facilities ?? []),
  ].filter((facility) => facility != null);
  return [
    ...new Map(facilities.map((facility) => [facility.id, facility])).values(),
  ];
}

export function useReferralFacilities(referral: ReferralRetrieve) {
  return useResourceFacilities({
    patientId: referral.patient,
    sourceFacility: referral.source?.facility,
    destinationFacility: referral.destination.facility,
  });
}

export function ReferralResourceCategoryField({
  value,
  onChange,
  disabled,
  categories = REFERRAL_RESOURCE_CATEGORIES,
}: {
  value: ReferralResourceCategory;
  onChange: (value: ReferralResourceCategory) => void;
  disabled?: boolean;
  categories?: readonly ReferralResourceCategory[];
}) {
  const { t } = useTranslation();
  return (
    <Field>
      <FieldLabel>{t("referral_record_category")}</FieldLabel>
      {categories.length === 1 ? (
        <p className="text-sm text-cui-muted-foreground">
          {t(`referral_records_${value}`)}
        </p>
      ) : (
        <Select value={value} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger aria-label={t("referral_record_category")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {t(`referral_records_${category}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </Field>
  );
}

type ReferralResourcePickerProps = {
  attachments: Pick<ReferralResource, "resource_type" | "resource_id">[];
  onClose: () => void;
  categories?: readonly ReferralResourceCategory[];
} & (
  | { referral: ReferralRetrieve; context?: never; onSelect?: never }
  | {
      referral?: never;
      context: ReferralResourceContext;
      onSelect: (record: StagedReferralResource) => void;
    }
);

export function ReferralResourcePicker(props: ReferralResourcePickerProps) {
  const {
    referral,
    attachments,
    onClose,
    categories = REFERRAL_RESOURCE_CATEGORIES,
  } = props;
  const context: ReferralResourceContext = referral
    ? {
        patientId: referral.patient,
        encounterId: referral.encounter ?? undefined,
        sourceFacility: referral.source?.facility,
        destinationFacility: referral.destination.facility,
      }
    : props.context;
  const staged = !referral;
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const facilities = useResourceFacilities(context);
  const [resourceType, setResourceType] =
    useState<ReferralResourceType>("diagnostic_report");
  const [selectedCategory, setCategory] = useState<ReferralResourceCategory>(
    categories[0],
  );
  const category = categories.includes(selectedCategory)
    ? selectedCategory
    : categories[0];
  const [facilityId, setFacilityId] = useState(
    facilities.find((facility) =>
      user?.facilities?.some((member) => member.id === facility.id),
    )?.id ??
      context.destinationFacility?.id ??
      context.sourceFacility?.id ??
      "",
  );
  const [offset, setOffset] = useState(0);
  const [fileScope, setFileScope] = useState<FileType>(FileType.PATIENT);
  const [parent, setParent] = useState<ReferralResourceCandidate>();
  const [selected, setSelected] = useState<ReferralResourceCandidate>();
  const requiresParent =
    resourceType === "specimen" ||
    (resourceType === "file_upload" &&
      [
        FileType.DIAGNOSTIC_REPORT,
        FileType.SERVICE_REQUEST,
        FileType.ENCOUNTER,
        FileType.CONSENT,
      ].includes(fileScope));
  const choosingParent = requiresParent && !parent;
  const listingType = choosingParent
    ? fileScope === FileType.DIAGNOSTIC_REPORT && resourceType === "file_upload"
      ? "diagnostic_report"
      : resourceType === "file_upload" && fileScope === FileType.ENCOUNTER
        ? "encounter"
        : resourceType === "file_upload" && fileScope === FileType.CONSENT
          ? "consent"
          : "service_request"
    : resourceType;
  const needsFacility =
    resourceType === "specimen" ||
    resourceType === "service_request" ||
    resourceType === "appointment" ||
    (resourceType === "file_upload" && fileScope === FileType.SERVICE_REQUEST);
  const associationId =
    parent?.id ??
    (fileScope === FileType.REFERRAL
      ? referral?.id
      : fileScope === FileType.ENCOUNTER
        ? context.encounterId
        : context.patientId);
  const candidates = useQuery({
    queryKey: [
      "referrals",
      referral?.id ?? "staged",
      context.patientId,
      "candidates",
      listingType,
      facilityId,
      offset,
      fileScope,
      parent?.id,
    ],
    queryFn: ({ signal }) =>
      loadReferralCandidates({
        resourceType: listingType,
        patientId: context.patientId,
        facilityId,
        offset,
        fileType: fileScope,
        parentId: resourceType === "specimen" ? parent?.id : associationId,
        signal,
      }),
    enabled:
      (!needsFacility || !!facilityId) &&
      (listingType !== "file_upload" || !!associationId),
    retry: false,
  });
  const add = useMutation<ReferralResource, Error, ReferralResourceCreate>({
    mutationFn: mutate(referralResourceApi.create, {
      pathParams: { referralId: referral?.id ?? "" },
    }),
    onSuccess: (_data, resource) => {
      if (referral) {
        void invalidateReferralResources(queryClient, {
          referral: referral.id,
          resource_type: resource.resource_type,
          resource_id: resource.resource_id,
        });
      }
      toast.success(t("referral_record_added"));
      onClose();
    },
  });
  function resetSelection() {
    setOffset(0);
    setParent(undefined);
    setSelected(undefined);
  }
  const attachedIds = new Set(
    attachments
      .filter((item) => item.resource_type === resourceType)
      .map((item) => item.resource_id),
  );
  const choices = (candidates.data?.results ?? []).filter(
    (item) => resourceType !== "referral" || item.id !== referral?.id,
  );

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !add.isPending) onClose();
      }}
    >
      <DialogContent className="careui max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("referral_add_record")}</DialogTitle>
          <DialogDescription>
            {t(
              staged
                ? "referral_stage_record_description"
                : "referral_add_record_description",
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>{t("referral_record_type")}</FieldLabel>
            <Select
              value={resourceType}
              disabled={add.isPending}
              onValueChange={(value: ReferralResourceType) => {
                setResourceType(value);
                resetSelection();
              }}
            >
              <SelectTrigger aria-label={t("referral_record_type")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REFERRAL_ATTACHABLE_RESOURCE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`referral_resource_${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {!staged && (
            <ReferralResourceCategoryField
              value={category}
              onChange={setCategory}
              disabled={add.isPending}
              categories={categories}
            />
          )}
        </div>
        {resourceType === "file_upload" && (
          <Field>
            <FieldLabel>{t("referral_file_source")}</FieldLabel>
            <Select
              value={fileScope}
              disabled={add.isPending}
              onValueChange={(value: FileType) => {
                setFileScope(value);
                resetSelection();
              }}
            >
              <SelectTrigger aria-label={t("referral_file_source")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[
                  FileType.PATIENT,
                  FileType.ENCOUNTER,
                  FileType.CONSENT,
                  FileType.REFERRAL,
                  FileType.DIAGNOSTIC_REPORT,
                  FileType.SERVICE_REQUEST,
                ]
                  .filter((scope) => !staged || scope !== FileType.REFERRAL)
                  .map((scope) => (
                    <SelectItem key={scope} value={scope}>
                      {t(`referral_file_source_${scope}`)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </Field>
        )}
        {needsFacility && (
          <Field>
            <FieldLabel>{t("facility")}</FieldLabel>
            <Select
              value={facilityId}
              disabled={add.isPending}
              onValueChange={(value) => {
                setFacilityId(value);
                resetSelection();
              }}
            >
              <SelectTrigger aria-label={t("facility")}>
                <SelectValue placeholder={t("select_facility")} />
              </SelectTrigger>
              <SelectContent>
                {facilities.map((facility) => (
                  <SelectItem key={facility.id} value={facility.id}>
                    {facility.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
        {parent && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetSelection}
              disabled={add.isPending}
            >
              <ArrowLeft className="size-4" />
              {t("back")}
            </Button>
            <p className="min-w-0 truncate text-sm text-cui-muted-foreground">
              {parent.title}
            </p>
          </div>
        )}
        {choosingParent && (
          <p className="text-sm text-cui-muted-foreground">
            {t("referral_choose_parent_record")}
          </p>
        )}
        <div className="space-y-2" aria-busy={candidates.isFetching}>
          {candidates.isLoading ? (
            <p role="status" className="flex items-center gap-2 py-6 text-sm">
              <Loader2 className="size-4 animate-spin" />
              {t("loading")}
            </p>
          ) : candidates.isError ? (
            <div role="alert" className="space-y-2 py-4">
              <p className="text-sm text-cui-muted-foreground">
                {t("referral_records_load_error")}
              </p>
              <Button
                variant="outline"
                onClick={() => void candidates.refetch()}
              >
                {t("retry")}
              </Button>
            </div>
          ) : choices.length === 0 ? (
            <p className="py-6 text-sm text-cui-muted-foreground">
              {needsFacility && !facilityId
                ? t("select_facility")
                : t("referral_no_available_records")}
            </p>
          ) : (
            choices.map((candidate) => {
              const attached = !choosingParent && attachedIds.has(candidate.id);
              return (
                <Item
                  key={candidate.id}
                  variant="outline"
                  size="sm"
                  className={
                    selected?.id === candidate.id
                      ? "border-cui-primary bg-cui-accent"
                      : ""
                  }
                >
                  <ItemContent>
                    <ItemTitle className="break-words">
                      {candidate.title || t(`referral_resource_${listingType}`)}
                    </ItemTitle>
                    {candidate.detail && (
                      <ItemDescription className="break-words">
                        {candidate.detail}
                      </ItemDescription>
                    )}
                  </ItemContent>
                  <Button
                    size="sm"
                    variant={
                      selected?.id === candidate.id ? "secondary" : "outline"
                    }
                    disabled={attached || add.isPending}
                    aria-pressed={
                      !choosingParent && selected?.id === candidate.id
                    }
                    aria-label={t("referral_select_record", {
                      name:
                        candidate.title ||
                        t(`referral_resource_${listingType}`),
                    })}
                    onClick={() => {
                      if (choosingParent) {
                        setParent(candidate);
                        setOffset(0);
                      } else setSelected(candidate);
                    }}
                  >
                    {selected?.id === candidate.id && (
                      <Check className="size-4" />
                    )}
                    {attached
                      ? t("referral_record_attached")
                      : choosingParent
                        ? t("open")
                        : t("select")}
                  </Button>
                </Item>
              );
            })
          )}
        </div>
        {(candidates.data?.count ?? 0) > REFERRAL_CANDIDATE_PAGE_SIZE &&
          listingType !== "specimen" && (
            <div className="flex justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={
                  offset === 0 || candidates.isFetching || add.isPending
                }
                onClick={() => {
                  setOffset(Math.max(0, offset - REFERRAL_CANDIDATE_PAGE_SIZE));
                  setSelected(undefined);
                }}
              >
                {t("previous")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={
                  offset + REFERRAL_CANDIDATE_PAGE_SIZE >=
                    (candidates.data?.count ?? 0) ||
                  candidates.isFetching ||
                  add.isPending
                }
                onClick={() => {
                  setOffset(offset + REFERRAL_CANDIDATE_PAGE_SIZE);
                  setSelected(undefined);
                }}
              >
                {t("next")}
              </Button>
            </div>
          )}
        {add.isError && (
          <FieldError role="alert">
            {referralResourceError(add.error, t("referral_record_share_error"))}
          </FieldError>
        )}
        <DialogFooter>
          <Button variant="outline" disabled={add.isPending} onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button
            disabled={!selected || add.isPending}
            onClick={() => {
              if (!selected) return;
              const resource: ReferralResourceCreate = {
                resource_type: resourceType,
                resource_id: selected.id,
                attachment_type: staged ? "source" : category,
                metadata: selected.metadata,
              };
              if (props.onSelect) {
                props.onSelect({
                  resource,
                  title: selected.title,
                  detail: selected.detail,
                });
                onClose();
              } else add.mutate(resource);
            }}
          >
            {add.isPending && <Loader2 className="size-4 animate-spin" />}
            {t(staged ? "referral_stage_record" : "referral_add_record")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
