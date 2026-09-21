import { navigate } from "raviger";
import { lazy } from "react";

import type { AppRoutes } from "@/Routers/AppRouter";

const QuestionnaireEditor = lazy(
  () => import("@/components/Questionnaire/QuestionnaireEditor"),
);
const QuestionnaireList = lazy(() =>
  import("@/components/Questionnaire/QuestionnaireList").then((module) => ({
    default: module.QuestionnaireList,
  })),
);
const ValueSetEditor = lazy(() =>
  import("@/components/ValueSet/ValueSetEditor").then((module) => ({
    default: module.ValueSetEditor,
  })),
);
const ValueSetList = lazy(() =>
  import("@/components/ValueSet/ValueSetList").then((module) => ({
    default: module.ValueSetList,
  })),
);
const PermissionsIndex = lazy(() =>
  import("@/pages/Admin/Permissions/PermissionsIndex").then((module) => ({
    default: module.PermissionsIndex,
  })),
);
const RolesIndex = lazy(() => import("@/pages/Admin/Roles/RolesIndex"));
const TagConfigList = lazy(
  () => import("@/pages/Admin/TagConfig/TagConfigList"),
);
const TagConfigView = lazy(
  () => import("@/pages/Admin/TagConfig/TagConfigView"),
);
const AdminOrganizationList = lazy(
  () => import("@/pages/Admin/organizations/AdminOrganizationList"),
);
const PlugConfigEdit = lazy(() =>
  import("@/pages/Apps/PlugConfigEdit").then((module) => ({
    default: module.PlugConfigEdit,
  })),
);
const PlugConfigList = lazy(() =>
  import("@/pages/Apps/PlugConfigList").then((module) => ({
    default: module.PlugConfigList,
  })),
);
const PatientIdentifierConfigForm = lazy(
  () =>
    import("@/pages/settings/patientIdentifierConfig/PatientIdentifierConfigForm"),
);
const PatientIdentifierConfigList = lazy(
  () =>
    import("@/pages/settings/patientIdentifierConfig/PatientIdentifierConfigList"),
);

const AdminRoutes: AppRoutes = {
  "/admin/questionnaire": () => <QuestionnaireList />,
  "/admin/questionnaire/create": () => <QuestionnaireEditor />,
  "/admin/questionnaire/:slug/edit": ({ slug }) => (
    <QuestionnaireEditor slug={slug} />
  ),
  "/admin/valuesets": () => <ValueSetList />,
  "/admin/valuesets/create": () => (
    <ValueSetEditor onSuccess={() => navigate(`/admin/valuesets`)} />
  ),
  "/admin/valuesets/:slug/edit": ({ slug }) => <ValueSetEditor slug={slug} />,
  "/admin/patient_identifier_config": () => <PatientIdentifierConfigList />,
  "/admin/patient_identifier_config/new": () => <PatientIdentifierConfigForm />,
  "/admin/patient_identifier_config/:id": ({ id }) => (
    <PatientIdentifierConfigForm configId={id} />
  ),
  "/admin/patient_identifier_config/:id/edit": ({ id }) => (
    <PatientIdentifierConfigForm configId={id} />
  ),
  "/admin/tag_config": () => <TagConfigList />,
  "/admin/tag_config/:id": ({ id }) => <TagConfigView tagId={id} />,
  "/admin/rbac/permissions": () => <PermissionsIndex />,
  "/admin/rbac/roles": () => <RolesIndex />,
  "/admin/apps": () => <PlugConfigList />,
  "/admin/apps/:slug": ({ slug }) => <PlugConfigEdit slug={slug} />,
  ...["govt", "product_supplier", "role"].reduce((acc: AppRoutes, type) => {
    acc[`/admin/organizations/${type}/:id`] = ({ id }) => (
      <AdminOrganizationList organizationType={type} organizationId={id} />
    );
    return acc;
  }, {}),
  ...["govt", "product_supplier", "role"].reduce((acc: AppRoutes, type) => {
    acc[`/admin/organizations/${type}`] = () => (
      <AdminOrganizationList organizationType={type} />
    );
    return acc;
  }, {}),
};

export default AdminRoutes;
