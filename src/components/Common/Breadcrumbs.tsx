import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAppHistory from "@/hooks/useAppHistory";
import { Separator } from "@radix-ui/react-separator";
import { ChevronLeft } from "lucide-react";
import { navigate, usePath, usePathParams } from "raviger";
import { useTranslation } from "react-i18next";
import { validate as validateUuid } from "uuid";

interface BreadcrumbItemProps {
  label: string;
  href: string;
}

// Map of resource types to their display labels
const RESOURCE_LABELS: Record<string, string> = {
  account: "account",
  invoices: "invoices",
  patient: "patient",
  encounter: "encounter",
  locations: "location",
  services: "service",
  settings: "settings",
  users: "users",
  patients: "patients",
  encounters: "encounters",
};

// Segments that should be skipped (actions, tabs, or namespace segments without pages)
const SKIP_SEGMENTS = new Set([
  "billing",
  "create",
  "edit",
  "new",
  "print",
  "overview",
]);

function isUuid(value: string): boolean {
  return validateUuid(value);
}

function isResourceName(segment: string): boolean {
  // Check if it's a known resource or follows kebab-case pattern
  return (
    /^[a-z_]+$/.test(segment) &&
    !isUuid(segment) &&
    Object.keys(RESOURCE_LABELS).includes(segment)
  );
}

function formatIdLabel(id: string): string {
  // Show first 4 and last 4 characters of UUID
  if (id.length > 12) {
    return `${id.slice(0, 4)}...${id.slice(-4)}`;
  }
  return id;
}

function buildBreadcrumbs(segments: string[]): BreadcrumbItemProps[] {
  const breadcrumbs: BreadcrumbItemProps[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const nextSegment = i < segments.length - 1 ? segments[i + 1] : null;
    const prevSegment = i > 0 ? segments[i - 1] : null;

    if (i === 0 || i === 1) continue;

    // Skip action/tab segments at the end
    if (SKIP_SEGMENTS.has(segment)) continue;

    // Handle UUIDs - show as separate breadcrumb with formatted ID
    if (isUuid(segment) && prevSegment && isResourceName(prevSegment)) {
      const currentPath = `/${segments.slice(0, i + 1).join("/")}`;
      const resourceLabel =
        RESOURCE_LABELS[prevSegment] || prevSegment.replace(/_/g, " ");
      breadcrumbs.push({
        label: `${resourceLabel} ${formatIdLabel(segment)}`,
        href: currentPath,
      });
      continue;
    }

    // Handle resource name followed by UUID
    // Add the resource collection page (e.g., /billing/account)
    if (isResourceName(segment) && nextSegment && isUuid(nextSegment)) {
      const currentPath = `/${segments.slice(0, i + 1).join("/")}`;
      breadcrumbs.push({
        label: RESOURCE_LABELS[segment] || segment.replace(/_/g, " "),
        href: currentPath,
      });
      continue;
    }

    // Handle standalone resource names (e.g. account, patients, charge_items)
    if (isResourceName(segment)) {
      const currentPath = `/${segments.slice(0, i + 1).join("/")}`;
      breadcrumbs.push({
        label: RESOURCE_LABELS[segment],
        href: currentPath,
      });
    }
  }

  return breadcrumbs;
}

export function Breadcrumbs() {
  const { t } = useTranslation();
  const { goBack } = useAppHistory();
  const { facilityId } = usePathParams("/facility/:facilityId/*") ?? {};
  const path = usePath();
  const segments = path?.split("/").filter(Boolean) || [];

  const breadcrumbs: BreadcrumbItemProps[] = [];

  if (facilityId && segments.length > 1) {
    breadcrumbs.push({
      label: "home",
      href: `/facility/${facilityId}/overview`,
    });

    const additionalBreadcrumbs = buildBreadcrumbs(segments);
    breadcrumbs.push(...additionalBreadcrumbs);
  }

  if (breadcrumbs.length === 0) return null;

  return (
    <div className="flex items-center gap-4 mb-3">
      <div className="flex items-center gap-2">
        <ChevronLeft className="size-4" />
        <span
          onClick={() => goBack()}
          className="text-sm text-gray-500 hover:cursor-pointer"
        >
          {t("back")}
        </span>
      </div>
      <Separator orientation="vertical" className="h-6 w-px bg-gray-200" />
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((breadcrumb, index) => (
            <BreadcrumbItem key={breadcrumb.href}>
              <BreadcrumbLink
                onClick={() => navigate(breadcrumb.href)}
                className="underline text-black hover:cursor-pointer"
              >
                {t(breadcrumb.label)}
              </BreadcrumbLink>
              {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
