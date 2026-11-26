import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { SpecimenDefinitionRead } from "@/types/emr/specimenDefinition/specimenDefinition";

import { requirementDetails } from "./specimenCollection";

/** What the specimen definition asks for, as a short list of what is set. */
export function SpecimenRequirements({
  requirement,
}: {
  requirement: SpecimenDefinitionRead;
}) {
  const { t } = useTranslation();
  const rows = requirementDetails(requirement, t);

  if (!rows.length) return null;

  return (
    <dl className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-soft-foreground">{label}</dt>
          <dd className="text-foreground">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The requirements behind an info button beside the specimen's name. */
export function SpecimenRequirementsInfo({
  requirement,
}: {
  requirement: SpecimenDefinitionRead;
}) {
  const { t } = useTranslation();

  if (!requirementDetails(requirement, t).length) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          className="size-5 text-soft-foreground hover:text-foreground"
          aria-label={t("requirements")}
        >
          <Info className="size-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 space-y-2 p-4">
        <h4 className="text-sm font-semibold text-muted-foreground">
          {t("requirements")}
        </h4>
        <SpecimenRequirements requirement={requirement} />
      </PopoverContent>
    </Popover>
  );
}
