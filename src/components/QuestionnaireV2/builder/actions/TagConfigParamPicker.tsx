import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  TagConfig,
  TagResource,
  getTagHierarchyDisplay,
} from "@/types/emr/tagConfig/tagConfig";
import tagConfigApi from "@/types/emr/tagConfig/tagConfigApi";
import query from "@/Utils/request/query";

interface TagConfigParamPickerProps {
  id: string;
  resource: TagResource;
  /** The studio mount's facility — facility tags are listed alongside
   *  instance ones; an instance mount lists instance tags only. */
  facilityId?: string;
  value: unknown;
  onChange: (value: unknown) => void;
  "aria-label": string;
}

/**
 * The control an instruction param gets when its schema carries
 * `x-care-picker: tag_config` — a tag chosen from the active tag configs
 * for `x-care-resource`, stored as the tag's id (what the backend's
 * tag instructions take).
 */
export function TagConfigParamPicker({
  id,
  resource,
  facilityId,
  value,
  onChange,
  "aria-label": ariaLabel,
}: TagConfigParamPickerProps) {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ["tags", resource, "action-picker", facilityId],
    queryFn: query.paginated(tagConfigApi.list, {
      queryParams: {
        resource,
        status: "active",
        ...(facilityId && { facility: facilityId }),
      },
    }),
  });
  const tags = data?.results ?? [];
  const selectableTags = tags.filter((tag) => !tag.has_children);
  const groups = new Map<string, { label: string; tags: TagConfig[] }>();
  for (const tag of selectableTags) {
    const key = tag.parent?.id ?? "";
    const group = groups.get(key) ?? {
      label: tag.parent
        ? getTagHierarchyDisplay(
            { ...tag, display: tag.parent.display, parent: tag.parent.parent },
            " › ",
          )
        : "",
      tags: [],
    };
    group.tags.push(tag);
    groups.set(key, group);
  }
  const stored = typeof value === "string" ? value : undefined;
  const unknownStored =
    !!stored && !isLoading && !selectableTags.some((tag) => tag.id === stored);

  return (
    <div className="space-y-1">
      <Select value={stored} onValueChange={(next) => onChange(next)}>
        <SelectTrigger
          id={id}
          className="w-full"
          aria-label={ariaLabel}
          aria-invalid={unknownStored}
        >
          <SelectValue
            placeholder={isLoading ? t("loading") : t("select_tag")}
          />
        </SelectTrigger>
        <SelectContent>
          {/* A stored tag the list no longer carries (archived, other
              facility) stays visible so the author sees what to replace. */}
          {unknownStored && (
            <SelectItem value={stored} disabled className="text-red-600">
              {t("action_tag_unknown")}
            </SelectItem>
          )}
          {Array.from(groups, ([key, group]) => (
            <SelectGroup key={key}>
              {group.label && <SelectLabel>{group.label}</SelectLabel>}
              {group.tags.map((tag) => (
                <SelectItem key={tag.id} value={tag.id}>
                  {tag.display}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
      {!isLoading && selectableTags.length === 0 && (
        <p className="text-xs text-gray-500">{t("action_tag_picker_empty")}</p>
      )}
    </div>
  );
}
