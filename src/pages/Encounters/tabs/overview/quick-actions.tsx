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
        icon={<AllergyIcon className="text-yellow-700" />}
        title={t("allergy")}
        shortcut={getShortcutDisplay("add-allergy")}
        href={`questionnaire/allergy_intolerance`}
      />
      <QuickAction
        icon={<ChillIcon className="text-pink-700" />}
        title={t("symptoms")}
        shortcut={getShortcutDisplay("add-symptoms")}
        href={`questionnaire/symptom`}
      />
      <QuickAction
        icon={<StethoscopeIcon className="text-blue-800" />}
        title={t("diagnosis")}
        shortcut={getShortcutDisplay("add-diagnosis")}
        href={`questionnaire/diagnosis`}
      />
      <QuickAction
        icon={<HealthWorkerIcon className="text-teal-700" />}
        title={t("forms")}
        shortcut={getShortcutDisplay("add-questionnaire")}
        href={`questionnaire`}
      />
    </div>
  );
};
// function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
export function QuickAction({
  icon,
  title,
  shortcut,
  href,
  ...props
}: {
  icon: React.ReactNode;
  title: string;
  shortcut?: string;
  href?: string;
  props?: React.ComponentProps<"div">;
}) {
  const content = (
    <>
      <div className="relative flex md:py-3 py-0 rounded-t-lg rounded-b-xl md:bg-gray-100 bg-white">
        <KeyboardShortcutBadge shortcut={shortcut} position="top-right" />
        <div className="rounded-xl bg-white md:shadow shadow-none mx-auto items-center flex p-2">
          {icon}
        </div>
      </div>
      <div className="flex items-center gap-1 justify-center">
        <PlusIcon className="size-4 md:block hidden" />
        <span className="text-sm font-semibold">{title}</span>
      </div>
    </>
  );

  const className =
    "flex-1 flex flex-row md:flex-col gap-1.25 p-1 pb-2 rounded-lg shadow bg-white";

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button className={className} {...props}>
      {content}
    </button>
  );
}
