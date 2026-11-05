import { AppRoutes } from "@/Routers/AppRouter";
import { lazyPage } from "@/Routers/lazyPage";
import { immunizationPolicyScope } from "@/types/emr/immunizationPolicy/immunizationPolicy";
import { INSTANCE_VALUESET_SCOPE } from "@/types/valueSet/valueSet";
import { INSTANCE_WORKSPACE_SCOPE } from "@/types/workspace/workspace";

const QuestionnaireCreatePage = lazyPage(
  () => import("@/components/QuestionnaireV2/manage/QuestionnaireCreatePage"),
  "QuestionnaireCreatePage",
);
const QuestionnaireDetailPage = lazyPage(
  () => import("@/components/QuestionnaireV2/manage/QuestionnaireDetailPage"),
  "QuestionnaireDetailPage",
);
const QuestionnaireListPage = lazyPage(
  () => import("@/components/QuestionnaireV2/manage/QuestionnaireListPage"),
  "QuestionnaireListPage",
);
const QuestionnaireRevisionPage = lazyPage(
  () => import("@/components/QuestionnaireV2/manage/QuestionnaireRevisionPage"),
  "QuestionnaireRevisionPage",
);
const QuestionnaireStudioPage = lazyPage(
  () => import("@/components/QuestionnaireV2/studio/QuestionnaireStudioPage"),
  "QuestionnaireStudioPage",
);
const ValueSetEditor = lazyPage(
  () => import("@/components/ValueSet/ValueSetEditor"),
  "ValueSetEditor",
);
const ValueSetList = lazyPage(
  () => import("@/components/ValueSet/ValueSetList"),
  "ValueSetList",
);
const WorkspaceEditor = lazyPage(
  () => import("@/components/Workspace/WorkspaceEditor"),
  "WorkspaceEditor",
);
const WorkspaceList = lazyPage(
  () => import("@/components/Workspace/WorkspaceList"),
  "WorkspaceList",
);
const PermissionsIndex = lazyPage(
  () => import("@/pages/Admin/Permissions/PermissionsIndex"),
  "PermissionsIndex",
);
const RolesIndex = lazyPage(() => import("@/pages/Admin/Roles/RolesIndex"));
const TagConfigList = lazyPage(
  () => import("@/pages/Admin/TagConfig/TagConfigList"),
);
const TagConfigView = lazyPage(
  () => import("@/pages/Admin/TagConfig/TagConfigView"),
);
const ActionConfigurationForm = lazyPage(
  () => import("@/pages/Admin/actions/ActionConfigurationForm"),
  "ActionConfigurationForm",
);
const ActionConfigurationList = lazyPage(
  () => import("@/pages/Admin/actions/ActionConfigurationList"),
  "ActionConfigurationList",
);
const AdminOrganizationList = lazyPage(
  () => import("@/pages/Admin/organizations/AdminOrganizationList"),
);
const PlugConfigEdit = lazyPage(
  () => import("@/pages/Apps/PlugConfigEdit"),
  "PlugConfigEdit",
);
const PlugConfigList = lazyPage(
  () => import("@/pages/Apps/PlugConfigList"),
  "PlugConfigList",
);
const ImmunizationPolicyForm = lazyPage(
  () => import("@/pages/ImmunizationPolicies/ImmunizationPolicyForm"),
);
const ImmunizationPolicyList = lazyPage(
  () => import("@/pages/ImmunizationPolicies/ImmunizationPolicyList"),
);
const PatientIdentifierConfigForm = lazyPage(
  () =>
    import("@/pages/settings/patientIdentifierConfig/PatientIdentifierConfigForm"),
);
const PatientIdentifierConfigList = lazyPage(
  () =>
    import("@/pages/settings/patientIdentifierConfig/PatientIdentifierConfigList"),
);

const INSTANCE_SCOPE = {
  authContext: "instance",
  basePath: "/admin/questionnaires",
} as const;

const AdminRoutes: AppRoutes = {
  "/admin/immunization-policies": () => (
    <ImmunizationPolicyList scope={immunizationPolicyScope()} />
  ),
  "/admin/immunization-policies/new": () => (
    <ImmunizationPolicyForm scope={immunizationPolicyScope()} />
  ),
  "/admin/immunization-policies/:id": ({ id }) => (
    <ImmunizationPolicyForm scope={immunizationPolicyScope()} id={id} />
  ),
  "/admin/questionnaires": () => (
    <QuestionnaireListPage scope={INSTANCE_SCOPE} />
  ),
  // Must be registered before "/admin/questionnaires/:id" — raviger matches
  // routes in object order, and "new" would otherwise be captured as an :id.
  "/admin/questionnaires/new": () => (
    <QuestionnaireCreatePage scope={INSTANCE_SCOPE} />
  ),
  // Must be registered before "/admin/questionnaires/:id" for the same
  // reason — otherwise "edit" would be captured as an :id.
  "/admin/questionnaires/:id/edit": ({ id }) => (
    <QuestionnaireStudioPage scope={INSTANCE_SCOPE} id={id} />
  ),
  // Registered before "/admin/questionnaires/:id" like the routes above.
  "/admin/questionnaires/:id/versions/:revisionId": ({ id, revisionId }) => (
    <QuestionnaireRevisionPage
      scope={INSTANCE_SCOPE}
      id={id}
      revisionId={revisionId}
    />
  ),
  "/admin/questionnaires/:id": ({ id }) => (
    <QuestionnaireDetailPage scope={INSTANCE_SCOPE} id={id} />
  ),
  "/admin/actions": () => <ActionConfigurationList />,
  // Before "/admin/actions/:id" — raviger matches in object order.
  "/admin/actions/new": () => <ActionConfigurationForm />,
  "/admin/actions/:id": ({ id }) => <ActionConfigurationForm id={id} />,
  "/admin/valuesets": () => <ValueSetList scope={INSTANCE_VALUESET_SCOPE} />,
  "/admin/valuesets/create": () => (
    <ValueSetEditor scope={INSTANCE_VALUESET_SCOPE} />
  ),
  "/admin/valuesets/:id/edit": ({ id }) => (
    <ValueSetEditor scope={INSTANCE_VALUESET_SCOPE} id={id} />
  ),
  "/admin/workspaces": () => <WorkspaceList scope={INSTANCE_WORKSPACE_SCOPE} />,
  "/admin/workspaces/create": () => (
    <WorkspaceEditor scope={INSTANCE_WORKSPACE_SCOPE} />
  ),
  "/admin/workspaces/:id/edit": ({ id }) => (
    <WorkspaceEditor scope={INSTANCE_WORKSPACE_SCOPE} id={id} />
  ),
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
