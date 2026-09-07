import { TFunction } from "i18next";
import {
  Activity,
  BookOpen,
  Building2,
  ClipboardList,
  FileText,
  HeartPulse,
  IdCard,
  ListChecks,
  LucideIcon,
  MapPin,
  Monitor,
  Network,
  Package,
  Receipt,
  Stethoscope,
  Tags,
  TestTubeDiagonal,
  Ticket,
  Wallet,
} from "lucide-react";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";

import { Separator } from "@/components/ui/separator";
import { NavigationLink, NavMain } from "@/components/ui/sidebar/nav-main";

import { getPermissions } from "@/common/Permissions";

import { usePermissions } from "@/context/PermissionContext";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";

interface SettingsPermissions {
  canListTokenCategories: boolean;
  canReadPatientIdentifierConfig: boolean;
  canListTemplate: boolean;
}

interface SettingsPage {
  path: string;
  title: string;
  icon: LucideIcon;
  permission?: keyof SettingsPermissions;
}

interface SettingsGroup {
  label?: string;
  pages: SettingsPage[];
}

const SETTINGS_GROUPS: SettingsGroup[] = [
  {
    pages: [{ path: "settings/general", title: "general", icon: Building2 }],
  },
  {
    label: "facility",
    pages: [
      { path: "settings/departments", title: "departments", icon: Network },
      { path: "settings/locations", title: "locations", icon: MapPin },
      { path: "settings/devices", title: "devices", icon: Monitor },
      {
        path: "settings/token_category",
        title: "token_category",
        icon: Ticket,
        permission: "canListTokenCategories",
      },
      {
        path: "settings/patient_identifier_config",
        title: "patient_identifier_config",
        icon: IdCard,
        permission: "canReadPatientIdentifierConfig",
      },
      { path: "settings/tag_config", title: "tag_config", icon: Tags },
    ],
  },
  {
    label: "clinical",
    pages: [
      {
        path: "settings/healthcare_services",
        title: "healthcare_services",
        icon: Stethoscope,
      },
      {
        path: "settings/specimen_definitions",
        title: "specimen_definitions",
        icon: TestTubeDiagonal,
      },
      {
        path: "settings/observation_definitions",
        title: "observation_definitions",
        icon: HeartPulse,
      },
      {
        path: "settings/activity_definitions",
        title: "activity_definitions",
        icon: Activity,
      },
    ],
  },
  {
    label: "forms",
    pages: [
      {
        path: "settings/questionnaires",
        title: "questionnaire_other",
        icon: ClipboardList,
      },
      { path: "settings/valuesets", title: "valuesets", icon: ListChecks },
      {
        path: "template",
        title: "templates",
        icon: FileText,
        permission: "canListTemplate",
      },
      {
        path: "settings/responses",
        title: "responses",
        icon: ClipboardList,
      },
    ],
  },
  {
    label: "inventory",
    pages: [
      {
        path: "settings/product_knowledge",
        title: "product_knowledge",
        icon: BookOpen,
      },
      { path: "settings/product", title: "product", icon: Package },
    ],
  },
  {
    label: "billing",
    pages: [
      { path: "settings/billing", title: "billing", icon: Wallet },
      {
        path: "settings/charge_item_definitions",
        title: "charge_item_definitions",
        icon: Receipt,
      },
    ],
  },
];

const BILLING_PAGES = [
  { path: "discount_codes", title: "discount_codes", header: "discount" },
  { path: "discount_components", title: "discount_components" },
  { path: "discount_configuration", title: "discount_configuration" },
  { path: "tax_codes", title: "tax_codes", header: "tax" },
  { path: "tax_components", title: "tax_components" },
  {
    path: "informational_codes",
    title: "informational_codes",
    header: "informational",
  },
  { path: "settings", title: "settings", header: "configuration" },
];

const matchesPage = (path: string, page: string) =>
  path === page || path.startsWith(`${page}/`);

export function getFacilitySettingsPageTitle(
  pathname: string,
  t: TFunction,
): string {
  const path =
    pathname
      .split(/[?#]/)[0]
      .match(/^\/facility\/[^/]+\/(.*)/)?.[1]
      .replace(/\/+$/, "") ?? "";

  const billingPage = BILLING_PAGES.find((page) =>
    matchesPage(path, `settings/billing/${page.path}`),
  );
  if (billingPage) return t(billingPage.title);

  const page = SETTINGS_GROUPS.flatMap((group) => group.pages).find((page) =>
    matchesPage(path, page.path),
  );
  return t(page?.title ?? "settings");
}

export function FacilitySettingsNav() {
  const { t } = useTranslation();
  const { facilityId, facility } = useCurrentFacility();
  const { hasPermission } = usePermissions();
  const permissions = getPermissions(
    hasPermission,
    facility?.permissions ?? [],
  );
  const baseUrl = `/facility/${facilityId}`;

  return (
    <>
      {SETTINGS_GROUPS.map((group, index) => {
        const links: NavigationLink[] = group.pages.map((page) => ({
          name: t(page.title),
          url: `${baseUrl}/${page.path}`,
          icon: <page.icon />,
          visibility: page.permission ? permissions[page.permission] : true,
          children:
            page.path === "settings/billing"
              ? BILLING_PAGES.map((billingPage) => ({
                  name: t(billingPage.title),
                  url: `${baseUrl}/settings/billing/${billingPage.path}`,
                  header: billingPage.header
                    ? t(billingPage.header)
                    : undefined,
                }))
              : undefined,
        }));

        return (
          <Fragment key={group.label ?? "general"}>
            {index > 0 && (
              <Separator className="mx-4 bg-neutral-200 data-[orientation=horizontal]:w-auto group-data-[collapsible=icon]:mx-2" />
            )}
            <NavMain
              label={group.label ? t(group.label) : undefined}
              links={links}
            />
          </Fragment>
        );
      })}
    </>
  );
}
