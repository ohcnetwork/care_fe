import { PlusIcon } from "lucide-react";
import { Link } from "raviger";
import React from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import {
  AllergyIcon,
  ChillIcon,
  HealthWorkerIcon,
  StethoscopeIcon,
} from "@/CAREUI/icons/CustomIcons";

import { KeyboardShortcutBadge } from "@/Utils/keyboardShortcutComponents";

import { useEncounterShortcutDisplays } from "@/hooks/useEncounterShortcuts";

export const QuickActions = (props: React.ComponentProps<"div">) => {
  const { t } = useTranslation();
  const getShortcutDisplay = useEncounterShortcutDisplays();
  return (
    <div
      {...props}
      className={cn("grid grid-cols-2 sm:grid-cols-4 gap-3", props.className)}
    >
      <QuickAction
        icon={<AllergyIcon className="size-8 text-yellow-700" />}
        title={t("allergy")}
        shortcut={getShortcutDisplay("add-allergy")}
        href={`questionnaire/allergy_intolerance`}
      />
      <QuickAction
        icon={<ChillIcon className="size-8 text-pink-700" />}
        title={t("symptoms")}
        shortcut={getShortcutDisplay("add-symptoms")}
        href={`questionnaire/symptom`}
      />
      <QuickAction
        icon={<StethoscopeIcon className="size-8 text-blue-800" />}
        title={t("diagnosis")}
        shortcut={getShortcutDisplay("add-diagnosis")}
        href={`questionnaire/diagnosis`}
      />
      <QuickAction
        icon={<HealthWorkerIcon className="size-8 text-teal-700" />}
        title={t("forms")}
        shortcut={getShortcutDisplay("add-questionnaire")}
        href={`questionnaire`}
      />
    </div>
  );
};

const QuickAction = ({
  icon,
  title,
  shortcut,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  shortcut?: string;
  href: string;
}) => {
  return (
    <Link
      href={href}
      className="flex-1 flex flex-col gap-1.25 p-1 pb-2 rounded-lg shadow bg-white"
    >
      <div className="relative flex py-3 rounded-t-lg rounded-b-xl bg-gray-100">
        <KeyboardShortcutBadge shortcut={shortcut} position="top-right" />
        <div className="rounded-xl bg-white p-2 size-12 shadow mx-auto">
          {icon}
        </div>
      </div>
      <div className="flex items-center gap-1 justify-center">
        <PlusIcon className="size-4" />
        <span className="text-sm font-semibold">{title}</span>
      </div>
    </Link>
  );
};
