import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { ImmunizationPolicyTemplate } from "@/types/emr/immunizationPolicy/immunizationPolicy";

interface PolicyTemplateDetailsProps {
  id: string;
  node: ImmunizationPolicyTemplate;
  onChange: (node: ImmunizationPolicyTemplate) => void;
}

export function PolicyTemplateDetails({
  id,
  node,
  onChange,
}: PolicyTemplateDetailsProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(!!node.description);

  return (
    <details
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className="group/details border-t border-gray-100 pt-4"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-gray-700">
        <ChevronDown
          className="size-4 transition-transform group-open/details:rotate-180"
          aria-hidden="true"
        />
        {t("immunization_additional_details")}
        <span className="ml-auto text-xs font-normal text-gray-400">
          {t("optional")}
        </span>
      </summary>
      <div className="space-y-4 pt-4">
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-description`}>
            {t("immunization_recommendation_description")}
          </Label>
          <Textarea
            id={`${id}-description`}
            value={node.description ?? ""}
            onChange={(event) =>
              onChange({ ...node, description: event.target.value })
            }
            rows={2}
          />
        </div>
      </div>
    </details>
  );
}
