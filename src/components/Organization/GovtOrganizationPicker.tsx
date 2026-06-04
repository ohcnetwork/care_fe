import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import Autocomplete from "@/components/ui/autocomplete";
import { Label } from "@/components/ui/label";

import query from "@/Utils/request/query";
import {
  Organization,
  OrganizationParent,
} from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";

interface GovtOrganizationPickerProps {
  /** The currently selected (deepest) organization. */
  value?: Organization | null;
  /** Called with the selected organization, or `null` when cleared. */
  onChange: (organization: Organization | null) => void;
  /** Marks every visible level as required. */
  required?: boolean;
  /** Marks levels below this depth as required. */
  requiredDepth?: number;
  /** Bearer token for unauthenticated (public) usage. */
  authToken?: string;

  ref?: React.RefCallback<HTMLButtonElement | null>;

  "aria-invalid"?: boolean;
}

interface GovtOrganizationLevelProps {
  index: number;
  parentId: string;
  selectedOrg?: Organization;
  previousOrg?: Organization;
  required?: boolean;
  authToken?: string;
  isError?: boolean;
  onSelect: (organization: Organization | null) => void;
  ref?: React.RefCallback<HTMLButtonElement | null>;
}

function GovtOrganizationLevel({
  index,
  parentId,
  selectedOrg,
  previousOrg,
  required,
  authToken,
  isError,
  onSelect,
  ref,
}: GovtOrganizationLevelProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const headers = authToken
    ? { headers: { Authorization: `Bearer ${authToken}` } }
    : {};

  const { data, isFetching } = useQuery({
    queryKey: ["govt-organizations", parentId, search],
    queryFn: query.debounced(organizationApi.list, {
      queryParams: {
        org_type: "govt",
        parent: parentId,
        name: search || undefined,
        limit: 200,
      },
      ...headers,
    }),
  });

  const organizations = data?.results ?? [];

  const labelType = selectedOrg?.metadata?.govt_org_type
    ? selectedOrg.metadata.govt_org_type
    : index === 0
      ? "default"
      : previousOrg?.metadata?.govt_org_children_type || "default";

  return (
    <div className="mt-2">
      <Label className="mb-2">
        {t(`SYSTEM__govt_org_type__${labelType}`)}
        {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="flex items-center gap-2">
        {isFetching && <Loader2 className="size-6 animate-spin" />}
        <Autocomplete
          showClearButton={false}
          aria-invalid={isError}
          ref={ref}
          value={selectedOrg?.id || ""}
          options={organizations.map((org) => ({
            label: org.name,
            value: org.id,
          }))}
          onChange={(value) => {
            onSelect(organizations.find((org) => org.id === value) ?? null);
            setSearch("");
          }}
          onSearch={setSearch}
        />
      </div>
    </div>
  );
}

/**
 * A cascading selector for government organizations (e.g. state → district →
 * local body). Each level is fetched on demand based on the parent selected in
 * the level above it.
 */
export default function GovtOrganizationPicker({
  value,
  onChange,
  required,
  requiredDepth,
  authToken,
  ref,
  ...props
}: GovtOrganizationPickerProps) {
  const [selectedLevels, setSelectedLevels] = useState<Organization[]>([]);

  // Rebuild the cascade from the selected organization's ancestor chain.
  useEffect(() => {
    if (!value) {
      setSelectedLevels([]);
      return;
    }

    const levels: Organization[] = [];
    let current: Organization | OrganizationParent | undefined = value;
    while (current && current.level_cache >= 0) {
      levels.unshift(current as Organization);
      current = current.parent;
    }
    setSelectedLevels(levels);
  }, [value]);

  const handleSelect = (index: number, organization: Organization | null) => {
    // Clearing a level removes it and every deeper level.
    const levels = selectedLevels.slice(0, index);
    if (organization) {
      levels.push(organization);
    }
    setSelectedLevels(levels);
    onChange(levels[levels.length - 1] ?? null);
  };

  const lastLevel = selectedLevels[selectedLevels.length - 1];
  const totalLevels =
    selectedLevels.length +
    (selectedLevels.length === 0 || lastLevel?.has_children ? 1 : 0);

  return (
    <>
      {Array.from({ length: totalLevels }).map((_, index) => (
        <GovtOrganizationLevel
          key={index}
          ref={index === 0 ? ref : undefined}
          index={index}
          parentId={index === 0 ? "" : selectedLevels[index - 1]?.id || ""}
          selectedOrg={selectedLevels[index]}
          previousOrg={selectedLevels[index - 1]}
          required={
            required || (requiredDepth != null && index < requiredDepth)
          }
          authToken={authToken}
          isError={props["aria-invalid"] && !selectedLevels[index]}
          onSelect={(organization) => handleSelect(index, organization)}
        />
      ))}
    </>
  );
}
