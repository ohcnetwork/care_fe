import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import ColoredIndicator from "@/CAREUI/display/ColoredIndicator";
import CareIcon from "@/CAREUI/icons/CareIcon";
import duoToneIcons from "@/CAREUI/icons/DuoTonePaths.json";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { type HealthcareServiceReadSpec } from "@/types/healthcareService/healthcareService";

type DuoToneIconName = keyof typeof duoToneIcons;

interface Props {
  service: HealthcareServiceReadSpec;
  link: string;
}

export function ServiceCard({ service, link }: Props) {
  const { t } = useTranslation();
  const getIconName = (name: string): DuoToneIconName =>
    `d-${name}` as DuoToneIconName;

  return (
    <Card className="transition-all duration-200 hover:border-primary/50 hover:shadow-sm rounded-md">
      <CardContent className="py-3 px-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative size-10 rounded-sm flex p-4 items-center justify-center">
              <ColoredIndicator
                id={service.id}
                className="absolute inset-0 rounded-sm opacity-20"
              />
              <CareIcon
                icon={
                  service.styling_metadata?.careIcon
                    ? getIconName(service.styling_metadata.careIcon)
                    : "d-health-worker"
                }
                className="size-6 relative z-1"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate text-gray-900 text-base">
                {service.name}
              </h3>
              <p className="mt-0.5 text-xs text-gray-500 truncate">
                {service.extra_details}
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate(link)}
            variant="outline"
            size="sm"
            className="px-3 text-xs whitespace-nowrap w-full md:w-auto"
          >
            {t("view_details")}
            <CareIcon icon="l-arrow-right" className="size-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
