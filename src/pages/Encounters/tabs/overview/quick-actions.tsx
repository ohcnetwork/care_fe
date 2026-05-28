import { HeartPulse, Stethoscope } from "lucide-react";
import { Link } from "raviger";
import React from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import {
  AllergyIcon,
  HealthWorkerIcon,
  MedicineIcon,
  TestTubeIcon,
} from "@/CAREUI/icons/CustomIcons";

import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";

import { register } from "@/lib/override";
import { FormDialog } from "./FormsDialog";

export const QuickActions = (props: React.ComponentProps<"div">) => {
  const { t } = useTranslation();

  return (
    <div
      {...props}
      className={cn("grid grid-cols-2 sm:grid-cols-4 gap-3", props.className)}
    >
      <QuickAction
        icon={<AllergyIcon className="text-red-700" />}
        title={t("allergy")}
        actionId="add-allergy"
        href={`questionnaire/allergy_intolerance`}
      />
      <QuickAction
        icon={<TestTubeIcon className="text-pink-700 size-8" />}
        title={t("service_request")}
        actionId="add-service-request"
        href={`questionnaire/service_request`}
      />
      <QuickAction
        icon={<MedicineIcon className="text-blue-800 size-8" />}
        title={t("add_medication")}
        href={`questionnaire/medication_request`}
        actionId="add-medication-request"
      />
      <QuickAction
        icon={<HeartPulse className="text-orange-700 size-8" />}
        title={t("add_symptom")}
        href={`questionnaire/symptom`}
        actionId="add-symptoms"
        hidden
      />
      <QuickAction
        icon={<Stethoscope className="text-purple-700 size-8" />}
        title={t("add_diagnosis")}
        href={`questionnaire/diagnosis`}
        actionId="add-diagnosis"
        hidden
      />
      <FormDialog
        subjectType="encounter"
        questionnaireTag="encounter_actions"
        trigger={
          <QuickAction
            icon={<HealthWorkerIcon className="text-teal-700" />}
            title={t("forms")}
            actionId="add-questionnaire"
          />
        }
      />
    </div>
  );
};

export const QuickAction = register("QuickAction", QuickActionBase);

function QuickActionBase({
  icon,
  title,
  actionId,
  href,
  basePath,
  onClick,
  hidden,
  ...props
}: {
  icon: React.ReactNode;
  title: string;
  actionId?: string;
  href?: string;
  props?: React.ComponentProps<"div">;
  basePath?: string;
  onClick?: () => void;
  hidden?: boolean;
}) {
  const className = cn(
    "flex-1 flex flex-row md:flex-col gap-1.25 p-1 pb-2 rounded-lg shadow bg-white",
    hidden && "hidden",
  );

  if (href) {
    return (
      <Link basePath={basePath} href={href} className={className}>
        <QuickActionContent icon={icon} title={title} actionId={actionId} />
      </Link>
    );
  }

  return (
    <button className={className} {...props} onClick={onClick}>
      <QuickActionContent icon={icon} title={title} actionId={actionId} />
    </button>
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
      <div className="relative flex md:py-3 py-0 rounded-t-md rounded-b-lg md:bg-gray-100 bg-white">
        {actionId && <ShortcutBadge actionId={actionId} position="top-right" />}
        <div className="rounded-xl bg-white md:shadow shadow-none mx-auto items-center flex p-2">
          {icon}
        </div>
      </div>
      <div className="flex items-center gap-1 justify-center">
        <span className="text-sm font-semibold">{title}</span>
      </div>
    </>
  );
};
