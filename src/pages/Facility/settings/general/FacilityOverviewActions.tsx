import {
  ChevronRight,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    <div className="space-y-4">
      <section
        aria-labelledby="facility-forms-heading"
        data-cy="facility-forms"
      >
        <Card>
          <CardHeader className="border-b border-border p-4">
            <CardTitle>
              <h2 id="facility-forms-heading" className="text-sm font-semibold">
                {t("forms")}
              </h2>
            </CardTitle>
            <CardDescription>{t("facility_forms_description")}</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border p-2">
            <ResourceFormPicker
              facilityId={facilityId}
              subjectType="facility"
              subjectId={facilityId}
              disabled={disabled}
              trigger={
                <Button
                  type="button"
                  variant="ghost"
                  disabled={disabled}
                  className="w-full justify-start whitespace-normal text-left font-normal tracking-normal no-underline"
                >
                  <FilePlus2 aria-hidden="true" />
                  {t("submit_forms")}
                  <ChevronRight className="ml-auto size-4" aria-hidden="true" />
                </Button>
              }
            />
            <Button
              variant="ghost"
              className="w-full justify-start whitespace-normal text-left font-normal tracking-normal no-underline"
              asChild
            >
              <Link basePath="/" href={`${baseUrl}/responses`}>
                <ClipboardList aria-hidden="true" />
                {t("responses")}
                <ChevronRight className="ml-auto size-4" aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section
        aria-labelledby="facility-quick-links-heading"
        data-cy="facility-quick-links"
      >
        <Card>
          <CardHeader className="border-b border-border p-4 pb-3">
            <CardTitle>
              <h2
                id="facility-quick-links-heading"
                className="text-sm font-semibold"
              >
                {t("quick_links")}
              </h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <ul>
              {links.map(({ label, path, icon: Icon }) => (
                <li key={path}>
                  <Button
                    variant="ghost"
                    className="h-auto min-h-12 w-full justify-start whitespace-normal py-2 text-left font-normal tracking-normal no-underline md:min-h-10"
                    asChild
                  >
                    <Link basePath="/" href={`${baseUrl}${path}`}>
                      <Icon
                        className="text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span className="min-w-0 break-words">{label}</span>
                      <ChevronRight
                        className="ml-auto size-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
