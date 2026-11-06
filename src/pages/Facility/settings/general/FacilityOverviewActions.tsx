import {
  ArrowRight,
  ChevronDown,
  ClipboardList,
  FilePlus2,
  MapPin,
  Monitor,
  Network,
  Package,
  Stethoscope,
} from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { ResourceFormPicker } from "@/components/Questionnaire/ResourceFormPicker";

interface FacilityOverviewActionsProps {
  facilityId: string;
  disabled: boolean;
}

export function FacilityOverviewActions({
  facilityId,
  disabled,
}: FacilityOverviewActionsProps) {
  const { t } = useTranslation();
  const baseUrl = `/facility/${facilityId}/settings`;
  const links = [
    { label: t("departments"), path: "/departments", icon: Network },
    { label: t("locations"), path: "/locations", icon: MapPin },
    { label: t("devices"), path: "/devices", icon: Monitor },
    {
      label: t("healthcare_services"),
      path: "/healthcare_services",
      icon: Stethoscope,
    },
    { label: t("product"), path: "/product", icon: Package },
    {
      label: t("questionnaire_other"),
      path: "/questionnaires",
      icon: ClipboardList,
    },
  ];

  return (
    <div className="overflow-hidden rounded-[10px] border border-neutral-200 bg-white shadow-xs">
      <section
        aria-labelledby="facility-forms-heading"
        className="space-y-4 border-b border-neutral-200 p-4"
        data-cy="facility-forms"
      >
        <div className="space-y-2">
          <h2
            id="facility-forms-heading"
            className="text-lg leading-6 font-semibold text-neutral-950"
          >
            {t("forms")}
          </h2>
          <p className="text-sm leading-6 text-neutral-600">
            {t("facility_forms_description")}
          </p>
        </div>
        <div className="space-y-2">
          <ResourceFormPicker
            facilityId={facilityId}
            subjectType="facility"
            subjectId={facilityId}
            disabled={disabled}
            trigger={
              <Button
                type="button"
                disabled={disabled}
                className="h-12 w-full justify-start border border-emerald-950 bg-emerald-800 px-3 text-white shadow-md hover:bg-emerald-900 focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 md:h-10 [&_svg]:size-5"
              >
                <FilePlus2 aria-hidden="true" />
                {t("submit_forms")}
                <ChevronDown className="ml-auto" aria-hidden="true" />
              </Button>
            }
          />
          <Link
            basePath="/"
            href={`${baseUrl}/responses`}
            className="group flex min-h-12 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-neutral-950 hover:bg-neutral-100/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 md:min-h-10"
          >
            <ClipboardList
              className="size-5 shrink-0 text-neutral-600"
              aria-hidden="true"
            />
            {t("responses")}
            <ArrowRight
              className="ml-auto size-4 shrink-0 text-neutral-400 group-hover:text-neutral-700"
              aria-hidden="true"
            />
          </Link>
        </div>
      </section>

      <section
        aria-labelledby="facility-quick-links-heading"
        data-cy="facility-quick-links"
      >
        <h2
          id="facility-quick-links-heading"
          className="px-4 pt-4 text-lg leading-6 font-semibold text-neutral-950"
        >
          {t("quick_links")}
        </h2>
        <ul className="grid grid-cols-2 gap-x-2 p-2 lg:grid-cols-1">
          {links.map(({ label, path, icon: Icon }) => (
            <li key={path} className="min-w-0">
              <Link
                basePath="/"
                href={`${baseUrl}${path}`}
                className="group flex min-h-12 items-center gap-2 rounded-md px-2 py-2 text-sm text-neutral-700 hover:bg-neutral-100/50 hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 md:min-h-10"
              >
                <Icon
                  className="size-4 shrink-0 text-neutral-500"
                  aria-hidden="true"
                />
                <span className="min-w-0 break-words">{label}</span>
                <ArrowRight
                  className="ml-auto hidden size-4 shrink-0 text-neutral-400 group-hover:text-neutral-700 lg:block"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
