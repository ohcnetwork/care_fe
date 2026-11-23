import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Copy, MapPin, Tag as TagIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import TagAssignmentSheet from "@/components/Tags/TagAssignmentSheet";
import { TagBadges } from "@/components/Tags/TagBadges";

import { cn } from "@/lib/utils";
import { ActivityDefinitionReadSpec } from "@/types/emr/activityDefinition/activityDefinition";
import { ServiceRequestReadSpec } from "@/types/emr/serviceRequest/serviceRequest";
import { LocationTypeIcons } from "@/types/location/location";
import { getLocationPath } from "@/types/location/utils";
import { formatName } from "@/Utils/utils";

import { ServiceRequestRequirements } from "./ServiceRequestRequirements";

interface ServiceRequestDetailsProps {
  request: ServiceRequestReadSpec;
  activityDefinition: ActivityDefinitionReadSpec;
  facilityId: string;
}

export function ServiceRequestDetails({
  request,
  activityDefinition,
  facilityId,
}: ServiceRequestDetailsProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  // Folded on narrow screens so the specimens come up sooner
  const [isOpen, setIsOpen] = useState(false);
  const titleId = `service-request-details-${request.id}`;
  const bodyId = `${titleId}-body`;
  const location = request.encounter.current_location;
  const LocationIcon = (location && LocationTypeIcons[location.form]) || MapPin;
  const locationParents = location?.parent?.id
    ? getLocationPath(location, undefined, true)
    : "";
  const summary = [t(request.intent), location?.name]
    .filter(Boolean)
    .join(" · ");

  const copyRequestId = async () => {
    try {
      await navigator.clipboard.writeText(request.id);
      toast.success(t("copied_to_clipboard"));
    } catch {
      toast.error(t("something_went_wrong"));
    }
  };

  return (
    <section
      aria-labelledby={titleId}
      className="rounded-lg border border-border bg-white shadow-xs"
    >
      <div className="flex items-center gap-2 px-4 py-3 sm:px-5">
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="text-base font-semibold text-foreground">
            {t("request_details")}
          </h2>
          {!isOpen && (
            <p className="truncate text-sm text-soft-foreground @3xl:hidden">
              {summary}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-soft-foreground @3xl:hidden"
          aria-expanded={isOpen}
          aria-controls={bodyId}
          aria-label={isOpen ? t("hide_details") : t("show_details")}
          onClick={() => setIsOpen((open) => !open)}
        >
          <ChevronDown
            className={cn("transition-transform", isOpen && "rotate-180")}
          />
        </Button>
      </div>
      {/* Outside the fold, so phones show the note without opening the card */}
      {request.note && (
        <div className="space-y-1 border-t border-border px-4 py-3 text-sm sm:px-5">
          <h3 className="text-sm font-normal text-soft-foreground">
            {t("note")}
          </h3>
          <p className="whitespace-pre-wrap text-foreground wrap-break-word">
            {request.note}
          </p>
        </div>
      )}
      <div
        id={bodyId}
        className={cn(
          "divide-y divide-soft-border border-t",
          request.note ? "border-soft-border" : "border-border",
          !isOpen && "hidden @3xl:block",
        )}
      >
        <dl className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-3 gap-y-3 px-4 py-3 text-sm sm:px-5">
          <dt className="text-soft-foreground">{t("intent")}</dt>
          <dd className="text-foreground">{t(request.intent)}</dd>
          {location && (
            <>
              <dt className="text-soft-foreground">{t("patient_location")}</dt>
              <dd className="min-w-0">
                <span className="flex items-start gap-1.5 text-foreground">
                  <LocationIcon
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-soft-foreground"
                  />
                  <span className="min-w-0 wrap-break-word">
                    {location.name}
                  </span>
                </span>
                {locationParents && (
                  <span className="mt-0.5 block pl-5.5 text-sm wrap-break-word text-soft-foreground">
                    {locationParents}
                  </span>
                )}
              </dd>
            </>
          )}
          {request.created_by && (
            <>
              <dt className="text-soft-foreground">{t("created_by")}</dt>
              <dd className="text-foreground wrap-break-word">
                {formatName(request.created_by)}
              </dd>
            </>
          )}
          <dt className="text-soft-foreground">{t("request_id")}</dt>
          <dd className="-my-1 flex min-w-0 items-center gap-1">
            <span
              className="truncate font-mono text-foreground"
              title={request.id}
            >
              {request.id}
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              className="shrink-0 text-soft-foreground"
              aria-label={t("copy")}
              onClick={copyRequestId}
            >
              <Copy />
            </Button>
          </dd>
        </dl>
        <div className="space-y-2 px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-normal text-soft-foreground">
              {t("tags")}
            </h3>
            <TagAssignmentSheet
              entityType="service_request"
              entityId={request.id}
              facilityId={facilityId}
              currentTags={request.tags}
              onUpdate={() => {
                queryClient.invalidateQueries({
                  queryKey: ["serviceRequest", facilityId, request.id],
                });
              }}
              patientId={request.encounter.patient.id}
              trigger={
                <Button variant="ghost" className="-mr-2 text-soft-foreground">
                  <TagIcon className="size-4" />
                  {t("add_tags")}
                </Button>
              }
            />
          </div>
          <TagBadges tags={request.tags} />
        </div>
        {!!activityDefinition.observation_result_requirements?.length && (
          <div className="px-4 py-3 sm:px-5">
            <ServiceRequestRequirements
              activityDefinition={activityDefinition}
            />
          </div>
        )}
      </div>
    </section>
  );
}
