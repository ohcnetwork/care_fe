import {
  ChevronDown,
  ClipboardList,
  GitPullRequestArrow,
  HeartPulse,
  Microscope,
  Stethoscope,
} from "lucide-react";
import { Link } from "raviger";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { CreateReferralDialog } from "@/components/Referral/CreateReferralDialog";
import { appendReferralNativeContext } from "@/components/Referral/referralNativeNavigation";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

import { AllergyIcon, MedicineIcon } from "@/CAREUI/icons/CustomIcons";

import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";

import { FormDialog } from "./FormsDialog";

interface QuickActionsProps extends React.ComponentProps<"div"> {
  showEmpty?: boolean;
}

export const QuickActions = ({
  title,
  showEmpty: _showEmpty,
  ...props
}: QuickActionsProps) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const {
    patientId,
    facilityId,
    selectedEncounter,
    selectedEncounterId,
    selectedEncounterPermissions,
    canWriteClinicalData,
  } = useEncounter();
  const canCreateReferral =
    selectedEncounterPermissions.canCreateReferral &&
    selectedEncounter?.id === selectedEncounterId &&
    selectedEncounter?.patient.id === patientId;
  const formLink = (questionnaire: string) =>
    appendReferralNativeContext(
      `/facility/${facilityId}/patient/${patientId}/encounter/${selectedEncounterId}/questionnaire/${questionnaire}`,
      window.location.search,
    );

  if (!canWriteClinicalData && !canCreateReferral) return null;

  const referralAction = canCreateReferral && selectedEncounter && (
    <CreateReferralDialog
      key={selectedEncounter.id}
      encounter={selectedEncounter}
    >
      <QuickAction
        compact
        className={
          canWriteClinicalData
            ? "col-span-full @min-[38rem]:col-span-1"
            : undefined
        }
        icon={
          <GitPullRequestArrow className="text-primary-700" strokeWidth={1.5} />
        }
        title={t("referral_new")}
      />
    </CreateReferralDialog>
  );

  return (
    <div
      {...props}
      role="region"
      aria-label={title ?? t("quick_actions")}
      className={cn("@container", props.className)}
    >
      {title && (
        <h2 className="mb-2 text-sm font-semibold text-gray-600">{title}</h2>
      )}
      <Collapsible
        open={expanded}
        onOpenChange={setExpanded}
        className="flex w-full items-start gap-1.5 rounded-xl border border-gray-300 bg-gray-100 p-1.5"
      >
        {canWriteClinicalData && (
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="h-11 w-8 shrink-0 self-center rounded-lg p-0 text-gray-600 hover:bg-gray-200 hover:text-gray-950"
              aria-label={expanded ? t("show_less") : t("more_actions")}
              title={expanded ? t("show_less") : t("more_actions")}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.ctrlKey &&
                  !event.metaKey &&
                  !event.altKey
                ) {
                  // Let Enter activate this button instead of the global shortcut.
                  event.stopPropagation();
                }
              }}
            >
              <ChevronDown
                aria-hidden="true"
                className={cn("transition-transform", expanded && "rotate-180")}
              />
            </Button>
          </CollapsibleTrigger>
        )}
        <div
          className={cn(
            "grid min-w-0 flex-1 gap-1.5",
            !canWriteClinicalData
              ? "grid-cols-1"
              : "grid-cols-2 @min-[38rem]:grid-cols-[repeat(4,auto)]",
          )}
        >
          {canWriteClinicalData && (
            <>
              <QuickAction
                compact
                icon={<AllergyIcon className="text-amber-700" />}
                title={t("allergy")}
                aria-label={t("add_allergy", { count: 1 })}
                actionId="add-allergy"
                href={formLink("allergy_intolerance")}
              />
              <QuickAction
                compact
                icon={
                  <Microscope className="text-pink-600" strokeWidth={1.5} />
                }
                title={t("service_request")}
                actionId="add-service-request"
                href={formLink("service_request")}
              />
              <QuickAction
                compact
                icon={<MedicineIcon className="text-teal-700" />}
                title={t("medication")}
                aria-label={t("add_medication")}
                href={formLink("medication_request")}
                actionId="add-medication-request"
              />
              <FormDialog
                subjectType="encounter"
                trigger={
                  <QuickAction
                    compact
                    icon={
                      <ClipboardList
                        className="text-teal-700"
                        strokeWidth={1.5}
                      />
                    }
                    title={t("forms")}
                    actionId="add-questionnaire"
                  />
                }
              />
            </>
          )}
          {!canWriteClinicalData && referralAction}
          {canWriteClinicalData && (
            <CollapsibleContent
              className={cn(
                "col-span-full grid grid-cols-2 gap-1.5 data-closed:hidden",
                canCreateReferral && "@min-[38rem]:grid-cols-3",
              )}
            >
              <QuickAction
                compact
                icon={
                  <HeartPulse className="text-orange-700" strokeWidth={1.5} />
                }
                title={t("symptoms")}
                aria-label={t("add_symptom")}
                href={formLink("symptom")}
                actionId="add-symptoms"
              />
              <QuickAction
                compact
                icon={
                  <Stethoscope className="text-purple-700" strokeWidth={1.5} />
                }
                title={t("diagnosis")}
                aria-label={t("add_diagnosis")}
                href={formLink("diagnosis")}
                actionId="add-diagnosis"
              />
              {referralAction}
            </CollapsibleContent>
          )}
        </div>
      </Collapsible>
    </div>
  );
};

export function QuickAction({
  icon,
  title,
  actionId,
  href,
  basePath,
  onClick,
  hidden,
  compact = false,
  className: customClassName,
  ...props
}: {
  icon: React.ReactNode;
  title: string;
  actionId?: string;
  href?: string;
  basePath?: string;
  onClick?: () => void;
  hidden?: boolean;
  compact?: boolean;
} & React.ComponentProps<"button">) {
  const className = cn(
    "h-auto min-w-0 w-full whitespace-normal",
    compact
      ? "min-h-11 justify-start gap-1.5 rounded-lg border-gray-200 bg-white px-2 py-2 text-left font-semibold text-gray-950 shadow-xs transition-[background-color,border-color,box-shadow] hover:border-gray-300 hover:bg-white hover:shadow-sm active:bg-gray-50 active:shadow-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 [&_svg]:size-6"
      : "flex-1 flex-row items-center justify-start gap-1.25 rounded-lg bg-white p-1 pb-2 text-left shadow md:flex-col md:items-stretch md:text-center",
    hidden && "hidden",
    customClassName,
  );

  const content = compact ? (
    <>
      <span
        aria-hidden="true"
        className="flex size-6 shrink-0 items-center justify-center [&_svg]:size-6"
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 leading-5">{title}</span>
      {actionId && (
        <ShortcutBadge
          actionId={actionId}
          variant="secondary"
          className="h-5 min-w-5 shrink-0 items-center rounded-md border-gray-200 border-b-2 px-1 font-normal text-gray-600 shadow-xs"
        />
      )}
    </>
  ) : (
    <QuickActionContent icon={icon} title={title} actionId={actionId} />
  );

  return (
    <Button
      asChild={!!href}
      type={href ? undefined : "button"}
      variant={compact ? "outline" : "ghost"}
      className={className}
      {...props}
      onClick={onClick}
      aria-label={props["aria-label"] ?? (compact ? title : undefined)}
    >
      {href ? (
        <Link basePath={basePath} href={href}>
          {content}
        </Link>
      ) : (
        content
      )}
    </Button>
  );
}

const QuickActionContent = ({
  icon,
  title,
  actionId,
}: {
  icon: React.ReactNode;
  title: string;
  actionId?: string;
}) => {
  return (
    <>
      <div className="relative flex shrink-0 items-center justify-center rounded-t-md rounded-b-lg bg-white py-0 md:w-full md:bg-gray-100 md:py-3">
        {actionId && <ShortcutBadge actionId={actionId} position="top-right" />}
        <div className="mx-auto flex size-9 shrink-0 items-center justify-center rounded-xl bg-white p-2 shadow-none md:shadow [&_svg]:size-5">
          {icon}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-start gap-1 md:w-full md:justify-center">
        <span className="min-w-0 text-sm font-semibold leading-5">{title}</span>
      </div>
    </>
  );
};
